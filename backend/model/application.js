const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  dob: Date,
  secondaryLevel: { type: String, enum: ['level3','level4','level5'], required: true },
  school: String,
  payslipPath: String,
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  classAssigned: String,
  admissionLetterPath: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);
