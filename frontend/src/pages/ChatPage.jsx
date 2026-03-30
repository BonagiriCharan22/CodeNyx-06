import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CameraVoicePanel from '../components/CameraVoicePanel';
import api from '../utils/api';

const PHASE_LABELS = {
  problem_clarity: { label: 'Phase 1: Problem Clarity', color: 'bg-sky-700', icon: '🎯' },
  feasibility: { label: 'Phase 2: Feasibility', color: 'bg-amber-700', icon: '⚙️' },
  resource_planning: { label: 'Phase 3: Resources', color: 'bg-emerald-700', icon: '🛠️' },
  risk_awareness: { label: 'Phase 4: Risk Awareness', color: 'bg-rose-700', icon: '⚠️' },
};

export default function ChatPage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [phase, setPhase] = useState('problem_clarity');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    startChat();
  }, [ideaId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = async () => {
    setStarting(true);
    try {
      const res = await api.post('/chat/start', { ideaId: parseInt(ideaId) });
      setSessionId(res.data.sessionId);
      setPhase(res.data.phase);
      setPhaseIndex(res.data.phaseIndex);
      setMessages([{ role: 'assistant', content: res.data.question }]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session.');
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async (text) => {
    if (!text || !text.trim() || loading || isComplete) return;
    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/chat/message', { sessionId, message: text.trim() });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      setPhase(res.data.phase);
      setPhaseIndex(res.data.phaseIndex);
      if (res.data.isComplete) setIsComplete(true);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an issue. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (text) => {
    if (text && !loading && !isComplete) {
      sendMessage(text);
    }
  };

  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.problem_clarity;
  const progressPct = ((phaseIndex + 1) / 4) * 100;

  if (starting) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Starting your mentoring session...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      {error && (
        <div className="bg-rose-900/40 border-b border-rose-800 px-6 py-3 text-rose-300 text-sm">{error}</div>
      )}

      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="w-72 shrink-0 flex flex-col overflow-hidden">
          <CameraVoicePanel onTranscript={handleVoiceTranscript} disabled={isComplete} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{phaseInfo.icon}</span>
                <span className="font-semibold text-white text-sm">{phaseInfo.label}</span>
                {isComplete && (
                  <span className="bg-emerald-700 text-white text-xs px-2 py-0.5 rounded-full">Complete ✓</span>
                )}
              </div>
              <span className="text-xs text-gray-400">{phaseIndex + 1} / 4 phases</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-sky-700 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1">🤖</div>
                )}
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start fade-in">
                <div className="w-8 h-8 bg-sky-700 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1">🤖</div>
                <div className="chat-bubble-ai flex items-center gap-1.5 py-4">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="bg-gray-900 border-t border-gray-800 p-4">
            {isComplete ? (
              <div className="text-center">
                <p className="text-emerald-400 font-medium mb-3">🎉 Mentoring complete! Your idea is structured and ready for the next steps.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate(`/simulate/${ideaId}`)}
                    className="btn-primary"
                  >
                    📊 Run Simulation
                  </button>
                  <button
                    onClick={() => navigate(`/pitch/${ideaId}`)}
                    className="btn-accent"
                  >
                    🎤 Start Pitching
                  </button>
                </div>
              </div>
            ) : (
              <TypeBar onSend={sendMessage} disabled={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeBar({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        className="input-field flex-1"
        placeholder="Type your answer or use voice input on the left..."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="btn-primary px-5"
      >
        Send
      </button>
    </form>
  );
}
