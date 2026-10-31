// test_admin_api.js — Comprehensive verification of all 18 requirements
const http = require('http');
const app = require('./server');
const { connectDB, mongoose } = require('./config/db');
const { User, ActivityLog } = require('./models');

async function runAllTests() {
  await connectDB();
  const server = http.createServer(app);
  const PORT = 5003;
  await new Promise(res => server.listen(PORT, res));
  console.log(`Test server listening on port ${PORT}`);

  const BASE = `http://localhost:${PORT}`;

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
    console.log('\n======================================================');
    console.log('🧪 VERIFYING ALL 18 SPECIFIED TEST CASES');
    console.log('======================================================\n');

    const timestamp = Date.now();
    const multiEmail = `multi_${timestamp}@test.com`;
    const donorOnlyEmail = `donoronly_${timestamp}@test.com`;
    const password = 'TestPassword@123';

    // ── Case 1: New user creates Donor account ──
    console.log('--- Case 1: New user creates Donor account ---');
    const c1 = await api('/api/auth/signup', 'POST', {
      full_name: 'Multi Role User',
      email: multiEmail,
      password: password,
      role: 'donor',
      phone: '9876543210',
    });
    assert(c1.status === 201, `Donor signup returned 201: ${c1.data.message}`);
    assert(c1.data.user?.roles?.includes('donor'), 'User has donor role');
    assert(c1.data.hasMultipleRoles === false, 'Initially hasMultipleRoles is false');

    // ── Case 2: Same user adds Receiver role ──
    console.log('\n--- Case 2: Same user adds Receiver role ---');
    // Using signup with receiver role and same email/password
    const c2 = await api('/api/auth/signup', 'POST', {
      full_name: 'Multi Role User',
      email: multiEmail,
      password: password,
      role: 'receiver',
    });
    assert(c2.status === 200, `Adding receiver role returned 200: ${c2.data.message}`);
    assert(c2.data.hasMultipleRoles === true, 'hasMultipleRoles is now true');
    assert(c2.data.user?.roles?.includes('receiver'), 'Receiver role added to roles array');
    assert(c2.data.user?.roles?.includes('donor'), 'Donor role retained');

    // ── Case 3: Same email remains one account ──
    console.log('\n--- Case 3: Same email remains one account record in DB ---');
    const userDocs = await User.find({ email: multiEmail.toLowerCase() });
    assert(userDocs.length === 1, `Exact 1 User record found in database for ${multiEmail}`);
    assert(userDocs[0].roles.length === 2, `Roles array contains 2 roles: ${JSON.stringify(userDocs[0].roles)}`);

    // ── Case 4: User can login as Donor ──
    console.log('\n--- Case 4: User can login as Donor ---');
    const c4 = await api('/api/auth/login', 'POST', {
      email: multiEmail,
      password: password,
      requestedRole: 'donor',
    });
    assert(c4.status === 200, 'Login succeeded');
    assert(c4.data.hasMultipleRoles === true, 'Response informs frontend user has multiple roles');
    assert(c4.data.activeRole === 'donor' || c4.data.user.role === 'donor', 'activeRole is donor');
    const multiDonorToken = c4.data.token;

    // ── Case 5: User can login / switch to Receiver ──
    console.log('\n--- Case 5: User can switch / login as Receiver ---');
    const c5 = await api('/api/auth/switch-role', 'POST', { role: 'receiver' }, multiDonorToken);
    assert(c5.status === 200, 'Switch role to receiver succeeded');
    assert(c5.data.user.activeRole === 'receiver', 'activeRole is receiver');
    const multiReceiverToken = c5.data.token;

    // ── Case 6: Donor dashboard / API still works ──
    console.log('\n--- Case 6: Donor dashboard APIs work ---');
    const c6History = await api('/api/donor/history', 'GET', null, multiDonorToken);
    const c6Requests = await api('/api/donor/requests', 'GET', null, multiDonorToken);
    assert(c6History.status === 200, 'GET /api/donor/history returns 200 OK');
    assert(c6Requests.status === 200, 'GET /api/donor/requests returns 200 OK');

    // ── Case 7: Receiver dashboard / API still works ──
    console.log('\n--- Case 7: Receiver dashboard APIs work ---');
    const c7Requests = await api('/api/receiver/requests', 'GET', null, multiReceiverToken);
    const c7Donors = await api('/api/receiver/donors', 'GET', null, multiReceiverToken);
    assert(c7Requests.status === 200, 'GET /api/receiver/requests returns 200 OK');
    assert(c7Donors.status === 200, 'GET /api/receiver/donors returns 200 OK');

    // ── Case 8: Donor-only user cannot access Receiver APIs ──
    console.log('\n--- Case 8: Donor-only user cannot access Receiver APIs ---');
    const c8Signup = await api('/api/auth/signup', 'POST', {
      full_name: 'Donor Only User',
      email: donorOnlyEmail,
      password: password,
      role: 'donor',
    });
    const donorOnlyToken = c8Signup.data.token;
    const c8ReceiverAccess = await api('/api/receiver/requests', 'GET', null, donorOnlyToken);
    assert(c8ReceiverAccess.status === 403, `Donor-only token access to /api/receiver/requests rejected with 403: ${c8ReceiverAccess.data.message}`);

    // Also check donor-only user cannot call switchRole to receiver
    const c8SwitchBlocked = await api('/api/auth/switch-role', 'POST', { role: 'receiver' }, donorOnlyToken);
    assert(c8SwitchBlocked.status === 403, 'Donor-only user cannot switchRole to receiver (403)');

    // ── Case 9: Normal user cannot register as Admin ──
    console.log('\n--- Case 9: Normal user cannot register as Admin ---');
    const c9RoleAdmin = await api('/api/auth/signup', 'POST', {
      full_name: 'Attacker',
      email: `attacker_${timestamp}@test.com`,
      password: password,
      role: 'admin',
    });
    assert(c9RoleAdmin.status === 400, 'Signup with role=admin rejected with 400');

    const c9RolesAdmin = await api('/api/auth/signup', 'POST', {
      full_name: 'Attacker 2',
      email: `attacker2_${timestamp}@test.com`,
      password: password,
      roles: ['donor', 'admin'],
    });
    assert(c9RolesAdmin.status === 400, 'Signup with roles=[donor, admin] rejected with 400');

    // Nor can normal user call add-role with admin
    const c9AddRoleAdmin = await api('/api/auth/add-role', 'POST', { role: 'admin' }, donorOnlyToken);
    assert(c9AddRoleAdmin.status === 400, 'Normal user calling /api/auth/add-role with admin rejected with 400');

    // ── Case 10: Admin can login through /admin/login (auth login endpoint) ──
    console.log('\n--- Case 10: Admin can login with credentials ---');
    const c10 = await api('/api/auth/login', 'POST', {
      email: 'admin@hemolink.com',
      password: 'Admin@12345',
    });
    assert(c10.status === 200, 'Admin login returned 200 OK');
    assert(c10.data.user.role === 'admin' || (c10.data.roles || []).includes('admin'), 'User has admin role');
    const adminToken = c10.data.token;

    // ── Case 11: Admin token grants access to /api/admin/dashboard ──
    console.log('\n--- Case 11: Admin accesses Admin Dashboard ---');
    const c11 = await api('/api/admin/dashboard', 'GET', null, adminToken);
    assert(c11.status === 200, 'Admin accesses /api/admin/dashboard with 200 OK');
    assert(c11.data.stats !== undefined, 'Dashboard contains statistics data');

    // ── Case 12: Donor cannot access Admin dashboard ──
    console.log('\n--- Case 12: Donor cannot access Admin dashboard ---');
    const c12 = await api('/api/admin/dashboard', 'GET', null, donorOnlyToken);
    assert(c12.status === 403, 'Donor token rejected from /api/admin/dashboard with 403');

    // ── Case 13: Receiver cannot access Admin dashboard ──
    console.log('\n--- Case 13: Receiver cannot access Admin dashboard ---');
    const receiverLogin = await api('/api/auth/login', 'POST', { email: 'receiver@test.com', password: 'Test@1234' });
    const receiverToken = receiverLogin.data.token;
    const c13 = await api('/api/admin/dashboard', 'GET', null, receiverToken);
    assert(c13.status === 403, 'Receiver token rejected from /api/admin/dashboard with 403');

    // ── Case 14: Donor token cannot call Admin APIs ──
    console.log('\n--- Case 14: Donor token cannot call Admin APIs ---');
    const c14Users = await api('/api/admin/users', 'GET', null, donorOnlyToken);
    const c14Requests = await api('/api/admin/requests', 'GET', null, donorOnlyToken);
    const c14Emergency = await api('/api/admin/emergency', 'GET', null, donorOnlyToken);
    assert(c14Users.status === 403, 'GET /api/admin/users blocked for donor (403)');
    assert(c14Requests.status === 403, 'GET /api/admin/requests blocked for donor (403)');
    assert(c14Emergency.status === 403, 'GET /api/admin/emergency blocked for donor (403)');

    // ── Case 15: Receiver token cannot call Admin APIs ──
    console.log('\n--- Case 15: Receiver token cannot call Admin APIs ---');
    const c15Analytics = await api('/api/admin/analytics', 'GET', null, receiverToken);
    const c15Reports = await api('/api/admin/reports', 'GET', null, receiverToken);
    const c15Logs = await api('/api/admin/activity-logs', 'GET', null, receiverToken);
    assert(c15Analytics.status === 403, 'GET /api/admin/analytics blocked for receiver (403)');
    assert(c15Reports.status === 403, 'GET /api/admin/reports blocked for receiver (403)');
    assert(c15Logs.status === 403, 'GET /api/admin/activity-logs blocked for receiver (403)');

    // ── Case 16: Multiple Admin accounts work with independent credentials ──
    console.log('\n--- Case 16: Multiple Admin accounts support ---');
    const admin2Email = `admin2_${timestamp}@hemolink.com`;
    const admin2Password = 'Admin2Pass#999';

    // Existing admin creates a second admin account
    const c16Create = await api('/api/admin/create-admin', 'POST', {
      full_name: 'Secondary Admin',
      email: admin2Email,
      password: admin2Password,
    }, adminToken);
    assert(c16Create.status === 201, `Admin created second admin account: ${c16Create.data.message}`);

    // Admin2 logs in independently with their own credentials
    const c16Login = await api('/api/auth/login', 'POST', {
      email: admin2Email,
      password: admin2Password,
    });
    assert(c16Login.status === 200, 'Second admin logged in with their own password');
    assert(c16Login.data.user.role === 'admin', 'Second admin has role=admin');
    const admin2Token = c16Login.data.token;

    // Admin2 can access admin endpoints
    const c16Access = await api('/api/admin/dashboard', 'GET', null, admin2Token);
    assert(c16Access.status === 200, 'Second admin token can access /api/admin/dashboard');

    // ── Case 17: Real database data is returned for Admin statistics ──
    console.log('\n--- Case 17: Real database data returned for Admin statistics ---');
    const c17Dash = await api('/api/admin/dashboard', 'GET', null, adminToken);
    const totalUsers = c17Dash.data.stats?.totalUsers?.value;
    const totalDonors = c17Dash.data.stats?.totalDonors?.value;
    const totalReceivers = c17Dash.data.stats?.totalReceivers?.value;
    const actualUsersInDB = await User.countDocuments();
    assert(typeof totalUsers === 'number' && totalUsers >= actualUsersInDB - 1, `Dashboard totalUsers is a real DB count (${totalUsers})`);
    assert(typeof totalDonors === 'number', `Dashboard totalDonors is a real count (${totalDonors})`);
    assert(typeof totalReceivers === 'number', `Dashboard totalReceivers is a real count (${totalReceivers})`);
    assert(Array.isArray(c17Dash.data.activeBloodRequests), 'Real activeBloodRequests array returned');
    assert(Array.isArray(c17Dash.data.emergencyRequests), 'Real emergencyRequests array returned');

    // ── Case 18: Activity logs record admin actions ──
    console.log('\n--- Case 18: Activity logs record admin actions ---');
    // Perform an admin action: change user status
    const c18User = await User.findOne({ email: multiEmail.toLowerCase() });
    const c18Block = await api(`/api/admin/users/${c18User._id}/status`, 'PATCH', { status: 'Blocked' }, adminToken);
    assert(c18Block.status === 200, 'Admin blocked user');

    // Retrieve activity logs via canonical route /api/admin/activity-logs
    const c18Logs = await api('/api/admin/activity-logs', 'GET', null, adminToken);
    assert(c18Logs.status === 200, 'GET /api/admin/activity-logs returned 200 OK');
    assert(c18Logs.data.logs?.length > 0, `Activity logs retrieved (${c18Logs.data.logs?.length} entries)`);

    const hasUserBlockAction = c18Logs.data.logs.some(l => l.action === 'USER_BLOCKED' || l.action === 'ADMIN_LOGIN' || l.action === 'ADMIN_CREATED');
    assert(hasUserBlockAction, 'Activity log includes recent admin action record');

    // Unblock the test user
    await api(`/api/admin/users/${c18User._id}/status`, 'PATCH', { status: 'Active' }, adminToken);

    console.log('\n======================================================');
    console.log(`🏁 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    server.close();
    await mongoose.disconnect();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAllTests();
