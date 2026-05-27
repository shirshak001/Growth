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
  
  // Pomodoro states
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            setTimerActive(false);
            const nextMode = !isBreak;
            setIsBreak(nextMode);
            setTimerMinutes(nextMode ? 5 : 25);
            setTimerSeconds(0);
          } else {
            setTimerMinutes(prev => prev - 1);
            setTimerSeconds(59);
          }
        } else {
          setTimerSeconds(prev => prev - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerMinutes, timerSeconds, isBreak]);

  const selectTimerMode = (focusMode) => {
    setTimerActive(false);
    setIsBreak(!focusMode);
    setTimerMinutes(focusMode ? 25 : 5);
    setTimerSeconds(0);
  };

  const [customVideos, setCustomVideos] = useState(() => {
    const saved = localStorage.getItem('growth_motivation_videos');
    return saved ? JSON.parse(saved) : [];
  });
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');

  const handleAddVideo = (e) => {
    e.preventDefault();
    if (!newVideoUrl.trim() || !newVideoTitle.trim()) return;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = newVideoUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) {
      alert('Please enter a valid YouTube video URL');
      return;
    }

    const updated = [...customVideos, { id: videoId, title: newVideoTitle }];
    setCustomVideos(updated);
    localStorage.setItem('growth_motivation_videos', JSON.stringify(updated));
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  const handleDeleteVideo = (idToDelete) => {
    const updated = customVideos.filter(v => v.id !== idToDelete);
    setCustomVideos(updated);
    localStorage.setItem('growth_motivation_videos', JSON.stringify(updated));
  };
  
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
    <div className="page-container">
      
      {/* Date Header */}
      <div className="card flex justify-between align-center" style={{ padding: '16px 24px', flexShrink: 0 }}>
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
        <div className="inner-column">
          
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
          <div className="card" style={{ flexShrink: 0, minHeight: '260px' }}>
            <span className="card-title">Reflection History</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
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

          {/* Motivation Corner */}
          <div className="card" style={{ flexShrink: 0 }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <BookOpen size={14} style={{ color: 'var(--color-warning)' }} /> Motivation Corner
            </span>
            
            {/* Add Custom Video Form */}
            <form onSubmit={handleAddVideo} style={{ marginBottom: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
              <span className="form-label" style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>Add Youtube Motivation/Study Video</span>
              <div className="flex flex-column gap-8">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Video Title (e.g. David Goggins Mindset)"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  required
                />
                <div className="flex gap-8">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Add
                  </button>
                </div>
              </div>
            </form>

            <div className="motivation-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {customVideos.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px', width: '100%' }}>
                  No motivational videos added yet. Paste a YouTube link above to add your favorite study beats or speeches!
                </div>
              ) : (
                customVideos.map((video) => (
                  <div key={video.id} className="video-card" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                    <div className="flex justify-between align-center" style={{ marginBottom: '6px' }}>
                      <span className="video-title" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{video.title}</span>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteVideo(video.id)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '10px' }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="video-container">
                      <iframe 
                        src={`https://www.youtube.com/embed/${video.id}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Streaks Widget */}
        <div className="inner-column">
          
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

          <div className="card" style={{ flexShrink: 0 }}>
            <span className="card-title">
              <span>Pomodoro Focus Timer</span>
              <Brain size={16} style={{ color: 'var(--color-primary)' }} />
            </span>
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                {isBreak ? 'Short Break' : 'Focus State'}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'monospace', margin: '4px 0', color: isBreak ? 'var(--color-success)' : 'var(--color-primary)' }}>
                {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
              </div>
              <div className="flex gap-8 justify-center" style={{ margin: '8px 0' }}>
                <button 
                  type="button" 
                  onClick={() => selectTimerMode(true)} 
                  className={`quality-btn ${!isBreak ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Focus
                </button>
                <button 
                  type="button" 
                  onClick={() => selectTimerMode(false)} 
                  className={`quality-btn ${isBreak ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Break
                </button>
              </div>
              <div className="flex gap-8 justify-center" style={{ marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setTimerActive(!timerActive)} 
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                >
                  {timerActive ? 'Pause' : 'Start'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setTimerActive(false); setTimerMinutes(25); setTimerSeconds(0); setIsBreak(false); }} 
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SelfDevelopment;
