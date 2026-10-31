// src/context/AuthContext.jsx
// Global auth state: JWT token, user info, role, profileComplete flag

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // { id, full_name, email, role, roles, activeRole, profileComplete }
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);   // true on first load (reading localStorage)

  // ── Restore session on page refresh ──────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('hemolink_token');
    const savedUser  = localStorage.getItem('hemolink_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('hemolink_token');
        localStorage.removeItem('hemolink_user');
      }
    }
    setLoading(false);
  }, []);

  // ── Login: save token + user to state and localStorage ───
  const login = useCallback((tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem('hemolink_token', tokenValue);
    localStorage.setItem('hemolink_user',  JSON.stringify(userData));
  }, []);

  // ── Update user (e.g. after profile completion) ───────────
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('hemolink_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Switch Active Role (without logging out) ──────────────
  const switchRole = useCallback(async (targetRole) => {
    const res = await authApi.switchRole(targetRole);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('hemolink_token', res.token);
      localStorage.setItem('hemolink_user',  JSON.stringify(res.user));
    }
    return res;
  }, []);

  // ── Add New Role to Account ───────────────────────────────
  const addRole = useCallback(async (newRole) => {
    const res = await authApi.addRole(newRole);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('hemolink_token', res.token);
      localStorage.setItem('hemolink_user',  JSON.stringify(res.user));
    }
    return res;
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hemolink_token');
    localStorage.removeItem('hemolink_user');
  }, []);

  const isAuthenticated   = Boolean(token && user);
  const roles             = Array.isArray(user?.roles) && user.roles.length > 0
    ? user.roles
    : (user?.role ? [user.role] : []);
  const activeRole        = user?.activeRole || user?.role || 'donor';
  const isDonor           = activeRole === 'donor';
  const isReceiver        = activeRole === 'receiver';
  const isAdmin           = roles.includes('admin') || user?.role === 'admin';
  const hasMultipleRoles  = roles.includes('donor') && roles.includes('receiver');
  const profileComplete   = user?.profileComplete ?? false;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated, isDonor, isReceiver, isAdmin, profileComplete,
      roles, activeRole, hasMultipleRoles,
      login, logout, updateUser, switchRole, addRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — use this everywhere instead of importing AuthContext directly
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
