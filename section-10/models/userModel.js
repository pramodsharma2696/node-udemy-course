const mongoose = require('mongoose');
var validator = require('validator');
const bcrypt = require('bcryptjs');


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
    password:{
        type: String,
        required: [true, 'Pleae provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm:{
        type: String,
        required: [true, 'Pleae confirm your password'],
        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: 'Password does not match'
      }
    },
    passwordChangedAt: Date
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



const User = mongoose.model('User', userSchema);

module.exports = User;