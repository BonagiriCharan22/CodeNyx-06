const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateResponse } = require('../config/ai');

router.post('/start', authenticate, async (req, res) => {
  const { ideaId, stakeholderType, pitchText } = req.body;
  if (!ideaId || !stakeholderType || !pitchText) {
    return res.status(400).json({ error: 'ideaId, stakeholderType, and pitchText required.' });
  }

  const validTypes = ['investor', 'ngo'];
  if (!validTypes.includes(stakeholderType)) {
    return res.status(400).json({ error: 'stakeholderType must be investor or ngo.' });
  }

  try {
    const ideaResult = await pool.query('SELECT * FROM ideas WHERE id = $1 AND user_id = $2', [ideaId, req.user.id]);
    if (ideaResult.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });
    const idea = ideaResult.rows[0];

    const systemPrompt = stakeholderType === 'investor'
      ? `Act as a sharp, experienced investor conducting a pitch evaluation. The entrepreneur has pitched: "${pitchText}" for an idea called "${idea.title}" in ${idea.domain}. Ask ONE tough but fair question focused on revenue, scalability, or sustainability. Be direct. Do not ask multiple questions.`
      : `Act as an experienced NGO evaluator assessing a social impact project. The entrepreneur has pitched: "${pitchText}" for an idea called "${idea.title}" in ${idea.domain}. Ask ONE probing question focused on community impact, feasibility, or social benefit. Be specific. Do not ask multiple questions.`;

    const firstQuestion = await generateResponse(`Opening pitch: "${pitchText}"`, systemPrompt);

    const sessionResult = await pool.query(
      'INSERT INTO pitch_sessions (idea_id, user_id, stakeholder_type, rounds, pitch_text) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ideaId, req.user.id, stakeholderType, 0, pitchText]
    );
    const pitchSession = sessionResult.rows[0];

    await pool.query(
      'INSERT INTO pitch_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [pitchSession.id, 'stakeholder', firstQuestion]
    );

    res.json({ sessionId: pitchSession.id, question: firstQuestion, round: 1 });
  } catch (err) {
    console.error('Pitch start error:', err);
    res.status(500).json({ error: 'Failed to start pitch.' });
  }
});

router.post('/respond', authenticate, async (req, res) => {
  const { sessionId, answer } = req.body;
  if (!sessionId || !answer) return res.status(400).json({ error: 'sessionId and answer required.' });

  try {
    const sessionResult = await pool.query(
      'SELECT ps.*, i.domain, i.title FROM pitch_sessions ps JOIN ideas i ON ps.idea_id = i.id WHERE ps.id = $1 AND ps.user_id = $2',
      [sessionId, req.user.id]
    );
    if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Pitch session not found.' });
    const session = sessionResult.rows[0];

    if (session.is_complete) {
      return res.status(400).json({ error: 'Pitch session already complete.' });
    }

    await pool.query('INSERT INTO pitch_messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'user', answer]);

    const newRounds = session.rounds + 1;
    await pool.query('UPDATE pitch_sessions SET rounds = $1 WHERE id = $2', [newRounds, sessionId]);

    if (newRounds >= 3) {
      const historyResult = await pool.query(
        'SELECT role, content FROM pitch_messages WHERE session_id = $1 ORDER BY created_at ASC',
        [sessionId]
      );
      const historyText = historyResult.rows.map(m => `${m.role === 'user' ? 'Entrepreneur' : session.stakeholder_type}: ${m.content}`).join('\n');

      const evalPrompt = `Based on this pitch session:\n${historyText}\n\nAs a ${session.stakeholder_type === 'investor' ? 'seasoned investor' : 'NGO director'}, give your FINAL DECISION. Format your response exactly as:\nDECISION: [Accept/Reject/Hesitant]\nREASON: [2-3 sentences explaining why]\nSCORE: [0-100]`;

      const evalSystem = session.stakeholder_type === 'investor'
        ? 'You are a strict but fair investor. Evaluate based on: revenue potential, market size, team credibility, scalability.'
        : 'You are an NGO director. Evaluate based on: social impact depth, community benefit, feasibility, sustainability.';

      const decision = await generateResponse(evalPrompt, evalSystem);

      await pool.query('UPDATE pitch_sessions SET is_complete = true, decision = $1 WHERE id = $2', [decision, sessionId]);
      await pool.query('INSERT INTO pitch_messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'stakeholder', decision]);

      const parsedDecision = parseDecision(decision);
      return res.json({ isComplete: true, decision: parsedDecision, rawDecision: decision });
    }

    const historyResult = await pool.query(
      'SELECT role, content FROM pitch_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    const historyText = historyResult.rows.map(m => `${m.role === 'user' ? 'Entrepreneur' : session.stakeholder_type}: ${m.content}`).join('\n');

    const systemPrompt = session.stakeholder_type === 'investor'
      ? `You are a tough investor evaluating a ${session.domain} startup called "${session.title}". Based on the entrepreneur's latest answer, ask ONE follow-up question. Focus on revenue, scalability, or risk. Be direct and specific.`
      : `You are an NGO evaluator reviewing a ${session.domain} project called "${session.title}". Based on the entrepreneur's latest answer, ask ONE follow-up question. Focus on impact depth or implementation challenges. Be specific.`;

    const nextQuestion = await generateResponse(
      `Conversation:\n${historyText}\n\nLatest answer: "${answer}"\n\nAsk ONE follow-up question based on this answer.`,
      systemPrompt
    );

    await pool.query('INSERT INTO pitch_messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'stakeholder', nextQuestion]);

    res.json({ isComplete: false, question: nextQuestion, round: newRounds + 1 });
  } catch (err) {
    console.error('Pitch respond error:', err);
    res.status(500).json({ error: 'Failed to process pitch response.' });
  }
});

router.get('/history/:sessionId', authenticate, async (req, res) => {
  try {
    const messages = await pool.query(
      'SELECT * FROM pitch_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [req.params.sessionId]
    );
    const session = await pool.query('SELECT * FROM pitch_sessions WHERE id = $1', [req.params.sessionId]);
    res.json({ messages: messages.rows, session: session.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

function parseDecision(text) {
  const decisionMatch = text.match(/DECISION:\s*(Accept|Reject|Hesitant)/i);
  const reasonMatch = text.match(/REASON:\s*(.+?)(?:SCORE:|$)/is);
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);

  return {
    verdict: decisionMatch ? decisionMatch[1] : 'Hesitant',
    reason: reasonMatch ? reasonMatch[1].trim() : text,
    score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
  };
}

module.exports = router;
