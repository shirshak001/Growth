import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Moon, 
  Sun, 
  Award, 
  Clock, 
  Target, 
  AlertCircle, 
  Zap, 
  Brain, 
  Bell, 
  Calendar, 
  Activity, 
  Flame, 
  Compass, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

// Reusable Circular Progress Ring for premium reporting
const CircularProgress = ({ value, size = 70, strokeWidth = 6, color = 'var(--color-primary)', glow = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeValue = Math.min(100, Math.max(0, value || 0));
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        {/* Glow filter if enabled */}
        {glow && (
          <defs>
            <filter id={`glow-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}
        
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={glow ? `url(#glow-${color.replace(/[^a-zA-Z0-9]/g, '')})` : undefined}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
        {safeValue}%
      </div>
    </div>
  );
};

// Shadcn-style Wireframe skeleton for Dashboard page
const DashboardSkeleton = () => (
  <div className="grid-dash animate-fadein" style={{ opacity: 0.7 }}>
    {/* Left Column Skeleton */}
    <div className="inner-column" style={{ gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ height: '200px', alignItems: 'center', justifyItems: 'center', textAlign: 'center' }}>
            <div className="skeleton" style={{ width: '60%', height: '12px', marginBottom: '14px' }} />
            <div className="skeleton skeleton-circle" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '70%', height: '16px', marginTop: '16px' }} />
          </div>
        ))}
      </div>
      <div className="skeleton-card" style={{ height: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div className="skeleton" style={{ width: '40%', height: '16px' }} />
          <div className="skeleton" style={{ width: '15px', height: '15px' }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '8px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ width: '30%', height: '14px', marginBottom: '12px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton" style={{ width: '80%', height: '12px' }} />
          <div className="skeleton" style={{ width: '90%', height: '12px' }} />
          <div className="skeleton" style={{ width: '85%', height: '12px' }} />
        </div>
      </div>
    </div>
    {/* Right Column Skeleton */}
    <div className="inner-column" style={{ gap: '20px' }}>
      <div className="skeleton-card" style={{ height: '320px' }}>
        <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ width: '100%', height: '50px', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
      <div className="skeleton-card" style={{ height: '180px' }}>
        <div className="skeleton" style={{ width: '40%', height: '12px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '60%', height: '18px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '100%', height: '30px', borderRadius: '6px' }} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { authFetch, user, clearNotifications } = useAuth();
  
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

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr) => {
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch (e) {
      return dateStr;
    }
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [tasks, setTasks] = useState([]);
  const [sleepLog, setSleepLog] = useState(null);
  const [dopamineLog, setDopamineLog] = useState(null);

  // AI Life Operator / Burnout states
  const [lifeScore, setLifeScore] = useState(null);
  const [burnoutProb, setBurnoutProb] = useState(null);
  const [lifeOperatorSuggestion, setLifeOperatorSuggestion] = useState('');
  
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
        const todayLog = sleepData.find(log => log.date === selectedDate);
        setSleepLog(todayLog || null);
      }

      // Fetch dopamine logs
      const dopRes = await authFetch('/routine/dopamine');
      if (dopRes.ok) {
        const dopLogs = await dopRes.json();
        const todayDop = dopLogs.find(l => l.date === selectedDate);
        setDopamineLog(todayDop || null);
      }

      // Fetch AI Suggestions
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
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const activeTasks = tasks;
  const completedTasksToday = activeTasks.filter(t => t.completedDates?.includes(selectedDate));
  const completionPercentage = activeTasks.length > 0 
    ? Math.round((completedTasksToday.length / activeTasks.length) * 100) 
    : 0;

  const notifications = user?.notifications || [];

  return (
    <div className="page-container" style={{ overflowY: 'auto', paddingBottom: '30px' }}>
      
      {/* Header Row: Greeting & Styled Date Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            Aria Life OS Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Metrics for {formatDisplayDate(selectedDate)}
          </p>
        </div>
        
        {/* Premium Date Selector */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '10px', 
          padding: '6px 14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}>
          <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-input" 
            style={{ width: 'auto', padding: '2px 6px', fontSize: '12px', border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid-dash">
          
          {/* Left Column: Visual Metrics & AI Operator Suggestions */}
          <div className="inner-column" style={{ gap: '20px' }}>
            
            {/* Visual Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              
              {/* Overall Life Score Card */}
              <div className="card" style={{ 
                alignItems: 'center', 
                textAlign: 'center', 
                padding: '24px 20px', 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(18, 20, 29, 0.6) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative glow */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', filter: 'blur(20px)' }} />
                
                <span className="form-label" style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '14px', letterSpacing: '0.8px' }}>Productivity Baseline</span>
                <CircularProgress 
                  value={lifeScore} 
                  size={88} 
                  strokeWidth={7} 
                  color="var(--color-primary)" 
                  glow={true} 
                />
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '16px', color: 'var(--text-primary)' }}>Life Score Index</h3>
                <span className="task-badge" style={{
                  marginTop: '8px',
                  background: lifeScore >= 80 ? 'var(--color-success-glow)' : lifeScore >= 50 ? 'var(--color-warning-glow)' : 'var(--color-danger-glow)',
                  color: lifeScore >= 80 ? 'var(--color-success)' : lifeScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                  border: lifeScore >= 80 ? '1px solid rgba(16, 185, 129, 0.2)' : lifeScore >= 50 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  {lifeScore >= 80 ? 'Peak Stamina' : lifeScore >= 50 ? 'Stable Load' : 'Critical Fatigue'}
                </span>
              </div>

              {/* Task Compliance Card */}
              <div className="card" style={{ 
                alignItems: 'center', 
                textAlign: 'center', 
                padding: '24px 20px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(18, 20, 29, 0.6) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.12)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.10)', filter: 'blur(20px)' }} />

                <span className="form-label" style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '14px', letterSpacing: '0.8px' }}>Execution Consistency</span>
                <CircularProgress 
                  value={completionPercentage} 
                  size={88} 
                  strokeWidth={7} 
                  color="var(--color-success)" 
                  glow={true}
                />
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '16px', color: 'var(--text-primary)' }}>Task Compliance</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {completedTasksToday.length} of {activeTasks.length} habits resolved
                </p>
              </div>

              {/* Burnout Risk Card */}
              <div className="card" style={{ 
                alignItems: 'center', 
                textAlign: 'center', 
                padding: '24px 20px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(18, 20, 29, 0.6) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.12)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.10)', filter: 'blur(20px)' }} />

                <span className="form-label" style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '14px', letterSpacing: '0.8px' }}>Neurological Reserves</span>
                <CircularProgress 
                  value={burnoutProb} 
                  size={88} 
                  strokeWidth={7} 
                  color={burnoutProb > 65 ? 'var(--color-danger)' : 'var(--color-warning)'} 
                  glow={true}
                />
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '16px', color: 'var(--text-primary)' }}>Burnout Threat</h3>
                <span className="task-badge" style={{
                  marginTop: '8px',
                  background: burnoutProb > 65 ? 'var(--color-danger-glow)' : 'var(--color-warning-glow)',
                  color: burnoutProb > 65 ? 'var(--color-danger)' : 'var(--color-warning)',
                  border: burnoutProb > 65 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  {burnoutProb > 65 ? 'Critical Risk' : 'Buffer Intact'}
                </span>
              </div>

            </div>

            {/* AI Life OS Intelligence Hub Card */}
            <div className="card" style={{ padding: '24px', background: 'rgba(18, 20, 29, 0.45)', border: '1px solid var(--border-color)', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <span className="flex align-center gap-8" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <Brain size={15} /> AI Life OS Scheduler & Diagnostics
                </span>
                <Sparkles size={14} style={{ color: 'var(--color-warning)' }} />
              </div>

              {lifeOperatorSuggestion ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* AI Suggestion Box */}
                  <div style={{ 
                    padding: '16px 20px', 
                    borderRadius: '10px', 
                    background: 'rgba(99, 102, 241, 0.03)', 
                    borderLeft: '4px solid var(--color-primary)',
                    boxShadow: 'inset 0 0 12px rgba(99, 102, 241, 0.02)'
                  }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Scheduler Operator Brief
                    </h4>
                    <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {lifeOperatorSuggestion}
                    </p>
                  </div>

                  {/* Bullet points baseline summary */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                      Diagnostic Baseline Logs
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      <div className="flex align-center gap-12" style={{ fontSize: '12px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Daily checklist compliance is currently at <strong style={{ color: 'var(--text-primary)' }}>{completionPercentage}%</strong>.
                        </span>
                      </div>

                      {sleepLog ? (
                        <div className="flex align-center gap-12" style={{ fontSize: '12px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sleepLog.duration >= 7 ? 'var(--color-primary)' : 'var(--color-warning)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Registered sleep duration is <strong style={{ color: 'var(--text-primary)' }}>{sleepLog.duration} hours</strong> with quality index <strong style={{ color: 'var(--text-primary)' }}>{sleepLog.quality}/5</strong>.
                          </span>
                        </div>
                      ) : (
                        <div className="flex align-center gap-12" style={{ fontSize: '12px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Circadian sleep log data missing. Update records in the Planner.
                          </span>
                        </div>
                      )}

                      {dopamineLog ? (
                        <div className="flex align-center gap-12" style={{ fontSize: '12px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dopamineLog.dopamineScore >= 80 ? 'var(--color-success)' : 'var(--color-danger)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Distraction screen time totals <strong style={{ color: 'var(--text-primary)' }}>{dopamineLog.totalMinutes} minutes</strong> (Focus Index: <strong style={{ color: 'var(--text-primary)' }}>{dopamineLog.dopamineScore}/100</strong>).
                          </span>
                        </div>
                      ) : (
                        <div className="flex align-center gap-12" style={{ fontSize: '12px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Digital distraction logs missing. Update records in the Planner.
                          </span>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ display: 'flex', height: '140px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} style={{ color: 'var(--text-muted)' }} />
                    <p>No telemetry logged. Complete logs under Tasks page to activate AI OS diagnostic briefing.</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Social Alerts, Notifications & Ultimate Goal countdown */}
          <div className="inner-column" style={{ gap: '20px' }}>
            
            {/* Social Alerts Card */}
            <div className="card" style={{ flex: 1, minHeight: '320px', display: 'flex', flexDirection: 'column', padding: '24px', background: 'rgba(18, 20, 29, 0.45)', border: '1px solid var(--border-color)' }}>
              <div className="card-title" style={{ fontSize: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span className="flex align-center gap-8" style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.8px' }}>
                  <Bell size={14} style={{ color: 'var(--color-primary)' }} /> ALERTS & NOTIFICATIONS
                </span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', outline: 'none' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {notifications.length === 0 ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={20} style={{ color: 'rgba(255, 255, 255, 0.15)' }} />
                      <span>Social log clear.<br />No nudges or requests recorded today.</span>
                    </div>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ 
                      padding: '12px 14px', 
                      borderRadius: '8px', 
                      background: 'rgba(255, 255, 255, 0.01)', 
                      border: '1px solid var(--border-color)', 
                      fontSize: '12px', 
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <Zap size={12} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: 'var(--text-primary)' }}>
                          <strong style={{ fontWeight: 700 }}>{n.senderName}</strong> {n.message}
                        </span>
                        <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Target Countdown Widget */}
            {user?.ultimateGoal?.title && (
              <div className="card" style={{ 
                padding: '24px 20px', 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(18, 20, 29, 0.7) 100%)', 
                border: '1px solid rgba(99, 102, 241, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.05)', filter: 'blur(30px)' }} />

                <span className="flex align-center gap-6" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <Target size={12} /> Ultimate Goal Target
                </span>
                
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '8px', marginBottom: '4px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  {user.ultimateGoal.title}
                </h3>
                {user.ultimateGoal.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {user.ultimateGoal.description}
                  </p>
                )}

                {(() => {
                  const days = getDaysRemaining(user.ultimateGoal.targetDate);
                  if (days === null) return null;
                  if (days < 0) {
                    return (
                      <span className="task-badge task-badge-custom" style={{ display: 'inline-block', fontSize: '10px', marginTop: '14px', border: '1px solid var(--border-color)' }}>
                        Target Milestone Reached
                      </span>
                    );
                  }
                  if (days === 0) {
                    return (
                      <span className="task-badge" style={{ marginTop: '14px', background: 'var(--color-warning-glow)', color: 'var(--color-warning)', fontSize: '10px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'inline-block' }}>
                        Target Deadline Reached Today!
                      </span>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-1px' }}>{days}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: 500 }}>days remaining</span>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Dashboard;
