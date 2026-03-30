const Review = require('../models/review');
const Trainer = require('../models/trainer');

exports.createReview = async (req, res) => {
  try {
    const { trainerId, bookingId, rating, comment } = req.body;
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) return res.status(400).json({ message: 'Already reviewed this booking' });

    const review = await Review.create({
      user: req.user.id, trainer: trainerId, booking: bookingId, rating, comment,
    });

    // Update trainer rating
    const allReviews = await Review.find({ trainer: trainerId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Trainer.findByIdAndUpdate(trainerId, {
      rating: avg.toFixed(1),
      totalReviews: allReviews.length,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTrainerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ trainer: req.params.trainerId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.respondToReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { trainerResponse: req.body.response },
      { new: true }
    );
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};