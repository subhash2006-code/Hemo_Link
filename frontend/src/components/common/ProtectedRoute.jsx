// src/components/common/ProtectedRoute.jsx
// Guards routes — redirects to /login if not authenticated
// Enforces strict, compulsory profile completion before accessing platform

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ExtraDetailsModal from './ExtraDetailsModal';

export default function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, user, loading, profileComplete } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: 12, color: '#9ca3af' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (allowedRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const userRoles = Array.isArray(user?.roles) && user?.roles.length > 0
    ? user.roles
    : [user?.role || 'donor'];

  // Role verification
  if (allowedRole) {
    if (allowedRole === 'admin') {
      if (!userRoles.includes('admin')) {
        let redirect = user.role === 'donor' ? '/donor/dashboard' : '/receiver/dashboard';
        return <Navigate to={redirect} replace />;
      }
    } else {
      if (!userRoles.includes(allowedRole)) {
        let redirect = '/receiver/dashboard';
        if (userRoles.includes('admin')) redirect = '/admin/dashboard';
        else if (userRoles.includes('donor')) redirect = '/donor/dashboard';
        return <Navigate to={redirect} replace />;
      }
    }
  }

  return (
    <>
      {!profileComplete && user.role !== 'admin' && <ExtraDetailsModal isStrict={true} />}
      <Outlet />
    </>
  );
}
