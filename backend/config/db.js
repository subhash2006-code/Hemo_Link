// config/db.js
// MongoDB Atlas connection via Mongoose ODM with MongoMemoryServer fallback for local development

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

let connPromise = null;

async function seedDefaultData() {
  try {
    const bcrypt = require('bcryptjs');
    const { User, DonorProfile, ReceiverProfile, BloodRequest, AdminSettings } = require('../models');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Test@1234', salt);
    const adminHash = await bcrypt.hash('Admin@12345', salt);

    // 1. Seed default admin if none exists
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        full_name: 'System Administrator',
        email: 'admin@hemolink.com',
        password_hash: adminHash,
        role: 'admin',
        status: 'Active',
      });
      console.log('🛡️ Seeded default admin account: admin@hemolink.com / Admin@12345');
    }

    // 2. Seed default donor if none exists
    let donor = await User.findOne({ email: 'donor@test.com' });
    if (!donor) {
      donor = await User.create({
        full_name: 'Rahul Sharma (Test Donor)',
        email: 'donor@test.com',
        password_hash: passwordHash,
        role: 'donor',
        status: 'Active',
      });
      await DonorProfile.create({
        user_id: donor._id,
        blood_group: 'O-',
        date_of_birth: '1995-05-15',
        gender: 'Male',
        weight_kg: 72,
        phone: '9876543210',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        is_available: true,
        total_donations: 3,
      });
      console.log('🌱 Seeded default donor account: donor@test.com / Test@1234');
    }

    // 3. Seed default receiver if none exists
    let receiver = await User.findOne({ email: 'receiver@test.com' });
    if (!receiver) {
      receiver = await User.create({
        full_name: 'Priya Verma (Test Receiver)',
        email: 'receiver@test.com',
        password_hash: passwordHash,
        role: 'receiver',
        status: 'Active',
      });
      await ReceiverProfile.create({
        user_id: receiver._id,
        blood_group: 'O-',
        date_of_birth: '1998-08-20',
        gender: 'Female',
        phone: '9876543211',
        city: 'Mumbai',
        address: 'Bandra West, Mumbai',
      });
      console.log('🌱 Seeded default receiver account: receiver@test.com / Test@1234');
    }

    // 4. Seed sample blood requests if none exists
    const requestCount = await BloodRequest.countDocuments();
    if (requestCount === 0 && receiver) {
      await BloodRequest.create({
        receiver_id: receiver._id,
        blood_group: 'O+',
        hospital_name: 'Apollo Hospital',
        city: 'Hyderabad',
        urgency: 'Critical',
        units_needed: 2,
        additional_note: 'Emergency surgical procedure scheduled. Blood required urgently.',
        status: 'Open',
      });
      await BloodRequest.create({
        receiver_id: receiver._id,
        blood_group: 'A-',
        hospital_name: 'City Hospital',
        city: 'Bangalore',
        urgency: 'High',
        units_needed: 3,
        additional_note: 'Severe anemia inpatient.',
        status: 'Open',
      });
      await BloodRequest.create({
        receiver_id: receiver._id,
        blood_group: 'B+',
        hospital_name: 'Sunrise Medical',
        city: 'Chennai',
        urgency: 'Medium',
        units_needed: 1,
        additional_note: 'Scheduled transfusion.',
        status: 'Open',
      });
      await BloodRequest.create({
        receiver_id: receiver._id,
        blood_group: 'AB-',
        hospital_name: 'Care Hospital',
        city: 'Pune',
        urgency: 'High',
        units_needed: 4,
        additional_note: 'Rare blood type requested.',
        status: 'Open',
      });
      await BloodRequest.create({
        receiver_id: receiver._id,
        blood_group: 'O-',
        hospital_name: 'Life Care Hospital',
        city: 'Delhi',
        urgency: 'Critical',
        units_needed: 2,
        additional_note: 'Trauma ICU emergency.',
        status: 'Open',
      });
    }

    // 5. Seed system settings if none exists
    const settingsCount = await AdminSettings.countDocuments();
    if (settingsCount === 0) {
      await AdminSettings.create({ key: 'system_settings' });
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connPromise) {
    connPromise = (async () => {
      try {
        if (MONGODB_URI && !MONGODB_URI.includes('user:password')) {
          const conn = await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
          console.log(`✅ MongoDB Atlas connected → ${conn.connection.name} (${conn.connection.host})`);
          await seedDefaultData();
          return conn;
        } else {
          throw new Error('Placeholder or missing MONGODB_URI detected');
        }
      } catch (err) {
        console.warn('⚠️ MONGODB_URI connection failed or placeholder detected. Starting Mongo Memory Server fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB In-Memory Database running → ${mongoUri}`);
        await seedDefaultData();
        return conn;
      }
    })();
  }
  return connPromise;
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Retrying...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

module.exports = {
  connectDB,
  testConnection: connectDB,
  mongoose,
};
