const mongoose = require('mongoose');
const slugify = require('slugify');
var validator = require('validator');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    validate: {
      validator: function (value) {
        return validator.isAlpha(value.replace(/\s/g, ''));
      },
      message: 'Tour name must be string'
    }
  },
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
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) must be less than actual price.'
    }
  },
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
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour:{
    type: Boolean,
    default: false
  }
},{
  //Include virtual data
  toJSON: { virtuals: true},
  toObject: { virtuals: true}
}); 

//VIRTUAL PROPERTIES
tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7;
})

//DOCUMENT MiDDLEWARE: pre & post - runs before .save() & .create() only

tourSchema.pre('save', function(next){
  this.slug = slugify(this.name, {lower: true});
  next();
})
// tourSchema.post('save', function(doc, next){
//   console.log(doc);
//   next();
// })

//QUERY MiDDLEWARE -  pre & post

tourSchema.pre(/^find/, function(next){ // used regular expression that will run for all query sdtatrt with findOne etc
// tourSchema.pre('find', function(next){
  // this.find({secretTour: {$ne: true}});
  this.start = Date.now();
  next();
})

tourSchema.post(/^find/, function(doc, next){
console.log(`Query took ${Date.now() - this.start} milliseconds.`);
  next();
})

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next){
  this.pipeline().unshift({ $match : { secretTour : {$ne: true }}});
  console.log(this.pipeline());
  next();
})

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
