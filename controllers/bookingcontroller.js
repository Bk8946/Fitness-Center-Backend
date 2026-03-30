const Booking = require('../models/booking');
const Class = require('../models/class');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');

exports.createBooking = async (req, res) => {
  try {
    const { classId, notes } = req.body;
    const cls = await Class.findById(classId).populate('trainer');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (cls.enrolled >= cls.maxCapacity)
      return res.status(400).json({ message: 'Class is full' });

    const booking = await Booking.create({
      user: req.user.id,
      class: classId,
      trainer: cls.trainer._id,
      amount: cls.price,
      notes,
    });

    cls.enrolled += 1;
    await cls.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { bookingHistory: booking._id },
    });

    await sendEmail({
      to: req.user.email,
      subject: 'Booking Confirmed!',
      html: `<h2>Booking Confirmed</h2>
             <p>Your class <strong>${cls.title}</strong> is scheduled for 
             ${new Date(cls.scheduledAt).toLocaleString()}.</p>
             <p>Amount: $${cls.price}</p>`,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('class')
      .populate({ path: 'trainer', populate: { path: 'user', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    booking.status = 'cancelled';
    await booking.save();

    await Class.findByIdAndUpdate(booking.class, { $inc: { enrolled: -1 } });

    await sendEmail({
      to: req.user.email,
      subject: 'Booking Cancelled',
      html: `<p>Your booking has been cancelled successfully.</p>`,
    });

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};