const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateResponse } = require('../config/ai');

router.post('/', authenticate, async (req, res) => {
  const { ideaId, chatSessionId } = req.body;
  if (!ideaId) return res.status(400).json({ error: 'ideaId required.' });

  try {
    const ideaResult = await pool.query('SELECT * FROM ideas WHERE id = $1 AND user_id = $2', [ideaId, req.user.id]);
    if (ideaResult.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });
    const idea = ideaResult.rows[0];

    let chatHistory = '';
    if (chatSessionId) {
      const historyResult = await pool.query(
        'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
        [chatSessionId]
      );
      chatHistory = historyResult.rows.map(m => `${m.role === 'user' ? 'Entrepreneur' : 'Mentor'}: ${m.content}`).join('\n');
    }

    const prompt = `Evaluate this social entrepreneur's readiness:
Idea: "${idea.title}" in ${idea.domain}
Description: "${idea.description || 'Not provided'}"
${chatHistory ? `Mentoring conversation:\n${chatHistory}` : ''}

Score them on readiness (0-100) and identify missing elements.

Return JSON:
{
  "score": <number 0-100>,
  "breakdown": {
    "clarity": <0-25>,
    "feasibility": <0-25>,
    "resources": <0-25>,
    "riskAwareness": <0-25>
  },
  "missingElements": ["element1", "element2"],
  "strengths": ["strength1", "strength2"],
  "isReady": <boolean - true if score >= 60>,
  "recommendation": "What they should do next",
  "governmentSchemes": {
    "stage0": ["Startup India", "Atal Innovation Mission"],
    "stage1": ["Most relevant scheme for their domain"],
    "stage2": ["MUDRA Yojana or Stand-Up India if budget is low"],
    "stage3": ["Seed Fund Scheme", "NIDHI PRAYAS"]
  }
}

Return ONLY valid JSON.`;

    const response = await generateResponse(prompt);
    let evaluation;
    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      evaluation = JSON.parse(cleaned);
    } catch (e) {
      evaluation = {
        score: 45,
        breakdown: { clarity: 12, feasibility: 10, resources: 13, riskAwareness: 10 },
        missingElements: ['Revenue model', 'Team composition', 'Market validation', 'Risk mitigation plan'],
        strengths: ['Clear problem statement', 'Domain passion'],
        isReady: false,
        recommendation: 'Complete the mentoring phases before proceeding to stakeholder pitching.',
        governmentSchemes: {
          stage0: ['Startup India', 'Atal Innovation Mission'],
          stage1: ['Relevant state government scheme'],
          stage2: ['MUDRA Yojana'],
          stage3: ['Seed Fund Scheme', 'NIDHI PRAYAS'],
        },
      };
    }

    await pool.query(
      'INSERT INTO simulation_results (idea_id, user_id, simulation_type, result) VALUES ($1, $2, $3, $4)',
      [ideaId, req.user.id, 'readiness_check', JSON.stringify(evaluation)]
    );

    res.json({ evaluation });
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate.' });
  }
});

module.exports = router;
