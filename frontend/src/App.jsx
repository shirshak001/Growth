import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fitness from './pages/Fitness';
import SelfDevelopment from './pages/SelfDevelopment';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { LogOut } from 'lucide-react';

const NavigationContainer = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
      case 'fitness':
        return <Fitness />;
      case 'mindset':
        return <SelfDevelopment />;
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
      case 'dashboard': return 'Daily Dashboard & Routines';
      case 'fitness': return 'Fitness Metrics & Hydration';
      case 'mindset': return 'Mindset & Self-Development';
      case 'analytics': return 'Performance Charts & AI Insights';
      case 'settings': return 'Profile Configuration';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Pane */}
      <div className="main-wrapper">
        <header className="main-header">
          <div className="header-title">
            <h2>{getHeaderTitle()}</h2>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="session-name" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Session: <strong>{user.name}</strong>
            </span>
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
