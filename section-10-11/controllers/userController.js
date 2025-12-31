const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErrors');
const factory = require('./handlerFactory');
const filterObj = require('../utils/filterObject');




// GET ALL USERS
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

//UPDATE - current loggedIn user
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

//DELETE - current loggedIn user
exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+active');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  if (!user.active) {
    return next(new AppError('User already deleted', 400));
  }
  user.active = false;
  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// GET USER BY ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// CREATE USER : FOR ADMIN USE
// exports.createUser = catchAsync(async (req, res, next) => {
//   const user = await User.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       user,
//     },
//   });
// });

exports.createUser = factory.createOne(User);

// UPDATE USER
// exports.updateUser = catchAsync(async (req, res, next) => {
 
//   // 1) Filtered out unwanted fields names that are not allowed to be updated
//   const filteredBody = filterObj(req.body, 'name', 'email');

//   // 2) Update user document
//   const updatedUser = await User.findByIdAndUpdate(req.params.id, filteredBody, {
//     new: true,
//     runValidators: true
//   });

//   if (!updatedUser) {
//     return next(new AppError('No user found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       user:updatedUser,
//     },
//   });
// });

//DO NOT UPDATE PASSWORD HERE - update based on paramns ID : FOR ADMIN USE
exports.updateUser = factory.updateOne(User, ['name', 'email']);

// DELETE USER - based on paramns ID
// exports.deleteUser = catchAsync(async (req, res, next) => {
//   const user = await User.findByIdAndDelete(req.params.id);

//   if (!user) {
//     return next(new AppError('No user found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

// DELETE USER - based on paramns ID : FOR ADMIN USE
exports.deleteUser = factory.deleteOne(User);

