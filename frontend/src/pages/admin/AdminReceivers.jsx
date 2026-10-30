// src/pages/admin/AdminReceivers.jsx — Dedicated Receiver Directory & Management
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { HeartHandshake, Search, Phone, MapPin, ClipboardList } from 'lucide-react';

export default function AdminReceivers() {
  const { addToast } = useToast();
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReceivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReceivers({ search });
      setReceivers(res.receivers || []);
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    fetchReceivers();
  }, [fetchReceivers]);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
          Receivers Directory
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Manage patients, hospitals, and receivers requesting blood donations across HemoLink.
        </p>
      </div>

      {/* Search Bar */}
      <div className="admin-card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 400 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search receivers by name, city, phone..."
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
      </div>

      {/* Receivers Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Receiver</th>
                <th>Blood Group</th>
                <th>Requests Posted</th>
                <th>City / Address</th>
                <th>Contact Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Loading receivers...
                  </td>
                </tr>
              ) : receivers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No receivers found.
                  </td>
                </tr>
              ) : (
                receivers.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-initials" style={{ background: '#eff6ff', color: '#2563eb' }}>
                          <HeartHandshake size={14} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{r.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {r.blood_group !== '—' ? (
                        <span className="blood-pill">{r.blood_group}</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#2563eb' }}>
                        <ClipboardList size={14} /> {r.total_requests} requests
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                        <MapPin size={13} /> {r.city || '—'} {r.address ? `(${r.address})` : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 12 }}>
                        <Phone size={13} /> {r.phone || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          r.status === 'Active' ? 'badge-status--active' : 'badge-status--blocked'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
