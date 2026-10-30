// src/pages/admin/AdminBloodRequests.jsx — Blood Requests Management Page
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ClipboardList,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Radio,
} from 'lucide-react';

export default function AdminBloodRequests() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBloodRequests({
        status: statusFilter,
        urgency: urgencyFilter,
        search,
      });
      setRequests(res.requests || []);
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter, search, addToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleUpdateStatus(id, newStatus) {
    try {
      await adminApi.updateBloodRequestStatus(id, newStatus);
      addToast({ title: 'Status Updated', message: `Request set to ${newStatus}`, type: 'success' });
      fetchRequests();
      if (selectedReq) setSelectedReq(null);
    } catch (err) {
      addToast({ title: 'Update Failed', message: err.message, type: 'error' });
    }
  }

  async function handleDelete(id, code) {
    if (!window.confirm(`Are you sure you want to delete blood request ${code}?`)) return;
    try {
      await adminApi.deleteBloodRequest(id);
      addToast({ title: 'Deleted', message: `Request ${code} deleted`, type: 'success' });
      fetchRequests();
    } catch (err) {
      addToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
          Blood Requests
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Monitor, verify prescriptions, update fulfillment status, and resolve patient blood needs.
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
            placeholder="Search by hospital, city..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Urgency</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Blood Group</th>
                <th>Hospital</th>
                <th>City</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Responses</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Loading blood requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No blood requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: '#475569' }}>{r.code}</td>
                    <td>
                      <span className="blood-pill">{r.blood_group}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.hospital_name}</td>
                    <td style={{ color: '#64748b' }}>{r.city}</td>
                    <td>{r.units_needed} units</td>
                    <td>
                      <span className={`badge-urgency badge-urgency--${r.urgency.toLowerCase()}`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          r.status === 'Open'
                            ? 'badge-status--active'
                            : r.status === 'Fulfilled'
                            ? 'badge-status--fulfilled'
                            : 'badge-status--cancelled'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {r.responses_count} donors
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          className="admin-action-icon-btn"
                          title="View Request Details"
                          onClick={() => setSelectedReq(r)}
                        >
                          <Eye size={15} />
                        </button>
                        {r.status === 'Open' && (
                          <button
                            className="admin-action-icon-btn"
                            title="Mark Fulfilled"
                            onClick={() => handleUpdateStatus(r.id, 'Fulfilled')}
                            style={{ color: '#059669' }}
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        <button
                          className="admin-action-icon-btn"
                          title="Delete Request"
                          onClick={() => handleDelete(r.id, r.code)}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View/Manage Request Modal ── */}
      {selectedReq && (
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
          onClick={() => setSelectedReq(null)}
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
              onClick={() => setSelectedReq(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#94a3b8" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span className="blood-pill" style={{ fontSize: 16, padding: '4px 14px' }}>
                {selectedReq.blood_group}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedReq.hospital_name}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{selectedReq.city} • {selectedReq.code}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              <div><span style={{ color: '#64748b' }}>Urgency:</span><p style={{ margin: '2px 0', fontWeight: 600, color: '#dc2626' }}>{selectedReq.urgency}</p></div>
              <div><span style={{ color: '#64748b' }}>Units Needed:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedReq.units_needed} units</p></div>
              <div><span style={{ color: '#64748b' }}>Current Status:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedReq.status}</p></div>
              <div><span style={{ color: '#64748b' }}>Patient / Receiver:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedReq.receiver?.name || 'Receiver'}</p></div>
            </div>

            {selectedReq.additional_note && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 16 }}>
                <strong>Note:</strong> {selectedReq.additional_note}
              </div>
            )}

            {selectedReq.document_url && (
              <div style={{ marginBottom: 20 }}>
                <a
                  href={selectedReq.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                >
                  <ExternalLink size={15} /> View Attached Medical Prescription
                </a>
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedReq.status !== 'Fulfilled' && (
                  <button
                    className="admin-action-btn-red"
                    style={{ background: '#059669' }}
                    onClick={() => handleUpdateStatus(selectedReq.id, 'Fulfilled')}
                  >
                    Mark Fulfilled
                  </button>
                )}
                {selectedReq.status !== 'Cancelled' && (
                  <button
                    className="admin-btn-refresh"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleUpdateStatus(selectedReq.id, 'Cancelled')}
                  >
                    Cancel Request
                  </button>
                )}
              </div>
              <button className="admin-btn-refresh" onClick={() => setSelectedReq(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
