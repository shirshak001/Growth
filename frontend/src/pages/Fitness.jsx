import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Scale, Droplet, Plus, Calendar } from 'lucide-react';

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
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    } finally {
      setLoading(false);
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
        // Update local logs list
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
      const newVal = prev + amount;
      // Auto save to database
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header and selector */}
      <div className="card flex justify-between align-center" style={{ padding: '16px 24px' }}>
        <div className="flex align-center gap-8">
          <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Log Fitness Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-input" 
            style={{ width: 'auto', padding: '6px 12px' }}
          />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Profile height: <strong>{heightCm} cm</strong> (editable in Settings)
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid-3">
        
        {/* Latest Weight Card */}
        <div className="card stat-widget">
          <span className="card-title">
            <span>Latest Weight</span>
            <Scale size={16} />
          </span>
          <div className="stat-value">
            {latestWeight ? `${latestWeight} kg` : 'Not Logged'}
          </div>
          <span className="stat-subtitle">
            Target Weight: {user?.targetWeight || 70} kg
          </span>
        </div>

        {/* BMI Card */}
        <div className="card stat-widget">
          <span className="card-title">
            <span>Body Mass Index</span>
            <Dumbbell size={16} />
          </span>
          <div className="stat-value">{bmiVal || 'N/A'}</div>
          <span className="stat-subtitle">
            Category: {getBMICategory(bmiVal)}
          </span>
        </div>

        {/* Water Logged today */}
        <div className="card stat-widget">
          <span className="card-title">
            <span>Hydration Today</span>
            <Droplet size={16} style={{ color: '#3b82f6' }} />
          </span>
          <div className="stat-value">{currentWater} ml</div>
          <span className="stat-subtitle">
            Target: 2000 ml
          </span>
        </div>

      </div>

      <div className="grid-dash">
        
        {/* Weight & Active Minutes Logger */}
        <div className="card">
          <span className="card-title">Log Metrics for {selectedDate}</span>
          
          <form onSubmit={handleLogFitness} className="task-section">
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="e.g. 72.5"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active Minutes (exercise/cardio)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 45"
                value={currentActive}
                onChange={(e) => setCurrentActive(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Save Metrics
            </button>
          </form>
        </div>

        {/* Hydration Tracker */}
        <div className="card flex" style={{ flexDirection: 'column', gap: '20px' }}>
          <span className="card-title">Water Intake Tracker</span>
          
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6' }}>
              {((currentWater / 2000) * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Hydrated of 2000 ml target
            </div>
          </div>

          <div className="water-progress-bar" style={{ margin: 0, height: '12px' }}>
            <div 
              className="water-progress-fill" 
              style={{ width: `${Math.min((currentWater / 2000) * 100, 100)}%` }}
            />
          </div>

          <div className="flex gap-8 justify-between">
            <button onClick={() => addWater(250)} className="btn btn-secondary flex-1" style={{ fontSize: '12px', padding: '10px 0' }}>
              + 250 ml
            </button>
            <button onClick={() => addWater(500)} className="btn btn-secondary flex-1" style={{ fontSize: '12px', padding: '10px 0' }}>
              + 500 ml
            </button>
            <button onClick={() => addWater(1000)} className="btn btn-secondary flex-1" style={{ fontSize: '12px', padding: '10px 0' }}>
              + 1000 ml
            </button>
          </div>

          <button onClick={() => addWater(-currentWater)} className="btn btn-icon text-center w-full" style={{ fontSize: '11px', marginTop: '10px' }}>
            Reset Water Count
          </button>
        </div>

      </div>

      {/* History table */}
      <div className="card">
        <span className="card-title">Fitness History Log</span>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 8px' }}>Date</th>
                <th style={{ padding: '12px 8px' }}>Weight (kg)</th>
                <th style={{ padding: '12px 8px' }}>Water (ml)</th>
                <th style={{ padding: '12px 8px' }}>Active Minutes</th>
                <th style={{ padding: '12px 8px' }}>BMI Equivalent</th>
              </tr>
            </thead>
            <tbody>
              {fitnessLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No fitness data logged yet.
                  </td>
                </tr>
              ) : (
                fitnessLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px' }}>{log.date}</td>
                    <td style={{ padding: '12px 8px' }}>{log.weight ? `${log.weight} kg` : '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{log.waterIntake ? `${log.waterIntake} ml` : '—'}</td>
                    <td style={{ padding: '12px 8px' }}>{log.activeMinutes ? `${log.activeMinutes} m` : '—'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {log.weight ? calculateBMI(log.weight, heightCm) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Fitness;
