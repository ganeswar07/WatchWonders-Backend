const asyncHandler = (requestFunction) => {
  return (req, res, next) => {
    Promise
      .resolve(requestFunction(req, res, next))
      .catch((error) =>
       next(error)
      );
  };
};

export { asyncHandler };
