// src/App.jsx — Unified routing for the entire HemoLink app

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import Login          from './pages/auth/Login';
import Signup         from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Public emergency request page (sharable without login)
import PublicRequestView from './pages/public/PublicRequestView';

// Donor pages
import DonorDashboard from './pages/donor/DonorDashboard';
import DonorRequests  from './pages/donor/DonorRequests';
import DonorHistory   from './pages/donor/DonorHistory';
import DonorProfile   from './pages/donor/DonorProfile';

// Receiver pages
import ReceiverDashboard from './pages/receiver/ReceiverDashboard';
import SearchDonors      from './pages/receiver/SearchDonors';
import SendRequest       from './pages/receiver/SendRequest';
import MyRequests        from './pages/receiver/MyRequests';
import ReceiverProfile   from './pages/receiver/ReceiverProfile';

// Admin pages
import AdminLogin             from './pages/admin/AdminLogin';
import AdminDashboard         from './pages/admin/AdminDashboard';
import AdminUsers             from './pages/admin/AdminUsers';
import AdminDonors            from './pages/admin/AdminDonors';
import AdminReceivers         from './pages/admin/AdminReceivers';
import AdminBloodRequests     from './pages/admin/AdminBloodRequests';
import AdminEmergencyRequests from './pages/admin/AdminEmergencyRequests';
import AdminAnalytics         from './pages/admin/AdminAnalytics';
import AdminReports           from './pages/admin/AdminReports';
import AdminActivityLogs      from './pages/admin/AdminActivityLogs';
import AdminSettings          from './pages/admin/AdminSettings';

// Guards
import ProtectedRoute from './components/common/ProtectedRoute';

// ─── Root redirect based on auth state ────────────────────
function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return user?.role === 'donor'
    ? <Navigate to="/donor/dashboard"    replace />
    : <Navigate to="/receiver/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Routes (No authentication required) */}
      <Route path="/login"           element={<Login />} />
      <Route path="/signup"          element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/request/:id"     element={<PublicRequestView />} />
      <Route path="/admin/login"     element={<AdminLogin />} />

      {/* ── DONOR Protected Routes ── */}
      <Route element={<ProtectedRoute allowedRole="donor" />}>
        <Route path="/donor/dashboard" element={<DonorDashboard />} />
        <Route path="/donor/requests"  element={<DonorRequests />} />
        <Route path="/donor/history"   element={<DonorHistory />} />
        <Route path="/donor/profile"   element={<DonorProfile />} />
      </Route>

      {/* ── RECEIVER Protected Routes ── */}
      <Route element={<ProtectedRoute allowedRole="receiver" />}>
        <Route path="/receiver/dashboard" element={<ReceiverDashboard />} />
        <Route path="/receiver/donors"    element={<SearchDonors />} />
        <Route path="/receiver/request"   element={<SendRequest />} />
        <Route path="/receiver/requests"  element={<MyRequests />} />
        <Route path="/receiver/profile"   element={<ReceiverProfile />} />
      </Route>

      {/* ── ADMIN Protected Routes ── */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin"                    element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"          element={<AdminDashboard />} />
        <Route path="/admin/users"              element={<AdminUsers />} />
        <Route path="/admin/donors"             element={<AdminDonors />} />
        <Route path="/admin/receivers"          element={<AdminReceivers />} />
        <Route path="/admin/requests"           element={<AdminBloodRequests />} />
        <Route path="/admin/blood-requests"     element={<AdminBloodRequests />} />
        <Route path="/admin/emergency"          element={<AdminEmergencyRequests />} />
        <Route path="/admin/emergency-requests" element={<AdminEmergencyRequests />} />
        <Route path="/admin/analytics"          element={<AdminAnalytics />} />
        <Route path="/admin/reports"            element={<AdminReports />} />
        <Route path="/admin/activity-logs"      element={<AdminActivityLogs />} />
        <Route path="/admin/settings"           element={<AdminSettings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
