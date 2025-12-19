const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appErrors');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const rateLimit  = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


const app = express();


//Security HTTP headers
app.use(helmet());

// 1. GLOBAL MIDDLEWARES

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Rate limiting (API protection)

const limiter = rateLimit({
  max: 100, // max requests
  windowMs: 60 * 60 * 1000, // 1 hour
  // message: 'Too many requests from this IP, please try again in an hour'
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many requests, please try again later'
    });
  }
});

app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));

//DATA SANITIZATION (Prevent NoSQL injection, XSS attacks)

app.use(mongoSanitize()); //NoSQL
app.use(xss()); //XSS
app.use(hpp({
  //hpp() automatically removes duplicate query parameters
  //GET /api/v1/tours?duration=5&duration=9&price=100. // { duration: '9', price: '100' }
  //we can whitelist some parameter to get execuated more then once
  //GET /api/v1/tours?difficulty=easy&difficulty=medium&duration=5&duration=9
  // { difficulty: ['easy','medium'], duration: '9' } 
  whitelist: [
    'price',
    'ratingsAverage',
    'ratingsQuantity',
    'difficulty'
  ]
})); // parameter pollution,e.g filter

// Query parser (Express 5 default = "simple")
app.set('query parser', 'extended');

// Serving static files
app.use(express.static(`${__dirname}/public`));

// 2. ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// 3. UNHANDLED ROUTES
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// 4. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
