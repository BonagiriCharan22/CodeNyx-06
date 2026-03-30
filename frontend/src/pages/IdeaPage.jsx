import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const DOMAINS = [
  { value: 'mental_health', label: 'Mental Health', icon: '🧠', desc: 'Wellbeing, therapy, awareness' },
  { value: 'education', label: 'Education', icon: '📚', desc: 'Learning, skill development' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥', desc: 'Medical access, preventive care' },
  { value: 'environment', label: 'Environment', icon: '🌿', desc: 'Sustainability, clean energy' },
  { value: 'women_empowerment', label: 'Women Empowerment', icon: '👩', desc: 'Safety, opportunity, leadership' },
  { value: 'poverty_livelihood', label: 'Poverty & Livelihood', icon: '🤲', desc: 'Income, skills, micro-finance' },
  { value: 'smart_communities', label: 'Smart Communities', icon: '🏙️', desc: 'Urban tech, civic solutions' },
];

export default function IdeaPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ domain: '', title: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.domain) return setError('Please select a domain.');
    if (!form.title.trim()) return setError('Title is required.');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/ideas', form);
      navigate(`/chat/${res.data.idea.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create idea.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Define Your Idea</h1>
          <p className="text-gray-400 mt-1">Start with your social enterprise concept. Our AI mentor will guide you from here.</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-rose-900/40 border border-rose-700 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Choose Your Domain *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {DOMAINS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setForm({ ...form, domain: d.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.domain === d.value
                        ? 'border-sky-500 bg-sky-900/30 text-white'
                        : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{d.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{d.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Idea Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Mental health app for college students"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Brief Description <span className="text-gray-500">(optional)</span></label>
              <textarea
                className="input-field h-28 resize-none"
                placeholder="Describe your idea in a few sentences. What problem does it solve? Who does it help?"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating...' : 'Start Mentoring Session →'}
            </button>
          </form>
        </div>

        <div className="mt-6 card bg-gray-900/50">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">What happens next?</h3>
          <div className="space-y-2">
            {[
              { step: '1', label: 'AI Mentor Chat', desc: 'Structured Q&A across 4 phases' },
              { step: '2', label: 'Readiness Check', desc: 'Score your idea readiness (0-100)' },
              { step: '3', label: 'Stakeholder Pitch', desc: 'Pitch to simulated Investor & NGO' },
              { step: '4', label: 'Consequence Engine', desc: 'See outcomes of your decisions' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-sky-700 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0">{item.step}</span>
                <div>
                  <span className="font-medium text-gray-200">{item.label}</span>
                  <span className="text-gray-500"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
