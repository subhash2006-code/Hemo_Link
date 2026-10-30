// src/pages/admin/AdminUsers.jsx — User Management Page
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Eye,
  X,
  CheckCircle,
} from 'lucide-react';

export default function AdminUsers() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ full_name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(res.users || []);
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleToggleStatus(userId, currentStatus) {
    const nextStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    try {
      await adminApi.updateUserStatus(userId, nextStatus);
      addToast({
        title: 'Status Updated',
        message: `User is now ${nextStatus}`,
        type: 'success',
      });
      fetchUsers();
    } catch (err) {
      addToast({ title: 'Failed', message: err.message, type: 'error' });
    }
  }

  async function handleDeleteUser(userId, name) {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(userId);
      addToast({ title: 'User Deleted', message: `User ${name} removed`, type: 'success' });
      fetchUsers();
    } catch (err) {
      addToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createAdmin(newAdmin);
      addToast({ title: 'Admin Created', message: 'New administrator added successfully!', type: 'success' });
      setShowAddModal(false);
      setNewAdmin({ full_name: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      addToast({ title: 'Failed to Create Admin', message: err.message, type: 'error' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
            Users Management
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Oversee and control all donors, receivers, and administrators on HemoLink.
          </p>
        </div>
        <button
          className="admin-action-btn-red"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setShowAddModal(true)}
        >
          <UserPlus size={16} /> Add Administrator
        </button>
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
            placeholder="Search by name or email..."
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Roles</option>
            <option value="donor">Donors</option>
            <option value="receiver">Receivers</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Blood Group</th>
                <th>City</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initial = u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-initials">{initial}</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600 }}>{u.full_name}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: u.role === 'donor' ? '#dc2626' : u.role === 'admin' ? '#9333ea' : '#2563eb',
                            background: u.role === 'donor' ? '#fef2f2' : u.role === 'admin' ? '#faf5ff' : '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: 6,
                            textTransform: 'capitalize',
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
                      <td style={{ color: '#64748b', fontSize: 12 }}>{u.phone}</td>
                      <td>
                        <span
                          className={`badge-status ${
                            u.status === 'Active' ? 'badge-status--active' : 'badge-status--blocked'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="admin-action-icon-btn"
                            title="View Full Profile"
                            onClick={() => setSelectedUser(u)}
                          >
                            <Eye size={15} />
                          </button>
                          {u.role !== 'admin' && (
                            <>
                              <button
                                className="admin-action-icon-btn"
                                title={u.status === 'Active' ? 'Block User' : 'Activate User'}
                                onClick={() => handleToggleStatus(u.id, u.status)}
                                style={{
                                  color: u.status === 'Active' ? '#ea580c' : '#16a34a',
                                }}
                              >
                                {u.status === 'Active' ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
                              </button>
                              <button
                                className="admin-action-icon-btn"
                                title="Delete User"
                                onClick={() => handleDeleteUser(u.id, u.full_name)}
                                style={{ color: '#dc2626' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View User Modal ── */}
      {selectedUser && (
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
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              maxWidth: 500,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#94a3b8" />
            </button>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              {selectedUser.full_name}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
              <div><span style={{ color: '#64748b' }}>Email:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedUser.email}</p></div>
              <div><span style={{ color: '#64748b' }}>Role:</span><p style={{ margin: '2px 0', fontWeight: 600, textTransform: 'capitalize' }}>{selectedUser.role}</p></div>
              <div><span style={{ color: '#64748b' }}>Blood Group:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedUser.blood_group}</p></div>
              <div><span style={{ color: '#64748b' }}>Phone:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedUser.phone}</p></div>
              <div><span style={{ color: '#64748b' }}>City:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedUser.city}</p></div>
              <div><span style={{ color: '#64748b' }}>Status:</span><p style={{ margin: '2px 0', fontWeight: 600 }}>{selectedUser.status}</p></div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="admin-btn-refresh" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Administrator Modal ── */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              maxWidth: 460,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#94a3b8" />
            </button>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>
              Create New Administrator
            </h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>
              Only existing administrators can provision new admin access.
            </p>

            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Subhash Admin"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@hemolink.org"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  minLength={6}
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="admin-btn-refresh" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn-red" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
