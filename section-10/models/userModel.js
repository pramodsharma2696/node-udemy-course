const mongoose = require('mongoose');
var validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Pleae tell us your name']
    },
     email:{
        type: String,
        required: [true, 'Pleae tell us your email'],
        unique: true,
        lowercase: true,
        validate:[validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role:{
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default:'user'
    },
    password:{
        type: String,
        required: [true, 'Pleae provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm:{
        type: String,
        required: function () {
          return this.isNew || this.isModified('password');
        },
        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: 'Password does not match'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

//DOCUMENT MiDDLEWARE
userSchema.pre('save',  async function(next){
  if(!this.isModified("password")) return next();
    //Hash the pass with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    //delete the passwordConfirm field
    this.passwordConfirm = undefined;
    next();
})

//Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// checks if password changed after JWT issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp; // true → password was changed
  }
  // false means NOT changed
  return false;
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // ensure token is always after password change
  next();
});

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;