const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  admin: { type: String, required: true }, // admin username
  action: { type: String, required: true }, // e.g., 'approve', 'reject', 'login', 'password_change'
  targetApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
