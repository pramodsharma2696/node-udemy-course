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
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    user.password = undefined;
    res.status(statusCode).json({
      status: 'success',
      token,
      data:{
        user
      }
  });
};

exports.signup = catchAsync(async(req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
   const newUser = await User.create({name, email, password, passwordConfirm });
   createSendToken(newUser, 201, res);
});


exports.login = catchAsync(async(req, res, next) => {
    const { email, password} = req.body;
    //1. check if email, password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    //2. check if user exist & password is correct
    const user = await User.findOne({ email }).select('+password');
    // const user = await User.findOne({ email }).select('+password +active').setOptions({ skipActiveFilter: true });

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
     // 3.) If user is deleted / inactive
    // if (!user.active) {
    //   return next(
    //     new AppError(
    //       'Your account has been deactivated. Please contact support.',
    //       403
    //     )
    //   );
    // }

    //4. if everything ok, send token to client
    createSendToken(user, 201, res);
  
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
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    } catch (err) {
      // Handle JWT-specific errors
      if (err.name === 'TokenExpiredError') {
        return next(
          new AppError('Your session has expired. Please log in again.', 401)
        );
      }
      if (err.name === 'JsonWebTokenError') {
        return next(
          new AppError('Invalid authentication token. Please log in again.', 401)
        );
      }
      // Fallback
      return next(
        new AppError('Authentication failed. Please log in again.', 401)
      );
    }

    // 3) Check if user still exists
     const currentUser = await User.findById(decoded.id);
    //  const currentUser = await User.findById(decoded.id).select('+active').setOptions({ skipActiveFilter: true });
     
     //User not found at all
    if (!currentUser) {
        return next(
        new AppError('The user belonging to this token no longer exists.', 401)
        );
    }
    //User is deactivated
    //   if (!currentUser.active) {
    //   return next(
    //     new AppError(
    //       'Your account has been deactivated. Please contact support.',
    //       403
    //     )
    //   );
    // }

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
    // 3. Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
   
    // 4. Send email  
     const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token (valid for 10 minutes)',
      message
    });
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
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
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
     createSendToken(user, 200, res);
});


exports.UpdatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  //2. Check if posted Current Password is correct
  const isCorrect = await user.correctPassword(req.body.currentPassword, user.password);

  if (!isCorrect) {
    return next(new AppError("Your current password is wrong", 401));
  }

   // 3) Check new password is not same as old password
    const isSamePassword = await user.isSameAsOldPassword(req.body.newPassword);

    if (isSamePassword) {
      return next(
        new AppError('New password must be different from the current password', 400)
      );
    }
    // 4) Update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    await user.save();

  // 5) Send new JWT
  createSendToken(user, 200, res);

}); 