import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Brain, 
  CheckSquare
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'mindset', label: 'Companion', icon: Brain },
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
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

