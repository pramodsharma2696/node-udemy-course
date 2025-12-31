const rateLimit = require('express-rate-limit');

// 🔐 Login limiter (brute-force protection)
exports.loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }
});

// 📧 Forgot password limiter (email abuse)
exports.forgotPasswordLimiter = rateLimit({
  max: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many password reset requests. Please try again later.'
    });
  }
});

// 📝 Signup limiter (bot protection)
exports.signupLimiter = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many accounts created from this IP.'
    });
  }
});
