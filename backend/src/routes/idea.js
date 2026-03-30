//idea.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  const { domain, title, description } = req.body;
  const userId = req.user.id;

  if (!domain || !title) {
    return res.status(400).json({ error: 'Domain and title are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO ideas (user_id, domain, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, domain, title, description || '']
    );
    res.status(201).json({ idea: result.rows[0] });
  } catch (err) {
    console.error('Create idea error:', err);
    res.status(500).json({ error: 'Failed to create idea.' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ideas WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ ideas: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ideas.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ideas WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });
    res.json({ idea: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch idea.' });
  }
});

module.exports = router;