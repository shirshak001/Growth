import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Brain, 
  BookOpen,
  TrendingUp, 
  Trophy,
  Settings, 
  LogOut 
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fitness', label: 'Fitness & Health', icon: Dumbbell },
    { id: 'mindset', label: 'Self-Development', icon: Brain },
    { id: 'strategist', label: 'Study Strategist', icon: BookOpen },
    { id: 'competitive', label: 'Competitive Arena', icon: Trophy },
    { id: 'analytics', label: 'Analytics & Growth', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        GROWTH<span>.</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button onClick={logout} className="btn-icon" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
