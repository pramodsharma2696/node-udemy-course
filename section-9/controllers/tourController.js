const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');


exports.getAllTours = catchAsync(async (req, res) => {
    const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    // EXECUTE
    const tours = await features.query;
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
});


exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    // if (!tour) {
    //   return res.status(404).json({
    //     status: 'fail',
    //     message: 'No tour found with that ID',
    //   });
    // }

    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  }
};


exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { tour: newTour },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const firstError = Object.values(err.errors)[0].message;
      return res.status(400).json({
        status: 'fail',
        message: firstError
      });
    }
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};


exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, 
      runValidators: true, 
    });

    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'No tour found with that ID',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};


exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'No tour found with that ID',
      });
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getToursStats = catchAsync( async (req, res) => {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage : { $gte: 4.5 }}
      },
      {
        $group:{
          _id:{$toUpper : '$difficulty'},
          // _id:'$difficulty',
          numTours: { $sum: 1},
          numRating: { $sum: '$ratingsQuantity'},
          avgRating: { $avg: '$ratingsAverage'},
          avgPrice: { $avg: '$price'},
          minPrice: { $min: '$price'},
          maxPrice: { $max: '$price'},
        }
      },
      {
         $sort:{avgPrice: 1}
      }
    ]);
    res.status(200).json({
      status: 'success',
      data: {stats},
    });
});

exports.getMonthlyPlan = async(req, res) =>{
  try {
      const year = req.params.year * 1;
      const plan = await Tour.aggregate([
        {
          $unwind: '$startDates'
        },
        {
          $match:{
            startDates:{
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            }
          }
        },
        {
          $group:{
            _id: { $month: '$startDates'},
            numTourStarts: { $sum: 1},
            tours: {$push: '$name'}
          }
        },
        {
          $addFields: {month: '$_id'}
        },
         {
          $project: {_id: 0}
        },
         {
          $sort: {numTourStarts: -1}
        }

      ]);
      res.status(200).json({
        status: 'success',
        data: {
          plan
        },
      });
  }catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
}