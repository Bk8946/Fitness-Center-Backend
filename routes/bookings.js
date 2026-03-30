const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, cancelBooking } = require('../controllers/bookingcontroller');
const { protect } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/my', protect, getUserBookings);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;