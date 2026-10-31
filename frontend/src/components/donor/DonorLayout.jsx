// src/components/donor/DonorLayout.jsx — Sidebar layout for donor pages

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './DonorLayout.css';

const NAV_LINKS = [
  { to: '/donor/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/donor/requests',  icon: '📋', label: 'Blood Requests' },
  { to: '/donor/history',   icon: '📜', label: 'My History' },
  { to: '/donor/profile',   icon: '👤', label: 'Profile' },
];

export default function DonorLayout({ children }) {
  const { user, logout, switchRole, addRole, roles } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleSwitchToReceiver() {
    try {
      await switchRole('receiver');
      navigate('/receiver/dashboard');
    } catch (err) {
      console.error('Role switch error:', err);
    }
  }

  async function handleEnableReceiver() {
    if (window.confirm('Enable Receiver capabilities on this account? You will be able to search donors and post blood requests using the same account.')) {
      try {
        await addRole('receiver');
        navigate('/receiver/dashboard');
      } catch (err) {
        alert(err.message || 'Error adding receiver role.');
      }
    }
  }

  return (
    <div className="dl-shell">
      {/* ── Sidebar ── */}
      <aside className={`dl-sidebar ${sidebarOpen ? 'dl-sidebar--open' : ''}`}>
        <div className="dl-brand">
          <div className="dl-logo">
            <img src="/logo-icon1.png" alt="HemoLink" className="dl-logo-img" />
            <span>Hemo<span className="dl-logo-accent">Link</span></span>
          </div>
          <span className="dl-role-badge">Donor</span>
        </div>

        <nav className="dl-nav">
          {NAV_LINKS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `dl-link ${isActive ? 'dl-link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span className="dl-link-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Role Switcher / Add Role ── */}
        <div style={{ padding: '0 12px 14px' }}>
          {(roles || []).includes('receiver') ? (
            <button
              type="button"
              onClick={handleSwitchToReceiver}
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
              <span>🔄</span> Switch to Receiver Mode
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnableReceiver}
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
              <span>➕</span> Enable Receiver Mode
            </button>
          )}
        </div>

        <div className="dl-user">
          <div className="dl-avatar">{user?.full_name?.charAt(0) || 'D'}</div>
          <div className="dl-user-info">
            <p className="dl-user-name">{user?.full_name}</p>
            <p className="dl-user-email">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="dl-logout" title="Logout">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && <div className="dl-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <main className="dl-main">
        <div className="dl-topbar">
          <button className="dl-hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <h1 className="dl-topbar-title">🩸 HemoLink</h1>
        </div>
        <div className="dl-page">{children}</div>
      </main>
    </div>
  );
}
