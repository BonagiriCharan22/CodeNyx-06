import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'founder', label: 'Founder', desc: 'Leading a social venture', icon: '🚀' },
  { value: 'co_founder', label: 'Co-Founder', desc: 'Co-building a venture', icon: '🤝' },
  { value: 'admin', label: 'Admin', desc: 'Platform administrator', icon: '⚙️' },
  { value: 'user', label: 'User', desc: 'Exploring ideas & learning', icon: '🌱' },
];

const DOMAINS = [
  { value: 'mental_health', label: 'Mental Health', icon: '🧠' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'environment', label: 'Environment', icon: '🌿' },
  { value: 'women_empowerment', label: 'Women Empowerment', icon: '👩' },
  { value: 'poverty_livelihood', label: 'Poverty & Livelihood', icon: '🤲' },
  { value: 'smart_communities', label: 'Smart Communities', icon: '🏙️' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', domain: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.role) return setError('Please select your role.');
    setLoading(true);
    try {
      const result = await register(form);
      if (result.suggestions) {
        setSuggestions(result.suggestions);
        setStep(2);
      } else {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2 && suggestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-8">
        <div className="w-full max-w-lg fade-in">
          <div className="card">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-white">Welcome to the Platform!</h2>
              <p className="text-gray-400 mt-1">Based on your <span className="text-sky-400 font-medium">{suggestions.domainLabel}</span> domain, here are your personalized suggestions:</p>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">💡 Tips for Your Domain</h3>
              <div className="space-y-2">
                {suggestions.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-800 rounded-lg">
                    <span className="text-sky-400 text-sm mt-0.5">→</span>
                    <span className="text-sm text-gray-200">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">🇮🇳 Government Schemes for You</h3>
              <div className="space-y-2">
                {suggestions.schemes.map((scheme, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-violet-900/30 border border-violet-800/40 rounded-lg">
                    <span className="text-violet-400">★</span>
                    <span className="text-sm text-violet-200">{scheme}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full text-center block text-center"
            >
              Continue to Login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-gray-400 mt-1">Join the platform for social entrepreneurs</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-rose-900/40 border border-rose-700 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Your full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="label">Your Role *</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.role === role.value
                        ? 'border-sky-500 bg-sky-900/30 text-white'
                        : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{role.icon}</div>
                    <div className="font-medium text-sm">{role.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{role.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Focus Domain <span className="text-gray-500">(optional — get personalized suggestions)</span></label>
              <div className="grid grid-cols-2 gap-2">
                {DOMAINS.map(domain => (
                  <button
                    key={domain.value}
                    type="button"
                    onClick={() => setForm({ ...form, domain: form.domain === domain.value ? '' : domain.value })}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2 ${
                      form.domain === domain.value
                        ? 'border-violet-500 bg-violet-900/30 text-white'
                        : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span className="text-lg">{domain.icon}</span>
                    <span className="text-xs font-medium">{domain.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
