import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Box, 
  Cpu, 
  Network, 
  LineChart, 
  FileText, 
  LogOut,
  User,
  Search
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/sandboxes', label: 'Sandboxes', icon: <Box size={18} /> },
  { to: '/processes', label: 'Processes', icon: <Cpu size={18} /> },
  { to: '/network', label: 'Network', icon: <Network size={18} /> },
  { to: '/analytics', label: 'Analytics', icon: <LineChart size={18} /> },
  { to: '/reports', label: 'Reports', icon: <FileText size={18} /> },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={28} className="text-primary" />
            <div>
              <h1>MBS</h1>
              <p>Malware Behavior Sandbox</p>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Analysis</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {item.icon} <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-info">
              <div className="user-name">{user?.username || 'Analyst'}</div>
              <div className="user-role">{user?.role || 'Security Analyst'}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon-text" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="topbar">
          <div className="search-bar" style={{ width: 400 }}>
             <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
             <input type="text" placeholder="Search sessions, hashes, or IP addresses..." />
          </div>
          <div className="topbar-actions">
            <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }}></div>
               Engine Online
            </div>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}