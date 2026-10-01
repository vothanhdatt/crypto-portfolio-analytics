const { sendError } = require('../utils/handleResponse.util');

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.name === 'MulterError') {
    error.statusCode = 400;
    error.details = [
      {
        field: error.field || 'file',
        code: error.code,
        message: error.code === 'LIMIT_FILE_SIZE' ? 'The CSV file must not exceed 5 MB.' : error.message,
      },
    ];
  }

  console.error(`[${req.method}] ${req.originalUrl}`, error);
  return sendError(res, error);
};

module.exports = {
  errorHandler,
};
