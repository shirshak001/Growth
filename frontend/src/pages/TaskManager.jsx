import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Moon, Sun, Plus, Trash2, Clock, Target, AlertCircle, Brain, RefreshCw, Sparkles, Flame, Droplet, Calendar } from 'lucide-react';

// Shadcn-style Wireframe Skeleton loader
const TaskManagerSkeleton = () => (
  <div className="grid-dash animate-fadein" style={{ opacity: 0.7 }}>
    {/* Left Column Skeleton */}
    <div className="inner-column">
      <div className="skeleton-card" style={{ height: '550px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="skeleton" style={{ width: '40%', height: '20px' }} />
          <div className="skeleton" style={{ width: '25%', height: '16px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ width: '100%', height: '50px', borderRadius: '8px' }} />
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="skeleton" style={{ width: '30%', height: '14px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    </div>
    {/* Right Column Skeleton */}
    <div className="inner-column" style={{ gap: '20px' }}>
      {/* Sleep Card Skeleton */}
      <div className="skeleton-card" style={{ height: '350px' }}>
        <div className="skeleton" style={{ width: '40%', height: '18px', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
      </div>
      {/* Dopamine Card Skeleton */}
      <div className="skeleton-card" style={{ height: '240px' }}>
        <div className="skeleton" style={{ width: '40%', height: '18px', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
      </div>
    </div>
  </div>
);

const TaskManager = () => {
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
  const [tasks, setTasks] = useState([]);
  const [sleepLog, setSleepLog] = useState(null);
  const [dopamineLog, setDopamineLog] = useState(null);

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
  const [savingTask, setSavingTask] = useState(false);
  const [savingSleep, setSavingSleep] = useState(false);
  const [savingDopamine, setSavingDopamine] = useState(false);

  // Load daily log data
  const loadDailyLogs = async () => {
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

    } catch (error) {
      console.error('Error fetching task manager logs:', error);
    } finally {
      // Artificially delay a tiny bit for elegant skeleton reveal transition
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    loadDailyLogs();
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
    setSavingTask(true);

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
    } finally {
      setSavingTask(false);
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
    setSavingSleep(true);
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
    } finally {
      setSavingSleep(false);
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
      setActiveMicroTask(null);
    }
    return () => clearInterval(interval);
  }, [panicCountdown, activeMicroTask]);

  // Log Dopamine Metrics
  const handleLogDopamine = async (e) => {
    e.preventDefault();
    setSavingDopamine(true);
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
    } finally {
      setSavingDopamine(false);
    }
  };

  const activeTasks = tasks;
  const completedTasksToday = activeTasks.filter(t => t.completedDates?.includes(selectedDate));

  return (
    <div className="page-container" style={{ overflowY: 'auto', paddingBottom: '30px' }}>
      
      {/* Date Selector Header */}
      <div className="card glass-card flex justify-between align-center animate-fadein" style={{ padding: '12px 24px', flexShrink: 0, marginBottom: '16px' }}>
        <div className="flex align-center gap-8">
          <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Selected Planning Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-input" 
            style={{ width: 'auto', padding: '4px 10px', fontSize: '13px', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}
          />
        </div>
        <div className="flex align-center gap-8">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Log inputs & tasks to calculate your productivity scores on the Dashboard.</span>
        </div>
      </div>

      {loading ? (
        <TaskManagerSkeleton />
      ) : (
        <div className="grid-dash animate-slideup">
          
          {/* Left Column: Tasks */}
          <div className="inner-column">
            
            <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-title" style={{ fontSize: '13px', marginBottom: '16px', display: 'flex', width: '100%', alignItems: 'center' }}>
                <span className="flex align-center gap-8">
                  <CheckSquare size={15} style={{ color: 'var(--color-primary)' }} /> Tasks & Daily Habits Checklists
                </span>
                
                {/* Switch Toggle for Crisis Recovery */}
                <div className="switch-container" style={{ marginLeft: 'auto' }}>
                  <input 
                    id="crisis-recovery-switch"
                    type="checkbox" 
                    className="switch-input"
                    checked={crisisRecovery} 
                    onChange={(e) => setCrisisRecovery(e.target.checked)}
                  />
                  <label htmlFor="crisis-recovery-switch" className="switch-track active-warning">
                    <span className="switch-thumb" />
                  </label>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: crisisRecovery ? 'var(--color-warning)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
                    Crisis Recovery Mode
                  </span>
                </div>
              </div>

              {/* Urgency Widget */}
              {activeMicroTask && (
                <div className="card animate-scalein" style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '16px', padding: '14px', animation: 'pulseGlow 2s infinite' }}>
                  <div className="flex justify-between align-center" style={{ marginBottom: '8px' }}>
                    <span className="flex align-center gap-6" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Flame size={12} /> Urgent Micro-Action (Anti-Procrastination)
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-danger)' }}>
                      {Math.floor(panicCountdown / 60)}:{String(panicCountdown % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {activeMicroTask.microStep}
                  </p>
                  <div className="flex gap-8" style={{ marginTop: '12px' }}>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '4px 10px', fontSize: '11px', height: '26px' }}
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
                      style={{ padding: '4px 10px', fontSize: '11px', height: '26px' }}
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
              
              <div className="task-section" style={{ display: 'flex', flexDirection: 'column' }}>
                {crisisRecovery ? (
                  <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className={`task-item-modern ${crisisCompleted.water ? 'completed' : ''}`}>
                      <div className="task-item-left" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={crisisCompleted.water} 
                              onChange={() => setCrisisCompleted(prev => ({ ...prev, water: !prev.water }))}
                              className="checkbox-input"
                            />
                            <span className="checkbox-box" />
                          </label>
                          <span className="task-text">Hydrate: Drink 1 glass of clean water</span>
                        </div>
                        <span className="task-badge task-badge-mandatory">Recovery 1</span>
                      </div>
                    </div>
                    
                    <div className={`task-item-modern ${crisisCompleted.study ? 'completed' : ''}`}>
                      <div className="task-item-left" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={crisisCompleted.study} 
                              onChange={() => setCrisisCompleted(prev => ({ ...prev, study: !prev.study }))}
                              className="checkbox-input"
                            />
                            <span className="checkbox-box" />
                          </label>
                          <span className="task-text">Low-Activation Study: Sit at desk and study/work for exactly 5 minutes</span>
                        </div>
                        <span className="task-badge task-badge-mandatory">Recovery 2</span>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.4', background: 'rgba(245, 158, 11, 0.02)', padding: '10px', borderLeft: '3px solid var(--color-warning)', borderRadius: '4px' }}>
                      Crisis Recovery Mode active. Routine tasks are hidden. Focus on hydrating and the 5-minute study buffer to restore cognitive stamina.
                    </p>
                  </div>
                ) : activeTasks.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      No tasks tracked yet. Add your first routine below.
                    </p>
                  </div>
                ) : (
                  <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    {activeTasks.map(task => {
                      const isCompleted = task.completedDates?.includes(selectedDate);
                      return (
                        <div key={task.id} className={`task-item-modern ${isCompleted ? 'completed animate-fadein' : 'animate-fadein'}`}>
                          <div className="task-item-left" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                              <label className="checkbox-container">
                                <input 
                                  type="checkbox" 
                                  checked={isCompleted} 
                                  onChange={() => handleToggleTask(task.id)}
                                  className="checkbox-input"
                                />
                                <span className="checkbox-box" />
                              </label>
                              <span className="task-text" style={{ fontSize: '13px', fontWeight: 600 }}>{task.title}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {task.dueTime && (
                                <span className="flex align-center gap-4" style={{ fontSize: '10px', color: 'var(--color-warning)', background: 'var(--color-warning-glow)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.15)', fontWeight: 500 }}>
                                  <Clock size={10} /> {task.dueTime}
                                </span>
                              )}
                              <span className={`task-badge ${task.isMandatory ? 'task-badge-mandatory' : 'task-badge-custom'}`} style={{ fontSize: '9px', letterSpacing: '0.3px' }}>
                                {task.isMandatory ? 'Mandatory' : 'Custom'}
                              </span>
                              <button onClick={() => handleDeleteTask(task.id)} className="btn-icon" title="Remove Habit" style={{ padding: '4px', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.85)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}>
                                <Trash2 size={12} style={{ color: 'var(--color-danger)' }} />
                              </button>
                            </div>
                          </div>

                          {/* Planned vs Actual hours */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '8px', marginTop: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {task.plannedHours !== null && task.plannedHours !== undefined && (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Planned: <strong style={{ color: 'var(--text-primary)' }}>{task.plannedHours}h</strong>
                                </span>
                              )}
                              {isCompleted && (
                                <div className="flex align-center animate-fadein" style={{ gap: '6px', marginLeft: '6px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Actual:</span>
                                  <input 
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="form-input"
                                    style={{ width: '50px', padding: '2px 6px', fontSize: '11px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}
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
                                className="flex align-center gap-4 animate-fadein"
                                style={{ 
                                  background: 'transparent', 
                                  border: 'none', 
                                  color: 'var(--color-primary)', 
                                  fontSize: '11px', 
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: '2px 4px',
                                  fontWeight: 500
                                }}
                              >
                                <Sparkles size={10} /> Break Down with AI
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Task Form */}
                <form onSubmit={handleAddTask} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span className="form-label" style={{ fontSize: '11px', margin: 0, letterSpacing: '0.5px' }}>Add New Routine Task</span>
                  <div className="form-group" style={{ margin: 0 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="New habit or task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                      required
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px', textTransform: 'none', letterSpacing: '0.3px' }}>Category</label>
                      <div className="chip-list">
                        {['custom', 'workout', 'study', 'practice'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            className={`chip-item ${newTaskCategory === cat ? 'active' : ''}`}
                            onClick={() => setNewTaskCategory(cat)}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px', marginBottom: '6px', textTransform: 'none', letterSpacing: '0.3px' }}>Due Time (Optional)</label>
                      <input
                        type="time"
                        className="form-input"
                        style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                        value={newTaskDueTime}
                        onChange={(e) => setNewTaskDueTime(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px', marginBottom: '6px', textTransform: 'none', letterSpacing: '0.3px' }}>Planned Hours (Optional)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        className="form-input"
                        placeholder="e.g. 1.5"
                        style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                        value={newTaskPlannedHours}
                        onChange={(e) => setNewTaskPlannedHours(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', marginTop: '6px' }}>
                      <div className="switch-container" style={{ margin: '4px 0' }}>
                        <input
                          id="mandatory-task-switch"
                          type="checkbox"
                          className="switch-input"
                          checked={newTaskIsMandatory}
                          onChange={(e) => setNewTaskIsMandatory(e.target.checked)}
                        />
                        <label htmlFor="mandatory-task-switch" className="switch-track">
                          <span className="switch-thumb" />
                        </label>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Mandatory Routine</span>
                      </div>
                      
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.98)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'} disabled={savingTask}>
                        <Plus size={14} /> Add Task
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            </div>

          </div>

          {/* Right Column: Logging (Sleep & Dopamine) */}
          <div className="inner-column" style={{ gap: '20px' }}>
            
            {/* Sleep Logger */}
            <div className="card glass-card">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="flex align-center gap-8">
                  <Moon size={15} style={{ color: 'var(--color-primary)' }} /> Sleep & Wake Log
                </span>
                {sleepLog && <Sun size={15} style={{ color: 'var(--color-warning)' }} />}
              </span>

              <form onSubmit={handleLogSleep} className="task-section">
                <div className="sleep-inputs">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>Sleep Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>Wake Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '10px' }}>Sleep Latency (mins)</label>
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
                  <label className="form-label" style={{ fontSize: '10px' }}>Restlessness Rating</label>
                  <select
                    className="form-input"
                    value={restlessness}
                    onChange={(e) => setRestlessness(Number(e.target.value))}
                    required
                  >
                    <option value={1}>1 - Calm / Restful</option>
                    <option value={2}>2 - Tossing mildly</option>
                    <option value={3}>3 - Tossed and turned</option>
                    <option value={4}>4 - Woke up repeatedly</option>
                    <option value={5}>5 - Restless night</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '10px' }}>Wake-Up Energy (1 - 5)</label>
                  <div className="sleep-quality-selector">
                    {[1, 2, 3, 4, 5].map(q => (
                      <button
                        key={q}
                        type="button"
                        className={`quality-btn ${wakeEnergy === q ? 'active' : ''}`}
                        onClick={() => setWakeEnergy(q)}
                        style={{ height: '34px', fontSize: '13px', transition: 'transform 0.1s' }}
                        onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.9)'}
                        onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '10px' }}>Overall Sleep Quality (1 - 5)</label>
                  <div className="sleep-quality-selector">
                    {[1, 2, 3, 4, 5].map(q => (
                      <button
                        key={q}
                        type="button"
                        className={`quality-btn ${sleepQuality === q ? 'active' : ''}`}
                        onClick={() => setSleepQuality(q)}
                        style={{ height: '34px', fontSize: '13px', transition: 'transform 0.1s' }}
                        onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.9)'}
                        onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-secondary w-full" style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={savingSleep}>
                  <Moon size={14} /> {savingSleep ? 'Logging Session...' : 'Log Sleep Session'}
                </button>
              </form>

              {sleepLog && (
                <div className="animate-slideup" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Calculated Duration:</span>
                    <span style={{ fontWeight: 600 }}>{sleepLog.duration} Hours</span>
                  </div>
                  <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Quality Rating:</span>
                    <span style={{ fontWeight: 600 }}>{sleepLog.quality} / 5</span>
                  </div>
                  {sleepLog.sleepScore !== undefined && (
                    <div className="flex justify-between align-center">
                      <span style={{ color: 'var(--text-secondary)' }}>Calculated Sleep Score:</span>
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

            {/* Dopamine Tracker */}
            <div className="card glass-card">
              <span className="card-title">
                <span className="flex align-center gap-8">
                  <Brain size={15} style={{ color: 'var(--color-primary)' }} /> Dopamine / Feed Tracker
                </span>
              </span>
              
              <form onSubmit={handleLogDopamine} className="task-section">
                <div className="sleep-inputs">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>Instagram (mins)</label>
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
                    <label className="form-label" style={{ fontSize: '10px' }}>YouTube (mins)</label>
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
                  <label className="form-label" style={{ fontSize: '10px' }}>Other Scrolling Feed (mins)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={scrollMins}
                    onChange={(e) => setScrollMins(Number(e.target.value))}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-secondary w-full" style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={savingDopamine}>
                  <Brain size={14} /> {savingDopamine ? 'Logging Screen Time...' : 'Log Screen Time'}
                </button>
              </form>

              {dopamineLog && (
                <div className="animate-slideup" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Screen Time:</span>
                    <span style={{ fontWeight: 600 }}>{dopamineLog.totalMinutes} Mins</span>
                  </div>
                  <div className="flex justify-between align-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Digital Focus Score:</span>
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
      )}

    </div>
  );
};

export default TaskManager;
