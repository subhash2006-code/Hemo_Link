// src/pages/auth/Login.jsx — Interactive, animated login with demo autofill & toast

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';
import { Badge } from '../../components/ui/Badge';
import { Sparkles } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const { login } = useAuth();
  const { addToast } = useToast();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingMultiRoleSession, setPendingMultiRoleSession] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSelectRole(chosenRole) {
    if (!pendingMultiRoleSession) return;
    setLoading(true);
    try {
      localStorage.setItem('hemolink_token', pendingMultiRoleSession.token);
      let sessionToken = pendingMultiRoleSession.token;
      let sessionUser  = {
        ...pendingMultiRoleSession.user,
        role: chosenRole,
        activeRole: chosenRole,
      };

      try {
        const switchRes = await authApi.switchRole(chosenRole);
        if (switchRes.token) {
          sessionToken = switchRes.token;
          sessionUser  = switchRes.user;
        }
      } catch (err) {
        console.warn('Switch role warning on login:', err);
      }

      login(sessionToken, sessionUser);
      addToast({
        title: `Welcome, ${sessionUser.full_name?.split(' ')[0]}!`,
        message: `Entered as ${chosenRole === 'donor' ? 'Blood Donor 🩸' : 'Receiver 🏥'}. You can switch anytime in the sidebar.`,
        type: 'success',
      });

      if (redirect) {
        navigate(redirect, { replace: true });
      } else if (chosenRole === 'donor') {
        navigate('/donor/dashboard', { replace: true });
      } else {
        navigate('/receiver/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    setLoading(true);
    try {
      const data = await authApi.login({ email: form.email, password: form.password });

      // If user has both donor and receiver roles, show "Continue as" selector
      if (data.hasMultipleRoles) {
        setPendingMultiRoleSession({ token: data.token, user: data.user });
        addToast({
          title: `Welcome back, ${data.user.full_name?.split(' ')[0]}!`,
          message: 'Choose your active role to continue.',
          type: 'info',
        });
        return;
      }

      login(data.token, data.user);
      addToast({
        title: `Welcome back, ${data.user.full_name?.split(' ')[0]}! 👋`,
        message: 'Logged in successfully.',
        type: 'success',
      });
      if (redirect) {
        navigate(redirect, { replace: true });
      } else if (data.user.role === 'admin' || (data.user.roles || []).includes('admin')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (data.user.activeRole === 'receiver' || data.user.role === 'receiver') {
        navigate('/receiver/dashboard', { replace: true });
      } else {
        navigate('/donor/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
      addToast({ title: 'Authentication Failed', message: err.message, type: 'error' });
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page auth-page--right">
      <div className="auth-card">
        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <Badge variant="glow" pulse pulseColor="red">
            ⚡ 100% Real-Time Donor Network
          </Badge>
        </div>

        {/* Logo & Headline */}
        <div className="auth-logo-wrap">
          <img src="/helpblood.png" alt="HemoLink" className="auth-logo" onError={e => { e.target.style.display='none'; }} />
          <h1 className="auth-brand"> HemoLink</h1>
        </div>

        {pendingMultiRoleSession ? (
          <div className="auth-multi-role-prompt">
            <h2 className="auth-title">Continue as</h2>
            <p className="auth-subtitle">
              Your account has access to both <strong>Donor</strong> and <strong>Receiver</strong> modes.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '24px 0 16px' }}>
              <button
                type="button"
                className="role-card role-card--active"
                onClick={() => handleSelectRole('donor')}
                disabled={loading}
                style={{ padding: '24px 14px', border: '2px solid #dc2626', background: '#fff' }}
              >
                <span className="role-icon" style={{ fontSize: 36 }}>🩸</span>
                <span className="role-name" style={{ fontSize: 16 }}>Donor</span>
                <span className="role-desc">Continue to Donor Dashboard</span>
              </button>

              <button
                type="button"
                className="role-card role-card--active"
                onClick={() => handleSelectRole('receiver')}
                disabled={loading}
                style={{ padding: '24px 14px', border: '2px solid #dc2626', background: '#fff' }}
              >
                <span className="role-icon" style={{ fontSize: 36 }}>🏥</span>
                <span className="role-name" style={{ fontSize: 16 }}>Receiver</span>
                <span className="role-desc">Continue to Receiver Dashboard</span>
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', margin: '14px 0 0' }}>
              💡 You can easily switch modes anytime from the sidebar without logging out.
            </p>

            <button
              type="button"
              onClick={() => setPendingMultiRoleSession(null)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                fontSize: 13,
                marginTop: 18,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Sign in with a different account
            </button>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Welcome Back, Hero</h2>
            <p className="auth-subtitle">Log in to save lives or find instant blood donors near you</p>

            {redirect && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.4 }}>
                <span>🩸</span>
                <span>Sign in to complete your blood donation offer. Your action will automatically resume right after!</span>
              </div>
            )}

            {error && <div className="auth-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="Enter your email" value={form.email}
                  onChange={e => set('email', e.target.value)} className="auth-input" required />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input type={showPwd ? 'text' : 'password'} placeholder="Enter your password"
                    value={form.password} onChange={e => set('password', e.target.value)}
                    className="auth-input" required />
                  <button type="button" className="eye-btn" onClick={() => setShowPwd(p => !p)}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="auth-options">
                <label className="remember-label">
                  <input type="checkbox" defaultChecked /> Remember Me
                </label>
                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'Authenticating...' : 'Log In to HemoLink →'}
              </button>
            </form>

            <p className="auth-switch">
              New to HemoLink? <Link to={`/signup?role=donor${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`}>Create an Account</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
