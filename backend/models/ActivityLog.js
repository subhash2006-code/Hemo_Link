// models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actor_name: {
      type: String,
      default: 'System',
    },
    actor_email: {
      type: String,
      default: '',
    },
    target_type: {
      type: String,
      default: 'General',
      index: true,
    },
    target_id: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    ip_address: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
