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
          // Only validate if password is modified
          if (!this.isModified('password')) return true;
            return value === this.password;
          },
          message: 'Password does not match'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type: Boolean,
        default: true,
        select: false
    },
});

//DOCUMENT MiDDLEWARE
userSchema.pre('save',  async function(next){
  if(!this.isModified("password")) return next();
    //Hash the pass with cost of 12
   this.password = await bcrypt.hash(this.password, 12); 
   this.passwordConfirm = undefined;  //delete the passwordConfirm field
   // Update passwordChangedAt
  if(!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
  }

    next();
})

//automatically filter out active: false users
userSchema.pre(/^find/, function (next) {
   // active: false ideally will be filter out but in case to get user, set this
  // if (this.getOptions().skipActiveFilter) return next()
  this.find({ active: { $ne: false } });
  next();
});
//Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// compare plain new password with hashed password in DB
userSchema.methods.isSameAsOldPassword = async function (newPassword) {
  return await bcrypt.compare(newPassword, this.password);
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