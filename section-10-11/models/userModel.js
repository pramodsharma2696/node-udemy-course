const mongoose = require('mongoose');
var validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ==============================
// USER SCHEMA DEFINITION
// ==============================
const userSchema = new mongoose.Schema({

  // ------------------------------
  // BASIC USER INFORMATION
  // ------------------------------
  name:{
    type: String,
    required: [true, 'Pleae tell us your name'] // Validation: name is mandatory
  },

  email:{
    type: String,
    required: [true, 'Pleae tell us your email'], // Validation: email required
    unique: true,                                 // Enforces unique emails
    lowercase: true,                              // Convert email to lowercase
    validate:[validator.isEmail, 'Please provide a valid email']
  },

  photo: String,                                  // Profile image filename

  // ------------------------------
  // ROLE & PERMISSIONS
  // ------------------------------
  role:{
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // Allowed roles
    default:'user'
  },

  // ------------------------------
  // AUTHENTICATION FIELDS
  // ------------------------------
  password:{
    type: String,
    required: [true, 'Pleae provide a password'],
    minlength: 8,
    select: false                                 // Never return password in queries
  },

  // Used ONLY for validation, never stored in DB
  passwordConfirm:{
    type: String,
    required: function () {
      // Required only when creating or updating password
      return this.isNew || this.isModified('password');
    },
    validate: {
      validator: function (value) {
        // Skip validation if password wasn't changed
        if (!this.isModified('password')) return true;
        return value === this.password;
      },
      message: 'Password does not match'
    }
  },

  // Timestamp to invalidate old JWTs
  passwordChangedAt: Date,

  // Password reset fields
  passwordResetToken: String,
  passwordResetExpires: Date,

  // ------------------------------
  // SOFT DELETE FLAG
  // ------------------------------
  active:{
    type: Boolean,
    default: true,
    select: false                                 // Hide from query output
  },
});

// ==============================
// DOCUMENT MIDDLEWARE
// Runs before .save() and .create()
// ==============================
userSchema.pre('save', async function(next){

  // Skip if password is not modified
  if(!this.isModified("password")) return next();

  // Hash password using bcrypt (cost factor = 12)
  this.password = await bcrypt.hash(this.password, 12);

  // Remove passwordConfirm field before saving
  this.passwordConfirm = undefined;

  // Update passwordChangedAt only for existing users
  if(!this.isNew) {
    // Subtract 1s to ensure token is issued AFTER password change
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

// ==============================
// QUERY MIDDLEWARE
// Automatically filters inactive users
// ==============================
userSchema.pre(/^find/, function (next) {
  // Exclude users where active = false (soft delete)
  this.find({ active: { $ne: false } });
  next();
});

// ==============================
// INSTANCE METHODS
// ==============================

// Compare login password with hashed password in DB
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Prevent reusing old password during update
userSchema.methods.isSameAsOldPassword = async function (newPassword) {
  return await bcrypt.compare(newPassword, this.password);
};

// Check if password was changed AFTER JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // true → password changed
  }
  // false → password NOT changed
  return false;
};

// Generate secure password reset token
userSchema.methods.createPasswordResetToken = function () {

  // Create random token (sent to user)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store hashed version in DB (security best practice)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token valid for 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; // Plain token sent via email
};

// ==============================
// MODEL EXPORT
// ==============================
const User = mongoose.model('User', userSchema);

module.exports = User;
