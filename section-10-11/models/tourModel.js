const mongoose = require('mongoose');
const slugify = require('slugify');
var validator = require('validator');
// const User = require('./userModel'); // Used if embedding guides (currently commented)

// ==============================
// TOUR SCHEMA DEFINITION
// ==============================
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'], // Validation: required field
    unique: true,                               // MongoDB unique index
    trim: true,                                 // Remove whitespace
    validate: {
      // Custom validator to allow only alphabets (spaces allowed)
      validator: function (value) {
        return validator.isAlpha(value.replace(/\s/g, ''));
      },
      message: 'Tour name must be string'
    }
  },

  // URL-friendly version of name (created using slugify)
  slug: {
    type: String
  },

  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },

  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },

  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty']
  },

  // ------------------------------
  // RATINGS & PRICING
  // ------------------------------
  ratingsAverage: {
    type: Number,
    default: 4.5
  },

  ratingsQuantity: {
    type: Number,
    default: 0
  },

  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },

  // Discount validation: must be less than price
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) must be less than actual price.'
    }
  },

  // ------------------------------
  // DESCRIPTION & MEDIA
  // ------------------------------
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary']
  },

  description: {
    type: String,
    trim: true
  },

  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },

  images: [String],

  // ------------------------------
  // META INFORMATION
  // ------------------------------
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false               // Hidden by default in query results
  },

  startDates: [Date],

  secretTour:{
    type: Boolean,
    default: false
  },

  // ------------------------------
  // GEO-SPATIAL DATA (START LOCATION)
  // ------------------------------
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']           // GeoJSON type
    },
    coordinates: [Number],      // [longitude, latitude]
    address: String,
    description: String
  },

  // ------------------------------
  // GEO-SPATIAL DATA (LOCATIONS)
  // ------------------------------
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],

  // ------------------------------
  // GUIDES (REFERENCED USERS)
  // ------------------------------
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'               // Referencing User collection
    }
  ],

},{
  // Enable virtual properties in JSON & Object outputs
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}); 

// ==============================
// VIRTUAL PROPERTIES
// ==============================

// Computed property (not stored in DB)
// Example: duration = 7 → durationWeeks = 1
tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7;
});

// ==============================
// VIRTUAL POPULATE (REVIEWS)
// ==============================
// Links Tour → Review without storing review IDs in Tour
// Enables: Tour.find().populate('reviews')
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',     // Field in Review schema
  localField: '_id'         // Field in Tour schema
});

// ==============================
// DOCUMENT MIDDLEWARE
// Runs ONLY on .save() & .create()
// ==============================
tourSchema.pre('save', function(next){
  // Automatically create slug before saving tour
  this.slug = slugify(this.name, { lower: true });
  next();
});

// ==============================
// QUERY MIDDLEWARE
// Runs on find, findOne, findById, etc.
// ==============================

// Measure query execution time
tourSchema.pre(/^find/, function(next){
  this.start = Date.now();
  next();
});

// Automatically populate guides whenever tours are fetched
tourSchema.pre(/^find/, function(next){
  this.populate({
    path:'guides',
    select: '-__v'           // Exclude __v field
  });
  next();
});

// Log query execution time
tourSchema.post(/^find/, function(doc, next){
  console.log(`Query took ${Date.now() - this.start} milliseconds.`);
  next();
});

// ==============================
// AGGREGATION MIDDLEWARE
// Runs before any aggregation pipeline
// ==============================
tourSchema.pre('aggregate', function(next){
  // Hide secret tours from aggregation results
  this.pipeline().unshift({ 
    $match : { secretTour : { $ne: true } }
  });
  console.log(this.pipeline());
  next();
});

// ==============================
// MODEL EXPORT
// ==============================
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
