// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    legacy_id: {
      type: Number,
      index: true,
      sparse: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['donor', 'receiver', 'admin'],
      default: 'donor',
      index: true,
    },
    roles: {
      type: [String],
      enum: ['donor', 'receiver', 'admin'],
      default: function () {
        return this.role ? [this.role] : ['donor'];
      },
      index: true,
    },
    activeRole: {
      type: String,
      enum: ['donor', 'receiver', 'admin'],
      default: function () {
        return this.role || 'donor';
      },
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Blocked', 'active', 'blocked'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.roles = ret.roles && ret.roles.length ? [...new Set(ret.roles)] : [ret.role || 'donor'];
        ret.activeRole = ret.activeRole || (ret.roles.includes(ret.role) ? ret.role : ret.roles[0]) || 'donor';
        ret.role = ret.activeRole;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.roles = ret.roles && ret.roles.length ? [...new Set(ret.roles)] : [ret.role || 'donor'];
        ret.activeRole = ret.activeRole || (ret.roles.includes(ret.role) ? ret.role : ret.roles[0]) || 'donor';
        ret.role = ret.activeRole;
        return ret;
      },
    },
  }
);

userSchema.pre('save', function (next) {
  if (this.roles && this.roles.length) {
    this.roles = [...new Set(this.roles)];
    if (this.role && !this.roles.includes(this.role)) {
      this.roles.push(this.role);
    }
  } else if (this.role) {
    this.roles = [this.role];
  } else {
    this.roles = ['donor'];
  }

  if (!this.activeRole || !this.roles.includes(this.activeRole)) {
    this.activeRole = this.roles.includes(this.role) ? this.role : this.roles[0];
  }
  this.role = this.activeRole;

  if (typeof next === 'function') next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
