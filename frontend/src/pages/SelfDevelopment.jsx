import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Sparkles, BookOpen, Calendar, HelpCircle } from 'lucide-react';

const SelfDevelopment = () => {
  const { authFetch } = useAuth();
  
  // Date state
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [moodLogs, setMoodLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Form states
  const [mindsetScore, setMindsetScore] = useState(3);
  const [reflection, setReflection] = useState('');
  
  const [loading, setLoading] = useState(true);

  // Load mood & tasks data
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch mood logs
      const moodRes = await authFetch('/mood');
      if (moodRes.ok) {
        const moodData = await moodRes.json();
        setMoodLogs(moodData);

        const currentLog = moodData.find(log => log.date === selectedDate);
        if (currentLog) {
          setMindsetScore(currentLog.mood);
          setReflection(currentLog.reflection || '');
        } else {
          setMindsetScore(3);
          setReflection('');
        }
      }

      // Fetch tasks to calculate streaks
      const tasksRes = await authFetch('/routine/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Error loading self-development data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Submit mindset and reflection log
  const handleSaveReflection = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/mood', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          mood: Number(mindsetScore),
          reflection
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local logs list
        setMoodLogs(prev => {
          const index = prev.findIndex(l => l.date === selectedDate);
          if (index > -1) {
            const copy = [...prev];
            copy[index] = data;
            return copy;
          } else {
            return [data, ...prev];
          }
        });
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  // Streak calculation helper
  // Checks consecutive days of completing ALL mandatory tasks in the last 15 days
  const calculateStreak = () => {
    const mandatoryTasks = tasks.filter(t => t.isMandatory);
    if (mandatoryTasks.length === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Check if all mandatory tasks were completed on this date
      const allCompleted = mandatoryTasks.every(t => t.completedDates?.includes(dateString));
      
      if (allCompleted) {
        streak++;
      } else {
        // If they missed a day, and it's not today (maybe today isn't done yet)
        if (i === 0) {
          // If today isn't done, check yesterday. If yesterday is done, streak continues.
          continue; 
        }
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // Get last 7 calendar days to show streak map
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i)); // Past 6 days to today
    return {
      dateString: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { weekday: 'short' })
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Date Header */}
      <div className="card flex justify-between align-center" style={{ padding: '16px 24px' }}>
        <div className="flex align-center gap-8">
          <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Log Mindset Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-input" 
            style={{ width: 'auto', padding: '6px 12px' }}
          />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Self-Development Hub
        </div>
      </div>

      <div className="grid-dash">
        
        {/* Left Side: Daily Mindset Rating & Journaling */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <span className="card-title">Daily Mindset & Focus</span>
            
            <form onSubmit={handleSaveReflection} className="task-section">
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Rate your focus/energy (1 - 5)</label>
                <div className="rating-scale">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={`rating-item ${mindsetScore === score ? 'active' : ''}`}
                      onClick={() => setMindsetScore(score)}
                    >
                      {score === 1 && '1 - Low'}
                      {score === 2 && '2'}
                      {score === 3 && '3 - Neutral'}
                      {score === 4 && '4'}
                      {score === 5 && '5 - High'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Daily Reflection & Gratitude Log</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  placeholder="Record your achievements, notes, or list things you are grateful for today..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Save Reflection Logs
              </button>

            </form>
          </div>

          {/* Reflections History List */}
          <div className="card">
            <span className="card-title">Reflection History</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {moodLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>
                  No journal entries recorded.
                </p>
              ) : (
                moodLogs.slice(0, 5).map(log => (
                  <div key={log.id} style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex justify-between" style={{ marginBottom: '6px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{log.date}</span>
                      <span style={{ color: 'var(--color-primary)' }}>Mindset Index: {log.mood}/5</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {log.reflection || 'No written thoughts.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Streaks Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card stat-widget" style={{ minHeight: '200px' }}>
            <span className="card-title">
              <span>Routine Streaks</span>
              <Sparkles size={16} style={{ color: 'var(--color-warning)' }} />
            </span>
            <div className="stat-value">{currentStreak} Days</div>
            <span className="stat-subtitle" style={{ marginBottom: '16px' }}>
              Consecutive days completing all mandatory habits.
            </span>

            {/* Streak Grid Visualizer */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span className="form-label" style={{ fontSize: '11px' }}>Past 7 Days Tracking</span>
              <div className="habit-grid">
                {last7Days.map((day) => {
                  const mandatoryList = tasks.filter(t => t.isMandatory);
                  const isCompleted = mandatoryList.length > 0 && 
                    mandatoryList.every(t => t.completedDates?.includes(day.dateString));
                  return (
                    <div key={day.dateString} className="habit-day">
                      <div className={`habit-dot ${isCompleted ? 'completed' : ''}`} />
                      <span>{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <span className="card-title">
              <span>Habit Streaks Info</span>
              <BookOpen size={16} />
            </span>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '10px' }}>
                Your routine streak measures consistency. Daily repetition is the building block of growth.
              </p>
              <p>
                <strong>Tip:</strong> Ensure you have defined at least 1 <em>Mandatory Routine</em> in the dashboard to initiate streak calculations.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SelfDevelopment;
