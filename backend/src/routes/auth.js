//auth.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const VALID_ROLES = ['founder', 'co_founder', 'admin', 'user'];
const VALID_DOMAINS = [
  'mental_health', 'education', 'healthcare', 'environment',
  'women_empowerment', 'poverty_livelihood', 'smart_communities'
];

const DOMAIN_SUGGESTIONS = {
  mental_health: {
    label: 'Mental Health',
    suggestions: ['Focus on student wellness apps', 'Partner with school counselors', 'Teletherapy integration', 'Peer support communities'],
    schemes: ['Ayushman Bharat Digital Mission', 'NIMHANS Programs', 'Mann Ki Baat Health Initiative'],
  },
  education: {
    label: 'Education',
    suggestions: ['EdTech for rural areas', 'Vernacular language content', 'Teacher training platforms', 'Gamified learning'],
    schemes: ['Startup India - EdTech', 'National Education Policy 2020 Grants', 'Samagra Shiksha Scheme'],
  },
  healthcare: {
    label: 'Healthcare',
    suggestions: ['Telemedicine for rural India', 'Affordable diagnostics', 'Community health workers', 'Preventive care apps'],
    schemes: ['Ayushman Bharat PM-JAY', 'Digital Health Mission', 'NIDHI PRAYAS for HealthTech'],
  },
  environment: {
    label: 'Environment',
    suggestions: ['Waste management tech', 'Clean energy micro-grids', 'Water purification', 'Carbon credit platforms'],
    schemes: ['National Clean Energy Fund', 'MNRE Solar Schemes', 'Green Climate Fund India'],
  },
  women_empowerment: {
    label: 'Women Empowerment',
    suggestions: ['Safe mobility solutions', 'Women entrepreneurship platforms', 'Skill training apps', 'Financial literacy tools'],
    schemes: ['Stand-Up India (women entrepreneurs)', 'MUDRA Yojana for women', 'Deen Dayal Upadhyaya scheme'],
  },
  poverty_livelihood: {
    label: 'Poverty & Livelihood',
    suggestions: ['Micro-lending platforms', 'Skill marketplace for rural workers', 'Agricultural tech', 'Cooperative models'],
    schemes: ['MUDRA Yojana', 'PMEGP', 'NRLM - National Rural Livelihood Mission'],
  },
  smart_communities: {
    label: 'Smart Communities',
    suggestions: ['Civic tech platforms', 'Smart waste bins', 'Community energy grids', 'Hyperlocal service apps'],
    schemes: ['Smart Cities Mission', 'Atal Mission for Urban Rejuvenation', 'Digital India Initiative'],
  },
};

router.post('/register', async (req, res) => {
  const { name, email, password, role, domain } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  if (domain && !VALID_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: `Invalid domain.` });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, domain) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, domain',
      [name, email, hashedPassword, role, domain || null]
    );

    const user = result.rows[0];
    const domainInfo = domain ? DOMAIN_SUGGESTIONS[domain] : null;

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, domain: user.domain },
      suggestions: domainInfo ? {
        domainLabel: domainInfo.label,
        tips: domainInfo.suggestions,
        schemes: domainInfo.schemes,
      } : null,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO sessions (session_id, user_id, expires_at) VALUES ($1, $2, $3)',
      [sessionId, user.id, expiresAt]
    );

    res.json({
      message: 'Login successful',
      sessionId,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, domain: user.domain },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.post('/logout', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]).catch(() => {});
  }
  res.json({ message: 'Logged out.' });
});

router.get('/me', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.domain FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_id = $1 AND s.expires_at > NOW()',
      [sessionId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Session invalid.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user.' });
  }
});

router.get('/domain-suggestions', (req, res) => {
  res.json({ domains: DOMAIN_SUGGESTIONS });
});

module.exports = router;