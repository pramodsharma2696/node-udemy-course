const mongoose = require('mongoose');

// ==============================
// REVIEW SCHEMA DEFINITION
// ==============================
const reviewSchema = new mongoose.Schema({

  // ------------------------------
  // REVIEW CONTENT
  // ------------------------------
  review: {
    type: String,
    required: [true, 'Review can not be empty'] // Review text is mandatory
  },

  rating: {
    type: Number,
    min: 1,                                     // Minimum rating value
    max: 5                                      // Maximum rating value
  },

  // Timestamp when review is created
  createdAt: {
    type: Date,
    default: Date.now()
  },

  // ------------------------------
  // TOUR REFERENCE
  // ------------------------------
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',                                // Reference to Tour model
    required: [true, 'Review must belong to a tour']
  },

  // ------------------------------
  // USER REFERENCE
  // ------------------------------
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',                                // Reference to User model
    required: [true, 'Review must belong to a user']
  }

},
{
  // Enable virtual properties when converting to JSON or plain objects
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}); 

// ==============================
// QUERY MIDDLEWARE
// ==============================

// Automatically populate user details whenever reviews are fetched
// This runs for: find, findOne, findById, etc.
reviewSchema.pre(/^find/, function(next){
  this.populate({
    path: 'user',                               // Populate user reference
    select: 'name photo'                        // Only include name & photo
  });
  next();
});

// ==============================
// MODEL EXPORT
// ==============================
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
