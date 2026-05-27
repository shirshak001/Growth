import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, Award, RefreshCw, AlertCircle, Play, CheckCircle } from 'lucide-react';

const StudyStrategist = () => {
  const { authFetch, user } = useAuth();

  // Strategist form states
  const [targetExam, setTargetExam] = useState('JEE');
  const [examDate, setExamDate] = useState('');
  const [weakSubjects, setWeakSubjects] = useState('');
  const [availableHours, setAvailableHours] = useState(4);
  const [aiRoadmap, setAiRoadmap] = useState('');

  // Mock test logs
  const [mockTests, setMockTests] = useState([]);
  const [testName, setTestName] = useState('');
  const [testScore, setTestScore] = useState('');
  const [testTotal, setTestTotal] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testAnalysis, setTestAnalysis] = useState('');

  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [loggingTest, setLoggingTest] = useState(false);

  const loadStrategistData = async () => {
    try {
      setLoading(true);
      // Fetch plan
      const planRes = await authFetch('/routine/strategist');
      if (planRes.ok) {
        const plan = await planRes.json();
        if (plan.targetExam) {
          setTargetExam(plan.targetExam);
          setExamDate(plan.examDate || '');
          setWeakSubjects(plan.weakSubjects || '');
          setAvailableHours(plan.availableHours || 4);
          setAiRoadmap(plan.aiRoadmap || '');
        }
      }

      // Fetch mock tests
      const testsRes = await authFetch('/routine/mock-tests');
      if (testsRes.ok) {
        const tests = await testsRes.json();
        setMockTests(tests);
      }
    } catch (e) {
      console.error('Error loading study strategist details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategistData();
  }, []);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      // Save details first
      const res = await authFetch('/routine/strategist', {
        method: 'POST',
        body: JSON.stringify({
          targetExam,
          examDate,
          weakSubjects,
          availableHours: Number(availableHours)
        })
      });

      if (res.ok) {
        // Generate AI Roadmap
        await generateAiRoadmap();
      }
    } catch (error) {
      console.error('Failed to save study strategy plan:', error);
    } finally {
      setSavingPlan(false);
    }
  };

  const generateAiRoadmap = async () => {
    setSavingPlan(true);
    const apiKey = user?.geminiApiKey || 'AIzaSyBFMI3frSYOwOAGZd75FqV25j_oWPuf9p0'; // Use seeded key fallback
    let generatedRoadmap = '';

    if (apiKey) {
      try {
        const prompt = `You are a world-class AI Study Strategist and Exam Performance Consultant.
The student is preparing for: "${targetExam}"
Target Exam Date: ${examDate || 'Not specified'}
Weak Subjects/Topics: "${weakSubjects || 'All general topics'}"
Available Daily Study Hours: ${availableHours} hours

Generate an advanced, highly realistic, milestone-based adaptive roadmap, weak-subject spacing loops, and burnout prevention tips.
Provide structured layout blocks (e.g. Phase 1, Phase 2, Revision loops). Limit to 250 words. Do not use emojis, keep the tone minimalist, clinical, and elite.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );

        if (response.ok) {
          const result = await response.json();
          generatedRoadmap = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          generatedRoadmap = 'Failed to generate roadmap from API. Reverting to static rules.';
        }
      } catch (error) {
        console.error('Gemini error:', error);
        generatedRoadmap = 'Connection timed out. Reverting to static rules.';
      }
    }

    if (!generatedRoadmap || generatedRoadmap.startsWith('Failed') || generatedRoadmap.startsWith('Connection')) {
      // Heuristic fallback
      generatedRoadmap = `[Adaptive Local Roadmap: ${targetExam}]\n\n` +
        `• PHASE 1 (Core Focus): Dedicate 60% of your daily ${availableHours}h block to [${weakSubjects || 'weak topics'}] revision.\n` +
        `• PHASE 2 (Spaced Recall): Solve mock tests every 3 days. Dedicate 2 hours to active diagnostic corrections.\n` +
        `• RECOVERY: Take a 15-minute screen-free walk after every 90-minute focus study block to avoid early burnout.`;
    }

    // Save final roadmap to backend
    await authFetch('/routine/strategist', {
      method: 'POST',
      body: JSON.stringify({
        targetExam,
        examDate,
        weakSubjects,
        availableHours: Number(availableHours),
        aiRoadmap: generatedRoadmap
      })
    });
    setAiRoadmap(generatedRoadmap);
  };

  const handleLogMockTest = async (e) => {
    e.preventDefault();
    if (!testName || testScore === '' || !testTotal) return;
    setLoggingTest(true);

    try {
      const res = await authFetch('/routine/mock-tests', {
        method: 'POST',
        body: JSON.stringify({
          date: testDate,
          testName,
          score: Number(testScore),
          totalMarks: Number(testTotal),
          analysis: testAnalysis
        })
      });

      if (res.ok) {
        const logged = await res.json();
        setMockTests(prev => [logged, ...prev]);
        setTestName('');
        setTestScore('');
        setTestTotal('');
        setTestAnalysis('');
      }
    } catch (err) {
      console.error('Failed logging mock test:', err);
    } finally {
      setLoggingTest(false);
    }
  };

  return (
    <div className="page-container" style={{ overflowY: 'auto' }}>
      
      <div className="grid-dash">
        
        {/* Left Column: Strategist Config Form & AI Output */}
        <div className="inner-column" style={{ height: 'auto', overflow: 'visible' }}>
          
          <div className="card">
            <span className="card-title">
              <span>Exam Strategist Configuration</span>
              <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
            </span>

            <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="grid-2" style={{ gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Target Examination</label>
                  <select
                    className="form-input"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    required
                  >
                    <option value="JEE">JEE Main / Advanced</option>
                    <option value="NEET">NEET UG</option>
                    <option value="UPSC">UPSC Civils</option>
                    <option value="Boards">Class 10/12 Boards</option>
                    <option value="College">College Semesters</option>
                    <option value="Other">General Up-skilling</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Exam Target Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Weak Subjects / Topics</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Physics Integration, Organic Chem"
                    value={weakSubjects}
                    onChange={(e) => setWeakSubjects(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Daily Available Study (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    className="form-input"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={savingPlan}>
                <RefreshCw size={14} className={savingPlan ? 'spin' : ''} />
                {savingPlan ? 'Formulating AI Roadmap...' : 'Save & Generate AI Roadmap'}
              </button>
            </form>
          </div>

          {/* AI Roadmap Results */}
          <div className="card" style={{ flex: 1, minHeight: '260px' }}>
            <span className="card-title">
              <span>Adaptive Milestone Roadmap</span>
              <Award size={16} style={{ color: 'var(--color-warning)' }} />
            </span>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading strategizer logs...</p>
            ) : aiRoadmap ? (
              <div className="ai-coach-text" style={{ fontSize: '13px', whiteSpace: 'pre-line', marginTop: 0 }}>
                {aiRoadmap}
              </div>
            ) : (
              <div className="flex gap-8" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>Provide your exam schedules and weak targets above to generate a premium adaptive revision roadmap.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Mock Test Logger & Spaced Analysis */}
        <div className="inner-column" style={{ height: 'auto', overflow: 'visible' }}>
          
          <div className="card">
            <span className="card-title">Mock Test Logger</span>
            <form onSubmit={handleLogMockTest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Test Title / Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. JEE Mock Test 12"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Score</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Score"
                    value={testScore}
                    onChange={(e) => setTestScore(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Total Marks</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Total"
                    value={testTotal}
                    onChange={(e) => setTestTotal(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Date Attempted</label>
                  <input
                    type="date"
                    className="form-input"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Weak Subjects Noticed</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Calculus, Optics"
                    value={testAnalysis}
                    onChange={(e) => setTestAnalysis(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary w-full" disabled={loggingTest}>
                <CheckCircle size={14} /> {loggingTest ? 'Logging Test...' : 'Save Mock Test Result'}
              </button>
            </form>
          </div>

          {/* Mock Test History list */}
          <div className="card" style={{ flex: 1, minHeight: '200px' }}>
            <span className="card-title">Mock Test Diagnostic Logs</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
              {mockTests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>
                  No mock test scores logged yet.
                </p>
              ) : (
                mockTests.map((test, index) => (
                  <div key={test.id || index} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex justify-between" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      <span>{test.testName}</span>
                      <span className="task-badge" style={{
                        background: test.percentage >= 75 ? 'var(--color-success-glow)' : test.percentage >= 50 ? 'var(--color-warning-glow)' : 'var(--color-danger-glow)',
                        color: test.percentage >= 75 ? 'var(--color-success)' : test.percentage >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                        border: test.percentage >= 75 ? '1px solid rgba(16, 185, 129, 0.2)' : test.percentage >= 50 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        {test.score}/{test.totalMarks} ({test.percentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Attempted: {test.date}</span>
                      {test.analysis && <span style={{ fontStyle: 'italic' }}>Weak Areas: {test.analysis}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default StudyStrategist;
