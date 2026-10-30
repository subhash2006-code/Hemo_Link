// src/pages/admin/AdminDashboard.jsx — Official HemoLink Admin Dashboard
// Faithfully matches the Admin Dashboard design reference with real database data

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import {
  Users,
  Droplet,
  UserCheck,
  Heart,
  Activity,
  Siren,
  RotateCw,
  ArrowRight,
  Eye,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Modal detail item

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await adminApi.getDashboardData();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = data?.stats || {
    totalUsers: { value: '—', change: '+12% from last month' },
    totalDonors: { value: '—', change: '+8% from last month' },
    totalReceivers: { value: '—', change: '+4% from last month' },
    totalDonations: { value: '—', change: '+18% from last month' },
    activeDonors: { value: '—', change: '+10% from last month' },
    emergencyRequests: { value: '—', change: '+3% from last month' },
  };

  const activeRequests = data?.activeBloodRequests || [];
  const emergencyRequests = data?.emergencyRequests || [];
  const recentUsers = data?.recentUsers || [];

  return (
    <AdminLayout>
      {/* ── 1. Top Quote Banner ── */}
      <div className="admin-quote-banner">
        <div>
          <h2 className="admin-quote-title">
            "A single pint of blood can save up to three lives. Your generosity rewrites stories."
          </h2>
          <p className="admin-quote-subtitle">
            Monitor and manage the HemoLink blood donation network.
          </p>
        </div>
        <img
          src="/hemolink-logo-transparent.png"
          alt="HemoLink"
          className="admin-quote-art"
        />
      </div>

      {/* ── 2. Admin Command Center Welcome ── */}
      <div className="admin-welcome-section">
        <div className="admin-eyebrow">ADMIN COMMAND CENTER</div>
        <h1 className="admin-welcome-title">
          Welcome back, Admin! <span>👋</span>
        </h1>
        <p className="admin-welcome-subtitle">
          Here's an overview of the HemoLink blood donation network.
        </p>
      </div>

      {/* ── 3. 6 Stats Cards Grid ── */}
      <div className="admin-stats-grid">
        {/* Card 1: Total Users */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap">
            <Users size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Total Users</p>
            <p className="admin-stat-num">{stats.totalUsers.value}</p>
            <p className="admin-stat-trend">↑ {stats.totalUsers.change}</p>
          </div>
        </div>

        {/* Card 2: Total Donors */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap">
            <Droplet size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Total Donors</p>
            <p className="admin-stat-num">{stats.totalDonors.value}</p>
            <p className="admin-stat-trend">↑ {stats.totalDonors.change}</p>
          </div>
        </div>

        {/* Card 3: Total Receivers */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Total Receivers</p>
            <p className="admin-stat-num">{stats.totalReceivers.value}</p>
            <p className="admin-stat-trend">↑ {stats.totalReceivers.change}</p>
          </div>
        </div>

        {/* Card 4: Total Donations */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap">
            <Heart size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Total Donations</p>
            <p className="admin-stat-num">{stats.totalDonations.value}</p>
            <p className="admin-stat-trend">↑ {stats.totalDonations.change}</p>
          </div>
        </div>

        {/* Card 5: Active Donors */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap">
            <Activity size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Active Donors</p>
            <p className="admin-stat-num">{stats.activeDonors.value}</p>
            <p className="admin-stat-trend">↑ {stats.activeDonors.change}</p>
          </div>
        </div>

        {/* Card 6: Emergency Requests */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap">
            <Siren size={22} />
          </div>
          <div>
            <p className="admin-stat-label">Emergency Requests</p>
            <p className="admin-stat-num">{stats.emergencyRequests.value}</p>
            <p className="admin-stat-trend">↑ {stats.emergencyRequests.change}</p>
          </div>
        </div>
      </div>

      {/* ── 4. Active Blood Requests Table ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <div className="admin-card-header-icon">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="admin-card-title">Active Blood Requests</h3>
              <p className="admin-card-subtitle">List of currently active blood requests from patients in need.</p>
            </div>
          </div>
          <div className="admin-card-actions">
            <button
              className="admin-btn-refresh"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
            >
              <RotateCw size={14} className={refreshing ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
            <Link to="/admin/blood-requests" className="admin-card-view-all">
              View All Requests <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Blood Group</th>
                <th>Hospital</th>
                <th>City</th>
                <th>Units Needed</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    {loading ? 'Loading active blood requests...' : 'No active blood requests currently found.'}
                  </td>
                </tr>
              ) : (
                activeRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600, color: '#475569' }}>{req.code}</td>
                    <td>
                      <span className="blood-pill">{req.blood_group}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{req.hospital}</td>
                    <td style={{ color: '#64748b' }}>{req.city}</td>
                    <td>{req.units_needed}</td>
                    <td>
                      <span className={`badge-urgency badge-urgency--${req.urgency.toLowerCase()}`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td>
                      <span className="badge-status badge-status--active">{req.status}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{req.date}</td>
                    <td>
                      <button
                        className="admin-action-btn-red"
                        onClick={() => setSelectedItem({ type: 'request', data: req })}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Emergency Requests Table ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <div className="admin-card-header-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <Siren size={18} />
            </div>
            <div>
              <h3 className="admin-card-title">Emergency Requests</h3>
              <p className="admin-card-subtitle">Critical blood requests that need immediate attention.</p>
            </div>
          </div>
          <div className="admin-card-actions">
            <button
              className="admin-btn-refresh"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
            >
              <RotateCw size={14} className={refreshing ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
            <Link to="/admin/emergency-requests" className="admin-card-view-all">
              View All Requests <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Blood Group</th>
                <th>Hospital</th>
                <th>City</th>
                <th>Units Needed</th>
                <th>Time</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {emergencyRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    {loading ? 'Loading emergency requests...' : 'No critical emergency requests currently active.'}
                  </td>
                </tr>
              ) : (
                emergencyRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600, color: '#475569' }}>{req.code}</td>
                    <td>
                      <span className="blood-pill">{req.blood_group}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{req.hospital}</td>
                    <td style={{ color: '#64748b' }}>{req.city}</td>
                    <td>{req.units_needed}</td>
                    <td style={{ fontWeight: 600, color: '#dc2626' }}>{req.time}</td>
                    <td>
                      <span className="badge-status badge-status--active">{req.status}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{req.date}</td>
                    <td>
                      <button
                        className="admin-action-btn-red"
                        onClick={() => setSelectedItem({ type: 'request', data: req })}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Recent Users Table ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <div className="admin-card-header-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <Users size={18} />
            </div>
            <div>
              <h3 className="admin-card-title">Recent Users</h3>
              <p className="admin-card-subtitle">Recently registered users on HemoLink.</p>
            </div>
          </div>
          <div className="admin-card-actions">
            <Link to="/admin/users" className="admin-card-view-all">
              View All Users <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Blood Group</th>
                <th>City</th>
                <th>Status</th>
                <th>Joined On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    {loading ? 'Loading recent users...' : 'No users registered yet.'}
                  </td>
                </tr>
              ) : (
                recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-initials">{u.initials}</div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{u.email}</td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: u.rawRole === 'donor' ? '#dc2626' : u.rawRole === 'admin' ? '#9333ea' : '#2563eb',
                          background: u.rawRole === 'donor' ? '#fef2f2' : u.rawRole === 'admin' ? '#faf5ff' : '#eff6ff',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.blood_group !== '—' ? (
                        <span className="blood-pill">{u.blood_group}</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: '#64748b' }}>{u.city}</td>
                    <td>
                      <span
                        className={`badge-status ${
                          u.status === 'Active' ? 'badge-status--active' : 'badge-status--blocked'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{u.joined_on}</td>
                    <td>
                      <button
                        className="admin-action-icon-btn"
                        title="View user details"
                        onClick={() => setSelectedItem({ type: 'user', data: u })}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Item Detail Modal (View Request or User) ── */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              <X size={20} />
            </button>

            {selectedItem.type === 'request' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span className="blood-pill" style={{ fontSize: 14, padding: '4px 12px' }}>
                    {selectedItem.data.blood_group}
                  </span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                      {selectedItem.data.hospital}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                      {selectedItem.data.city} • {selectedItem.data.code}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    background: '#f8fafc',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>Units Needed:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{selectedItem.data.units_needed}</p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Urgency:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#dc2626' }}>
                      {selectedItem.data.urgency}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Status:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#059669' }}>
                      {selectedItem.data.status}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Patient / Requester:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600 }}>
                      {selectedItem.data.receiverName || 'Anonymous Patient'}
                    </p>
                  </div>
                </div>

                {selectedItem.data.document_url && (
                  <div style={{ marginBottom: 16 }}>
                    <a
                      href={selectedItem.data.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#dc2626',
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={15} /> View Attached Medical Prescription Document
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button
                    className="admin-btn-refresh"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close
                  </button>
                  <Link
                    to={`/admin/blood-requests`}
                    className="admin-action-btn-red"
                    style={{ textDecoration: 'none' }}
                  >
                    Manage Request
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div
                    className="admin-avatar-circle"
                    style={{ width: 48, height: 48, fontSize: 18 }}
                  >
                    {selectedItem.data.initials}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                      {selectedItem.data.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                      {selectedItem.data.email}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: 16,
                    borderRadius: 8,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>Role:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{selectedItem.data.role}</p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Blood Group:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600 }}>
                      {selectedItem.data.blood_group}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>City:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{selectedItem.data.city}</p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Status:</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{selectedItem.data.status}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="admin-btn-refresh" onClick={() => setSelectedItem(null)}>
                    Close
                  </button>
                  <Link
                    to={`/admin/users`}
                    className="admin-action-btn-red"
                    style={{ textDecoration: 'none' }}
                  >
                    View in Users Directory
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
