const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // })
  //   .populate({
  //     path: 'user',
  //     select: 'name photo'
  //   })
  //   .lean();

  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function(
  tourId
) {
  // console.log(tourId);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  //this points to the current review
  this.constructor.calcAverageRatings(this.tour);
});

// ** This is one way of solving using pre and post which is longer but it shows how to send data between pre and post
// reviewSchema.pre(/^findOneAnd/, async function(next) {
//   this.r = await this.findOne();
//   next();
// });
// reviewSchema.post(/^findOneAnd/, async function() {
//   // this.findOne(); does not work here because query has already executed
//   await this.r.constructor.calcAverageRatings(this.r.tour);
// });

// ** This is an easier way of calling the function with only post
reviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
