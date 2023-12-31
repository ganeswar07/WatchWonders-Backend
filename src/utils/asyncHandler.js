/**
 * Wraps an Express route handler to handle asynchronous operations and errors.
 * @param {Function} requestFunction - The Express route handler function.
 * @returns {Function} - An Express middleware function.
 */

const asyncHandler = (routeHandler) => {
  return async (req, res, next) => {
    try {
      await Promise.resolve(routeHandler(req, res, next));
    } catch (error) {
      next(error);
    }
  };
};
export { asyncHandler };
