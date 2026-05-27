import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Scale, Droplet, Plus, Calendar, Activity, Info } from 'lucide-react';

// Shadcn-style Wireframe skeleton for Fitness page
const FitnessSkeleton = () => (
  <div className="grid-dash animate-fadein" style={{ opacity: 0.7 }}>
    {/* Left Column Skeleton */}
    <div className="inner-column">
      <div className="skeleton-card" style={{ height: '220px' }}>
        <div className="skeleton" style={{ width: '40%', height: '18px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px', marginBottom: '14px' }} />
        <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px', marginBottom: '14px' }} />
        <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
      </div>
      <div className="skeleton-card" style={{ height: '320px' }}>
        <div className="skeleton" style={{ width: '40%', height: '18px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
      </div>
    </div>
    {/* Right Column Skeleton */}
    <div className="inner-column">
      <div className="skeleton-card" style={{ height: '180px' }}>
        <div className="skeleton" style={{ width: '40%', height: '18px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ width: '100%', height: '8px', borderRadius: '4px', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />
        </div>
      </div>
      <div className="skeleton-card" style={{ height: '350px' }}>
        <div className="skeleton" style={{ width: '50%', height: '18px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '8px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ width: '100%', height: '150px', borderRadius: '8px' }} />
      </div>
    </div>
  </div>
);

const Fitness = () => {
  const { user, authFetch } = useAuth();
  
  // Date state
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [fitnessLogs, setFitnessLogs] = useState([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentWater, setCurrentWater] = useState(0);
  const [currentActive, setCurrentActive] = useState(0);
  
  // Menstrual cycle states (for female users)
  const [periodLogs, setPeriodLogs] = useState([]);
  const [periodDate, setPeriodDate] = useState(getTodayString());
  const [periodDuration, setPeriodDuration] = useState(5);
  const [periodCycle, setPeriodCycle] = useState(28);
  const [periodSymptoms, setPeriodSymptoms] = useState('');
  
  const [loading, setLoading] = useState(true);

  const fetchFitnessData = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/fitness');
      if (res.ok) {
        const data = await res.json();
        setFitnessLogs(data);

        // Find log for currently selected date
        const todayLog = data.find(log => log.date === selectedDate);
        if (todayLog) {
          setCurrentWeight(todayLog.weight || '');
          setCurrentWater(todayLog.waterIntake || 0);
          setCurrentActive(todayLog.activeMinutes || 0);
        } else {
          setCurrentWeight('');
          setCurrentWater(0);
          setCurrentActive(0);
        }
      }

      // Fetch period logs if user is female
      if (user?.gender === 'female') {
        const periodRes = await authFetch('/period');
        if (periodRes.ok) {
          const periodData = await periodRes.json();
          setPeriodLogs(periodData);
        }
      }
    } catch (error) {
      console.error('Error fetching fitness/period data:', error);
    } finally {
      // Artificially delay a tiny bit for elegant skeleton reveal transition
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    fetchFitnessData();
  }, [selectedDate]);

  // Handle Log submit
  const handleLogFitness = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await authFetch('/fitness', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          weight: currentWeight === '' ? undefined : Number(currentWeight),
          waterIntake: Number(currentWater),
          activeMinutes: Number(currentActive)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFitnessLogs(prev => {
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
      console.error('Error saving fitness metrics:', error);
    }
  };

  // Add water helper
  const addWater = (amount) => {
    setCurrentWater(prev => {
      const newVal = Math.max(0, prev + amount);
      setTimeout(() => {
        authFetch('/fitness', {
          method: 'POST',
          body: JSON.stringify({
            date: selectedDate,
            waterIntake: newVal,
            weight: currentWeight === '' ? undefined : Number(currentWeight),
            activeMinutes: Number(currentActive)
          })
        }).then(res => {
          if (res.ok) {
            res.json().then(data => {
              setFitnessLogs(prevList => {
                const index = prevList.findIndex(l => l.date === selectedDate);
                if (index > -1) {
                  const copy = [...prevList];
                  copy[index] = data;
                  return copy;
                } else {
                  return [data, ...prevList];
                }
              });
            });
          }
        });
      }, 100);
      return newVal;
    });
  };

  // Log period submit
  const handleLogPeriod = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/period', {
        method: 'POST',
        body: JSON.stringify({
          date: periodDate,
          duration: Number(periodDuration),
          cycleLength: Number(periodCycle),
          symptoms: periodSymptoms
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPeriodLogs(prev => {
          const index = prev.findIndex(l => l.date === periodDate);
          if (index > -1) {
            const copy = [...prev];
            copy[index] = data;
            return copy;
          } else {
            return [data, ...prev].sort((a, b) => b.date.localeCompare(a.date));
          }
        });
        setPeriodSymptoms('');
      }
    } catch (error) {
      console.error('Error logging period:', error);
    }
  };

  // Calculate BMI
  const heightCm = user?.height || 170;
  const latestLoggedWeightObj = fitnessLogs.find(log => log.weight !== null && log.weight !== undefined);
  const latestWeight = latestLoggedWeightObj ? latestLoggedWeightObj.weight : null;
  
  const calculateBMI = (w, h) => {
    if (!w || !h) return null;
    const heightM = h / 100;
    return (w / (heightM * heightM)).toFixed(1);
  };

  const bmiVal = calculateBMI(latestWeight, heightCm);
  
  const getBMICategory = (bmi) => {
    if (!bmi) return 'N/A';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  // Predict Menstrual Cycle Date
  const getPrediction = () => {
    if (periodLogs.length === 0) return null;
    const latest = periodLogs[0];
    const start = new Date(latest.date);
    start.setDate(start.getDate() + (latest.cycleLength || 28));

    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    const predictionStr = `${year}-${month}-${day}`;

    // Days remaining
    const todayDate = new Date(getTodayString());
    const diffTime = start - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      date: predictionStr,
      daysRemaining: diffDays
    };
  };

  const cyclePrediction = getPrediction();

  return (
    <div className="page-container" style={{ paddingBottom: '30px' }}>
      
      {/* Header and selector */}
      <div className="card glass-card flex justify-between align-center animate-fadein" style={{ padding: '12px 24px', flexShrink: 0 }}>
        <div className="flex align-center gap-8">
          <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Log Fitness Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-input" 
            style={{ width: 'auto', padding: '4px 10px', fontSize: '13px', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}
          />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Profile height: <strong style={{ color: 'var(--text-primary)' }}>{heightCm} cm</strong> (editable in Settings)
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid-3 animate-slideup" style={{ flexShrink: 0 }}>
        
        {/* Latest Weight Card */}
        <div className="card glass-card stat-widget animate-scalein" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.05)', filter: 'blur(15px)' }} />
          <span className="card-title" style={{ fontSize: '11px', marginBottom: '8px', letterSpacing: '0.5px' }}>
            <span>Latest Weight</span>
            <Scale size={14} style={{ color: 'var(--color-primary)' }} />
          </span>
          <div className="stat-value" style={{ fontSize: '26px', fontWeight: 800 }}>
            {latestWeight ? `${latestWeight} kg` : 'Not Logged'}
          </div>
          <span className="stat-subtitle" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Target Weight: {user?.targetWeight || 70} kg
          </span>
        </div>

        {/* BMI Card */}
        <div className="card glass-card stat-widget animate-scalein" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.05)', filter: 'blur(15px)' }} />
          <span className="card-title" style={{ fontSize: '11px', marginBottom: '8px', letterSpacing: '0.5px' }}>
            <span>Body Mass Index</span>
            <Dumbbell size={14} style={{ color: 'var(--color-success)' }} />
          </span>
          <div className="stat-value" style={{ fontSize: '26px', fontWeight: 800 }}>{bmiVal || 'N/A'}</div>
          <span className="stat-subtitle" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Category: {getBMICategory(bmiVal)}
          </span>
        </div>

        {/* Water Logged today */}
        <div className="card glass-card stat-widget animate-scalein" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.08)', filter: 'blur(15px)' }} />
          <span className="card-title" style={{ fontSize: '11px', marginBottom: '8px', letterSpacing: '0.5px' }}>
            <span>Hydration Today</span>
            <Droplet size={14} style={{ color: '#3b82f6' }} />
          </span>
          <div className="stat-value" style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6' }}>{currentWater} ml</div>
          <span className="stat-subtitle" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Target: 2000 ml
          </span>
        </div>

      </div>

      {loading ? (
        <FitnessSkeleton />
      ) : (
        <div className="grid-dash animate-slideup">
          
          {/* Left Column: Logger & History */}
          <div className="inner-column">
            
            {/* Weight & Active Minutes Logger */}
            <div className="card glass-card" style={{ flexShrink: 0 }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '16px' }}>Log Metrics for {selectedDate}</span>
              
              <form onSubmit={handleLogFitness} className="task-section" style={{ gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', marginBottom: '6px' }}>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 72.5"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', marginBottom: '6px' }}>Active Minutes (exercise/cardio)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 45"
                    value={currentActive}
                    onChange={(e) => setCurrentActive(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full" style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.98)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  Save Metrics
                </button>
              </form>
            </div>

            {/* History table */}
            <div className="card glass-card" style={{ flex: 1, minHeight: 0 }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '16px' }}>Fitness History Log</span>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 6px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '10px 6px', fontWeight: 600 }}>Weight</th>
                      <th style={{ padding: '10px 6px', fontWeight: 600 }}>Water</th>
                      <th style={{ padding: '10px 6px', fontWeight: 600 }}>Active</th>
                      <th style={{ padding: '10px 6px', fontWeight: 600 }}>BMI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fitnessLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No fitness data logged.
                        </td>
                      </tr>
                    ) : (
                      fitnessLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="animate-fadein" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.01)'} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='transparent'}>
                          <td style={{ padding: '10px 6px', fontWeight: 500 }}>{log.date}</td>
                          <td style={{ padding: '10px 6px' }}>{log.weight ? `${log.weight} kg` : '—'}</td>
                          <td style={{ padding: '10px 6px', color: log.waterIntake ? '#60a5fa' : 'inherit' }}>{log.waterIntake ? `${log.waterIntake} ml` : '—'}</td>
                          <td style={{ padding: '10px 6px' }}>{log.activeMinutes ? `${log.activeMinutes} mins` : '—'}</td>
                          <td style={{ padding: '10px 6px' }}>
                            {log.weight ? (
                              <span className="task-badge task-badge-custom" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.02)' }}>
                                {calculateBMI(log.weight, heightCm)}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Hydration & Period Tracker */}
          <div className="inner-column">
            
            {/* Hydration Tracker */}
            <div className="card glass-card" style={{ flexShrink: 0, padding: '20px' }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '12px' }}>Water Intake Tracker</span>
              
              <div className="flex justify-between align-center" style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.5px' }}>
                  {((currentWater / 2000) * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {currentWater} / 2000 ml
                </div>
              </div>

              <div className="water-progress-bar" style={{ margin: '0 0 16px 0', height: '8px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden', borderRadius: '4px' }}>
                <div 
                  className="water-progress-fill" 
                  style={{ width: `${Math.min((currentWater / 2000) * 100, 100)}%`, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' }}
                />
              </div>

              <div className="flex gap-8 justify-between">
                <button onClick={() => addWater(250)} className="btn btn-secondary flex-1" style={{ fontSize: '11px', padding: '8px 0', borderRadius: '6px', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.92)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  + 250ml
                </button>
                <button onClick={() => addWater(500)} className="btn btn-secondary flex-1" style={{ fontSize: '11px', padding: '8px 0', borderRadius: '6px', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.92)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  + 500ml
                </button>
                <button onClick={() => addWater(1000)} className="btn btn-secondary flex-1" style={{ fontSize: '11px', padding: '8px 0', borderRadius: '6px', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.92)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  + 1.0L
                </button>
              </div>
            </div>

            {/* Period Tracker Card (Conditional) */}
            {user?.gender === 'female' ? (
              <div className="card glass-card animate-fadein" style={{ flex: 1, minHeight: 0, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.15)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.01) 0%, rgba(18, 20, 29, 0.6) 100%)' }}>
                <span className="card-title" style={{ fontSize: '13px', marginBottom: '12px', color: '#f87171' }}>
                  <span className="flex align-center gap-8">
                    <Activity size={14} style={{ color: '#ef4444' }} /> Menstrual Cycle Predictor
                  </span>
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                  {/* Predictions summary */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.12)', padding: '12px 14px', borderRadius: '8px', fontSize: '12px' }}>
                    {cyclePrediction ? (
                      <div>
                        <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Next predicted cycle:</span>
                          <strong style={{ color: '#ef4444' }}>{cyclePrediction.date}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>Countdown:</span>
                          <strong style={{ color: '#f87171' }}>
                            {cyclePrediction.daysRemaining > 0 
                              ? `In ${cyclePrediction.daysRemaining} days` 
                              : cyclePrediction.daysRemaining === 0 
                              ? 'Starting today' 
                              : 'Late / Cycle active'}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '11px', padding: '4px 0' }}>
                        Log your first period start date below to calculate predictions.
                      </div>
                    )}
                  </div>

                  {/* Log Period Form */}
                  <form onSubmit={handleLogPeriod} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '14px' }}>
                    <div className="grid-2" style={{ gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Start Date</label>
                        <input
                          type="date"
                          value={periodDate}
                          onChange={(e) => setPeriodDate(e.target.value)}
                          className="form-input"
                          style={{ padding: '8px 10px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Duration (Days)</label>
                        <input
                          type="number"
                          value={periodDuration}
                          onChange={(e) => setPeriodDuration(e.target.value)}
                          className="form-input"
                          style={{ padding: '8px 10px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Symptoms / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Mild cramps, low energy"
                        value={periodSymptoms}
                        onChange={(e) => setPeriodSymptoms(e.target.value)}
                        className="form-input"
                        style={{ padding: '8px 10px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                      />
                    </div>

                    <button type="submit" className="btn btn-secondary w-full" style={{ padding: '8px 0', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.15)', background: 'rgba(239, 68, 68, 0.02)', color: '#f87171' }}>
                      Log Period Start
                    </button>
                  </form>

                  {/* Mini history list */}
                  <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '10px' }}>
                    <span className="form-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Log History</span>
                    {periodLogs.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No logs saved.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {periodLogs.slice(0, 3).map(log => (
                          <div key={log.id} className="animate-fadein" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
                            <span>{log.date} ({log.duration} days)</span>
                            <span style={{ color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.symptoms || 'No symptoms'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card glass-card animate-fadein" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '30px' }}>
                <Activity size={20} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Period tracking is configured for female user profiles. You can change your gender settings in the profile page.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Fitness;
