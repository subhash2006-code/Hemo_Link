// src/components/receiver/ReceiverLayout.jsx — Sidebar layout for receiver pages

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ReceiverLayout.css';

const NAV_LINKS = [
  { to: '/receiver/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/receiver/donors',    icon: '🩸', label: 'Search Donors' },
  { to: '/receiver/request',   icon: '➕', label: 'New Request' },
  { to: '/receiver/requests',  icon: '📋', label: 'My Requests' },
  { to: '/receiver/profile',   icon: '👤', label: 'Profile' },
];

export default function ReceiverLayout({ children }) {
  const { user, logout, switchRole, addRole, roles } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleSwitchToDonor() {
    try {
      await switchRole('donor');
      navigate('/donor/dashboard');
    } catch (err) {
      console.error('Role switch error:', err);
    }
  }

  async function handleEnableDonor() {
    if (window.confirm('Enable Donor capabilities on this account? You will be able to register blood donation details and respond to requests with the same account.')) {
      try {
        await addRole('donor');
        navigate('/donor/dashboard');
      } catch (err) {
        alert(err.message || 'Error adding donor role.');
      }
    }
  }

  return (
    <div className="rl-shell">
      <aside className={`rl-sidebar ${sidebarOpen ? 'rl-sidebar--open' : ''}`}>
        <div className="rl-brand">
          <div className="rl-logo">
            <img src="/logo-icon.png" alt="HemoLink" className="rl-logo-img" />
            <span>Hemo<span className="rl-logo-accent">Link</span></span>
          </div>
          <span className="rl-role-badge">Receiver</span>
        </div>

        <nav className="rl-nav">
          {NAV_LINKS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rl-link ${isActive ? 'rl-link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span className="rl-link-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Role Switcher / Add Role ── */}
        <div style={{ padding: '0 12px 14px' }}>
          {(roles || []).includes('donor') ? (
            <button
              type="button"
              onClick={handleSwitchToDonor}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid rgba(220, 38, 38, 0.4)',
                background: 'rgba(220, 38, 38, 0.08)',
                color: '#b91c1c',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span>🔄</span> Switch to Donor Mode
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnableDonor}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px dashed #d1d5db',
                background: '#f9fafb',
                color: '#4b5563',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <span>➕</span> Enable Donor Mode
            </button>
          )}
        </div>

        <div className="rl-user">
          <div className="rl-avatar">{user?.full_name?.charAt(0) || 'R'}</div>
          <div className="rl-user-info">
            <p className="rl-user-name">{user?.full_name}</p>
            <p className="rl-user-email">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="rl-logout" title="Logout">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="rl-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="rl-main">
        <div className="rl-topbar">
          <button className="rl-hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <h1 className="rl-topbar-title">🩸 HemoLink</h1>
        </div>
        <div className="rl-page">{children}</div>
      </main>
    </div>
  );
}
