import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

export default function SimulatePage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('readiness');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [chosenPath, setChosenPath] = useState('');

  const runSimulation = async (type) => {
    setLoading(true);
    try {
      let res;
      if (type === 'readiness') {
        res = await api.post('/evaluate', { ideaId: parseInt(ideaId) });
        setResults(prev => ({ ...prev, readiness: res.data.evaluation }));
      } else if (type === 'users') {
        res = await api.post('/simulate/users', { ideaId: parseInt(ideaId) });
        setResults(prev => ({ ...prev, users: res.data.simulation }));
      } else if (type === 'conflict') {
        res = await api.post('/simulate/stakeholders', { ideaId: parseInt(ideaId) });
        setResults(prev => ({ ...prev, conflict: res.data }));
      } else if (type === 'consequences') {
        if (!chosenPath) return alert('Select a decision path first');
        res = await api.post('/simulate/consequences', { ideaId: parseInt(ideaId), chosenPath });
        setResults(prev => ({ ...prev, consequences: res.data.consequences }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const ScoreBar = ({ label, value, max = 100, color = 'sky' }) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-medium">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`bg-${color}-500 h-2 rounded-full transition-all duration-700`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  const TABS = [
    { id: 'readiness', label: '✅ Readiness', icon: '📋' },
    { id: 'users', label: '👥 User Perception', icon: '👥' },
    { id: 'conflict', label: '⚡ Conflict Engine', icon: '⚡' },
    { id: 'consequences', label: '🔮 Consequences', icon: '🔮' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Simulation Engine</h1>
          <p className="text-gray-400 mt-1">Run different simulations to evaluate your idea from multiple angles</p>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'readiness' && (
          <div className="space-y-4">
            {!results.readiness ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-white mb-2">Readiness Check</h3>
                <p className="text-gray-400 text-sm mb-6">Evaluate your idea's readiness across clarity, feasibility, resources, and risk awareness</p>
                <button onClick={() => runSimulation('readiness')} disabled={loading} className="btn-primary">
                  {loading ? 'Analyzing...' : 'Run Readiness Check'}
                </button>
              </div>
            ) : (
              <div className="fade-in space-y-4">
                <div className={`card text-center border-2 ${results.readiness.isReady ? 'border-emerald-700' : 'border-amber-700'}`}>
                  <div className="text-5xl font-bold mb-2" style={{ color: results.readiness.score >= 60 ? '#34d399' : results.readiness.score >= 40 ? '#fbbf24' : '#f87171' }}>
                    {results.readiness.score}
                  </div>
                  <div className={`text-lg font-semibold mb-1 ${results.readiness.isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {results.readiness.isReady ? '✅ Ready to Proceed' : '⚠️ Needs More Work'}
                  </div>
                  <p className="text-gray-400 text-sm">{results.readiness.recommendation}</p>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-4">Score Breakdown</h3>
                  <div className="space-y-3">
                    <ScoreBar label="Problem Clarity" value={results.readiness.breakdown?.clarity || 0} max={25} color="sky" />
                    <ScoreBar label="Feasibility" value={results.readiness.breakdown?.feasibility || 0} max={25} color="amber" />
                    <ScoreBar label="Resource Planning" value={results.readiness.breakdown?.resources || 0} max={25} color="violet" />
                    <ScoreBar label="Risk Awareness" value={results.readiness.breakdown?.riskAwareness || 0} max={25} color="rose" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="font-semibold text-emerald-400 mb-3">✅ Strengths</h3>
                    <ul className="space-y-1">
                      {(results.readiness.strengths || []).map((s, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-1"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="card">
                    <h3 className="font-semibold text-amber-400 mb-3">⚠️ Missing</h3>
                    <ul className="space-y-1">
                      {(results.readiness.missingElements || []).map((m, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-1"><span className="text-amber-500 mt-0.5">•</span>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-3">🇮🇳 Government Schemes</h3>
                  {Object.entries(results.readiness.governmentSchemes || {}).map(([stage, schemes]) => (
                    <div key={stage} className="mb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{stage.replace('stage', 'Stage ')}</p>
                      {schemes.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <span className="text-violet-400">★</span>
                          <span className="text-sm text-gray-300">{s}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {!results.users ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-white mb-2">User Perception Simulation</h3>
                <p className="text-gray-400 text-sm mb-6">Simulate how the Indian public would react to your idea</p>
                <button onClick={() => runSimulation('users')} disabled={loading} className="btn-primary">
                  {loading ? 'Simulating...' : 'Simulate User Reactions'}
                </button>
              </div>
            ) : (
              <div className="fade-in space-y-4">
                <div className="card">
                  <h3 className="font-semibold text-white mb-4">Sentiment Metrics</h3>
                  <div className="space-y-3">
                    <ScoreBar label="Trust Level" value={results.users.trust} color="sky" />
                    <ScoreBar label="Awareness Potential" value={results.users.awareness} color="violet" />
                    <ScoreBar label="Adoption Likelihood" value={results.users.adoption} color="emerald" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-400">Overall Sentiment:</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${results.users.overallSentiment === 'positive' ? 'bg-emerald-900 text-emerald-300' : results.users.overallSentiment === 'negative' ? 'bg-rose-900 text-rose-300' : 'bg-amber-900 text-amber-300'}`}>
                      {results.users.overallSentiment}
                    </span>
                  </div>
                </div>

                <div className="card">
                  <p className="text-sm text-gray-300 leading-relaxed">{results.users.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="font-semibold text-emerald-400 mb-3">👍 Positive</h3>
                    {(results.users.positiveReactions || []).map((r, i) => <p key={i} className="text-sm text-gray-300 py-0.5">• {r}</p>)}
                  </div>
                  <div className="card">
                    <h3 className="font-semibold text-rose-400 mb-3">👎 Concerns</h3>
                    {(results.users.concerns || []).map((c, i) => <p key={i} className="text-sm text-gray-300 py-0.5">• {c}</p>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'conflict' && (
          <div className="space-y-4">
            {!results.conflict ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-white mb-2">Conflict Engine</h3>
                <p className="text-gray-400 text-sm mb-6">Analyze conflicts between investor & NGO perspectives on your idea</p>
                <button onClick={() => runSimulation('conflict')} disabled={loading} className="btn-primary">
                  {loading ? 'Analyzing...' : 'Run Conflict Analysis'}
                </button>
              </div>
            ) : (
              <div className="fade-in space-y-4">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Overall Viability</h3>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
                      results.conflict.conflict?.conflictLevel === 'high' ? 'border-rose-700 text-rose-300 bg-rose-900/30' :
                      results.conflict.conflict?.conflictLevel === 'low' ? 'border-emerald-700 text-emerald-300 bg-emerald-900/30' :
                      'border-amber-700 text-amber-300 bg-amber-900/30'
                    }`}>
                      {results.conflict.conflict?.conflictLevel?.toUpperCase()} CONFLICT
                    </span>
                  </div>
                  <ScoreBar label="Viability Score" value={results.conflict.conflict?.overallViability || 0} color="sky" />
                  <div className="mt-4 p-3 bg-sky-900/20 border border-sky-800 rounded-lg">
                    <p className="text-sm text-sky-200">{results.conflict.conflict?.recommendation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="font-semibold text-rose-400 mb-3">⚡ Conflict Areas</h3>
                    {(results.conflict.conflict?.conflictAreas || []).map((a, i) => <p key={i} className="text-sm text-gray-300 py-0.5">• {a}</p>)}
                  </div>
                  <div className="card">
                    <h3 className="font-semibold text-emerald-400 mb-3">🤝 Alignment Areas</h3>
                    {(results.conflict.conflict?.alignmentAreas || []).map((a, i) => <p key={i} className="text-sm text-gray-300 py-0.5">• {a}</p>)}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-2">Next Best Step</h3>
                  <p className="text-sm text-gray-300">{results.conflict.conflict?.nextBestStep}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'consequences' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Choose Your Decision Path</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { value: 'continue', label: '▶ Continue', desc: 'Move forward as is', color: 'sky' },
                  { value: 'improve', label: '⬆ Improve', desc: 'Refine and iterate', color: 'amber' },
                  { value: 'change_idea', label: '🔄 Change Idea', desc: 'Pivot to something new', color: 'violet' },
                ].map(path => (
                  <button
                    key={path.value}
                    onClick={() => setChosenPath(path.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      chosenPath === path.value ? `border-${path.color}-500 bg-${path.color}-900/20` : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{path.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{path.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => runSimulation('consequences')} disabled={loading || !chosenPath} className="btn-primary w-full">
                {loading ? 'Simulating...' : 'Simulate Consequences'}
              </button>
            </div>

            {results.consequences && (
              <div className="fade-in space-y-4">
                <div className="card border-sky-800">
                  <h3 className="font-semibold text-sky-400 mb-2">⚡ Immediate Outcome</h3>
                  <p className="text-sm text-gray-300">{results.consequences.immediateOutcome}</p>
                </div>

                <div className="card border-violet-800">
                  <h3 className="font-semibold text-violet-400 mb-2">💡 Hidden Insight</h3>
                  <p className="text-sm text-gray-300">{results.consequences.hiddenInsight}</p>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-3">📅 Timeline</h3>
                  <div className="space-y-3">
                    {Object.entries(results.consequences.timeline || {}).map(([period, desc]) => (
                      <div key={period} className="flex gap-3">
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-gray-300 shrink-0 h-fit">{period}</span>
                        <p className="text-sm text-gray-300">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-3">🎯 Expectation vs Reality</h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-emerald-900/20 rounded">
                      <p className="text-xs text-emerald-400 font-medium mb-1">EXPECTED</p>
                      <p className="text-sm text-gray-300">{results.consequences.expectedVsReality?.expected}</p>
                    </div>
                    <div className="p-2 bg-amber-900/20 rounded">
                      <p className="text-xs text-amber-400 font-medium mb-1">REALITY</p>
                      <p className="text-sm text-gray-300">{results.consequences.expectedVsReality?.reality}</p>
                    </div>
                    <div className="p-2 bg-rose-900/20 rounded">
                      <p className="text-xs text-rose-400 font-medium mb-1">THE GAP</p>
                      <p className="text-sm text-gray-300">{results.consequences.expectedVsReality?.gap}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-3">📋 Next Steps</h3>
                  <div className="space-y-2">
                    {(results.consequences.nextSteps || []).map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-sky-700 rounded-full text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                        <p className="text-sm text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
