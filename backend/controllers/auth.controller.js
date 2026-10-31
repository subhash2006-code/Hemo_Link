// controllers/auth.controller.js
// Handles signup, login, forgot-password, reset-password using MongoDB Atlas & Mongoose

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User, DonorProfile, ReceiverProfile, PasswordReset, ActivityLog } = require('../models');
const { sendWelcomeEmail, sendPasswordResetEmail, sendBloodRequestAlert } = require('../services/email.service');

// ─── Helper: generate JWT ────────────────────────────────────
function generateToken(user, profileComplete, activeRole) {
  const roles = Array.isArray(user.roles) && user.roles.length > 0
    ? [...new Set(user.roles)]
    : [user.role || 'donor'];
  const resolvedRole = activeRole || user.activeRole || roles[0] || user.role || 'donor';

  return jwt.sign(
    {
      id:              user._id ? user._id.toString() : user.id,
      email:           user.email,
      roles:           roles,
      activeRole:      resolvedRole,
      role:            resolvedRole, // Backwards compatibility for existing code
      profileComplete: profileComplete,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// ─── Helper: check profile complete ─────────────────────────
async function isProfileComplete(userId, role) {
  try {
    if (role === 'admin') {
      return true;
    }
    if (role === 'donor') {
      const exists = await DonorProfile.exists({ user_id: userId });
      return exists !== null;
    } else if (role === 'receiver') {
      const exists = await ReceiverProfile.exists({ user_id: userId });
      return exists !== null;
    }
    return false;
  } catch (err) {
    console.error('isProfileComplete error:', err);
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// POST /api/auth/signup
// Body: { full_name, email, password, role, roles, phone }
// Supports: donor, receiver, both (Donor + Receiver in 1 account)
// Updates existing account if user adds another role
// ════════════════════════════════════════════════════════════
exports.signup = async (req, res) => {
  try {
    const { full_name, email, password, role, roles, phone } = req.body;

    // Validate presence
    if (!full_name || !email || !password || (!role && (!roles || !roles.length))) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Determine requested roles
    let requestedRoles = [];
    if (Array.isArray(roles) && roles.length > 0) {
      requestedRoles = roles;
    } else if (role === 'both') {
      requestedRoles = ['donor', 'receiver'];
    } else {
      requestedRoles = [role];
    }

    // Never allow signup as admin through normal registration
    if (requestedRoles.includes('admin')) {
      return res.status(400).json({ message: 'Registration as administrator is not permitted.' });
    }

    const validRoles = requestedRoles.filter(r => ['donor', 'receiver'].includes(r));
    if (validRoles.length === 0) {
      return res.status(400).json({ message: 'Role must be donor, receiver, or both.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    let existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // Check password authentication
      const isMatch = await bcrypt.compare(password, existingUser.password_hash);
      if (!isMatch) {
        return res.status(409).json({
          message: 'An account with this email already exists. Please enter your existing password to add this role or log in.',
        });
      }

      // User authenticated; check which roles are new
      const currentRoles = existingUser.roles && existingUser.roles.length
        ? existingUser.roles
        : [existingUser.role || 'donor'];

      const newRoles = validRoles.filter(r => !currentRoles.includes(r));

      if (newRoles.length === 0) {
        return res.status(409).json({
          message: 'An account with this email already has all requested roles. Please log in directly.',
        });
      }

      // Add new role(s) to existing user account without creating duplicate
      existingUser.roles = [...new Set([...currentRoles, ...validRoles])];
      existingUser.activeRole = validRoles[0] || existingUser.activeRole;
      existingUser.role = existingUser.activeRole;
      if (phone && !existingUser.phone) existingUser.phone = phone.trim();

      await existingUser.save();

      const profileComplete = await isProfileComplete(existingUser._id, existingUser.activeRole);
      const token = generateToken(existingUser, profileComplete, existingUser.activeRole);

      return res.status(200).json({
        message: 'Role added successfully to your existing account!',
        token,
        hasMultipleRoles: existingUser.roles.filter(r => ['donor', 'receiver'].includes(r)).length > 1,
        user: {
          id:              existingUser._id.toString(),
          full_name:       existingUser.full_name,
          email:           existingUser.email,
          roles:           existingUser.roles,
          activeRole:      existingUser.activeRole,
          role:            existingUser.activeRole,
          phone:           existingUser.phone,
          profileComplete,
        },
      });
    }

    // Create brand new account
    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      full_name: full_name.trim(),
      email: normalizedEmail,
      password_hash,
      phone: phone ? phone.trim() : '',
      roles: validRoles,
      activeRole: validRoles[0],
      role: validRoles[0],
      status: 'Active',
    });

    const token = generateToken(newUser, false, newUser.activeRole);

    // Send Welcome Email in background
    sendWelcomeEmail({
      name:  full_name.trim(),
      email: newUser.email,
      role:  validRoles.join(' & '),
    }).catch(err => console.error('Welcome email error:', err));

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      hasMultipleRoles: validRoles.length > 1,
      user: {
        id:              newUser._id.toString(),
        full_name:       newUser.full_name,
        email:           newUser.email,
        roles:           newUser.roles,
        activeRole:      newUser.activeRole,
        role:            newUser.activeRole,
        phone:           newUser.phone,
        profileComplete: false,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error during signup.' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/login
// Body: { email, password, requestedRole }
// ════════════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const { email, password, requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status && user.status.toLowerCase() === 'blocked') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    // Resolve roles
    const roles = user.roles && user.roles.length
      ? [...new Set(user.roles)]
      : [user.role || 'donor'];

    // Determine active role
    let activeRole = user.activeRole;
    if (requestedRole && roles.includes(requestedRole)) {
      activeRole = requestedRole;
      user.activeRole = requestedRole;
      user.role = requestedRole;
      await user.save();
    } else if (!activeRole || !roles.includes(activeRole)) {
      activeRole = roles[0];
    }

    // Check if profile is complete for active role
    const profileComplete = await isProfileComplete(user._id, activeRole);
    const token = generateToken(user, profileComplete, activeRole);

    const hasBothRoles = roles.includes('donor') && roles.includes('receiver');

    // If admin, log activity
    if (roles.includes('admin')) {
      ActivityLog.create({
        action: 'ADMIN_LOGIN',
        actor_id: user._id,
        actor_name: user.full_name,
        actor_email: user.email,
        target_type: 'Auth',
        details: `Administrator ${user.full_name} logged in.`,
        ip_address: req.ip || req.connection?.remoteAddress || '',
      }).catch(err => console.error('Activity log error:', err));
    }

    return res.status(200).json({
      message: 'Login successful!',
      token,
      hasMultipleRoles: hasBothRoles,
      roles,
      activeRole,
      user: {
        id:              user._id.toString(),
        full_name:       user.full_name,
        email:           user.email,
        roles,
        activeRole,
        role:            activeRole,
        phone:           user.phone,
        profileComplete: profileComplete,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// Body: { email }
// ════════════════════════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // If email doesn't exist, return neutral message for security
    if (!user) {
      return res.status(200).json({ message: 'If this email exists, a verification code has been sent.' });
    }

    const userId   = user._id;
    const userName = user.full_name;

    // Invalidate any previously generated unused reset codes for this user
    await PasswordReset.updateMany({ user_id: userId, used: false }, { used: true });

    // Generate a secure 6-digit verification code (e.g. 749201)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires   = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    // Save 6-digit code to DB
    await PasswordReset.create({
      user_id: userId,
      token: resetCode,
      expires_at: expires,
    });

    // Send Real-Time Crimson Email Template with 6-digit code
    sendPasswordResetEmail({
      email:     normalizedEmail,
      userName:  userName,
      resetCode: resetCode,
    }).catch(err => console.error('Reset email dispatch error:', err));

    console.log(`🔑 [SECURITY OTP] 6-digit password reset code for ${normalizedEmail}: ${resetCode}`);

    return res.status(200).json({
      message:   'A 6-digit verification code has been sent to your email.',
      resetCode: resetCode,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// Body: { code (or token), newPassword }
// ════════════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  try {
    const { code, token, newPassword } = req.body;
    const verificationCode = (code || token || '').toString().trim();

    if (!verificationCode || !newPassword) {
      return res.status(400).json({ message: 'Verification code and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    // Find valid active code
    const resetRecord = await PasswordReset.findOne({
      token: verificationCode,
      expires_at: { $gt: new Date() },
      used: false,
    });

    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please request a new one.' });
    }

    const userId = resetRecord.user_id;

    // Hash new password
    const salt    = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update password + mark code as used
    await User.findByIdAndUpdate(userId, { password_hash: newHash });
    resetRecord.used = true;
    await resetRecord.save();

    console.log(`✅ Password successfully updated for user ID: ${userId}`);

    return res.status(200).json({ message: 'Password updated successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════════════
// GET /api/auth/me  (verify token + return fresh user info)
// ════════════════════════════════════════════════════════════
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const roles = user.roles && user.roles.length ? [...new Set(user.roles)] : [user.role || 'donor'];
    const activeRole = req.user.activeRole || user.activeRole || roles[0] || user.role || 'donor';
    const profileComplete = await isProfileComplete(user._id, activeRole);

    return res.status(200).json({
      user: {
        id:              user._id.toString(),
        full_name:       user.full_name,
        email:           user.email,
        roles,
        activeRole,
        role:            activeRole,
        phone:           user.phone,
        hasMultipleRoles: roles.includes('donor') && roles.includes('receiver'),
        profileComplete,
      },
    });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/switch-role  (switch active role for user)
// Body: { role }
// ════════════════════════════════════════════════════════════
exports.switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required.' });
    }

    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const roles = user.roles && user.roles.length ? [...new Set(user.roles)] : [user.role || 'donor'];
    if (!roles.includes(role)) {
      return res.status(403).json({ message: `Access denied. You do not have the ${role} role on this account.` });
    }

    user.activeRole = role;
    user.role = role;
    await user.save();

    const profileComplete = await isProfileComplete(user._id, role);
    const token = generateToken(user, profileComplete, role);

    return res.status(200).json({
      message: `Switched to ${role} mode!`,
      token,
      user: {
        id:              user._id.toString(),
        full_name:       user.full_name,
        email:           user.email,
        roles,
        activeRole:      role,
        role:            role,
        phone:           user.phone,
        hasMultipleRoles: roles.includes('donor') && roles.includes('receiver'),
        profileComplete,
      },
    });
  } catch (err) {
    console.error('Switch role error:', err);
    return res.status(500).json({ message: 'Server error during role switch.' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/add-role  (add role to existing account)
// Body: { role }
// ════════════════════════════════════════════════════════════
exports.addRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['donor', 'receiver'].includes(role)) {
      return res.status(400).json({ message: 'Can only add donor or receiver role.' });
    }

    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const currentRoles = user.roles && user.roles.length ? user.roles : [user.role || 'donor'];
    user.roles = [...new Set([...currentRoles, role])];
    user.activeRole = role;
    user.role = role;
    await user.save();

    const profileComplete = await isProfileComplete(user._id, role);
    const token = generateToken(user, profileComplete, role);

    return res.status(200).json({
      message: `Successfully added ${role} role to your account!`,
      token,
      user: {
        id:              user._id.toString(),
        full_name:       user.full_name,
        email:           user.email,
        roles:           user.roles,
        activeRole:      role,
        role:            role,
        phone:           user.phone,
        hasMultipleRoles: user.roles.includes('donor') && user.roles.includes('receiver'),
        profileComplete,
      },
    });
  } catch (err) {
    console.error('Add role error:', err);
    return res.status(500).json({ message: 'Server error adding role.' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/test-email  — Send a test notification email
// Body: { targetEmail?: string }
// ════════════════════════════════════════════════════════════
exports.testEmail = async (req, res) => {
  const { targetEmail } = req.body;
  if (!targetEmail) {
    return res.status(400).json({ message: 'targetEmail is required in request body.' });
  }

  const result = await sendBloodRequestAlert({
    bloodGroup: 'O-',
    hospitalName: 'Apollo Speciality Hospital',
    city: 'Hyderabad',
    urgency: 'Critical',
    unitsNeeded: 2,
    additionalNote: 'Test Real-Time Notification from HemoLink platform!',
    receiverName: 'HemoLink System Test',
    recipientEmail: targetEmail.trim(),
  });

  if (result.success) {
    return res.status(200).json({
      message: `✅ Test email successfully sent to ${targetEmail}!`,
      messageId: result.messageId,
    });
  } else {
    return res.status(500).json({
      message: '⚠️ Unable to send email. Please verify server email configuration.',
    });
  }
};
