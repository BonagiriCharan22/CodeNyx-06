//collaborators.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateResponse } = require('../config/ai');

router.post('/', authenticate, async (req, res) => {
  const { ideaId, skills, domain } = req.body;
  if (!skills || !domain) return res.status(400).json({ error: 'skills and domain required.' });

  try {
    await pool.query(
      'INSERT INTO collaborators (user_id, idea_id, skills, domain) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, idea_id) DO UPDATE SET skills = $3',
      [req.user.id, ideaId || null, skills, domain]
    );

    res.json({ message: 'Collaboration profile saved.' });
  } catch (err) {
    console.error('Collaborator post error:', err);
    res.status(500).json({ error: 'Failed to save collaborator.' });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { domain } = req.query;
  try {
    let query = 'SELECT c.*, u.name, u.role FROM collaborators c JOIN users u ON c.user_id = u.id WHERE c.user_id != $1';
    const params = [req.user.id];

    if (domain) {
      query += ' AND c.domain = $2';
      params.push(domain);
    }

    query += ' ORDER BY c.created_at DESC LIMIT 20';

    const result = await pool.query(query, params);
    res.json({ collaborators: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collaborators.' });
  }
});

router.post('/suggest', authenticate, async (req, res) => {
  const { ideaId, missingSkills } = req.body;
  if (!ideaId || !missingSkills) return res.status(400).json({ error: 'ideaId and missingSkills required.' });

  try {
    const ideaResult = await pool.query('SELECT * FROM ideas WHERE id = $1', [ideaId]);
    if (ideaResult.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });
    const idea = ideaResult.rows[0];

    const prompt = `For a social enterprise idea "${idea.title}" in ${idea.domain} with missing skills: ${missingSkills.join(', ')},
suggest what kind of collaborators they need.

Return JSON:
{
  "suggestions": [
    {
      "role": "Role title",
      "type": "developer/ngo_partner/business_strategist/domain_expert/other",
      "reason": "Why this person is needed",
      "skills": ["skill1", "skill2"],
      "whereToFind": "Where to find such a person in India"
    }
  ],
  "communityTip": "General tip on building a strong team for this domain"
}

Return ONLY valid JSON.`;

    const response = await generateResponse(prompt);
    let suggestions;
    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      suggestions = JSON.parse(cleaned);
    } catch (e) {
      suggestions = {
        suggestions: [
          { role: 'Technical Developer', type: 'developer', reason: 'To build the digital product', skills: ['React', 'Node.js'], whereToFind: 'Internshala, LinkedIn, IIT/NIT communities' },
          { role: 'NGO Partner', type: 'ngo_partner', reason: 'For community access and trust', skills: ['Community mobilization', 'Impact reporting'], whereToFind: 'GuideStar India, local NGO networks' },
          { role: 'Business Strategist', type: 'business_strategist', reason: 'To build revenue model', skills: ['Business planning', 'Fundraising'], whereToFind: 'iSPIRT, TiE chapters, NSRCEL IIM' },
        ],
        communityTip: 'Start with your personal network, then expand to domain-specific communities and startup ecosystems.',
      };
    }

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate suggestions.' });
  }
});

module.exports = router;