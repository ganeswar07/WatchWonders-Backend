/**
 * Express middleware for handling errors.
 *
 * @param {Error} error - The error object.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @alias {number} 
 */

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  console.error(error.stack);

  res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
    errors: error.errors || [],
  });
};

export { errorHandler };
