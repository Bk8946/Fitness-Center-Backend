const express = require('express');
const router = express.Router();
const { createReview, getTrainerReviews, respondToReview } = require('../controllers/reviewcontroller');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/trainer/:trainerId', getTrainerReviews);
router.patch('/:id/respond', protect, authorize('trainer'), respondToReview);

module.exports = router;