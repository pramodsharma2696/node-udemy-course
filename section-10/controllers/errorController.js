module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let firstError = null; 

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors)
      .map(error => error.message)
      .join(', ');
    firstError = errors;
    err.isOperational = true;
  }

  // Handle Mongoose CastError (Invalid MongoDB ID)
  if (err.name === 'CastError') {
    firstError = `Invalid ${err.path}: ${err.value}.`;
    err.isOperational = true;
  }

  // Handle Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    firstError = `Duplicate field value: '${err.keyValue[field]}'. Please use another ${field}.`;
    err.statusCode = 400;
    err.isOperational = true;
  }

  // DEVELOPMENT MODE
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: firstError || err.message,
      // origin: err.stack?.split('\n')[1]?.trim()
    });
  }

  // PRODUCTION MODE
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: firstError || err.message
    });
  }

  // PROGRAMMING OR UNKNOWN ERROR
  console.error('ERROR :', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!'
  });
};
