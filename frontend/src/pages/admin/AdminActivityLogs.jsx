// src/pages/admin/AdminActivityLogs.jsx — Activity Logs & Audit Trail
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Clock, Search, Filter, Shield, Activity, User, Globe } from 'lucide-react';

export default function AdminActivityLogs() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getActivityLogs({
        action: actionFilter,
        search,
      });
      setLogs(res.logs || []);
    } catch (err) {
      addToast({ title: 'Failed to load logs', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [actionFilter, search, addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function getActionBadge(action) {
    if (action.includes('LOGIN')) {
      return { bg: '#eff6ff', color: '#2563eb' };
    }
    if (action.includes('BLOCKED') || action.includes('DELETED')) {
      return { bg: '#fef2f2', color: '#dc2626' };
    }
    if (action.includes('ACTIVATED') || action.includes('CREATED')) {
      return { bg: '#ecfdf5', color: '#059669' };
    }
    if (action.includes('BROADCAST')) {
      return { bg: '#fff7ed', color: '#ea580c' };
    }
    return { bg: '#f1f5f9', color: '#475569' };
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
          Activity Logs
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Immutable administrative audit trail tracking logins, status changes, alerts, and system operations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="admin-card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search logs by actor, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={15} color="#64748b" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Actions</option>
            <option value="ADMIN_LOGIN">Admin Logins</option>
            <option value="USER_BLOCKED">User Blocked</option>
            <option value="USER_ACTIVATED">User Activated</option>
            <option value="REQUEST_STATUS_UPDATED">Request Updates</option>
            <option value="EMERGENCY_BROADCAST_TRIGGERED">Emergency Broadcasts</option>
            <option value="SETTINGS_UPDATED">Settings Updated</option>
          </select>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target Area</th>
                <th>Details</th>
                <th>IP / Origin</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const badge = getActionBadge(l.action);
                  return (
                    <tr key={l.id}>
                      <td>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {l.action}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{l.actor}</p>
                          {l.email && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{l.email}</p>}
                        </div>
                      </td>
                      <td style={{ color: '#475569', fontWeight: 500 }}>{l.target}</td>
                      <td style={{ color: '#1e293b' }}>{l.details}</td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>{l.ip || 'Local/Cloud'}</td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
