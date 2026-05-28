import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Trophy, 
  Landmark, 
  TrendingUp, 
  Settings, 
  LogOut, 
  X, 
  User, 
  Scale, 
  Sparkles 
} from 'lucide-react';

const MenuDrawer = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const secondaryNavItems = [
    { id: 'strategist', label: 'Study Strategist', icon: BookOpen, desc: 'AI Roadmaps & Study Plans' },
    { id: 'competitive', label: 'Competitive Arena', icon: Trophy, desc: 'Duels, Leaderboards & Pokes' },
    { id: 'finance', label: 'Finance Planner', icon: Landmark, desc: 'Expense Logging & Analytics' },
    { id: 'analytics', label: 'Analytics & Charts', icon: TrendingUp, desc: 'ML Productivity Forecasts' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Profile & Key Configurations' },
  ];

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;


  return (
    <div className="menu-drawer-backdrop" onClick={onClose}>
      <div className="menu-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <Sparkles size={16} className="title-icon" />
            <span>Growth Menu</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Personal Profile Section */}
        {user && (
          <div className="drawer-profile-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {user.name ? user.name[0].toUpperCase() : <User size={20} />}
              </div>
              <div className="profile-badge">Active</div>
            </div>
            <div className="profile-meta">
              <h3 className="profile-name">{user.name || 'User'}</h3>
              <p className="profile-email">{user.email || 'No email associated'}</p>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="stat-label">Height</span>
                <span className="stat-value">{user.height ? `${user.height} cm` : 'Not Set'}</span>
              </div>
              <div className="profile-stat-box">
                <span className="stat-label">Target Weight</span>
                <span className="stat-value">{user.targetWeight ? `${user.targetWeight} kg` : 'Not Set'}</span>
              </div>
              <div className="profile-stat-box">
                <span className="stat-label">Gender</span>
                <span className="stat-value" style={{ textTransform: 'capitalize' }}>{user.gender || 'Other'}</span>
              </div>
            </div>
            
            {user.ultimateGoal && user.ultimateGoal.title && (
              <div className="drawer-goal-box">
                <span className="goal-label">Ultimate Goal</span>
                <p className="goal-title">"{user.ultimateGoal.title}"</p>
              </div>
            )}
          </div>
        )}

        <hr className="drawer-divider" />

        {/* Secondary Navigation Items */}
        <div className="drawer-nav">
          <span className="nav-section-title">Additional Features</span>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
              >
                <div className="nav-item-icon-wrapper">
                  <Icon size={18} />
                </div>
                <div className="nav-item-text">
                  <span className="nav-item-label">{item.label}</span>
                  <span className="nav-item-desc">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer / Logout */}
        <div className="drawer-footer">
          <button 
            className="drawer-logout-btn" 
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuDrawer;
