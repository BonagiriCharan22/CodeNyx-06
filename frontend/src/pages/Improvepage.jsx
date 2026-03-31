import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

export default function ImprovePage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('suggestions'); // 'suggestions' | 'questions' | 'complete'
  const [idea, setIdea] = useState(null);

  // Phase 1
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Phase 2
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Phase 3
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const answerRef = useRef(null);

  // Fetch idea details on mount
  useEffect(() => {
    const fetchIdea = async () => {
      try {
        const res = await api.get(`/ideas/${ideaId}`);
        setIdea(res.data.idea || res.data);
      } catch (err) {
        console.error('Failed to fetch idea', err);
      }
    };
    fetchIdea();
  }, [ideaId]);

  // Phase 1: Fetch AI suggestions
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await api.post('/improve/suggestions', { ideaId: parseInt(ideaId) });
      setSuggestions(res.data.suggestions);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fetch suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Phase 1 → 2: Generate follow-up questions from suggestions
  const startQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.post('/improve/questions', {
        ideaId: parseInt(ideaId),
        suggestions,
      });
      setQuestions(res.data.questions || []);
      setPhase('questions');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Phase 2: Submit answer, advance to next question
  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    const updated = [...answers, { question: questions[currentQIndex], answer: currentAnswer.trim() }];
    setAnswers(updated);
    setCurrentAnswer('');

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(prev => prev + 1);
      setTimeout(() => answerRef.current?.focus(), 100);
    } else {
      generateSummary(updated);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer();
  };

  // Phase 2 → 3: Generate improvement summary
  const generateSummary = async (allAnswers) => {
    setLoadingSummary(true);
    setPhase('complete');
    try {
      const res = await api.post('/improve/summary', {
        ideaId: parseInt(ideaId),
        suggestions,
        answers: allAnswers,
      });
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Summary generation failed', err);
      setSummary({
        overallImprovement: 'Your responses show meaningful improvements to the original idea.',
        keyChanges: allAnswers.map(a => `Addressed: ${a.question}`),
        readinessLevel: 'Improved',
        nextAction: 'Proceed to Pitch Session with your refined idea.',
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const progressPercent =
    phase === 'suggestions' ? 33 :
    phase === 'questions'   ? 33 + Math.round((currentQIndex / Math.max(questions.length, 1)) * 34) :
    100;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <span className={phase === 'suggestions' ? 'text-amber-400 font-medium' : 'text-gray-500'}>
              1. AI Suggestions
            </span>
            <span>›</span>
            <span className={phase === 'questions' ? 'text-amber-400 font-medium' : 'text-gray-500'}>
              2. Clarity Questions
            </span>
            <span>›</span>
            <span className={phase === 'complete' ? 'text-emerald-400 font-medium' : 'text-gray-500'}>
              3. Improvement Summary
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mb-5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <h1 className="text-2xl font-bold text-white">⬆ Improve Your Idea</h1>
          {idea && (
            <p className="text-gray-400 mt-1 text-sm">
              Refining: <span className="text-amber-400 font-medium">{idea.title}</span>
            </p>
          )}
        </div>

        {/* ── PHASE 1: AI SUGGESTIONS ── */}
        {phase === 'suggestions' && (
          <div className="space-y-4">
            {!suggestions ? (
              <div className="card text-center py-14">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Improvement Analysis</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                  Our AI will analyse your idea and suggest specific, actionable improvements across
                  clarity, feasibility, market fit, and impact.
                </p>
                <button
                  onClick={fetchSuggestions}
                  disabled={loadingSuggestions}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {loadingSuggestions ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analysing your idea...
                    </>
                  ) : '✨ Generate Improvement Suggestions'}
                </button>
              </div>
            ) : (
              <div className="fade-in space-y-4">
                {suggestions.overallAssessment && (
                  <div className="card border-amber-800 bg-amber-900/10">
                    <h3 className="font-semibold text-amber-400 mb-2">📊 Overall Assessment</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{suggestions.overallAssessment}</p>
                  </div>
                )}

                {(suggestions.improvements || []).map((item, i) => (
                  <div key={i} className="card">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-amber-700 rounded-lg text-white text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white text-sm">{item.area}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.priority === 'high'   ? 'bg-rose-900 text-rose-300' :
                            item.priority === 'medium' ? 'bg-amber-900 text-amber-300' :
                                                         'bg-gray-800 text-gray-400'
                          }`}>
                            {item.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{item.suggestion}</p>
                        {item.example && (
                          <p className="text-xs text-gray-500 italic border-l-2 border-gray-700 pl-2">
                            {item.example}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(suggestions.quickWins || []).length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-emerald-400 mb-3">⚡ Quick Wins</h3>
                    <div className="space-y-1">
                      {suggestions.quickWins.map((w, i) => (
                        <p key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{w}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card bg-amber-900/10 border-amber-700">
                  <p className="text-sm text-gray-300 mb-4">
                    Now let's verify you've understood and can act on these improvements. The AI will ask you{' '}
                    <strong className="text-white">{suggestions.improvements?.length || 3} focused questions</strong> — one per improvement area.
                  </p>
                  <button
                    onClick={startQuestions}
                    disabled={loadingQuestions}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-sm transition-all inline-flex items-center justify-center gap-2"
                  >
                    {loadingQuestions ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating questions...
                      </>
                    ) : 'Next: Answer Clarity Questions →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 2: FOLLOW-UP QUESTIONS ── */}
        {phase === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">
                Question <span className="text-white font-semibold">{currentQIndex + 1}</span> of{' '}
                <span className="text-white font-semibold">{questions.length}</span>
              </p>
              <div className="flex gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i < currentQIndex   ? 'bg-amber-500' :
                      i === currentQIndex ? 'bg-amber-400 scale-125' :
                                            'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Previous answered questions */}
            {answers.length > 0 && (
              <div className="space-y-2">
                {answers.map((a, i) => (
                  <div key={i} className="card bg-gray-900/50 border-gray-800 opacity-70">
                    <p className="text-xs text-gray-500 mb-1">Q{i + 1}: {a.question}</p>
                    <p className="text-sm text-gray-400 italic">"{a.answer}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Current question */}
            <div className="card border-amber-700 bg-amber-900/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                  🤖
                </div>
                <div>
                  <p className="text-xs text-amber-400 font-medium mb-1">AI Question {currentQIndex + 1}</p>
                  <p className="text-white text-sm leading-relaxed">{questions[currentQIndex]}</p>
                </div>
              </div>

              <textarea
                ref={answerRef}
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here... (Ctrl+Enter to submit)"
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-amber-600 transition-colors"
                autoFocus
              />

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">Ctrl+Enter to submit</p>
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                >
                  {currentQIndex + 1 < questions.length ? 'Next Question →' : 'Finish & See Summary →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 3: IMPROVEMENT SUMMARY ── */}
        {phase === 'complete' && (
          <div className="space-y-4">
            {loadingSummary ? (
              <div className="card text-center py-14">
                <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">Generating your improvement summary...</p>
                <p className="text-gray-400 text-sm mt-1">Reviewing all your answers</p>
              </div>
            ) : summary ? (
              <div className="fade-in space-y-4">
                <div className="card text-center border-emerald-700 bg-emerald-900/10">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-1">Improvement Complete!</h3>
                  <p className="text-sm text-gray-400">{summary.overallImprovement}</p>
                </div>

                {summary.readinessLevel && (
                  <div className="card flex items-center gap-4">
                    <div className="text-3xl">📈</div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">New Readiness Level</p>
                      <p className="text-white font-semibold">{summary.readinessLevel}</p>
                    </div>
                  </div>
                )}

                {(summary.keyChanges || []).length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-white mb-3">✅ Key Changes You've Made</h3>
                    <div className="space-y-2">
                      {summary.keyChanges.map((change, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-emerald-700 rounded-full text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-300">{change}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card">
                  <h3 className="font-semibold text-white mb-3">💬 Your Answers Recap</h3>
                  <div className="space-y-3">
                    {answers.map((a, i) => (
                      <div key={i} className="border-l-2 border-amber-700 pl-3">
                        <p className="text-xs text-amber-400 mb-0.5">{a.question}</p>
                        <p className="text-sm text-gray-300 italic">"{a.answer}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {summary.nextAction && (
                  <div className="card bg-sky-900/20 border-sky-700">
                    <h3 className="font-semibold text-sky-400 mb-1">🚀 What's Next</h3>
                    <p className="text-sm text-gray-300">{summary.nextAction}</p>
                  </div>
                )}

                {/* CTA to Pitch */}
                <div className="card bg-emerald-900/10 border-emerald-700">
                  <h3 className="font-semibold text-white mb-1">Ready to Pitch Your Improved Idea?</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    You've addressed the key improvement areas. Head to the Pitch Session to present
                    your refined idea to investors and NGOs.
                  </p>
                  <button
                    onClick={() => navigate(`/pitch/${ideaId}`)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all"
                  >
                    🎤 Proceed to Pitch Session →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-10 flex items-center justify-between border-t border-gray-800 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}