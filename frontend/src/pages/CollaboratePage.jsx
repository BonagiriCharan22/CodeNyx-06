import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const DOMAINS = [
  { value: '', label: 'All Domains' },
  { value: 'mental_health', label: '🧠 Mental Health' },
  { value: 'education', label: '📚 Education' },
  { value: 'healthcare', label: '🏥 Healthcare' },
  { value: 'environment', label: '🌿 Environment' },
  { value: 'women_empowerment', label: '👩 Women Empowerment' },
  { value: 'poverty_livelihood', label: '🤲 Poverty & Livelihood' },
  { value: 'smart_communities', label: '🏙️ Smart Communities' },
];

const ROLE_COLORS = {
  founder: 'bg-amber-700',
  co_founder: 'bg-violet-700',
  admin: 'bg-rose-700',
  user: 'bg-sky-700',
};

export default function CollaboratePage() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDomain, setFilterDomain] = useState('');
  const [showPost, setShowPost] = useState(false);
  const [postForm, setPostForm] = useState({ skills: '', domain: '' });
  const [postLoading, setPostLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [filterDomain]);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const params = filterDomain ? `?domain=${filterDomain}` : '';
      const res = await api.get(`/collaborators${params}`);
      setCollaborators(res.data.collaborators);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postForm.skills.trim() || !postForm.domain) return;
    setPostLoading(true);
    try {
      await api.post('/collaborators', { skills: postForm.skills, domain: postForm.domain });
      setPosted(true);
      setShowPost(false);
      fetchCollaborators();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post profile');
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Collaboration Network</h1>
            <p className="text-gray-400 mt-1">Find co-founders, developers, NGO partners, and domain experts</p>
          </div>
          <button onClick={() => setShowPost(!showPost)} className="btn-accent">
            {showPost ? 'Cancel' : '+ Post Your Skills'}
          </button>
        </div>

        {posted && (
          <div className="mb-4 p-3 bg-emerald-900/40 border border-emerald-700 rounded-xl text-emerald-300 text-sm">
            ✅ Your collaboration profile is now visible to others!
          </div>
        )}

        {showPost && (
          <div className="card mb-6 fade-in">
            <h3 className="font-semibold text-white mb-4">Post Your Skills & Domain</h3>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="label">Your Skills</label>
                <textarea
                  className="input-field h-24 resize-none"
                  placeholder="e.g., React developer, public health researcher, grant writing, community mobilization..."
                  value={postForm.skills}
                  onChange={e => setPostForm({ ...postForm, skills: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Your Domain Focus</label>
                <select
                  className="input-field"
                  value={postForm.domain}
                  onChange={e => setPostForm({ ...postForm, domain: e.target.value })}
                  required
                >
                  <option value="">Select domain...</option>
                  {DOMAINS.filter(d => d.value).map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={postLoading} className="btn-primary">
                {postLoading ? 'Posting...' : 'Post Profile'}
              </button>
            </form>
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {DOMAINS.map(d => (
            <button
              key={d.value}
              onClick={() => setFilterDomain(d.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterDomain === d.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : collaborators.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold text-white mb-2">No collaborators found</h3>
            <p className="text-gray-400 text-sm mb-4">Be the first to post your skills in this domain!</p>
            <button onClick={() => setShowPost(true)} className="btn-accent">Post Your Skills</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborators.map(collab => (
              <div key={collab.id} className="card hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0">
                    {collab.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{collab.name}</p>
                    <span className={`text-xs text-white px-2 py-0.5 rounded-full ${ROLE_COLORS[collab.role] || 'bg-gray-600'}`}>
                      {collab.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Domain</p>
                  <p className="text-xs text-sky-400">{DOMAINS.find(d => d.value === collab.domain)?.label || collab.domain}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Skills</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{collab.skills}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                  Joined {new Date(collab.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
