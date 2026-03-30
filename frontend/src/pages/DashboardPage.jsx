import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const DOMAIN_LABELS = {
  mental_health: '🧠 Mental Health',
  education: '📚 Education',
  healthcare: '🏥 Healthcare',
  environment: '🌿 Environment',
  women_empowerment: '👩 Women Empowerment',
  poverty_livelihood: '🤲 Poverty & Livelihood',
  smart_communities: '🏙️ Smart Communities',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/session').then(res => {
      setSessionData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  const ideas = sessionData?.ideas || [];

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-400 mt-1">Your social innovation workspace</p>
          </div>
          <Link to="/idea" className="btn-primary flex items-center gap-2">
            <span>+</span> New Idea
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Ideas', value: ideas.length, icon: '💡', color: 'sky' },
            { label: 'Chat Sessions', value: ideas.reduce((a, i) => a + parseInt(i.chat_count || 0), 0), icon: '🤖', color: 'violet' },
            { label: 'Pitch Sessions', value: ideas.reduce((a, i) => a + parseInt(i.pitch_count || 0), 0), icon: '🎤', color: 'amber' },
          ].map(stat => (
            <div key={stat.label} className="card flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Ideas</h2>
            </div>

            {ideas.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">💡</div>
                <h3 className="text-lg font-semibold text-white mb-2">No ideas yet</h3>
                <p className="text-gray-400 mb-6 text-sm">Start by creating your first social enterprise idea</p>
                <Link to="/idea" className="btn-primary inline-block">Create Your First Idea</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {ideas.map(idea => (
                  <div key={idea.id} className="card hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{idea.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                            {DOMAIN_LABELS[idea.domain] || idea.domain}
                          </span>
                          <span className="text-xs text-gray-500">
                            {idea.chat_count} chats • {idea.pitch_count} pitches
                          </span>
                        </div>
                        {idea.description && (
                          <p className="text-sm text-gray-400 mt-1 truncate">{idea.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 ml-4 shrink-0">
                        <button
                          onClick={() => navigate(`/chat/${idea.id}`)}
                          className="text-xs bg-sky-700 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          🤖 Mentor
                        </button>
                        <button
                          onClick={() => navigate(`/pitch/${idea.id}`)}
                          className="text-xs bg-violet-700 hover:bg-violet-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          🎤 Pitch
                        </button>
                        <button
                          onClick={() => navigate(`/simulate/${idea.id}`)}
                          className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          📊 Simulate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { to: '/idea', icon: '💡', label: 'Create New Idea', color: 'sky' },
                  { to: '/collaborate', icon: '🤝', label: 'Find Collaborators', color: 'violet' },
                ].map(action => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-200">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-white mb-3">🇮🇳 Get Started</h3>
              <div className="space-y-2">
                {[
                  { name: 'Startup India', url: 'https://www.startupindia.gov.in' },
                  { name: 'Atal Innovation Mission', url: 'https://aim.gov.in' },
                  { name: 'MUDRA Yojana', url: 'https://www.mudra.org.in' },
                ].map(scheme => (
                  <a key={scheme.name} href={scheme.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-violet-300 hover:text-violet-200 transition-colors">
                    <span className="text-violet-500">★</span> {scheme.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')} • {user?.email}</p>
                </div>
              </div>
              {user?.domain && (
                <p className="text-xs text-sky-400 mt-1">{DOMAIN_LABELS[user.domain] || user.domain}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
