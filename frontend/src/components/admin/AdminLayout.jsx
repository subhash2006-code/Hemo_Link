// src/components/admin/AdminLayout.jsx — Professional Dark Red/Black Admin Layout

import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Droplet,
  HeartHandshake,
  ClipboardList,
  Siren,
  BarChart3,
  FileSpreadsheet,
  Clock,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import './AdminLayout.css';

const ADMIN_LINKS = [
  { to: '/admin/dashboard',         label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/admin/users',             label: 'Users',          icon: Users },
  { to: '/admin/donors',            label: 'Donors',         icon: Droplet },
  { to: '/admin/receivers',         label: 'Receivers',      icon: HeartHandshake },
  { to: '/admin/blood-requests',    label: 'Blood Requests', icon: ClipboardList },
  { to: '/admin/emergency-requests',label: 'Emergency',      icon: Siren },
  { to: '/admin/analytics',         label: 'Analytics',      icon: BarChart3 },
  { to: '/admin/reports',           label: 'Reports',        icon: FileSpreadsheet },
  { to: '/admin/activity-logs',     label: 'Activity Logs',  icon: Clock },
  { to: '/admin/settings',          label: 'Settings',       icon: Settings },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  function handleSearchSubmit(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="admin-shell">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Dark Red/Black Sidebar ── */}
      <aside className={`admin-sidebar ${mobileOpen ? 'admin-sidebar--open' : ''}`}>
        {/* Branding */}
        <div className="admin-brand">
          <NavLink to="/admin/dashboard" className="admin-brand-top" onClick={() => setMobileOpen(false)}>
            <img
              src="/hemolink-logo-transparent.png"
              alt="HemoLink Official Logo"
              className="admin-logo-img"
            />
            <span className="admin-brand-name">HemoLink</span>
          </NavLink>
          <span className="admin-badge">ADMIN</span>
        </div>

        {/* Navigation links */}
        <nav className="admin-nav">
          {ADMIN_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="admin-nav-icon">
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer User Profile Card */}
        <div className="admin-user-box">
          <div className="admin-avatar-circle">{initial}</div>
          <div className="admin-user-details">
            <p className="admin-user-name">{user?.full_name || 'Admin'}</p>
            <p className="admin-user-role">System Administrator</p>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main Layout Body ── */}
      <div className="admin-main-wrap">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="admin-search-box">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search users, requests, hospitals, donors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
              />
            </div>
          </div>

          <div className="admin-header-right">
            {/* Notification Bell */}
            <button
              className="admin-notif-btn"
              title="Emergency Notifications"
              onClick={() => navigate('/admin/emergency-requests')}
            >
              <Bell size={18} />
              <span className="admin-notif-dot">2</span>
            </button>

            {/* Profile Menu */}
            <div
              className="admin-header-profile"
              onClick={() => setUserDropdown(!userDropdown)}
            >
              <div className="admin-avatar-circle" style={{ width: 32, height: 32, fontSize: 13 }}>
                {initial}
              </div>
              <div className="admin-profile-meta">
                <p className="admin-profile-name">{user?.full_name || 'Admin'}</p>
                <p className="admin-profile-role">System Administrator</p>
              </div>
              <ChevronDown size={14} color="#64748b" />

              {userDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    width: 180,
                    padding: '6px 0',
                    zIndex: 60,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      padding: '8px 16px',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#334155',
                    }}
                    onClick={() => {
                      setUserDropdown(false);
                      navigate('/admin/settings');
                    }}
                  >
                    <Settings size={15} /> Settings
                  </div>
                  <div
                    style={{
                      padding: '8px 16px',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#dc2626',
                      borderTop: '1px solid #f1f5f9',
                    }}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} /> Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
}
