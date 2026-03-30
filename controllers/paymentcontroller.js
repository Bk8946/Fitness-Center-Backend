const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/booking');
const Payment = require('../models/payment');
const sendEmail = require('../utils/sendEmail');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('class');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.amount * 100, // paise/cents
      currency: 'usd',
      metadata: { bookingId: bookingId.toString(), userId: req.user.id },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not successful' });

    const booking = await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'paid',
      status: 'confirmed',
      paymentId: paymentIntentId,
    }, { new: true }).populate('class');

    await Payment.create({
      user: req.user.id,
      booking: bookingId,
      stripePaymentIntentId: paymentIntentId,
      amount: booking.amount,
      status: 'succeeded',
    });

    await sendEmail({
      to: req.user.email,
      subject: 'Payment Successful',
      html: `<h2>Payment Confirmed!</h2>
             <p>$${booking.amount} paid for <strong>${booking.class.title}</strong>.</p>
             <p>Payment ID: ${paymentIntentId}</p>`,
    });

    res.json({ message: 'Payment confirmed', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};