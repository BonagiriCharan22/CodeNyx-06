const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateResponse } = require('../config/ai');

// ─────────────────────────────────────────────────────────────
// POST /api/improve/suggestions
// Phase 1 — AI analyses idea and returns improvement areas
// ─────────────────────────────────────────────────────────────
router.post('/suggestions', authenticate, async (req, res) => {
  const { ideaId } = req.body;
  if (!ideaId) return res.status(400).json({ error: 'ideaId required.' });

  try {
    const ideaResult = await pool.query(
      'SELECT * FROM ideas WHERE id = $1 AND user_id = $2',
      [ideaId, req.user.id]
    );
    if (ideaResult.rows.length === 0)
      return res.status(404).json({ error: 'Idea not found.' });

    const idea = ideaResult.rows[0];

    const prompt = `You are an expert startup mentor reviewing a social enterprise idea for an Indian entrepreneur.

Idea Title: "${idea.title}"
Domain: ${idea.domain}
Description: "${idea.description || 'No description provided'}"
Problem Statement: "${idea.problem_statement || 'Not specified'}"
Target Audience: "${idea.target_audience || 'Not specified'}"

Analyse this idea and provide specific, actionable improvement suggestions.

Return ONLY valid JSON in this exact format:
{
  "overallAssessment": "2-3 sentence honest assessment of the idea's current state",
  "improvements": [
    {
      "area": "short label e.g. Problem Clarity",
      "priority": "high|medium|low",
      "suggestion": "specific actionable suggestion in 1-2 sentences",
      "example": "optional concrete example or rewrite suggestion"
    }
  ],
  "quickWins": ["quick win 1", "quick win 2", "quick win 3"]
}

Provide exactly 3-4 improvements covering: problem clarity, target audience, feasibility/revenue, and differentiation/impact. Be direct and specific, not generic.`;

    const response = await generateResponse(prompt);
    let suggestions;

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      suggestions = JSON.parse(cleaned);
    } catch (e) {
      suggestions = {
        overallAssessment: 'Your idea shows promise but needs sharper definition in a few key areas before pitching.',
        improvements: [
          {
            area: 'Problem Clarity',
            priority: 'high',
            suggestion: 'Narrow down the specific problem you are solving. A broad problem statement makes it hard for investors to assess impact.',
            example: 'Instead of "improving healthcare", try "reducing diagnostic delays for rural patients in Tier 3 cities".',
          },
          {
            area: 'Target Audience',
            priority: 'high',
            suggestion: 'Define your primary user with demographics, geography, and behaviour. Who specifically will use this first?',
            example: 'e.g. "Women aged 25-40 in semi-urban Maharashtra who own a smartphone but lack access to financial literacy resources".',
          },
          {
            area: 'Revenue Model',
            priority: 'medium',
            suggestion: 'Clarify how the venture will sustain itself financially beyond grants. Add at least one revenue stream.',
            example: 'Consider freemium, B2B licensing to NGOs, or government scheme tie-ups like NITI Aayog.',
          },
          {
            area: 'Differentiation',
            priority: 'medium',
            suggestion: 'State clearly what makes this different from existing solutions. Why will users choose this over alternatives?',
            example: 'List 1-2 competitors and explain your unique advantage in a single sentence.',
          },
        ],
        quickWins: [
          'Write a one-sentence problem statement that a 10-year-old could understand.',
          'List three organisations already working in this space and how you differ.',
          'Identify one government scheme you could partner with or apply to in the next 30 days.',
        ],
      };
    }

    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/improve/questions
// Phase 2 — Generate follow-up questions based on suggestions
// ─────────────────────────────────────────────────────────────
router.post('/questions', authenticate, async (req, res) => {
  const { ideaId, suggestions } = req.body;
  if (!ideaId || !suggestions) return res.status(400).json({ error: 'ideaId and suggestions required.' });

  try {
    const ideaResult = await pool.query(
      'SELECT * FROM ideas WHERE id = $1 AND user_id = $2',
      [ideaId, req.user.id]
    );
    if (ideaResult.rows.length === 0)
      return res.status(404).json({ error: 'Idea not found.' });

    const idea = ideaResult.rows[0];
    const improvementAreas = (suggestions.improvements || []).map(i => i.area).join(', ');

    const prompt = `You are a mentor helping a social entrepreneur improve their idea before pitching.

Idea: "${idea.title}" in domain: ${idea.domain}

The entrepreneur received improvement suggestions in these areas: ${improvementAreas}

Generate one focused follow-up question per improvement area to verify the entrepreneur has understood and can act on the improvement. Questions should:
- Be specific to this idea, not generic
- Have clear, testable answers (not yes/no)
- Be encouraging, not critical in tone
- Check practical readiness

Return ONLY valid JSON:
{
  "questions": [
    "Question about improvement area 1?",
    "Question about improvement area 2?",
    "Question about improvement area 3?",
    "Question about improvement area 4?"
  ]
}

Return exactly ${(suggestions.improvements || []).length || 3} questions, one per improvement area.`;

    const response = await generateResponse(prompt);
    let parsed;

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {
        questions: (suggestions.improvements || []).map(imp =>
          `Regarding "${imp.area}": ${imp.suggestion} — How specifically will you address this in your idea?`
        ),
      };
    }

    res.json({ questions: parsed.questions });
  } catch (err) {
    console.error('Questions error:', err);
    res.status(500).json({ error: 'Failed to generate questions.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/improve/summary
// Phase 3 — Evaluate answers and produce improvement summary
// ─────────────────────────────────────────────────────────────
router.post('/summary', authenticate, async (req, res) => {
  const { ideaId, suggestions, answers } = req.body;
  if (!ideaId || !answers) return res.status(400).json({ error: 'ideaId and answers required.' });

  try {
    const ideaResult = await pool.query(
      'SELECT * FROM ideas WHERE id = $1 AND user_id = $2',
      [ideaId, req.user.id]
    );
    if (ideaResult.rows.length === 0)
      return res.status(404).json({ error: 'Idea not found.' });

    const idea = ideaResult.rows[0];
    const qaText = answers
      .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`)
      .join('\n\n');

    const prompt = `A social entrepreneur has answered improvement questions about their idea.

Idea: "${idea.title}" in domain: ${idea.domain}

Their answers:
${qaText}

Evaluate how well they have addressed the improvements and generate a summary.

Return ONLY valid JSON:
{
  "overallImprovement": "1-2 sentence summary of how much the entrepreneur has improved their thinking",
  "readinessLevel": "one of: Significantly Improved | Moderately Improved | Needs More Work",
  "keyChanges": [
    "specific change 1 that came from their answers",
    "specific change 2",
    "specific change 3"
  ],
  "nextAction": "one concrete sentence on what they should do immediately before pitching"
}`;

    const response = await generateResponse(prompt);
    let summary;

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      summary = JSON.parse(cleaned);
    } catch (e) {
      summary = {
        overallImprovement: 'Your answers demonstrate a clearer understanding of the problem and target audience. You are better prepared to pitch.',
        readinessLevel: 'Moderately Improved',
        keyChanges: answers.map(a => `Clarified your approach to: ${a.question.split('?')[0]}`),
        nextAction: 'Refine your one-line problem statement using the clarity you developed here, then head to the Pitch Session.',
      };
    }

    // Save improvement session to DB
    await pool.query(
      'INSERT INTO simulation_results (idea_id, user_id, simulation_type, result) VALUES ($1, $2, $3, $4)',
      [ideaId, req.user.id, 'improvement_session', JSON.stringify({ suggestions, answers, summary })]
    );

    res.json({ summary });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

module.exports = router;