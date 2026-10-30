// src/pages/admin/AdminDonors.jsx — Dedicated Donor Directory & Management
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Droplet, Search, Filter, Phone, MapPin, Award, CheckCircle, XCircle } from 'lucide-react';

const BLOOD_GROUPS = ['all', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function AdminDonors() {
  const { addToast } = useToast();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroup, setBloodGroup] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [search, setSearch] = useState('');

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDonors({
        blood_group: bloodGroup,
        is_available: availability,
        search,
      });
      setDonors(res.donors || []);
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [bloodGroup, availability, search, addToast]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
          Donors Directory
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Manage registered blood donors, check real-time availability, and track total lives saved.
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
            placeholder="Search donors by name, city, phone..."
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
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Blood Groups</option>
            {BLOOD_GROUPS.filter((b) => b !== 'all').map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Availability</option>
            <option value="true">Available Now</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Donors Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Blood Group</th>
                <th>Availability</th>
                <th>Total Donations</th>
                <th>City / Location</th>
                <th>Contact Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Loading donors...
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No donors matching filter criteria.
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-initials" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          <Droplet size={14} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{d.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="blood-pill">{d.blood_group}</span>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          d.is_available ? 'badge-status--active' : 'badge-status--pending'
                        }`}
                      >
                        {d.is_available ? '🟢 Ready to Donate' : '⚪ Unavailable'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#0f172a' }}>
                        <Award size={14} color="#dc2626" /> {d.total_donations} donations
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                        <MapPin size={13} /> {d.city || '—'} {d.state ? `, ${d.state}` : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 12 }}>
                        <Phone size={13} /> {d.phone || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          d.status === 'Active' ? 'badge-status--active' : 'badge-status--blocked'
                        }`}
                      >
                        {d.status}
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
