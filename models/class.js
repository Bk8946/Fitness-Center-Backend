const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
  type: { type: String, enum: ['yoga', 'strength', 'cardio', 'pilates', 'hiit', 'zumba', 'crossfit'], required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  duration: { type: Number, required: true }, // minutes
  price: { type: Number, required: true },
  maxCapacity: { type: Number, default: 10 },
  enrolled: { type: Number, default: 0 },
  scheduledAt: { type: Date, required: true },
  thumbnail: String,
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);