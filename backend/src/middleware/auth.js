const pool = require('../config/database');

async function authenticate(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

  if (!sessionId) {
    return res.status(401).json({ error: 'No session. Please login.' });
  }

  try {
    const result = await pool.query(
      'SELECT u.*, s.id as session_db_id FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_id = $1 AND s.expires_at > NOW()',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
