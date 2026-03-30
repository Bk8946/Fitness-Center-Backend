const Class = require('../models/class');
const Booking = require('../models/booking');

exports.getClasses = async (req, res) => {
  try {
    const { type, difficulty, duration, date } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (duration) filter.duration = { $lte: parseInt(duration) };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.scheduledAt = { $gte: start, $lt: end };
    }
    const classes = await Class.find(filter)
      .populate({ path: 'trainer', populate: { path: 'user', select: 'name avatar' } })
      .sort({ scheduledAt: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate({ path: 'trainer', populate: { path: 'user', select: 'name avatar' } });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const cls = await Class.create({ ...req.body, trainer: req.body.trainerId });
    res.status(201).json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// AI-style recommendation: match by user's preferences and past bookings
exports.getRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const prefs = user.preferences?.classTypes || [];
    const difficulty = user.preferences?.difficultyLevel || 'beginner';

    const classes = await Class.find({
      isActive: true,
      scheduledAt: { $gte: new Date() },
      $or: [
        { type: { $in: prefs } },
        { difficulty },
      ],
    })
      .populate({ path: 'trainer', populate: { path: 'user', select: 'name avatar' } })
      .limit(6)
      .sort({ rating: -1 });

    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};