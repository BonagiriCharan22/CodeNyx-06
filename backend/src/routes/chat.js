//chat.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateResponse } = require('../config/ai');

const PHASES = ['problem_clarity', 'feasibility', 'resource_planning', 'risk_awareness'];

const PHASE_PROMPTS = {
  problem_clarity: (domain) => `Act as a mentor for a social entrepreneur in the ${domain} sector. You are in Phase 1: Problem Clarity. Ask ONE focused question to help them articulate the core problem they're solving. Do not ask multiple questions. Keep it under 2 sentences.`,
  feasibility: (domain) => `Act as a mentor for a social entrepreneur in the ${domain} sector. You are in Phase 2: Feasibility. Ask ONE question about the practical feasibility of their idea. Do not ask multiple questions. Keep it under 2 sentences.`,
  resource_planning: (domain) => `Act as a mentor for a social entrepreneur in the ${domain} sector. You are in Phase 3: Resource Planning. Ask ONE question about the resources, team, or funding they need. Do not ask multiple questions. Keep it under 2 sentences.`,
  risk_awareness: (domain) => `Act as a mentor for a social entrepreneur in the ${domain} sector. You are in Phase 4: Risk Awareness. Ask ONE question about potential risks or challenges they foresee. Do not ask multiple questions. Keep it under 2 sentences.`,
};

router.post('/start', authenticate, async (req, res) => {
  const { ideaId } = req.body;
  if (!ideaId) return res.status(400).json({ error: 'ideaId required.' });

  try {
    const ideaResult = await pool.query('SELECT * FROM ideas WHERE id = $1 AND user_id = $2', [ideaId, req.user.id]);
    if (ideaResult.rows.length === 0) return res.status(404).json({ error: 'Idea not found.' });

    const idea = ideaResult.rows[0];
    const phase = PHASES[0];
    const systemPrompt = PHASE_PROMPTS[phase](idea.domain);
    const context = `The entrepreneur's idea: "${idea.title}". ${idea.description ? 'Description: ' + idea.description : ''}`;

    const question = await generateResponse(context, systemPrompt);

    const sessionResult = await pool.query(
      'INSERT INTO chat_sessions (idea_id, user_id, current_phase, phase_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [ideaId, req.user.id, phase, 0]
    );

    const chatSession = sessionResult.rows[0];

    await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [chatSession.id, 'assistant', question]
    );

    res.json({ sessionId: chatSession.id, phase, question, phaseIndex: 0, totalPhases: PHASES.length });
  } catch (err) {
    console.error('Chat start error:', err);
    res.status(500).json({ error: 'Failed to start chat.' });
  }
});

router.post('/message', authenticate, async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message required.' });

  try {
    const sessionResult = await pool.query(
      'SELECT cs.*, i.domain, i.title, i.description FROM chat_sessions cs JOIN ideas i ON cs.idea_id = i.id WHERE cs.id = $1 AND cs.user_id = $2',
      [sessionId, req.user.id]
    );
    if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Chat session not found.' });

    const session = sessionResult.rows[0];

    await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', message]
    );

    const historyResult = await pool.query(
      'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    const history = historyResult.rows;
    const historyText = history.map(m => `${m.role === 'user' ? 'Entrepreneur' : 'Mentor'}: ${m.content}`).join('\n');

    let nextPhaseIndex = session.phase_index;
    let nextPhase = session.current_phase;
    let isComplete = false;

    const userTurns = history.filter(m => m.role === 'user').length;

    if (userTurns >= 2 && nextPhaseIndex < PHASES.length - 1) {
      nextPhaseIndex += 1;
      nextPhase = PHASES[nextPhaseIndex];
      await pool.query(
        'UPDATE chat_sessions SET current_phase = $1, phase_index = $2 WHERE id = $3',
        [nextPhase, nextPhaseIndex, sessionId]
      );
    } else if (userTurns >= 2 && nextPhaseIndex === PHASES.length - 1) {
      isComplete = true;
      await pool.query('UPDATE chat_sessions SET is_complete = true WHERE id = $1', [sessionId]);
    }

    let aiResponse;
    if (isComplete) {
      aiResponse = `Excellent work! You've completed all phases of mentoring. You're now ready to proceed to the Readiness Check. Your structured thinking shows great potential!`;
    } else {
      const systemPrompt = PHASE_PROMPTS[nextPhase](session.domain);
      const prompt = `Conversation so far:\n${historyText}\n\nLatest answer from entrepreneur: "${message}"\n\nBased on their answer, ask the next most relevant question for this phase. Ask only ONE question. Keep it under 2 sentences.`;
      aiResponse = await generateResponse(prompt, systemPrompt);
    }

    await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', aiResponse]
    );

    res.json({
      response: aiResponse,
      phase: nextPhase,
      phaseIndex: nextPhaseIndex,
      totalPhases: PHASES.length,
      isComplete,
    });
  } catch (err) {
    console.error('Chat message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

router.get('/history/:sessionId', authenticate, async (req, res) => {
  try {
    const messages = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [req.params.sessionId]
    );
    res.json({ messages: messages.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

module.exports = router;