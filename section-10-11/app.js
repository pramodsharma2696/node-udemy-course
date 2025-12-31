const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appErrors');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const rateLimit  = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


const app = express();


// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet());

// ==================== GLOBAL MIDDLEWARES ====================

// Logging requests in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Rate limiting to prevent brute-force / API abuse
const limiter = rateLimit({
  max: 100,// Max requests from same IP
  windowMs: 60 * 60 * 1000, // 1 hour
  // message: 'Too many requests from this IP, please try again in an hour'
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many requests, please try again later'
    });
  }
});

app.use('/api', limiter); // Apply rate limiter to all /api routes

// Body parser: read JSON from request body
app.use(express.json({ limit: '10kb' }));  // Limit body size to 10kb

// ==================== DATA SANITIZATION ====================

app.use(mongoSanitize()); // Prevent NoSQL query injection
app.use(xss()); // Prevent XSS attacks (malicious HTML/JS)
app.use(hpp({ // Prevent HTTP parameter pollution (duplicate query params)
  //hpp() automatically removes duplicate query parameters
  //GET /api/v1/tours?duration=5&duration=9&price=100. // { duration: '9', price: '100' }
  //we can whitelist some parameter to get execuated more then once
  //GET /api/v1/tours?difficulty=easy&difficulty=medium&duration=5&duration=9
  // { difficulty: ['easy','medium'], duration: '9' } 
  whitelist: [
     // Whitelist allows these fields to appear multiple times
    'price',
    'ratingsAverage',
    'ratingsQuantity',
    'difficulty'
  ]
})); // parameter pollution,e.g filter

// Use extended query parser (Express 5 default = "simple")
app.set('query parser', 'extended');

// Serve static files from "public" folder
app.use(express.static(`${__dirname}/public`));

// ==================== ROUTES ====================

// Mount routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// ==================== UNHANDLED ROUTES ====================
// Handle all routes not defined above
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use(globalErrorHandler);

module.exports = app;
