// src/pages/admin/AdminEmergencyRequests.jsx — Priority Emergency Operations Center
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Siren,
  Radio,
  Clock,
  MapPin,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export default function AdminEmergencyRequests() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(null);

  const fetchEmergency = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEmergencyRequests();
      setRequests(res.emergencyRequests || []);
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchEmergency();
  }, [fetchEmergency]);

  async function handleBroadcast(id, hospital) {
    setBroadcasting(id);
    try {
      const res = await adminApi.broadcastEmergency(id);
      addToast({
        title: 'Emergency Broadcast Sent! 🚨',
        message: res.message || `Dispatched alerts to donors for ${hospital}`,
        type: 'success',
      });
    } catch (err) {
      addToast({ title: 'Broadcast Failed', message: err.message, type: 'error' });
    } finally {
      setBroadcasting(null);
    }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', letterSpacing: '0.1em' }}>
              CRITICAL RESPONSE CENTER
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '2px 0 4px', color: '#0f172a' }}>
            Emergency Requests
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Live critical and high-urgency hospital requests requiring immediate donor dispatch.
          </p>
        </div>

        <button className="admin-btn-refresh" onClick={fetchEmergency} disabled={loading}>
          <RotateCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh Feed
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          Loading emergency board...
        </div>
      ) : requests.length === 0 ? (
        <div className="admin-card" style={{ padding: '48px', textAlign: 'center' }}>
          <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a' }}>All Clear!</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            There are currently no active critical blood emergencies in the network.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {requests.map((r) => (
            <div
              key={r.id}
              className="admin-card"
              style={{
                padding: '20px',
                borderLeft: `4px solid ${r.urgency === 'Critical' ? '#dc2626' : '#ea580c'}`,
                marginBottom: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span className="blood-pill" style={{ fontSize: 14, padding: '3px 12px' }}>
                    {r.blood_group}
                  </span>
                  <span
                    className={`badge-urgency badge-urgency--${r.urgency.toLowerCase()}`}
                    style={{ marginLeft: 8 }}
                  >
                    {r.urgency}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{r.code}</span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                {r.hospital}
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {r.city}
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <span>
                  Needed: <strong>{r.units_needed}</strong>
                </span>
                <span>
                  Status: <strong>{r.status}</strong>
                </span>
              </div>

              {r.additional_note && (
                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px', background: '#fff1f2', padding: 8, borderRadius: 6 }}>
                  {r.additional_note}
                </p>
              )}

              {r.document_url && (
                <div style={{ marginBottom: 16 }}>
                  <a
                    href={r.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <ExternalLink size={13} /> View Verified Prescription Document
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                <button
                  className="admin-action-btn-red"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => handleBroadcast(r.id, r.hospital)}
                  disabled={broadcasting === r.id}
                >
                  <Radio size={15} />
                  {broadcasting === r.id ? 'Broadcasting...' : 'Broadcast to Donors'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
