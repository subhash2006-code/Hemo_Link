// routes/admin.routes.js
// Protected router strictly guarded by verifyToken and requireAdmin

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// Apply JWT authentication & role=admin guard to ALL routes in this file
router.use(verifyToken, requireAdmin);

// ─── Dashboard & Statistics ───
router.get('/dashboard', adminController.getDashboardData);
router.get('/stats',     adminController.getStats);

// ─── User Management ───
router.get('/users',             adminController.getUsers);
router.get('/users/:id',         adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id',      adminController.deleteUser);
router.post('/create-admin',     adminController.createAdminUser);

// ─── Donors & Receivers ───
router.get('/donors',    adminController.getDonors);
router.get('/receivers', adminController.getReceivers);

// ─── Blood Requests ───
router.get('/blood-requests',             adminController.getBloodRequests);
router.get('/blood-requests/:id',         adminController.getBloodRequestById);
router.patch('/blood-requests/:id/status', adminController.updateBloodRequestStatus);
router.delete('/blood-requests/:id',      adminController.deleteBloodRequest);

// ─── Emergency Requests ───
router.get('/emergency-requests',               adminController.getEmergencyRequests);
router.post('/emergency-requests/:id/broadcast', adminController.broadcastEmergency);

// ─── Analytics & Reports ───
router.get('/analytics', adminController.getAnalytics);
router.get('/reports',   adminController.getReports);

// ─── Activity Logs ───
router.get('/logs', adminController.getActivityLogs);

// ─── System Settings ───
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
