module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let firstError = null;  // Will store the first error message for client

 // ================= MONGOOSE VALIDATION ERROR =================
  // This occurs when schema validation fails (e.g., required field missing)
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors)
      .map(error => error.message) // Extract each error message
      .join(', '); // Combine multiple messages into one string
    firstError = errors;
    err.isOperational = true;  // Mark as known operational error
  }

    // ================= MONGOOSE CAST ERROR =================
  // Occurs when an invalid MongoDB ID is provided in params
  if (err.name === 'CastError') {
    firstError = `Invalid ${err.path}: ${err.value}.`;
    err.isOperational = true;
  }

// ================= DUPLICATE KEY ERROR ================= (E11000)
 // Occurs when unique field value already exists in DB (e.g., email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    firstError = `Duplicate field value: '${err.keyValue[field]}'. Please use another ${field}.`;
    err.statusCode = 400;
    err.isOperational = true;
  }

  // ================= DEVELOPMENT MODE =================
   // Send full error details for easier debugging
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: firstError || err.message,
      // origin: err.stack?.split('\n')[1]?.trim()   // Optional: origin of error for debugging
    });
  }

// ================= PRODUCTION MODE =================
 // Only send known operational errors to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: firstError || err.message
    });
  }

 // ================= PROGRAMMING OR UNKNOWN ERROR =================
 // Log error internally, do not leak details to client
  console.error('ERROR :', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!'
  });
};
