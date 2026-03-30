//session.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const ideas = await pool.query(
      'SELECT i.*, (SELECT COUNT(*) FROM chat_sessions cs WHERE cs.idea_id = i.id) as chat_count, (SELECT COUNT(*) FROM pitch_sessions ps WHERE ps.idea_id = i.id) as pitch_count FROM ideas i WHERE i.user_id = $1 ORDER BY i.created_at DESC',
      [req.user.id]
    );

    const recentSimulations = await pool.query(
      'SELECT * FROM simulation_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );

    res.json({
      user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, domain: req.user.domain },
      ideas: ideas.rows,
      recentSimulations: recentSimulations.rows,
    });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Failed to fetch session data.' });
  }
});

module.exports = router;
