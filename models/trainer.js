const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String, maxlength: 1000 },
  qualifications: [String],
  specializations: [{ type: String, enum: ['yoga', 'strength', 'cardio', 'pilates', 'hiit', 'zumba', 'crossfit'] }],
  experience: { type: Number, default: 0 }, // years
  photos: [String],
  introVideo: { type: String },
  availability: [{
    day: { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
    slots: [{ start: String, end: String, isBooked: { type: Boolean, default: false } }],
  }],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  pricePerSession: { type: Number, required: true },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Trainer', trainerSchema);