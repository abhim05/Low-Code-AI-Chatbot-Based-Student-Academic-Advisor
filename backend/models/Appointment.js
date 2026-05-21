const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  department: { type: String, default: 'General Advising' },
  reason: { type: String, default: 'General advising' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
