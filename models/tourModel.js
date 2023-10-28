import mongoose from 'mongoose';
import slugify from 'slugify';
// import User from './userModel.js';

// Schema object creation using Mongoose
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      maxlength: [
        30,
        'A tour must be less or equal to 30 characters in length',
      ],
      minlength: [
        10,
        'A tour must be more or equal to 10 characters in length',
      ],
      required: [true, 'A tour must have a name'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour must have either a: easy, medium or hard difficulty',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [0.5, 'Ratings must be above or equal to 0.5'],
      max: [5, 'Ratings must be less than or equal to 5'],
      set: val => Math.floor(val),
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return this.price > val; // 200 > 50 return true
        },
        message: `Discount price {VALUE} should be less than price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover'],
    },
    images: [String],
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    slug: String,
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      // GeoJSON
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
      },
    ],
    guides: [
      // Referencing docs by child referencing
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    // Define schema for virtuals properties
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Indexing to increase DB perfomance during query
// Single indexation
// tourSchema.index({ price: 1 });

// Compound indexation
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual properties
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Pre Save Hook / Pre Save Middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async guide => await User.findById(guide)
//   );
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save the document');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
// console.log(doc);
// next();
// });

// Pre Query hook / Pre Query Middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });

  next();
});

// Post Query hook / Post Query Middleware
tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs);
  // console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// Pre Aggregation hook / Pre Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//   this._pipeline.unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   // console.log(this._pipeline);
//   next();
// });

// Model creation using mongoose schema
const Tour = mongoose.model('Tour', tourSchema);

export default Tour;
