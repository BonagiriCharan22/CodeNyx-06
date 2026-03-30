import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CameraVoicePanel from '../components/CameraVoicePanel';
import api from '../utils/api';

const STAKEHOLDERS = [
  { value: 'investor', label: 'Investor', icon: '💼', desc: 'Focus: Revenue, scalability, returns', color: 'amber' },
  { value: 'ngo', label: 'NGO Evaluator', icon: '🤲', desc: 'Focus: Impact, community, feasibility', color: 'emerald' },
];

export default function PitchPage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [stage, setStage] = useState('select');
  const [selectedType, setSelectedType] = useState('');
  const [pitchText, setPitchText] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [round, setRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startPitch = async () => {
    if (!pitchText.trim() || !selectedType) return;
    setLoading(true);
    try {
      const res = await api.post('/pitch/start', {
        ideaId: parseInt(ideaId),
        stakeholderType: selectedType,
        pitchText: pitchText.trim(),
      });
      setSessionId(res.data.sessionId);
      setMessages([
        { role: 'user', content: pitchText.trim() },
        { role: 'stakeholder', content: res.data.question },
      ]);
      setRound(res.data.round);
      setStage('pitching');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start pitch');
    } finally {
      setLoading(false);
    }
  };

  const sendResponse = async (text) => {
    if (!text || !text.trim() || loading || isComplete) return;
    setMessages(prev => [...prev, { role: 'user', content: text.trim() }]);
    setLoading(true);
    try {
      const res = await api.post('/pitch/respond', { sessionId, answer: text.trim() });
      if (res.data.isComplete) {
        setIsComplete(true);
        setDecision(res.data.decision);
        setMessages(prev => [...prev, { role: 'stakeholder', content: `🏁 Final Decision:\n\n${res.data.rawDecision}` }]);
        setCompletedSessions(prev => [...prev, selectedType]);
      } else {
        setMessages(prev => [...prev, { role: 'stakeholder', content: res.data.question }]);
        setRound(res.data.round);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error sending response');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (text) => {
    if (stage === 'pitching' && text && !loading && !isComplete) {
      sendResponse(text);
    } else if (stage === 'select' && text) {
      setPitchText(prev => prev + ' ' + text);
    }
  };

  const resetForNext = () => {
    setStage('select');
    setSelectedType('');
    setPitchText('');
    setMessages([]);
    setSessionId(null);
    setRound(1);
    setIsComplete(false);
    setDecision(null);
  };

  const verdictColor = {
    Accept: 'text-emerald-400 bg-emerald-900/30 border-emerald-700',
    Reject: 'text-rose-400 bg-rose-900/30 border-rose-700',
    Hesitant: 'text-amber-400 bg-amber-900/30 border-amber-700',
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="w-72 shrink-0 flex flex-col overflow-hidden">
          <CameraVoicePanel onTranscript={handleVoiceTranscript} disabled={isComplete} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {stage === 'select' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white">Stakeholder Pitch Simulation</h1>
                  <p className="text-gray-400 mt-1">Simulate real pitching rounds with investors and NGOs. The AI will ask follow-up questions based on your answers.</p>
                </div>

                {completedSessions.length > 0 && (
                  <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-800 rounded-xl">
                    <p className="text-sm text-emerald-300">
                      ✓ Completed: {completedSessions.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="label">Select Stakeholder Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STAKEHOLDERS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setSelectedType(s.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          selectedType === s.value
                            ? s.value === 'investor' ? 'border-amber-500 bg-amber-900/20' : 'border-emerald-500 bg-emerald-900/20'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-3xl mb-2">{s.icon}</div>
                        <div className="font-semibold text-white text-sm">{s.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="label">Your Opening Pitch</label>
                  <p className="text-xs text-gray-500 mb-2">Speak with camera or type below. Describe your idea, the problem, and your solution.</p>
                  <textarea
                    className="input-field h-32 resize-none"
                    placeholder='e.g., "My idea is a mental health app for college students in India. We provide anonymous peer support and connect users with affordable therapists..."'
                    value={pitchText}
                    onChange={e => setPitchText(e.target.value)}
                  />
                </div>

                <button
                  onClick={startPitch}
                  disabled={loading || !selectedType || !pitchText.trim()}
                  className="btn-primary w-full"
                >
                  {loading ? 'Starting...' : `Start ${selectedType ? (selectedType === 'investor' ? 'Investor' : 'NGO') : ''} Pitch →`}
                </button>

                <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-xs text-gray-400">
                    <strong className="text-gray-300">How it works:</strong> You pitch → Stakeholder asks 3 rounds of follow-up questions → AI gives final Accept/Reject/Hesitant decision with reasoning.
                  </p>
                </div>
              </div>
            </div>
          )}

          {stage === 'pitching' && (
            <>
              <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{selectedType === 'investor' ? '💼' : '🤲'}</span>
                  <span className="font-semibold text-white text-sm">
                    {selectedType === 'investor' ? 'Investor' : 'NGO Evaluator'} Pitch
                  </span>
                  {isComplete && (
                    <span className="bg-emerald-700 text-white text-xs px-2 py-0.5 rounded-full">Complete</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">Round {Math.min(round, 3)} of 3</span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'user' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1 ${selectedType === 'investor' ? 'bg-amber-700' : 'bg-emerald-700'}`}>
                        {selectedType === 'investor' ? '💼' : '🤲'}
                      </div>
                    )}
                    <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 ${selectedType === 'investor' ? 'bg-amber-700' : 'bg-emerald-700'}`}>
                      {selectedType === 'investor' ? '💼' : '🤲'}
                    </div>
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
                  <div>
                    {decision && (
                      <div className={`mb-4 p-4 border rounded-xl ${verdictColor[decision.verdict] || verdictColor.Hesitant}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg">
                            {decision.verdict === 'Accept' ? '✅' : decision.verdict === 'Reject' ? '❌' : '🤔'}
                          </span>
                          <span className="font-bold">{decision.verdict}</span>
                          <span className="text-sm opacity-70">Score: {decision.score}/100</span>
                        </div>
                        <p className="text-sm opacity-80">{decision.reason}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={resetForNext} className="btn-secondary flex-1">
                        🔄 Pitch to {selectedType === 'investor' ? 'NGO' : 'Investor'}
                      </button>
                      <button onClick={() => navigate(`/simulate/${ideaId}`)} className="btn-primary flex-1">
                        📊 View Full Simulation →
                      </button>
                    </div>
                  </div>
                ) : (
                  <PitchTypeBar onSend={sendResponse} disabled={loading} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PitchTypeBar({ onSend, disabled }) {
  const [text, setText] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) { onSend(text.trim()); setText(''); }
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        className="input-field flex-1"
        placeholder="Answer the question or use voice input..."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !text.trim()} className="btn-primary px-5">Send</button>
    </form>
  );
}
