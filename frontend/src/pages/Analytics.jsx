import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Sparkles, TrendingUp, RefreshCw, Info } from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

const Analytics = () => {
  const { authFetch } = useAuth();
  
  const [sleepLogs, setSleepLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [fitnessLogs, setFitnessLogs] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [geminiAdvice, setGeminiAdvice] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch Sleep logs
      const sleepRes = await authFetch('/routine/sleep');
      const sleepData = await sleepRes.json();
      // Reverse logs to chronological order for charts
      setSleepLogs([...sleepData].reverse());

      // Fetch Tasks
      const tasksRes = await authFetch('/routine/tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // Fetch Fitness logs
      const fitnessRes = await authFetch('/fitness');
      const fitnessData = await fitnessRes.json();
      setFitnessLogs([...fitnessData].reverse());

      // Fetch Mood logs
      const moodRes = await authFetch('/mood');
      const moodData = await moodRes.json();
      setMoodLogs([...moodData].reverse());

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAISuggestions = async () => {
    try {
      setAiLoading(true);
      const res = await authFetch('/ai/suggestions', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.localSuggestions || []);
        setGeminiAdvice(data.geminiAdvice || '');
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
    loadAISuggestions();
  }, []);

  // 1. DATA PREPARATION: Sleep Chart (last 7 logs)
  const recentSleepLogs = sleepLogs.slice(-7);
  const sleepChartData = {
    labels: recentSleepLogs.map(log => log.date),
    datasets: [
      {
        label: 'Duration (hours)',
        data: recentSleepLogs.map(log => log.duration),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Sleep Score (0-100)',
        data: recentSleepLogs.map(log => log.sleepScore !== undefined ? log.sleepScore : log.quality * 20),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.3,
        yAxisID: 'y1',
      }
    ]
  };

  const sleepChartOptions = {
    responsive: true,
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Hours Slept', color: '#9ca3af' },
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        title: { display: true, text: 'Sleep Score', color: '#9ca3af' },
        ticks: { color: '#6b7280' },
        grid: { drawOnChartArea: false }
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    },
    plugins: {
      legend: { labels: { color: '#f3f4f6' } }
    }
  };

  // 2. DATA PREPARATION: Task Completion Rate (last 7 days)
  const today = new Date();
  const dateLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const completionRates = dateLabels.map(date => {
    const activeTasks = tasks;
    if (activeTasks.length === 0) return 0;
    const completed = activeTasks.filter(t => t.completedDates?.includes(date)).length;
    return Math.round((completed / activeTasks.length) * 100);
  });

  const taskChartData = {
    labels: dateLabels.map(d => d.slice(5)), // display MM-DD
    datasets: [
      {
        label: 'Task Completion %',
        data: completionRates,
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderRadius: 6,
      }
    ]
  };

  const taskChartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#6b7280', callback: value => `${value}%` },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // 3. DATA PREPARATION: Weight History Chart (last 10 entries)
  const weightLogs = fitnessLogs.filter(log => log.weight !== null).slice(-10);
  const weightChartData = {
    labels: weightLogs.map(log => log.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightLogs.map(log => log.weight),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.2,
        fill: true,
      }
    ]
  };

  const weightChartOptions = {
    responsive: true,
    scales: {
      y: {
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    },
    plugins: {
      legend: { labels: { color: '#f3f4f6' } }
    }
  };

  return (
    <div className="page-container">
      
      {/* Overview stats header */}
      <div className="card flex justify-between align-center" style={{ padding: '12px 24px', flexShrink: 0 }}>
        <div className="flex align-center gap-8">
          <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Performance & Growth Metrics</span>
        </div>
        <button onClick={() => { loadAnalyticsData(); loadAISuggestions(); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
          <RefreshCw size={12} /> Reload Analytics
        </button>
      </div>

      {loading ? (
        <div className="card text-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Compiling analytics dataset...</span>
        </div>
      ) : (
        <div className="inner-column">
          {/* Row 1: Habits & Sleep Charts */}
          <div className="grid-2" style={{ gap: '20px', flex: '1.1', minHeight: 0 }}>
            
            {/* Task completion rate card */}
            <div className="card" style={{ height: '100%' }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Daily Task Compliance (Last 7 Days)</span>
              <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {tasks.length === 0 ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No tasks defined. Tracking compliance requires task logs.
                  </div>
                ) : (
                  <Bar data={taskChartData} options={{ ...taskChartOptions, maintainAspectRatio: false }} />
                )}
              </div>
            </div>

            {/* Sleep trend card */}
            <div className="card" style={{ height: '100%' }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Sleep Cycles & Quality</span>
              <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {sleepLogs.length === 0 ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No sleep history available. Log sleep on the dashboard to visualize.
                  </div>
                ) : (
                  <Line data={sleepChartData} options={{ ...sleepChartOptions, maintainAspectRatio: false }} />
                )}
              </div>
            </div>

          </div>

          {/* Row 2: Weight Chart & AI Coach */}
          <div className="grid-2" style={{ gap: '20px', flex: '1', minHeight: 0 }}>
            
            {/* Weight trend card */}
            <div className="card" style={{ height: '100%' }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Weight Trajectory Chart</span>
              <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {weightLogs.length === 0 ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No weights logged. Add weight inputs on the Fitness page.
                  </div>
                ) : (
                  <Line data={weightChartData} options={{ ...weightChartOptions, maintainAspectRatio: false }} />
                )}
              </div>
            </div>

            {/* AI Coach card */}
            <div className="card" style={{ height: '100%' }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '12px', flexShrink: 0 }}>
                <span className="flex align-center gap-8">
                  <Sparkles size={14} style={{ color: 'var(--color-primary)' }} /> AI Coach Insights
                </span>
                {aiLoading && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Processing...</span>}
              </span>

              <div className="flex gap-16" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                
                {/* Local engine list */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                  <span className="form-label" style={{ fontSize: '10px', marginBottom: '4px', flexShrink: 0 }}>Actionable Diagnostics</span>
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className={`ai-suggestion-card priority-${s.priority}`} style={{ padding: '10px', borderRadius: '6px' }}>
                      <div className="ai-suggestion-header" style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <span>{s.title}</span>
                        <span style={{ 
                          fontSize: '8px', 
                          textTransform: 'uppercase', 
                          color: s.priority === 'high' ? 'var(--color-danger)' : s.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-primary)' 
                        }}>
                          {s.priority}
                        </span>
                      </div>
                      <div className="ai-suggestion-desc" style={{ fontSize: '11px', lineHeight: 1.4 }}>{s.description}</div>
                    </div>
                  ))}
                </div>

                {/* Gemini advice */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="form-label" style={{ fontSize: '10px', marginBottom: '4px', flexShrink: 0 }}>Gemini AI Analysis</span>
                  {geminiAdvice ? (
                    <p className="ai-coach-text" style={{ fontSize: '11px', margin: 0, lineHeight: 1.5 }}>{geminiAdvice}</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <Info size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p>Provide a Google Gemini API Key in the Settings page to unlock deep LLM summaries of your routines.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Analytics;
