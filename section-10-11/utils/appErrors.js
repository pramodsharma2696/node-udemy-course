// Custom error class to handle operational errors in the app
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Call parent Error constructor with message

    this.statusCode = statusCode;  // HTTP status code
      // If status code starts with 4 → client error ('fail'), else server error ('error')
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark this as an operational error (trusted error)
     // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
