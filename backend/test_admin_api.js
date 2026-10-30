// test_admin_api.js — Comprehensive test suite for HemoLink Admin Panel
const http = require('http');
const app = require('./server');
const { connectDB, mongoose } = require('./config/db');

async function runAdminTests() {
  await connectDB();
  const server = http.createServer(app);
  await new Promise(res => server.listen(5002, res));
  console.log('Admin test server listening on port 5002');

  const BASE = 'http://localhost:5002';

  async function api(path, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    console.log('\n========================================');
    console.log('🧪 RUNNING ADMIN PANEL TEST SUITE');
    console.log('========================================\n');

    // 1. Test Signup Security: Disallow self-registration as admin
    console.log('--- 1. Testing Registration Guard (Self-admin forbidden) ---');
    const signupAdminRes = await api('/api/auth/signup', 'POST', {
      full_name: 'Hacker Admin',
      email: 'hacker@test.com',
      password: 'Password@123',
      role: 'admin',
    });
    assert(signupAdminRes.status === 400, 'Attempting to signup with role=admin is rejected with 400');

    // 2. Log in as Donor and Receiver
    console.log('\n--- 2. Getting Donor & Receiver Tokens ---');
    const donorLogin = await api('/api/auth/login', 'POST', { email: 'donor@test.com', password: 'Test@1234' });
    const donorToken = donorLogin.data.token;
    assert(donorLogin.status === 200, 'Donor login successful');

    const receiverLogin = await api('/api/auth/login', 'POST', { email: 'receiver@test.com', password: 'Test@1234' });
    const receiverToken = receiverLogin.data.token;
    assert(receiverLogin.status === 200, 'Receiver login successful');

    // 3. Security Tests: Non-admins blocked from Admin APIs
    console.log('\n--- 3. Testing Role Authorization Guards on Admin APIs ---');
    const unauthRes = await api('/api/admin/dashboard');
    assert(unauthRes.status === 401, 'Unauthenticated access to /api/admin/dashboard rejected with 401');

    const donorAccessRes = await api('/api/admin/dashboard', 'GET', null, donorToken);
    assert(donorAccessRes.status === 403, 'Donor access to /api/admin/dashboard rejected with 403 Forbidden');

    const receiverAccessRes = await api('/api/admin/dashboard', 'GET', null, receiverToken);
    assert(receiverAccessRes.status === 403, 'Receiver access to /api/admin/dashboard rejected with 403 Forbidden');

    // 4. Admin Authentication
    console.log('\n--- 4. Testing Admin Login ---');
    const adminLogin = await api('/api/auth/login', 'POST', { email: 'admin@hemolink.com', password: 'Admin@12345' });
    assert(adminLogin.status === 200, 'Admin login successful');
    assert(adminLogin.data.user?.role === 'admin', 'Admin user role is "admin"');
    assert(adminLogin.data.user?.profileComplete === true, 'Admin profileComplete is true by default');
    const adminToken = adminLogin.data.token;

    // 5. Admin Dashboard Data
    console.log('\n--- 5. Testing Admin Dashboard Endpoint (/api/admin/dashboard) ---');
    const dashRes = await api('/api/admin/dashboard', 'GET', null, adminToken);
    assert(dashRes.status === 200, 'Admin dashboard returns 200 OK');
    assert(dashRes.data.stats?.totalUsers?.value >= 3, `Stats totalUsers reflects real database count (${dashRes.data.stats?.totalUsers?.value})`);
    assert(Array.isArray(dashRes.data.activeBloodRequests), 'Dashboard includes activeBloodRequests array');
    assert(Array.isArray(dashRes.data.emergencyRequests), 'Dashboard includes emergencyRequests array');
    assert(Array.isArray(dashRes.data.recentUsers), 'Dashboard includes recentUsers array');

    // 6. Users Management
    console.log('\n--- 6. Testing Users Management (/api/admin/users) ---');
    const usersRes = await api('/api/admin/users', 'GET', null, adminToken);
    assert(usersRes.status === 200, 'Get users returns 200 OK');
    assert(usersRes.data.users?.length >= 3, 'Users list populated with users from DB');

    const targetUser = usersRes.data.users.find(u => u.role !== 'admin');
    if (targetUser) {
      console.log(`\n--- 7. Testing User Status Toggle (/api/admin/users/${targetUser.id}/status) ---`);
      const blockRes = await api(`/api/admin/users/${targetUser.id}/status`, 'PATCH', { status: 'Blocked' }, adminToken);
      assert(blockRes.status === 200, `Successfully blocked user ${targetUser.email}`);

      // Verify blocked user cannot log in
      const blockedLogin = await api('/api/auth/login', 'POST', { email: targetUser.email, password: 'Test@1234' });
      assert(blockedLogin.status === 403, 'Blocked user is forbidden from logging in (403)');

      // Unblock user
      const unblockRes = await api(`/api/admin/users/${targetUser.id}/status`, 'PATCH', { status: 'Active' }, adminToken);
      assert(unblockRes.status === 200, `Successfully re-activated user ${targetUser.email}`);
    }

    // 8. Donors & Receivers Management
    console.log('\n--- 8. Testing Donors and Receivers Management ---');
    const donorsRes = await api('/api/admin/donors', 'GET', null, adminToken);
    assert(donorsRes.status === 200, 'Get donors returns 200 OK');
    assert(donorsRes.data.donors?.length >= 1, `Donors directory returns donors (${donorsRes.data.donors?.length})`);

    const receiversRes = await api('/api/admin/receivers', 'GET', null, adminToken);
    assert(receiversRes.status === 200, 'Get receivers returns 200 OK');
    assert(receiversRes.data.receivers?.length >= 1, `Receivers directory returns receivers (${receiversRes.data.receivers?.length})`);

    // 9. Blood Requests Management
    console.log('\n--- 9. Testing Blood Requests Management ---');
    const requestsRes = await api('/api/admin/blood-requests', 'GET', null, adminToken);
    assert(requestsRes.status === 200, 'Get blood requests returns 200 OK');
    assert(requestsRes.data.requests?.length >= 1, 'Requests list populated');

    const sampleReq = requestsRes.data.requests[0];
    if (sampleReq) {
      const updateStatusRes = await api(`/api/admin/blood-requests/${sampleReq.id}/status`, 'PATCH', { status: 'Fulfilled' }, adminToken);
      assert(updateStatusRes.status === 200, 'Admin can update blood request status to Fulfilled');
    }

    // 10. Emergency Requests Management
    console.log('\n--- 10. Testing Emergency Requests Management ---');
    const emergencyRes = await api('/api/admin/emergency-requests', 'GET', null, adminToken);
    assert(emergencyRes.status === 200, 'Get emergency requests returns 200 OK');

    if (sampleReq) {
      const broadcastRes = await api(`/api/admin/emergency-requests/${sampleReq.id}/broadcast`, 'POST', null, adminToken);
      assert(broadcastRes.status === 200, 'Emergency broadcast triggered successfully');
    }

    // 11. Analytics & Reports
    console.log('\n--- 11. Testing Analytics & Reports ---');
    const analyticsRes = await api('/api/admin/analytics', 'GET', null, adminToken);
    assert(analyticsRes.status === 200, 'Analytics data returns 200 OK');
    assert(Array.isArray(analyticsRes.data.supplyDemand), 'Analytics includes supplyDemand array');

    const reportsRes = await api('/api/admin/reports', 'GET', null, adminToken);
    assert(reportsRes.status === 200, 'Reports summary returns 200 OK');
    assert(reportsRes.data.metrics?.totalUsers !== undefined, 'Reports includes totalUsers metric');

    // 12. Activity Logs
    console.log('\n--- 12. Testing Activity Logs ---');
    const logsRes = await api('/api/admin/logs', 'GET', null, adminToken);
    assert(logsRes.status === 200, 'Activity logs return 200 OK');
    assert(logsRes.data.logs?.length > 0, `Audit trail recorded admin actions (${logsRes.data.logs?.length} logs)`);

    // 13. System Settings
    console.log('\n--- 13. Testing System Settings ---');
    const settingsRes = await api('/api/admin/settings', 'GET', null, adminToken);
    assert(settingsRes.status === 200, 'System settings return 200 OK');

    const updateSettingsRes = await api('/api/admin/settings', 'PUT', { emergency_search_radius_km: 35 }, adminToken);
    assert(updateSettingsRes.status === 200, 'Admin can update platform settings');

    console.log('\n========================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    server.close();
    await mongoose.disconnect();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAdminTests();
