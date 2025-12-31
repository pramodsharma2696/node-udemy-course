// ===================== CATCH ASYNC =====================
// Higher-order function to handle errors in async functions (controllers)
// Avoids writing try-catch in every async route handler

module.exports = fn => {
  return (req, res, next) => {
     // Execute the async function and catch any errors
    fn(req, res, next).catch(next); // Pass error to global error handler
  };
};
