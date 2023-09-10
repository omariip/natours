const stripe = require('stripe')(
  process.env.STRIPE_SECRET_KEY
);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.getCheckoutSession = catchAsync(
  async (req, res, next) => {
    // 1) get hte currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    // 2) create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get(
        'host'
      )}/my-tours`,
      cancel_url: `${req.protocol}://${req.get(
        'host'
      )}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [
                `${req.protocol}://${req.get(
                  'host'
                )}/img/tours/${tour.imageCover}`
              ]
            }
          }
        }
      ]
    });
    // 3) create session as response
    res.status(200).json({
      status: 'success',
      session
    });
  }
);

// exports.createBookingCheckout = catchAsync(
//   async (req, res, next) => {
//     // This is only temporary, its unsecure, because anyone can make bookings without paying
//     const { tour, user, price } = req.query;

//     if (!tour && !user && !price) {
//       return next();
//     }
//     await Booking.create({ tour, user, price });

//     res.redirect(req.originalUrl.split('?')[0]);
//   }
// );

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({
    email: session.customer_email
  }))._id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res
      .status(400)
      .send(`Webhook Error ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
