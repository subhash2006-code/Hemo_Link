// src/pages/admin/AdminSettings.jsx — System Settings & Admin Preferences
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Settings, Save, Shield, Bell, Radio, Wrench, Mail, Phone } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    platform_name: 'HemoLink Blood Donation Network',
    emergency_auto_broadcast: true,
    emergency_search_radius_km: 25,
    email_alerts_enabled: true,
    require_donor_verification: true,
    maintenance_mode: false,
    support_email: 'support@hemolink.org',
    support_phone: '+91 98765 43210',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getSettings();
        if (res.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      addToast({ title: 'Settings Saved', message: 'Platform configurations updated successfully!', type: 'success' });
    } catch (err) {
      addToast({ title: 'Save Failed', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
          System Settings
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Configure emergency dispatch automation, alert radius, notification rules, and admin parameters.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Platform Settings Form */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} color="#dc2626" /> Emergency & Dispatch Rules
          </h2>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                <span>Auto-Broadcast Urgent Requests</span>
                <input
                  type="checkbox"
                  checked={settings.emergency_auto_broadcast}
                  onChange={(e) => setSettings({ ...settings, emergency_auto_broadcast: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#dc2626' }}
                />
              </label>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                Automatically notifies all compatible donors in the city when a Critical urgency request is placed.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Donor Match Radius (km)
              </label>
              <input
                type="number"
                min={5}
                max={150}
                value={settings.emergency_search_radius_km}
                onChange={(e) => setSettings({ ...settings, emergency_search_radius_km: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                <span>Email Alerts (Brevo Integration)</span>
                <input
                  type="checkbox"
                  checked={settings.email_alerts_enabled}
                  onChange={(e) => setSettings({ ...settings, email_alerts_enabled: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#dc2626' }}
                />
              </label>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                Deliver real-time transactional emails when donor matches or responses are recorded.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                <span>Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#dc2626' }}
                />
              </label>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                Temporarily pause new public registrations during scheduled system maintenance.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Support Email
              </label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Support Helpline Phone
              </label>
              <input
                type="text"
                value={settings.support_phone}
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
            </div>

            <button type="submit" className="admin-action-btn-red" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Current Admin Account Card */}
        <div>
          <div className="admin-card" style={{ padding: '24px', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="#dc2626" /> Active Administrator
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div className="admin-avatar-circle" style={{ width: 48, height: 48, fontSize: 18 }}>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{user?.full_name || 'Admin'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Role:</span>
                <span style={{ fontWeight: 700, color: '#9333ea' }}>admin (Full Platform Access)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Authorization:</span>
                <span style={{ fontWeight: 600 }}>Bearer JWT Token (Server-Protected)</span>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ padding: '20px', background: '#fff1f2', border: '1px solid #fecdd3' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#991b1b' }}>
              🛡️ Security & Role Integrity
            </h4>
            <p style={{ margin: 0, fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.5 }}>
              All administrative routes under <code>/api/admin/*</code> and frontend pages under <code>/admin/*</code> are protected server-side and client-side. Regular donors, receivers, and unauthenticated visitors cannot access or register as administrators.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
