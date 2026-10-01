const { sendError } = require('../utils/handleResponse.util');

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  console.error(`[${req.method}] ${req.originalUrl}`, error);
  return sendError(res, error);
};

module.exports = {
  errorHandler,
};

