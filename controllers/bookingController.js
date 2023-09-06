const stripe = require('stripe')(
  process.env.STRIPE_SECRET_KEY
);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(
  async (req, res, next) => {
    // 1) get hte currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    // 2) create checkout session
    const session = await stripe.checkout.sessions.create({
      //session info
      payment_method_types: ['card'],
      //product info
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [
                `https://images.freeimages.com/images/large-previews/3b2/prague-conference-center-1056491.jpg`
              ]
            }
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get(
        'host'
      )}/?tour=${req.params.tourId}&user=${
        req.user.id
      }&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get(
        'host'
      )}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId
    });
    // 3) create session as response
    res.status(200).json({
      status: 'success',
      session
    });
  }
);

exports.createBookingCheckout = catchAsync(
  async (req, res, next) => {
    // This is only temporary, its unsecure, because anyone can make bookings without paying
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) {
      return next();
    }
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
  }
);

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);