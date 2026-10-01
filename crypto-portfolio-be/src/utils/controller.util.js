const { sendSuccess } = require('./handleResponse.util');

const createController = (service, successMessage = 'Success') => async (req, res, next) => {
  try {
    const data = await service({
      body: req.body,
      file: req.file,
      params: req.params,
      query: req.query,
    });

    return sendSuccess(res, data, successMessage);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createController,
};

