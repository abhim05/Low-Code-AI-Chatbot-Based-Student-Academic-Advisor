const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  credits: { type: Number, required: true },
  prerequisites: [{ type: String }] // Array of course codes
});

module.exports = mongoose.model('Course', courseSchema);