import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Sparkles, TrendingUp, RefreshCw, Info, Calendar, Clock, BarChart2, Coins } from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
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
  const [dopamineLogs, setDopamineLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [geminiAdvice, setGeminiAdvice] = useState('');
  const [burnoutProb, setBurnoutProb] = useState(null);
  
  const [activeSubTab, setActiveSubTab] = useState('compliance');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch Sleep logs
      const sleepRes = await authFetch('/routine/sleep');
      const sleepData = await sleepRes.json();
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

      // Fetch Dopamine logs
      const dopRes = await authFetch('/routine/dopamine');
      if (dopRes.ok) {
        const dopData = await dopRes.json();
        setDopamineLogs([...dopData].reverse());
      }

      // Fetch Finance logs
      const finRes = await authFetch('/finance');
      if (finRes.ok) {
        const finData = await finRes.json();
        setTransactions(finData);
      }

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
        setBurnoutProb(data.burnoutProb);
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
    maintainAspectRatio: false,
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
    maintainAspectRatio: false,
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
    maintainAspectRatio: false,
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

  // 4. DATA PREPARATION: Planned vs Actual Study Hours (last 7 days)
  const plannedHoursData = dateLabels.map(date => {
    let plannedSum = 0;
    let actualSum = 0;
    tasks.forEach(task => {
      if (task.plannedHours !== null && task.plannedHours !== undefined) {
        plannedSum += Number(task.plannedHours);
      }
      if (task.completedDates?.includes(date)) {
        const actualHrs = task.actualHoursLogs?.[date];
        if (actualHrs !== undefined && actualHrs !== null) {
          actualSum += Number(actualHrs);
        }
      }
    });
    return { planned: Math.round(plannedSum * 10) / 10, actual: Math.round(actualSum * 10) / 10 };
  });

  const hoursChartData = {
    labels: dateLabels.map(d => d.slice(5)),
    datasets: [
      {
        label: 'Planned hours',
        data: plannedHoursData.map(d => d.planned),
        backgroundColor: 'rgba(99, 102, 241, 0.4)',
        borderColor: 'var(--color-primary)',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Actual hours logged',
        data: plannedHoursData.map(d => d.actual),
        backgroundColor: 'rgba(16, 185, 129, 0.65)',
        borderColor: 'var(--color-success)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const hoursChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        title: { display: true, text: 'Hours', color: '#9ca3af' }
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { labels: { color: '#f3f4f6' } }
    }
  };

  // 5. DATA PREPARATION: Dopamine distraction correlation chart (last 7 days)
  const dopamineCorrelationData = dateLabels.map(date => {
    const log = dopamineLogs.find(l => l.date === date);
    const totalScreenTime = log ? log.totalMinutes : 0;
    const activeTasks = tasks;
    let completionRate = 0;
    if (activeTasks.length > 0) {
      const completed = activeTasks.filter(t => t.completedDates?.includes(date)).length;
      completionRate = Math.round((completed / activeTasks.length) * 100);
    }
    return { screenTime: totalScreenTime, compliance: completionRate };
  });

  const correlationChartData = {
    labels: dateLabels.map(d => d.slice(5)),
    datasets: [
      {
        label: 'Distraction Minutes',
        data: dopamineCorrelationData.map(d => d.screenTime),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Compliance rate %',
        data: dopamineCorrelationData.map(d => d.compliance),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        tension: 0.3,
        yAxisID: 'y1',
      }
    ]
  };

  const correlationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Distraction (Mins)', color: '#9ca3af' },
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        title: { display: true, text: 'Completion %', color: '#9ca3af' },
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

  // 6. DATA PREPARATION: Doughnut Chart 1 - Dopamine Distraction Breakdown
  const totalInsta = dopamineLogs.reduce((acc, l) => acc + (l.instagramMins || 0), 0);
  const totalYt = dopamineLogs.reduce((acc, l) => acc + (l.youtubeMins || 0), 0);
  const totalScroll = dopamineLogs.reduce((acc, l) => acc + (l.scrollingMins || 0), 0);
  const hasDopamineData = totalInsta > 0 || totalYt > 0 || totalScroll > 0;

  const dopaminePieData = {
    labels: ['Instagram', 'YouTube', 'Other Feed'],
    datasets: [
      {
        data: [totalInsta, totalYt, totalScroll],
        backgroundColor: [
          'rgba(239, 68, 68, 0.65)',
          'rgba(99, 102, 241, 0.65)',
          'rgba(245, 158, 11, 0.65)'
        ],
        borderColor: [
          '#ef4444',
          '#6366f1',
          '#f59e0b'
        ],
        borderWidth: 1
      }
    ]
  };

  // 7. DATA PREPARATION: Doughnut Chart 2 - Task Category Breakdown
  const studyCount = tasks.filter(t => t.category === 'study').length;
  const fitnessCount = tasks.filter(t => t.category === 'fitness').length;
  const routineCount = tasks.filter(t => t.category === 'routine' || t.isMandatory).length;
  const customCount = tasks.filter(t => t.category !== 'study' && t.category !== 'fitness' && !(t.category === 'routine' || t.isMandatory)).length;
  const hasTaskData = tasks.length > 0;

  const taskPieData = {
    labels: ['Study', 'Fitness', 'Routine', 'Custom'],
    datasets: [
      {
        data: [studyCount, fitnessCount, routineCount, customCount],
        backgroundColor: [
          'rgba(16, 185, 129, 0.65)',
          'rgba(59, 130, 246, 0.65)',
          'rgba(245, 158, 11, 0.65)',
          'rgba(148, 163, 184, 0.65)'
        ],
        borderColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#94a3b8'
        ],
        borderWidth: 1
      }
    ]
  };

  // 8. DATA PREPARATION: Finance Comparison Chart (last 7 days)
  const financeDaysData = dateLabels.map(date => {
    const dayIncome = transactions
      .filter(tx => tx.date === date && tx.type === 'income')
      .reduce((acc, tx) => acc + tx.amount, 0);
    const dayExpense = transactions
      .filter(tx => tx.date === date && tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);
    return { income: dayIncome, expense: dayExpense };
  });

  const financeCompareChartData = {
    labels: dateLabels.map(d => d.slice(5)), // display MM-DD
    datasets: [
      {
        label: 'Income (₹)',
        data: financeDaysData.map(d => d.income),
        backgroundColor: 'rgba(16, 185, 129, 0.65)',
        borderColor: 'var(--color-success)',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Expenses (₹)',
        data: financeDaysData.map(d => d.expense),
        backgroundColor: 'rgba(239, 68, 68, 0.65)',
        borderColor: 'var(--color-danger)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const financeCompareChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: { color: '#6b7280' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        title: { display: true, text: 'Amount (₹)', color: '#9ca3af' }
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { labels: { color: '#f3f4f6' } }
    }
  };

  // 9. DATA PREPARATION: Finance Category Outflow Distribution (Doughnut)
  const expenseCategoriesList = [
    'Food', 'Rent', 'Utilities', 'Entertainment', 'Books/Education', 'Health/Fitness', 'Transport', 'Shopping', 'Custom Expense'
  ];
  const financeCategoryTotals = expenseCategoriesList.map(cat => {
    return transactions
      .filter(tx => tx.type === 'expense' && tx.category === cat)
      .reduce((acc, tx) => acc + tx.amount, 0);
  });

  const hasFinanceExpenses = financeCategoryTotals.some(val => val > 0);

  const financeDoughnutChartData = {
    labels: expenseCategoriesList.filter((_, idx) => financeCategoryTotals[idx] > 0),
    datasets: [
      {
        data: financeCategoryTotals.filter(val => val > 0),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(99, 102, 241, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(20, 184, 166, 0.6)',
          'rgba(100, 116, 139, 0.6)'
        ],
        borderColor: [
          '#ef4444',
          '#6366f1',
          '#f59e0b',
          '#a855f7',
          '#10b981',
          '#3b82f6',
          '#ec4899',
          '#14b8a6',
          '#64748b'
        ],
        borderWidth: 1
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e2e8f0',
          font: { size: 11, family: 'Outfit, sans-serif' }
        }
      }
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
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

      {/* Sub-tab Navigation to fit everything without vertical scroll on desktop */}
      <div className="flex gap-8" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
        <button 
          onClick={() => setActiveSubTab('compliance')} 
          className={`btn ${activeSubTab === 'compliance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '6px' }}
        >
          <Calendar size={12} /> Compliance & Sleep
        </button>
        <button 
          onClick={() => setActiveSubTab('focus')} 
          className={`btn ${activeSubTab === 'focus' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '6px' }}
        >
          <Clock size={12} /> Time & Focus
        </button>
        <button 
          onClick={() => setActiveSubTab('fitness')} 
          className={`btn ${activeSubTab === 'fitness' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '6px' }}
        >
          <BarChart2 size={12} /> Fitness & AI Coach
        </button>
      </div>

      {loading ? (
        <div className="card text-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Compiling analytics dataset...</span>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          
          {/* Tab 1: Routines & Sleep Compliance */}
          {activeSubTab === 'compliance' && (
            <div className="grid-2" style={{ gap: '20px', flex: 1, minHeight: 0 }}>
              
              {/* Task completion rate card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Daily Task Compliance (Last 7 Days)</span>
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                  {tasks.length === 0 ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No tasks defined. Tracking compliance requires task logs.
                    </div>
                  ) : (
                    <Bar data={taskChartData} options={taskChartOptions} />
                  )}
                </div>
              </div>

              {/* Sleep trend card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Sleep Cycles & Quality</span>
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                  {sleepLogs.length === 0 ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No sleep history available. Log sleep on the dashboard to visualize.
                    </div>
                  ) : (
                    <Line data={sleepChartData} options={sleepChartOptions} />
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Time & Focus */}
          {activeSubTab === 'focus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              <div className="grid-2" style={{ gap: '20px', minHeight: '300px' }}>
                {/* Planned vs Actual hours */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Planned vs Actual Workload (Reality Check)</span>
                  <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    <Bar data={hoursChartData} options={hoursChartOptions} />
                  </div>
                </div>

                {/* Distraction minutes correlation */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Digital Distraction vs Task Completion Correlation</span>
                  <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    <Line data={correlationChartData} options={correlationChartOptions} />
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '20px', minHeight: '300px' }}>
                {/* Distraction Breakdown Doughnut */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Screen Time Distraction Breakdown</span>
                  <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    {!hasDopamineData ? (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No distraction logs available. Log screen time on the dashboard to visualize.
                      </div>
                    ) : (
                      <Doughnut data={dopaminePieData} options={doughnutOptions} />
                    )}
                  </div>
                </div>

                {/* Task Distribution Doughnut */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Task Category Distribution</span>
                  <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    {!hasTaskData ? (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No tasks defined. Add tasks to see distribution.
                      </div>
                    ) : (
                      <Doughnut data={taskPieData} options={doughnutOptions} />
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Weight & AI Coaching / Burnout */}
          {activeSubTab === 'fitness' && (
            <div className="grid-2" style={{ gap: '20px', flex: 1, minHeight: 0 }}>
              
              {/* Weight trend card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span className="card-title" style={{ fontSize: '13px', marginBottom: '8px', flexShrink: 0 }}>Weight Trajectory Chart</span>
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                  {weightLogs.length === 0 ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No weights logged. Add weight inputs on the Fitness page.
                    </div>
                  ) : (
                    <Line data={weightChartData} options={weightChartOptions} />
                  )}
                </div>
              </div>

              {/* AI Coach card with Burnout risk gauge */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span className="card-title" style={{ fontSize: '13px', marginBottom: '12px', flexShrink: 0 }}>
                  <span className="flex align-center gap-8">
                    <Sparkles size={14} style={{ color: 'var(--color-primary)' }} /> AI Coach Insights & Burnout Risk
                  </span>
                  {aiLoading && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Processing...</span>}
                </span>

                {/* Burnout Probability Gauge block */}
                {burnoutProb !== null && (
                  <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="46" height="46" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="3.5"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={burnoutProb > 65 ? '#ef4444' : '#f59e0b'}
                          strokeWidth="3.5"
                          strokeDasharray={`${burnoutProb}, 100`}
                        />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 700, color: burnoutProb > 65 ? '#ef4444' : '#f59e0b' }}>
                        {burnoutProb}%
                      </span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Burnout Probability</h4>
                      <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '1px 0 0 0', lineHeight: '1.3' }}>
                        {burnoutProb > 65 ? 'High risk. Schedule buffers and shift workouts.' : 'Safe index. Standard execution block maintained.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-16" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  
                  {/* Local engine list */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    <span className="form-label" style={{ fontSize: '9px', marginBottom: '4px', flexShrink: 0 }}>Diagnostics</span>
                    {aiSuggestions.map((s, idx) => (
                      <div key={idx} className={`ai-suggestion-card priority-${s.priority}`} style={{ padding: '8px 10px', borderRadius: '6px' }}>
                        <div className="ai-suggestion-header" style={{ fontSize: '11px', marginBottom: '2px' }}>
                          <span>{s.title}</span>
                          <span style={{ 
                            fontSize: '8px', 
                            textTransform: 'uppercase', 
                            color: s.priority === 'high' ? 'var(--color-danger)' : s.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-primary)' 
                          }}>
                            {s.priority}
                          </span>
                        </div>
                        <div className="ai-suggestion-desc" style={{ fontSize: '10px', lineHeight: 1.3 }}>{s.description}</div>
                      </div>
                    ))}
                  </div>

                  {/* Gemini advice */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="form-label" style={{ fontSize: '9px', marginBottom: '4px', flexShrink: 0 }}>Gemini AI Analysis</span>
                    {geminiAdvice ? (
                      <p className="ai-coach-text" style={{ fontSize: '10px', margin: 0, lineHeight: 1.4 }}>{geminiAdvice}</p>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                        <Info size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p>Provide a Google Gemini API Key in the Settings page to unlock deep LLM summaries of your routines.</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Analytics;
