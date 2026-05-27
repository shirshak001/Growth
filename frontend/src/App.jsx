import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fitness from './pages/Fitness';
import SelfDevelopment from './pages/SelfDevelopment';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { LogOut, Zap } from 'lucide-react';
import StudyStrategist from './pages/StudyStrategist';
import Competitive from './pages/Competitive';
import TaskManager from './pages/TaskManager';
import Finance from './pages/Finance';

const NavigationContainer = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lowDopamineMode, setLowDopamineMode] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontSize: '14px'
      }}>
        Initializing Growth Tracker Session...
      </div>
    );
  }

  // Not logged in: show login page
  if (!user) {
    return <Login />;
  }

  // Map active tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskManager />;
      case 'fitness':
        return <Fitness />;
      case 'mindset':
        return <SelfDevelopment />;
      case 'strategist':
        return <StudyStrategist />;
      case 'competitive':
        return <Competitive />;
      case 'finance':
        return <Finance />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Daily Dashboard & Reports';
      case 'tasks': return 'Daily Tasks & Log Planner';
      case 'fitness': return 'Fitness Metrics & Hydration';
      case 'mindset': return 'Mindset & Self-Development';
      case 'strategist': return 'AI Study Strategist & Roadmap';
      case 'competitive': return 'Competitive Arena & Duels';
      case 'finance': return 'Financial Planner & Tracker';
      case 'analytics': return 'Performance Charts & AI Insights';
      case 'settings': return 'Profile Configuration';
      default: return 'Dashboard';
    }
  };

  return (
    <div className={`app-layout ${lowDopamineMode ? 'low-dopamine-mode' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Pane */}
      <div className="main-wrapper">
        <header className="main-header">
          <div className="header-title">
            <h2>{getHeaderTitle()}</h2>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user?.notifications && user.notifications.length > 0 && (
              <button 
                onClick={() => setActiveTab('competitive')} 
                style={{
                  background: 'var(--color-primary-glow)',
                  border: '1px solid var(--color-primary)',
                  color: 'var(--color-primary)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Zap size={11} /> {user.notifications.length} Alerts
              </button>
            )}
            <span className="session-name" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Session: <strong>{user.name}</strong>
            </span>
            <button 
              onClick={() => setLowDopamineMode(!lowDopamineMode)} 
              className={`btn-icon ${lowDopamineMode ? 'active' : ''}`} 
              title="Toggle Low-Dopamine Focus Mode"
              style={{ 
                padding: '6px', 
                color: lowDopamineMode ? 'var(--color-warning)' : 'var(--text-secondary)',
                backgroundColor: lowDopamineMode ? 'var(--color-warning-glow)' : 'transparent',
                border: lowDopamineMode ? '1px solid rgba(245, 158, 11, 0.2)' : 'none'
              }}
            >
              <Zap size={14} />
            </button>
            <button onClick={logout} className="btn-icon" title="Sign Out" style={{ padding: '6px' }}>
              <LogOut size={14} style={{ color: 'var(--color-danger)' }} />
            </button>
          </div>
        </header>
        
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NavigationContainer />
    </AuthProvider>
  );
}

export default App;
