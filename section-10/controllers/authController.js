const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appErrors');


const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async(req, res, next) => {
    const { name, email, password, passwordConfirm } = req.body;
   const newUser = await User.create({name, email, password, passwordConfirm });
    const token = signToken(newUser._id);
    //Remove password from output
    newUser.password = undefined;
    res.status(201).json({
        status: "success",
        token,
        data: { newUser }
    });
});


exports.login = catchAsync(async(req, res, next) => {
    const { email, password} = req.body;
    //1. check if email, password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    //2. check if user exist & password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    //3. if everything ok, send token to client
     const token = signToken(user._id);
     // Remove password before sending
    user.password = undefined;
    res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
  
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it’s there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
        );
    }

    // 2) Verification token
     const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3) Check if user still exists
     const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
        new AppError('The user belonging to this token no longer exists.', 401)
        );
    }
    // 4) Check if user changed password AFTER the token was issued
     if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
        new AppError('User recently changed password! Please log in again.', 401)
        );
    }
    // 5) Grant access to protected route
    req.user = currentUser;
    next();

});