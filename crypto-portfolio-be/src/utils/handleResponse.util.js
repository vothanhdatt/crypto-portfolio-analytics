const sendSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({
    status: true,
    data,
    message,
  });

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    status: false,
    data: error.details || null,
    message: statusCode === 500 ? 'Internal server error' : error.message,
  });
};

const notFound = (req, res) =>
  res.status(404).json({
    status: false,
    data: null,
    message: 'This route is not defined',
  });

module.exports = {
  notFound,
  sendError,
  sendSuccess,
};

