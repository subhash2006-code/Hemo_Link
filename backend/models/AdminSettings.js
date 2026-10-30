// models/AdminSettings.js
const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'system_settings',
    },
    platform_name: {
      type: String,
      default: 'HemoLink Blood Donation Network',
    },
    emergency_auto_broadcast: {
      type: Boolean,
      default: true,
    },
    emergency_search_radius_km: {
      type: Number,
      default: 25,
    },
    email_alerts_enabled: {
      type: Boolean,
      default: true,
    },
    require_donor_verification: {
      type: Boolean,
      default: true,
    },
    maintenance_mode: {
      type: Boolean,
      default: false,
    },
    support_email: {
      type: String,
      default: 'support@hemolink.org',
    },
    support_phone: {
      type: String,
      default: '+91 98765 43210',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.AdminSettings || mongoose.model('AdminSettings', adminSettingsSchema);
