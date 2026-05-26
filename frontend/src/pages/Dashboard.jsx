import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Moon, Sun, Plus, Trash2, Award, Clock, Target, AlertCircle, Zap, Brain, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const { authFetch, user } = useAuth();
  
  const getDaysRemaining = (targetDateStr) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Date state
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [tasks, setTasks] = useState([]);
  const [sleepLog, setSleepLog] = useState(null);

  // AI Life Operator / Burnout states
  const [lifeScore, setLifeScore] = useState(null);
  const [burnoutProb, setBurnoutProb] = useState(null);
  const [lifeOperatorSuggestion, setLifeOperatorSuggestion] = useState('');

  // Procrastination breakdown states
  const [activeMicroTask, setActiveMicroTask] = useState(null);
  const [panicCountdown, setPanicCountdown] = useState(0);

  // Crisis Recovery Mode state
  const [crisisRecovery, setCrisisRecovery] = useState(false);
  const [crisisCompleted, setCrisisCompleted] = useState({ water: false, study: false });

  // Dopamine tracker states
  const [instaMins, setInstaMins] = useState(0);
  const [ytMins, setYtMins] = useState(0);
  const [scrollMins, setScrollMins] = useState(0);
  const [dopamineLog, setDopamineLog] = useState(null);

  // Task execution hours states
  const [newTaskPlannedHours, setNewTaskPlannedHours] = useState('');
  const [taskActualHours, setTaskActualHours] = useState({});
  
  // Add task inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('custom');
  const [newTaskIsMandatory, setNewTaskIsMandatory] = useState(false);
  const [newTaskDueTime, setNewTaskDueTime] = useState('');

  // Sleep logger inputs
  const [sleepTime, setSleepTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sleepLatency, setSleepLatency] = useState(15);
  const [restlessness, setRestlessness] = useState(1);
  const [wakeEnergy, setWakeEnergy] = useState(3);
  
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks
      const tasksRes = await authFetch('/routine/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      // Fetch sleep logs
      const sleepRes = await authFetch('/routine/sleep');
      if (sleepRes.ok) {
        const sleepData = await sleepRes.json();
        // Find sleep log for selected date
        const todayLog = sleepData.find(log => log.date === selectedDate);
        if (todayLog) {
          setSleepLog(todayLog);
          setSleepTime(todayLog.sleepTime);
          setWakeTime(todayLog.wakeTime);
          setSleepQuality(todayLog.quality);
          setSleepLatency(todayLog.sleepLatency || 15);
          setRestlessness(todayLog.restlessness || 1);
          setWakeEnergy(todayLog.wakeEnergy || 3);
        } else {
          setSleepLog(null);
          setSleepTime('22:00');
          setWakeTime('06:00');
          setSleepQuality(3);
          setSleepLatency(15);
          setRestlessness(1);
          setWakeEnergy(3);
        }
      }

      // Fetch dopamine logs
      const dopRes = await authFetch('/routine/dopamine');
      if (dopRes.ok) {
        const dopLogs = await dopRes.json();
        const todayDop = dopLogs.find(l => l.date === selectedDate);
        if (todayDop) {
          setDopamineLog(todayDop);
          setInstaMins(todayDop.instagramMins || 0);
          setYtMins(todayDop.youtubeMins || 0);
          setScrollMins(todayDop.scrollingMins || 0);
        } else {
          setDopamineLog(null);
          setInstaMins(0);
          setYtMins(0);
          setScrollMins(0);
        }
      }

      // Fetch AI Suggestions (reload to calculate today's Life Score & operator briefing)
      const aiRes = await authFetch('/ai/suggestions', { method: 'POST' });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setLifeScore(aiData.lifeScore);
        setBurnoutProb(aiData.burnoutProb);
        setLifeOperatorSuggestion(aiData.lifeOperatorSuggestion);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  // Task Completion Toggle
  const handleToggleTask = async (taskId, actualHrs) => {
    try {
      const hrs = actualHrs !== undefined ? actualHrs : taskActualHours[taskId];
      const res = await authFetch(`/routine/tasks/${taskId}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ 
          date: selectedDate,
          actualHours: hrs !== undefined && hrs !== '' ? Number(hrs) : undefined
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await authFetch('/routine/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          isMandatory: newTaskIsMandatory,
          category: newTaskCategory,
          dueTime: newTaskDueTime || undefined,
          plannedHours: newTaskPlannedHours ? Number(newTaskPlannedHours) : undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => [...prev, data]);
        setNewTaskTitle('');
        setNewTaskIsMandatory(false);
        setNewTaskCategory('custom');
        setNewTaskDueTime('');
        setNewTaskPlannedHours('');
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    try {
      const res = await authFetch(`/routine/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Log Sleep
  const handleLogSleep = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/routine/sleep', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          sleepTime,
          wakeTime,
          quality: Number(sleepQuality),
          sleepLatency: Number(sleepLatency),
          restlessness: Number(restlessness),
          wakeEnergy: Number(wakeEnergy)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSleepLog(data);
      }
    } catch (error) {
      console.error('Error logging sleep:', error);
    }
  };

  // Handle Break Task with AI
  const handleBreakTask = async (title) => {
    try {
      const res = await authFetch('/ai/break-task', {
        method: 'POST',
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMicroTask({
          originalTask: title,
          microStep: data.microStep
        });
        setPanicCountdown(120); // 2 minute countdown urgency system
      }
    } catch (e) {
      console.error('Failed breaking task:', e);
    }
  };

  // Timer for micro task panic countdown
  useEffect(() => {
    let interval = null;
    if (panicCountdown > 0) {
      interval = setInterval(() => {
        setPanicCountdown(c => c - 1);
      }, 1000);
    } else if (panicCountdown === 0 && activeMicroTask) {
      // Countdown expired, auto reset
      setActiveMicroTask(null);
    }
    return () => clearInterval(interval);
  }, [panicCountdown, activeMicroTask]);

  // Log Dopamine Metrics
  const handleLogDopamine = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/routine/dopamine', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          instagramMins: Number(instaMins),
          youtubeMins: Number(ytMins),
          scrollingMins: Number(scrollMins)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDopamineLog(data);
      }
    } catch (error) {
      console.error('Error logging dopamine tracker:', error);
    }
  };

  // Calculate percentages
  const activeTasks = tasks;
  const completedTasksToday = activeTasks.filter(t => t.completedDates?.includes(selectedDate));
  const completionPercentage = activeTasks.length > 0 
    ? Math.round((completedTasksToday.length / activeTasks.length) * 100) 
    : 0;

  return (
    <div className="page-container" style={{ overflowY: 'auto' }}>
      
      {/* Date Selector Header with Life Score & Burnout indicators */}
      <div className="card flex justify-between align-center" style={{ padding: '12px 24px', flexShrink: 0 }}>
        <div className="flex align-center gap-8">
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Selected Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-input" 
            style={{ width: 'auto', padding: '4px 10px', fontSize: '13px' }}
          />
        </div>
        <div className="flex align-center gap-16">
          {lifeScore !== null && (
            <div className="flex align-center gap-8" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
              <Brain size={14} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Life Score:</span>
              <span className="task-badge" style={{
                background: lifeScore >= 80 ? 'var(--color-success-glow)' : lifeScore >= 50 ? 'var(--color-warning-glow)' : 'var(--color-danger-glow)',
                color: lifeScore >= 80 ? 'var(--color-success)' : lifeScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                fontWeight: 700,
                border: lifeScore >= 80 ? '1px solid rgba(16, 185, 129, 0.2)' : lifeScore >= 50 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {lifeScore} / 100
              </span>
            </div>
          )}
          {burnoutProb !== null && (
            <div className="flex align-center gap-8" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
              <AlertCircle size={14} style={{ color: burnoutProb > 60 ? 'var(--color-danger)' : 'var(--color-warning)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Burnout Risk:</span>
              <span className="task-badge" style={{
                background: burnoutProb > 60 ? 'var(--color-danger-glow)' : 'var(--color-warning-glow)',
                color: burnoutProb > 60 ? 'var(--color-danger)' : 'var(--color-warning)',
                fontWeight: 700,
                border: burnoutProb > 60 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                {burnoutProb}%
              </span>
            </div>
          )}
          <div className="flex align-center gap-8">
            <Award size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {completionPercentage}% Tasks Completed Today
            </span>
          </div>
        </div>
      </div>

      {/* AI Life Operator Workload Adjustment Briefing Card */}
      {lifeOperatorSuggestion && (
        <div className="card" style={{ flexShrink: 0, padding: '16px 24px', background: 'rgba(99, 102, 241, 0.04)', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
          <div className="flex align-center gap-8" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Brain size={12} /> AI Life OS Scheduler
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px', lineHeight: '1.4' }}>
            {lifeOperatorSuggestion}
          </p>
        </div>
      )}

      {/* Ultimate Goal Header Widget */}
      {user?.ultimateGoal?.title && (
        <div className="card" style={{ flexShrink: 0, padding: '16px 24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(18, 20, 29, 0.6) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div className="flex justify-between align-center">
            <div>
              <span className="flex align-center gap-8" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Target size={12} /> Ultimate Goal
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', marginBottom: '2px' }}>{user.ultimateGoal.title}</h3>
              {user.ultimateGoal.description && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.ultimateGoal.description}</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              {(() => {
                const days = getDaysRemaining(user.ultimateGoal.targetDate);
                if (days === null) return null;
                if (days < 0) {
                  return <span className="task-badge task-badge-custom" style={{ padding: '4px 8px', fontSize: '11px' }}>Goal Date Reached</span>;
                }
                if (days === 0) {
                  return <span className="task-badge" style={{ background: 'var(--color-warning-glow)', color: 'var(--color-warning)', padding: '4px 8px', fontSize: '11px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Today is the Target Date!</span>;
                }
                return (
                  <div>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{days}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>days remaining</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="grid-dash">
        
        {/* Left Side: Tasks */}
        <div className="inner-column">
          
          {/* Daily Progress Widget */}
          <div className="card stat-widget" style={{ flexShrink: 0, padding: '16px' }}>
            <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px' }}>Daily Execution</span>
            <div className="flex align-center gap-16">
              <div className="stat-value" style={{ fontSize: '26px' }}>{completedTasksToday.length}/{activeTasks.length}</div>
              <div className="water-progress-bar" style={{ margin: 0 }}>
                <div 
                  className="water-progress-fill" 
                  style={{ 
                    width: `${completionPercentage}%`, 
                    backgroundColor: 'var(--color-success)' 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Task Manager Card */}
          <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="card-title" style={{ fontSize: '13px', marginBottom: '12px', display: 'flex', width: '100%', alignItems: 'center' }}>
              <span>Tasks & Habits</span>
              <div className="flex align-center gap-12" style={{ marginLeft: 'auto' }}>
                <label className="flex align-center gap-8" style={{ fontSize: '12px', cursor: 'pointer', color: crisisRecovery ? 'var(--color-warning)' : 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={crisisRecovery} 
                    onChange={(e) => setCrisisRecovery(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Crisis Recovery Mode</span>
                </label>
              </div>
            </div>

            {/* Anti-Procrastination Engine Countdown Urgency Widget */}
            {activeMicroTask && (
              <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '12px', padding: '12px' }}>
                <div className="flex justify-between align-center" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                    Urgent Micro-Action (Bypass Procrastination)
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger)' }}>
                    {Math.floor(panicCountdown / 60)}:{String(panicCountdown % 60).padStart(2, '0')}
                  </span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeMicroTask.microStep}
                </p>
                <div className="flex gap-8" style={{ marginTop: '8px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--color-danger)', border: 'none' }}
                    onClick={() => {
                      const matchingTask = tasks.find(t => t.title === activeMicroTask.originalTask);
                      if (matchingTask) {
                        handleToggleTask(matchingTask.id);
                      }
                      setActiveMicroTask(null);
                      setPanicCountdown(0);
                    }}
                  >
                    Completed!
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => {
                      setActiveMicroTask(null);
                      setPanicCountdown(0);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="task-section" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {crisisRecovery ? (
                <div className="task-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                  <div className={`task-item ${crisisCompleted.water ? 'completed' : ''}`}>
                    <div className="task-item-left">
                      <label className="task-checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          checked={crisisCompleted.water} 
                          onChange={() => setCrisisCompleted(prev => ({ ...prev, water: !prev.water }))}
                          className="task-checkbox"
                        />
                      </label>
                      <span className="task-text">Hydrate: Drink 1 glass of clean water</span>
                      <span className="task-badge task-badge-mandatory">Recovery 1</span>
                    </div>
                  </div>
                  <div className={`task-item ${crisisCompleted.study ? 'completed' : ''}`}>
                    <div className="task-item-left">
                      <label className="task-checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          checked={crisisCompleted.study} 
                          onChange={() => setCrisisCompleted(prev => ({ ...prev, study: !prev.study }))}
                          className="task-checkbox"
                        />
                      </label>
                      <span className="task-text">Low-Activation Study: Sit at desk and study/work for exactly 5 minutes</span>
                      <span className="task-badge task-badge-mandatory">Recovery 2</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '12px', fontStyle: 'italic', lineHeight: '1.4' }}>
                    Crisis Recovery Mode active. Routine tasks are hidden. Focus on hydrating and the 5-minute study buffer to restore cognitive stamina.
                  </p>
                </div>
              ) : activeTasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                  No tasks tracked yet. Add your first routine below.
                </p>
              ) : (
                <div className="task-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                  {activeTasks.map(task => {
                    const isCompleted = task.completedDates?.includes(selectedDate);
                    return (
                      <div key={task.id} className={`task-item ${isCompleted ? 'completed' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                        <div className="task-item-left" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <label className="task-checkbox-wrapper">
                              <input 
                                type="checkbox" 
                                checked={isCompleted} 
                                onChange={() => handleToggleTask(task.id)}
                                className="task-checkbox"
                              />
                            </label>
                            <span className="task-text" style={{ fontSize: '13px', fontWeight: 500 }}>{task.title}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {task.dueTime && (
                              <span className="flex align-center gap-4" style={{ fontSize: '10px', color: 'var(--color-warning)', background: 'var(--color-warning-glow)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <Clock size={10} /> {task.dueTime}
                              </span>
                            )}
                            <span className={`task-badge ${task.isMandatory ? 'task-badge-mandatory' : 'task-badge-custom'}`} style={{ fontSize: '10px' }}>
                              {task.isMandatory ? 'Mandatory' : 'Custom'}
                            </span>
                            <button onClick={() => handleDeleteTask(task.id)} className="btn-icon" title="Remove Habit" style={{ padding: '4px' }}>
                              <Trash2 size={12} style={{ color: 'var(--color-danger)' }} />
                            </button>
                          </div>
                        </div>

                        {/* Planned vs Actual hours logging block (Reality-Based Scheduling) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {task.plannedHours !== null && (
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                Planned: <strong>{task.plannedHours}h</strong>
                              </span>
                            )}
                            {isCompleted && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Actual:</span>
                                <input 
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  style={{ width: '45px', padding: '1px 4px', fontSize: '11px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '3px' }}
                                  value={taskActualHours[task.id] !== undefined ? taskActualHours[task.id] : (task.actualHoursLogs?.[selectedDate] || '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTaskActualHours(prev => ({ ...prev, [task.id]: val }));
                                  }}
                                  onBlur={() => handleToggleTask(task.id, taskActualHours[task.id])}
                                  placeholder="hrs"
                                />
                              </div>
                            )}
                          </div>
                          
                          {!isCompleted && (
                            <button 
                              onClick={() => handleBreakTask(task.title)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--color-primary)', 
                                fontSize: '11px', 
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: '2px 4px'
                              }}
                            >
                              Break Down with AI
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Task Form with Planned Hours input */}
              <form onSubmit={handleAddTask} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New habit or task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-12 align-center flex-wrap">
                  <div className="flex align-center gap-6" style={{ fontSize: '12px' }}>
                    <label className="form-label" style={{ margin: 0, textTransform: 'none' }}>Category:</label>
                    <select
                      className="form-input"
                      style={{ padding: '4px 8px', width: 'auto', fontSize: '12px' }}
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                    >
                      <option value="custom">Custom</option>
                      <option value="workout">Workout</option>
                      <option value="study">Study</option>
                      <option value="practice">Practice</option>
                    </select>
                  </div>
                  <div className="flex align-center gap-6" style={{ fontSize: '12px' }}>
                    <label className="form-label" style={{ margin: 0, textTransform: 'none' }}>Due Time:</label>
                    <input
                      type="time"
                      className="form-input"
                      style={{ padding: '4px 8px', width: 'auto', fontSize: '12px' }}
                      value={newTaskDueTime}
                      onChange={(e) => setNewTaskDueTime(e.target.value)}
                    />
                  </div>
                  <div className="flex align-center gap-6" style={{ fontSize: '12px' }}>
                    <label className="form-label" style={{ margin: 0, textTransform: 'none' }}>Plan (hrs):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-input"
                      placeholder="e.g. 1.5"
                      style={{ padding: '4px 8px', width: '70px', fontSize: '12px' }}
                      value={newTaskPlannedHours}
                      onChange={(e) => setNewTaskPlannedHours(e.target.value)}
                    />
                  </div>
                  <label className="flex align-center gap-6" style={{ fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newTaskIsMandatory}
                      onChange={(e) => setNewTaskIsMandatory(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Mandatory</span>
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', marginLeft: 'auto', fontSize: '12px' }}>
                    <Plus size={12} /> Add Task
                  </button>
                </div>
              </form>

            </div>
          </div>

        </div>

        {/* Right Side: Sleep Logging & Dopamine Logging */}
        <div className="inner-column" style={{ gap: '24px' }}>
          
          <div className="card">
            <div className="card-title">
              <span>Sleep & Wake Log</span>
              {sleepLog && <Sun size={16} style={{ color: 'var(--color-warning)' }} />}
            </div>

            <form onSubmit={handleLogSleep} className="task-section">
              
              <div className="sleep-inputs">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sleep Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Wake Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="sleep-inputs">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Latency (mins)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={sleepLatency}
                    onChange={(e) => setSleepLatency(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Restlessness</label>
                  <select
                    className="form-input"
                    value={restlessness}
                    onChange={(e) => setRestlessness(Number(e.target.value))}
                    required
                  >
                    <option value={1}>1 - Calm / Peaceful</option>
                    <option value={2}>2 - Light tossing</option>
                    <option value={3}>3 - Tossed & turned</option>
                    <option value={4}>4 - Frequent waking</option>
                    <option value={5}>5 - Very restless</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Wake-Up Energy (1 - 5)</label>
                <div className="sleep-quality-selector">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      type="button"
                      className={`quality-btn ${wakeEnergy === q ? 'active' : ''}`}
                      onClick={() => setWakeEnergy(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Sleep Quality (1 - 5)</label>
                <div className="sleep-quality-selector">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      type="button"
                      className={`quality-btn ${sleepQuality === q ? 'active' : ''}`}
                      onClick={() => setSleepQuality(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-secondary w-full">
                <Moon size={14} /> Log Sleep Session
              </button>

            </form>

            {sleepLog && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '13px' }}>
                <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Calculated Duration:</span>
                  <span style={{ fontWeight: 600 }}>{sleepLog.duration} Hours</span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Quality Rating:</span>
                  <span style={{ fontWeight: 600 }}>{sleepLog.quality} / 5</span>
                </div>
                {sleepLog.sleepScore !== undefined && (
                  <div className="flex justify-between align-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Sleep Score:</span>
                    <span className="task-badge" style={{
                      background: sleepLog.sleepScore >= 80 ? 'var(--color-success-glow)' : sleepLog.sleepScore >= 50 ? 'var(--color-warning-glow)' : 'var(--color-danger-glow)',
                      color: sleepLog.sleepScore >= 80 ? 'var(--color-success)' : sleepLog.sleepScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                      fontWeight: 700,
                      border: sleepLog.sleepScore >= 80 ? '1px solid rgba(16, 185, 129, 0.2)' : sleepLog.sleepScore >= 50 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      {sleepLog.sleepScore} / 100
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dopamine Distraction Tracker */}
          <div className="card">
            <div className="card-title">
              <span>Dopamine Tracker</span>
              <Brain size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
            
            <form onSubmit={handleLogDopamine} className="task-section">
              <div className="sleep-inputs">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Instagram (mins)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={instaMins}
                    onChange={(e) => setInstaMins(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">YouTube (mins)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={ytMins}
                    onChange={(e) => setYtMins(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Other Scrolling / Feed (mins)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={scrollMins}
                  onChange={(e) => setScrollMins(Number(e.target.value))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary w-full">
                <Brain size={14} /> Log Screen Time
              </button>
            </form>

            {dopamineLog && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '13px' }}>
                <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Screen Time:</span>
                  <span style={{ fontWeight: 600 }}>{dopamineLog.totalMinutes} Mins</span>
                </div>
                <div className="flex justify-between align-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Focus Score:</span>
                  <span className="task-badge" style={{
                    background: dopamineLog.dopamineScore >= 80 ? 'var(--color-success-glow)' : dopamineLog.dopamineScore >= 50 ? 'var(--color-warning-glow)' : 'var(--color-danger-glow)',
                    color: dopamineLog.dopamineScore >= 80 ? 'var(--color-success)' : dopamineLog.dopamineScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                    fontWeight: 700,
                    border: dopamineLog.dopamineScore >= 80 ? '1px solid rgba(16, 185, 129, 0.2)' : dopamineLog.dopamineScore >= 50 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {dopamineLog.dopamineScore} / 100
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
