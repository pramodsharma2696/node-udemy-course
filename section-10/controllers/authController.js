const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appErrors');
const sendEmail = require('../utils/email');



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

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin', 'lead-guide'] etc
    if (!roles.includes(req.user.role)) {
       return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
     next();
  };
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
     // 1. Get user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('No user found with that email.', 404));
    }
     // 2. Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
   // console.log(user.passwordResetToken, user.passwordResetExpires);
    // 3. Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // console.log('resetURL = ', resetURL);
    
    // 4. Send email (pseudo)
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password reset token (valid for 10 minutes)',
    //   message: `Forgot your password? Reset here:\n${resetURL}`
    // });
    console.log(`sending email to: ${user.email} with link: ${resetURL}`);
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending email. Try again later.', 500));
  }
});

exports.resetPassword = catchAsync(async(req, res, next) => {
    // 1. Hash token from URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
     // 2. Find user by token + expiry
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
     if (!user) {
        return next(new AppError('Token is invalid or has expired.', 400));
    }
     // 3. Set new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
     // 4. Log user in (send JWT)
    const token = signToken(user._id);
    user.password = undefined;
    res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});