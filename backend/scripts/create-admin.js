// scripts/create-admin.js
// Safe CLI tool to create or promote an administrator without exposing self-registration

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('../config/db');
const { User, ActivityLog } = require('../models');

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'admin@hemolink.com').toLowerCase().trim();
  const password = args[1] || 'Admin@12345';
  const fullName = args[2] || 'System Administrator';

  console.log(`\n🛡️  HemoLink Admin Setup Tool`);
  console.log(`Connecting to database...`);

  await connectDB();

  let existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`ℹ️  User ${email} is already an Admin.`);
      const salt = await bcrypt.genSalt(10);
      existing.password_hash = await bcrypt.hash(password, salt);
      existing.status = 'Active';
      await existing.save();
      console.log(`🔑 Password updated for admin: ${email}`);
    } else {
      existing.role = 'admin';
      existing.status = 'Active';
      const salt = await bcrypt.genSalt(10);
      existing.password_hash = await bcrypt.hash(password, salt);
      await existing.save();
      console.log(`🎉 Promoted existing user ${email} to Admin!`);
    }
  } else {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    existing = await User.create({
      full_name: fullName,
      email,
      password_hash,
      role: 'admin',
      status: 'Active',
    });
    console.log(`✅ Created brand new Administrator account: ${email}`);
  }

  await ActivityLog.create({
    action: 'ADMIN_SETUP_CLI',
    actor_id: existing._id,
    actor_name: existing.full_name,
    actor_email: existing.email,
    target_type: 'System',
    details: `Admin account initialized via CLI tool: ${email}`,
  });

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`  HemoLink Admin Credentials:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     admin`);
  console.log(`  Status:   Active`);
  console.log(`══════════════════════════════════════════════\n`);

  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('❌ Failed to create admin:', err.message);
  process.exit(1);
});
