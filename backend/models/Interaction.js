const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  studentId: { type: String, default: 'anonymous' },
  message: { type: String, required: true },
  aiResponse: { type: String, required: true },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  topic: { type: String, default: 'general' },
  responseTime: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interaction', interactionSchema);