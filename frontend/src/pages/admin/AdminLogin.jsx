// src/pages/admin/AdminLogin.jsx — Dedicated Admin Portal Login
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';
import { Shield, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function fillDemoAdmin() {
    setForm({ email: 'admin@hemolink.com', password: 'Admin@12345' });
    addToast({ title: 'Admin Demo Loaded 🛡️', message: 'Credentials autofilled' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({
        email: form.email,
        password: form.password,
      });

      const userRoles = Array.isArray(data.user?.roles) && data.user.roles.length > 0
        ? data.user.roles
        : [data.user?.role].filter(Boolean);

      if (!userRoles.includes('admin')) {
        throw new Error('Access restricted to System Administrators. Authorized personnel only.');
      }

      login(data.token, data.user);
      addToast({
        title: `Welcome, Administrator ${data.user.full_name?.split(' ')[0]}! 🛡️`,
        message: 'Authenticated successfully into Admin Command Center.',
        type: 'success',
      });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      addToast({ title: 'Authentication Failed', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Branding */}
        <div className="admin-login-brand">
          <img
            src="/hemolink-logo-transparent.png"
            alt="HemoLink Logo"
            className="admin-login-logo"
          />
          <h1 className="admin-login-title">HemoLink</h1>
          <div className="admin-login-badge">
            <Shield size={12} />
            <span>ADMINISTRATOR COMMAND CENTER</span>
          </div>
        </div>

        <p className="admin-login-subtitle">
          Authorized personnel only. Enter your administrative credentials.
        </p>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label>Admin Email</label>
            <div className="admin-input-wrap">
              <Mail size={16} className="admin-input-icon" />
              <input
                type="email"
                required
                placeholder="admin@hemolink.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label>Master Password</label>
            <div className="admin-input-wrap">
              <Lock size={16} className="admin-input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="admin-login-submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Command Center'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Demo Login */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            type="button"
            onClick={fillDemoAdmin}
            style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px dashed #ef4444',
              color: '#f87171',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={14} /> 1-Click Fill Admin Demo
          </button>
        </div>

        <div className="admin-login-footer">
          <Link to="/login" className="admin-back-link">
            ← Return to Member Login
          </Link>
        </div>
      </div>
    </div>
  );
}
