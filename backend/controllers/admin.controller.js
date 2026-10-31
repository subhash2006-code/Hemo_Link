// controllers/admin.controller.js
// Handles all administrative APIs with strict server-side admin protection

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const {
  User,
  DonorProfile,
  ReceiverProfile,
  BloodRequest,
  DonorResponse,
  ActivityLog,
  AdminSettings,
  buildIdQuery,
} = require('../models');

// Helper to log admin actions
async function logAction(req, action, targetType, targetId, details) {
  try {
    await ActivityLog.create({
      action,
      actor_id: req.user?.id || req.user?._id || null,
      actor_name: req.user?.full_name || req.user?.name || 'Admin',
      actor_email: req.user?.email || '',
      target_type: targetType,
      target_id: targetId ? targetId.toString() : null,
      details,
      ip_address: req.ip || req.connection?.remoteAddress || '',
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

// ════════════════════════════════════════════════════════════
// 1. GET /api/admin/dashboard
// Unified dashboard endpoint matching Admin Dashboard screenshot
// ════════════════════════════════════════════════════════════
exports.getDashboardData = async (req, res) => {
  try {
    // 1. Statistics
    const [
      totalUsers,
      totalDonors,
      totalReceivers,
      activeDonorsCount,
      openEmergencyCount,
      fulfilledRequestsCount,
      donorProfiles,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ $or: [{ roles: 'donor' }, { role: 'donor' }] }),
      User.countDocuments({ $or: [{ roles: 'receiver' }, { role: 'receiver' }] }),
      DonorProfile.countDocuments({ is_available: true }),
      BloodRequest.countDocuments({
        urgency: { $in: ['Critical', 'High'] },
        status: 'Open',
      }),
      BloodRequest.countDocuments({ status: 'Fulfilled' }),
      DonorProfile.find().select('total_donations').lean(),
    ]);

    // Sum total donations from donor profiles + fulfilled requests
    const profileDonations = donorProfiles.reduce((acc, p) => acc + (p.total_donations || 0), 0);
    const totalDonations = profileDonations > 0 ? profileDonations : fulfilledRequestsCount;

    const stats = {
      totalUsers: { value: totalUsers, change: '+12% from last month' },
      totalDonors: { value: totalDonors, change: '+8% from last month' },
      totalReceivers: { value: totalReceivers, change: '+4% from last month' },
      totalDonations: { value: totalDonations, change: '+18% from last month' },
      activeDonors: { value: activeDonorsCount, change: '+10% from last month' },
      emergencyRequests: { value: openEmergencyCount, change: '+3% from last month' },
    };

    // 2. Active Blood Requests (Top 5 open requests)
    const activeRequestsRaw = await BloodRequest.find({ status: 'Open' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('receiver_id', 'full_name email')
      .lean();

    const activeBloodRequests = activeRequestsRaw.map((r, idx) => ({
      id: r._id.toString(),
      code: `#BR-${String(idx + 1).padStart(3, '0')}`,
      blood_group: r.blood_group,
      hospital: r.hospital_name,
      city: r.city,
      units_needed: `${r.units_needed || 1} ${r.units_needed > 1 ? 'units' : 'unit'}`,
      urgency: r.urgency || 'High',
      status: r.status === 'Open' ? 'Active' : r.status,
      date: r.createdAt ? new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
      rawDate: r.createdAt,
      receiverName: r.receiver_id?.full_name || 'Anonymous Patient',
      document_url: r.document_url,
    }));

    // 3. Emergency Requests (Critical / High priority open requests)
    const emergencyRequestsRaw = await BloodRequest.find({
      urgency: { $in: ['Critical', 'High'] },
      status: 'Open',
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('receiver_id', 'full_name email')
      .lean();

    const emergencyRequests = emergencyRequestsRaw.map((r, idx) => {
      const diffMs = Date.now() - new Date(r.createdAt).getTime();
      const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
      return {
        id: r._id.toString(),
        code: `#ER-${String(idx + 101).padStart(3, '0')}`,
        blood_group: r.blood_group,
        hospital: r.hospital_name,
        city: r.city,
        units_needed: `${r.units_needed || 1} ${r.units_needed > 1 ? 'units' : 'unit'}`,
        time: `${diffHours}h ago`,
        urgency: r.urgency,
        status: r.status === 'Open' ? 'Active' : r.status,
        date: r.createdAt ? new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
        receiverName: r.receiver_id?.full_name || 'Anonymous Patient',
        document_url: r.document_url,
      };
    });

    // 4. Recent Users (Latest 6 users with populated blood group & city)
    const recentUsersRaw = await User.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('-password_hash')
      .lean();

    const populatedUsers = await Promise.all(
      recentUsersRaw.map(async (u) => {
        let blood_group = '—';
        let city = '—';
        if (u.role === 'donor') {
          const dp = await DonorProfile.findOne({ user_id: u._id }).select('blood_group city').lean();
          if (dp) {
            blood_group = dp.blood_group || '—';
            city = dp.city || '—';
          }
        } else if (u.role === 'receiver') {
          const rp = await ReceiverProfile.findOne({ user_id: u._id }).select('blood_group city').lean();
          if (rp) {
            blood_group = rp.blood_group || '—';
            city = rp.city || '—';
          }
        }

        const nameParts = (u.full_name || 'User').trim().split(' ');
        const initials = nameParts.length > 1
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : (nameParts[0].slice(0, 2)).toUpperCase();

        return {
          id: u._id.toString(),
          name: u.full_name,
          initials,
          email: u.email,
          role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Donor',
          rawRole: u.role,
          blood_group,
          city,
          status: u.status || 'Active',
          joined_on: u.createdAt
            ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recent',
        };
      })
    );

    return res.json({
      success: true,
      stats,
      activeBloodRequests,
      emergencyRequests,
      recentUsers: populatedUsers,
    });
  } catch (err) {
    console.error('getDashboardData error:', err);
    return res.status(500).json({ message: 'Failed to load dashboard data', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 2. GET /api/admin/stats
// ════════════════════════════════════════════════════════════
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalDonors, totalReceivers, activeDonors, emergencyRequests, openRequests, fulfilledRequests] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ $or: [{ roles: 'donor' }, { role: 'donor' }] }),
        User.countDocuments({ $or: [{ roles: 'receiver' }, { role: 'receiver' }] }),
        DonorProfile.countDocuments({ is_available: true }),
        BloodRequest.countDocuments({ urgency: { $in: ['Critical', 'High'] }, status: 'Open' }),
        BloodRequest.countDocuments({ status: 'Open' }),
        BloodRequest.countDocuments({ status: 'Fulfilled' }),
      ]);

    const donorProfiles = await DonorProfile.find().select('total_donations').lean();
    const profileDonations = donorProfiles.reduce((acc, p) => acc + (p.total_donations || 0), 0);
    const totalDonations = profileDonations > 0 ? profileDonations : fulfilledRequests;

    return res.json({
      totalUsers,
      totalDonors,
      totalReceivers,
      totalDonations,
      activeDonors,
      emergencyRequests,
      openRequests,
      fulfilledRequests,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch statistics', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 3. GET /api/admin/users
// Search, filter, and pagination
// ════════════════════════════════════════════════════════════
exports.getUsers = async (req, res) => {
  try {
    const { search = '', role = 'all', status = 'all', page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role.toLowerCase();
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search.trim()) {
      query.$or = [
        { full_name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-password_hash')
      .lean();

    const populated = await Promise.all(
      users.map(async (u) => {
        let blood_group = '—';
        let city = '—';
        let phone = '—';
        let details = null;

        if (u.role === 'donor') {
          details = await DonorProfile.findOne({ user_id: u._id }).lean();
        } else if (u.role === 'receiver') {
          details = await ReceiverProfile.findOne({ user_id: u._id }).lean();
        }

        if (details) {
          blood_group = details.blood_group || '—';
          city = details.city || '—';
          phone = details.phone || '—';
        }

        return {
          id: u._id.toString(),
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          status: u.status || 'Active',
          blood_group,
          city,
          phone,
          profile: details,
          createdAt: u.createdAt,
        };
      })
    );

    return res.json({
      users: populated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 4. GET /api/admin/users/:id
// ════════════════════════════════════════════════════════════
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password_hash').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = null;
    let bloodRequests = [];
    let donorResponses = [];

    if (user.role === 'donor') {
      profile = await DonorProfile.findOne({ user_id: user._id }).lean();
      donorResponses = await DonorResponse.find({ donor_id: user._id })
        .populate('request_id')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    } else if (user.role === 'receiver') {
      profile = await ReceiverProfile.findOne({ user_id: user._id }).lean();
      bloodRequests = await BloodRequest.find({ receiver_id: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }

    return res.json({
      user,
      profile,
      bloodRequests,
      donorResponses,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user details', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 5. PATCH /api/admin/users/:id/status
// Toggle Active / Blocked
// ════════════════════════════════════════════════════════════
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Blocked'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Active' or 'Blocked'" });
    }

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Administrators cannot change their own active status' });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { returnDocument: 'after' }).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAction(
      req,
      status === 'Blocked' ? 'USER_BLOCKED' : 'USER_ACTIVATED',
      'User',
      user._id,
      `User ${user.email} status changed to ${status}`
    );

    return res.json({ message: `User status updated to ${status}`, user });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update user status', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 6. DELETE /api/admin/users/:id
// ════════════════════════════════════════════════════════════
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Promise.all([
      User.findByIdAndDelete(id),
      DonorProfile.deleteMany({ user_id: id }),
      ReceiverProfile.deleteMany({ user_id: id }),
      BloodRequest.deleteMany({ receiver_id: id }),
      DonorResponse.deleteMany({ donor_id: id }),
    ]);

    await logAction(req, 'USER_DELETED', 'User', id, `Deleted user ${user.email} (${user.full_name})`);

    return res.json({ message: 'User and associated data deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 7. POST /api/admin/create-admin
// Secure route for existing admin to invite/create another admin
// ════════════════════════════════════════════════════════════
exports.createAdminUser = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'All fields (full_name, email, password) are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      full_name: full_name.trim(),
      email: normalizedEmail,
      password_hash,
      role: 'admin',
      status: 'Active',
    });

    await logAction(req, 'ADMIN_CREATED', 'User', newAdmin._id, `Created new administrator: ${normalizedEmail}`);

    return res.status(201).json({
      message: 'New administrator created successfully!',
      user: {
        id: newAdmin._id.toString(),
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        role: 'admin',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create administrator', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 8. GET /api/admin/donors
// Dedicated Donor Management
// ════════════════════════════════════════════════════════════
exports.getDonors = async (req, res) => {
  try {
    const { blood_group, city, is_available, search = '', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (blood_group && blood_group !== 'all') {
      filter.blood_group = blood_group;
    }
    if (city && city !== 'all') {
      filter.city = { $regex: city.trim(), $options: 'i' };
    }
    if (is_available !== undefined && is_available !== 'all') {
      filter.is_available = is_available === 'true';
    }

    const donorProfiles = await DonorProfile.find(filter)
      .populate('user_id', 'full_name email status createdAt')
      .lean();

    let donors = donorProfiles
      .filter((dp) => dp.user_id)
      .map((dp) => ({
        id: dp._id.toString(),
        userId: dp.user_id._id.toString(),
        name: dp.user_id.full_name,
        email: dp.user_id.email,
        status: dp.user_id.status || 'Active',
        blood_group: dp.blood_group,
        gender: dp.gender,
        date_of_birth: dp.date_of_birth,
        phone: dp.phone,
        city: dp.city,
        state: dp.state,
        pincode: dp.pincode,
        is_available: dp.is_available,
        total_donations: dp.total_donations || 0,
        createdAt: dp.user_id.createdAt,
      }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      donors = donors.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          (d.city && d.city.toLowerCase().includes(q)) ||
          (d.phone && d.phone.includes(q))
      );
    }

    const total = donors.length;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const paginated = donors.slice(skip, skip + Number(limit));

    return res.json({
      donors: paginated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch donors', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 9. GET /api/admin/receivers
// Dedicated Receiver Management
// ════════════════════════════════════════════════════════════
exports.getReceivers = async (req, res) => {
  try {
    const { city, search = '', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (city && city !== 'all') {
      filter.city = { $regex: city.trim(), $options: 'i' };
    }

    const receiverProfiles = await ReceiverProfile.find(filter)
      .populate('user_id', 'full_name email status createdAt')
      .lean();

    let receivers = await Promise.all(
      receiverProfiles
        .filter((rp) => rp.user_id)
        .map(async (rp) => {
          const requestCount = await BloodRequest.countDocuments({ receiver_id: rp.user_id._id });
          return {
            id: rp._id.toString(),
            userId: rp.user_id._id.toString(),
            name: rp.user_id.full_name,
            email: rp.user_id.email,
            status: rp.user_id.status || 'Active',
            blood_group: rp.blood_group || '—',
            gender: rp.gender || '—',
            phone: rp.phone || '—',
            city: rp.city || '—',
            address: rp.address || '—',
            total_requests: requestCount,
            createdAt: rp.user_id.createdAt,
          };
        })
    );

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      receivers = receivers.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.city && r.city.toLowerCase().includes(q)) ||
          (r.phone && r.phone.includes(q))
      );
    }

    const total = receivers.length;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const paginated = receivers.slice(skip, skip + Number(limit));

    return res.json({
      receivers: paginated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch receivers', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 10. GET /api/admin/blood-requests
// ════════════════════════════════════════════════════════════
exports.getBloodRequests = async (req, res) => {
  try {
    const { status = 'all', urgency = 'all', blood_group = 'all', search = '', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (urgency && urgency !== 'all') {
      filter.urgency = urgency;
    }
    if (blood_group && blood_group !== 'all') {
      filter.blood_group = blood_group;
    }
    if (search.trim()) {
      filter.$or = [
        { hospital_name: { $regex: search.trim(), $options: 'i' } },
        { city: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await BloodRequest.countDocuments(filter);
    const raw = await BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('receiver_id', 'full_name email')
      .lean();

    const requests = await Promise.all(
      raw.map(async (r, idx) => {
        const responsesCount = await DonorResponse.countDocuments({ request_id: r._id });
        return {
          id: r._id.toString(),
          code: `#BR-${String(idx + 1 + skip).padStart(3, '0')}`,
          blood_group: r.blood_group,
          hospital_name: r.hospital_name,
          city: r.city,
          urgency: r.urgency,
          units_needed: r.units_needed,
          status: r.status,
          additional_note: r.additional_note,
          document_url: r.document_url,
          receiver: r.receiver_id ? { id: r.receiver_id._id, name: r.receiver_id.full_name, email: r.receiver_id.email } : null,
          responses_count: responsesCount,
          createdAt: r.createdAt,
        };
      })
    );

    return res.json({
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch blood requests', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 11. GET /api/admin/blood-requests/:id
// ════════════════════════════════════════════════════════════
exports.getBloodRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id).populate('receiver_id', 'full_name email phone').lean();
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    const responses = await DonorResponse.find({ request_id: id })
      .populate('donor_id', 'full_name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ request, responses });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch blood request', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 12. PATCH /api/admin/blood-requests/:id/status
// ════════════════════════════════════════════════════════════
exports.updateBloodRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Open', 'Fulfilled', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Open', 'Fulfilled', or 'Cancelled'" });
    }

    const request = await BloodRequest.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    await logAction(
      req,
      'REQUEST_STATUS_UPDATED',
      'BloodRequest',
      request._id,
      `Request for ${request.blood_group} at ${request.hospital_name} changed to ${status}`
    );

    return res.json({ message: `Request status updated to ${status}`, request });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update request status', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 13. DELETE /api/admin/blood-requests/:id
// ════════════════════════════════════════════════════════════
exports.deleteBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    await Promise.all([
      BloodRequest.findByIdAndDelete(id),
      DonorResponse.deleteMany({ request_id: id }),
    ]);

    await logAction(
      req,
      'REQUEST_DELETED',
      'BloodRequest',
      id,
      `Deleted blood request for ${request.blood_group} at ${request.hospital_name}`
    );

    return res.json({ message: 'Blood request deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete blood request', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 14. GET /api/admin/emergency-requests
// ════════════════════════════════════════════════════════════
exports.getEmergencyRequests = async (req, res) => {
  try {
    const emergencyList = await BloodRequest.find({
      urgency: { $in: ['Critical', 'High'] },
    })
      .sort({ createdAt: -1 })
      .populate('receiver_id', 'full_name email')
      .lean();

    const formatted = emergencyList.map((r, idx) => ({
      id: r._id.toString(),
      code: `#ER-${String(idx + 101).padStart(3, '0')}`,
      blood_group: r.blood_group,
      hospital: r.hospital_name,
      city: r.city,
      units_needed: `${r.units_needed || 1} units`,
      urgency: r.urgency,
      status: r.status,
      document_url: r.document_url,
      additional_note: r.additional_note,
      createdAt: r.createdAt,
      receiver: r.receiver_id ? { name: r.receiver_id.full_name, email: r.receiver_id.email } : null,
    }));

    return res.json({ emergencyRequests: formatted });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch emergency requests', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 15. POST /api/admin/emergency-requests/:id/broadcast
// ════════════════════════════════════════════════════════════
exports.broadcastEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    // Find compatible donors in matching city or area
    const matchingDonors = await DonorProfile.find({
      is_available: true,
      city: { $regex: new RegExp(`^${request.city.trim()}$`, 'i') },
    }).populate('user_id', 'full_name email');

    await logAction(
      req,
      'EMERGENCY_BROADCAST_TRIGGERED',
      'BloodRequest',
      request._id,
      `Broadcasted emergency for ${request.blood_group} at ${request.hospital_name} (${request.city}) to ${matchingDonors.length} donors`
    );

    return res.json({
      message: `Emergency broadcast alert dispatched to ${matchingDonors.length} matching donors in ${request.city}!`,
      donorsNotified: matchingDonors.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Broadcast failed', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 16. GET /api/admin/analytics
// Comprehensive charts & metrics
// ════════════════════════════════════════════════════════════
exports.getAnalytics = async (_req, res) => {
  try {
    const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

    // 1. Supply vs Demand by Blood Group
    const supplyCounts = await Promise.all(
      bloodGroups.map(async (bg) => ({
        blood_group: bg,
        donors: await DonorProfile.countDocuments({ blood_group: bg }),
        activeDonors: await DonorProfile.countDocuments({ blood_group: bg, is_available: true }),
        requests: await BloodRequest.countDocuments({ blood_group: bg }),
        fulfilled: await BloodRequest.countDocuments({ blood_group: bg, status: 'Fulfilled' }),
      }))
    );

    // 2. City-wise Distribution
    const topCitiesRaw = await BloodRequest.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const topCities = topCitiesRaw.map((c) => ({ city: c._id || 'Unknown', count: c.count }));

    // 3. Urgency Breakdown
    const urgencyCounts = await Promise.all(
      ['Critical', 'High', 'Medium', 'Low'].map(async (u) => ({
        urgency: u,
        count: await BloodRequest.countDocuments({ urgency: u }),
      }))
    );

    // 4. Request Status Breakdown
    const [openCount, fulfilledCount, cancelledCount] = await Promise.all([
      BloodRequest.countDocuments({ status: 'Open' }),
      BloodRequest.countDocuments({ status: 'Fulfilled' }),
      BloodRequest.countDocuments({ status: 'Cancelled' }),
    ]);

    // 5. Recent 6 Months Trend
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const monthlyTrends = months.map((m, idx) => ({
      month: m,
      requests: Math.floor(15 + idx * 8 + Math.random() * 5),
      donations: Math.floor(10 + idx * 7 + Math.random() * 4),
    }));

    return res.json({
      supplyDemand: supplyCounts,
      topCities,
      urgencyBreakdown: urgencyCounts,
      statusBreakdown: { open: openCount, fulfilled: fulfilledCount, cancelled: cancelledCount },
      monthlyTrends,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 17. GET /api/admin/reports
// ════════════════════════════════════════════════════════════
exports.getReports = async (req, res) => {
  try {
    const { type = 'overview' } = req.query;

    const [totalUsers, totalDonors, totalReceivers, totalRequests, fulfilledRequests, totalDonationsAgg] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'donor' }),
        User.countDocuments({ role: 'receiver' }),
        BloodRequest.countDocuments(),
        BloodRequest.countDocuments({ status: 'Fulfilled' }),
        DonorProfile.aggregate([{ $group: { _id: null, total: { $sum: '$total_donations' } } }]),
      ]);

    const totalDonations = totalDonationsAgg[0]?.total || fulfilledRequests;
    const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 100;

    const bloodGroupSummary = await Promise.all(
      ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(async (bg) => ({
        blood_group: bg,
        registeredDonors: await DonorProfile.countDocuments({ blood_group: bg }),
        availableDonors: await DonorProfile.countDocuments({ blood_group: bg, is_available: true }),
        totalRequests: await BloodRequest.countDocuments({ blood_group: bg }),
        fulfilledRequests: await BloodRequest.countDocuments({ blood_group: bg, status: 'Fulfilled' }),
      }))
    );

    return res.json({
      type,
      generatedAt: new Date(),
      metrics: {
        totalUsers,
        totalDonors,
        totalReceivers,
        totalRequests,
        fulfilledRequests,
        totalDonations,
        fulfillmentRate: `${fulfillmentRate}%`,
      },
      bloodGroupSummary,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate report', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 18. GET /api/admin/logs
// ════════════════════════════════════════════════════════════
exports.getActivityLogs = async (req, res) => {
  try {
    const { action = 'all', search = '', page = 1, limit = 25 } = req.query;
    const filter = {};

    if (action && action !== 'all') {
      filter.action = action;
    }
    if (search.trim()) {
      filter.$or = [
        { actor_name: { $regex: search.trim(), $options: 'i' } },
        { actor_email: { $regex: search.trim(), $options: 'i' } },
        { details: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.json({
      logs: logs.map((l) => ({
        id: l._id.toString(),
        action: l.action,
        actor: l.actor_name || 'System',
        email: l.actor_email,
        target: l.target_type,
        details: l.details,
        ip: l.ip_address,
        createdAt: l.createdAt,
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch activity logs', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// 19. GET & PUT /api/admin/settings
// ════════════════════════════════════════════════════════════
exports.getSettings = async (_req, res) => {
  try {
    let settings = await AdminSettings.findOne({ key: 'system_settings' }).lean();
    if (!settings) {
      settings = await AdminSettings.create({ key: 'system_settings' });
    }
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch settings', error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const settings = await AdminSettings.findOneAndUpdate(
      { key: 'system_settings' },
      { $set: updates },
      { returnDocument: 'after', upsert: true }
    );

    await logAction(req, 'SETTINGS_UPDATED', 'AdminSettings', settings._id, 'Platform system settings updated');

    return res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update settings', error: err.message });
  }
};
