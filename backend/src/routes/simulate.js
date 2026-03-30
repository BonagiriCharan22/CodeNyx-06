const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateResponse } = require('../config/ai');

router.post('/users', authenticate, async (req, res) => {
  const { ideaId } = req.body;
  if (!ideaId) return res.status(400).json({ error: 'ideaId required.' });

  try {
    const ideaResult = await pool.query('SELECT * FROM ideas WHERE id = $1 AND user_id = $2', [ideaId, req.user.id]);
    if (ideaResult.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });
    const idea = ideaResult.rows[0];

    const prompt = `Simulate how the general public in India would react to this social enterprise idea:
Title: "${idea.title}"
Domain: ${idea.domain}
Description: "${idea.description || 'No description provided'}"

Provide a JSON response with these exact fields:
{
  "trust": <number 0-100>,
  "awareness": <number 0-100>,
  "adoption": <number 0-100>,
  "concerns": ["concern1", "concern2", "concern3"],
  "positiveReactions": ["reaction1", "reaction2"],
  "negativeReactions": ["reaction1", "reaction2"],
  "overallSentiment": "positive/neutral/negative",
  "summary": "2-3 sentence overall analysis"
}

Return ONLY valid JSON, no markdown.`;

    const response = await generateResponse(prompt);
    let simulation;

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      simulation = JSON.parse(cleaned);
    } catch (e) {
      simulation = {
        trust: 55,
        awareness: 40,
        adoption: 35,
        concerns: ['Awareness gap', 'Cultural acceptance', 'Sustainability doubts'],
        positiveReactions: ['Addresses a real need', 'Innovative approach'],
        negativeReactions: ['Not enough local context', 'Implementation complexity'],
        overallSentiment: 'neutral',
        summary: 'The idea shows promise but needs stronger community engagement and local adaptation to gain wider acceptance.',
      };
    }

    await pool.query(
      'INSERT INTO simulation_results (idea_id, user_id, simulation_type, result) VALUES ($1, $2, $3, $4)',
      [ideaId, req.user.id, 'user_perception', JSON.stringify(simulation)]
    );

    res.json({ simulation });
  } catch (err) {
    console.error('User simulation error:', err);
    res.status(500).json({ error: 'Failed to run simulation.' });
  }
});

router.post('/stakeholders', authenticate, async (req, res) => {
  const { ideaId } = req.body;
  if (!ideaId) return res.status(400).json({ error: 'ideaId required.' });

  try {
    const ideaResult = await pool.query('SELECT * FROM ideas WHERE id = $1 AND user_id = $2', [ideaId, req.user.id]);
    if (ideaResult.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });
    const idea = ideaResult.rows[0];

    const pitchSessions = await pool.query(
      'SELECT * FROM pitch_sessions WHERE idea_id = $1 AND is_complete = true ORDER BY created_at DESC',
      [ideaId]
    );

    const investorSession = pitchSessions.rows.find(s => s.stakeholder_type === 'investor');
    const ngoSession = pitchSessions.rows.find(s => s.stakeholder_type === 'ngo');

    const prompt = `Based on this social enterprise idea:
Title: "${idea.title}"
Domain: ${idea.domain}
Investor decision: ${investorSession?.decision || 'Not yet pitched to investor'}
NGO decision: ${ngoSession?.decision || 'Not yet pitched to NGO'}

Analyze the CONFLICT ENGINE - how do the investor and NGO perspectives conflict or align?

Return JSON:
{
  "conflictLevel": "high/medium/low",
  "conflictAreas": ["area1", "area2"],
  "alignmentAreas": ["area1", "area2"],
  "recommendation": "What the entrepreneur should prioritize",
  "overallViability": <number 0-100>,
  "nextBestStep": "Specific actionable next step"
}

Return ONLY valid JSON.`;

    const response = await generateResponse(prompt);
    let conflict;
    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      conflict = JSON.parse(cleaned);
    } catch (e) {
      conflict = {
        conflictLevel: 'medium',
        conflictAreas: ['Revenue vs. impact balance', 'Speed vs. thoroughness'],
        alignmentAreas: ['Community focus', 'Long-term sustainability'],
        recommendation: 'Prioritize demonstrating impact metrics while building a lean revenue model.',
        overallViability: 60,
        nextBestStep: 'Create a detailed impact measurement framework with financial projections.',
      };
    }

    res.json({ conflict, investorDecision: investorSession?.decision, ngoDecision: ngoSession?.decision });
  } catch (err) {
    console.error('Stakeholder simulation error:', err);
    res.status(500).json({ error: 'Failed to run stakeholder simulation.' });
  }
});

router.post('/consequences', authenticate, async (req, res) => {
  const { ideaId, chosenPath } = req.body;
  if (!ideaId || !chosenPath) return res.status(400).json({ error: 'ideaId and chosenPath required.' });

  const validPaths = ['continue', 'improve', 'change_idea'];
  if (!validPaths.includes(chosenPath)) {
    return res.status(400).json({ error: 'chosenPath must be: continue, improve, or change_idea' });
  }

  try {
    const ideaResult = await pool.query('SELECT * FROM ideas WHERE id = $1 AND user_id = $2', [ideaId, req.user.id]);
    if (ideaResult.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });
    const idea = ideaResult.rows[0];

    const prompt = `Simulate the consequences for a social entrepreneur who chose to "${chosenPath}" with their idea:
Title: "${idea.title}" in domain: ${idea.domain}

Return JSON:
{
  "immediateOutcome": "What happens in the first week",
  "hiddenInsight": "A non-obvious insight they might not have considered",
  "timeline": {
    "week1": "What to expect in week 1",
    "week4": "What to expect in week 4",
    "month2": "What to expect in month 2"
  },
  "expectedVsReality": {
    "expected": "What they thought would happen",
    "reality": "What actually tends to happen",
    "gap": "The key gap between expectation and reality"
  },
  "explanation": "Why this outcome occurs - the root cause analysis",
  "governmentSchemes": ["relevant scheme 1", "relevant scheme 2"],
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}

Return ONLY valid JSON.`;

    const response = await generateResponse(prompt);
    let consequences;
    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      consequences = JSON.parse(cleaned);
    } catch (e) {
      consequences = {
        immediateOutcome: 'You begin refining your approach with renewed clarity.',
        hiddenInsight: 'The biggest barrier is often not technical but behavioral change in the target community.',
        timeline: {
          week1: 'Initial team alignment and stakeholder mapping.',
          week4: 'First prototype or pilot discussions with 2-3 potential partners.',
          month2: 'First user feedback loop and iteration cycle.',
        },
        expectedVsReality: {
          expected: 'Rapid adoption and enthusiastic reception.',
          reality: 'Slower than expected uptake with valuable learning opportunities.',
          gap: 'Community trust takes time to build — it cannot be rushed.',
        },
        explanation: 'Social innovation follows an S-curve. The early phase is slow but establishes the foundation for exponential growth.',
        governmentSchemes: ['Startup India Seed Fund', 'Atal Innovation Mission Grants'],
        nextSteps: ['Define your minimum viable community (MVC)', 'Apply for Atal Innovation Mission grant', 'Map potential NGO partners'],
      };
    }

    await pool.query(
      'INSERT INTO simulation_results (idea_id, user_id, simulation_type, result) VALUES ($1, $2, $3, $4)',
      [ideaId, req.user.id, 'consequence_' + chosenPath, JSON.stringify(consequences)]
    );

    res.json({ consequences, chosenPath });
  } catch (err) {
    console.error('Consequence simulation error:', err);
    res.status(500).json({ error: 'Failed to simulate consequences.' });
  }
});

module.exports = router;
