import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Moon, Sun, Plus, Trash2, Award } from 'lucide-react';

const Dashboard = () => {
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
  
  // Add task inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('custom');
  const [newTaskIsMandatory, setNewTaskIsMandatory] = useState(false);

  // Sleep logger inputs
  const [sleepTime, setSleepTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepQuality, setSleepQuality] = useState(3);
  
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
        } else {
          setSleepLog(null);
        }
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
  const handleToggleTask = async (taskId) => {
    try {
      const res = await authFetch(`/routine/tasks/${taskId}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ date: selectedDate })
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
          category: newTaskCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => [...prev, data]);
        setNewTaskTitle('');
        setNewTaskIsMandatory(false);
        setNewTaskCategory('custom');
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
          quality: Number(sleepQuality)
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

  // Calculate percentages
  const activeTasks = tasks;
  const completedTasksToday = activeTasks.filter(t => t.completedDates?.includes(selectedDate));
  const completionPercentage = activeTasks.length > 0 
    ? Math.round((completedTasksToday.length / activeTasks.length) * 100) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Date Selector Header */}
      <div className="card flex justify-between align-center" style={{ padding: '16px 24px' }}>
        <div className="flex align-center gap-8">
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Selected Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-input" 
            style={{ width: 'auto', padding: '6px 12px' }}
          />
        </div>
        <div className="flex align-center gap-8">
          <Award size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {completionPercentage}% Tasks Completed Today
          </span>
        </div>
      </div>

      <div className="grid-dash">
        
        {/* Left Side: Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Daily Progress Widget */}
          <div className="card stat-widget">
            <span className="card-title">Daily Execution</span>
            <div className="flex align-center gap-16">
              <div className="stat-value">{completedTasksToday.length}/{activeTasks.length}</div>
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
            <span className="stat-subtitle" style={{ marginTop: '8px' }}>
              Complete mandatory and custom habits to lock in your daily growth.
            </span>
          </div>

          {/* Task Manager Card */}
          <div className="card">
            <span className="card-title">Tasks & Habits</span>
            
            <div className="task-section">
              {activeTasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No tasks tracked yet. Add your first routine below.
                </p>
              ) : (
                <div className="task-list">
                  {activeTasks.map(task => {
                    const isCompleted = task.completedDates?.includes(selectedDate);
                    return (
                      <div key={task.id} className={`task-item ${isCompleted ? 'completed' : ''}`}>
                        <div className="task-item-left">
                          <label className="task-checkbox-wrapper">
                            <input 
                              type="checkbox" 
                              checked={isCompleted} 
                              onChange={() => handleToggleTask(task.id)}
                              className="task-checkbox"
                            />
                          </label>
                          <span className="task-text">{task.title}</span>
                          <span className={`task-badge ${task.isMandatory ? 'task-badge-mandatory' : 'task-badge-custom'}`}>
                            {task.isMandatory ? 'Mandatory' : 'Custom'}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} className="btn-icon" title="Remove Habit">
                          <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                <div className="flex gap-16 align-center">
                  <div className="flex align-center gap-8" style={{ fontSize: '13px' }}>
                    <label className="form-label" style={{ margin: 0, textTransform: 'none' }}>Category:</label>
                    <select
                      className="form-input"
                      style={{ padding: '6px 12px', width: 'auto' }}
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                    >
                      <option value="custom">Custom</option>
                      <option value="workout">Workout</option>
                      <option value="study">Study</option>
                      <option value="practice">Practice</option>
                    </select>
                  </div>
                  <label className="flex align-center gap-8" style={{ fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newTaskIsMandatory}
                      onChange={(e) => setNewTaskIsMandatory(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Mandatory Routine</span>
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', marginLeft: 'auto' }}>
                    <Plus size={14} /> Add Task
                  </button>
                </div>
              </form>

            </div>
          </div>

        </div>

        {/* Right Side: Sleep Logging */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
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
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Quality Rating:</span>
                  <span style={{ fontWeight: 600 }}>{sleepLog.quality} / 5</span>
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
