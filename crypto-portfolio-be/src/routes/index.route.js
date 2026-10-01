const apiRoutes = require('./api.route');
const portfolioApiRoutes = require('./portfolio-api.route');
const { notFound } = require('../utils/handleResponse.util');

const initRoutes = (app) => {
  app.use('/api', portfolioApiRoutes);
  app.use('/api/v1', apiRoutes);
  app.use(notFound);
};

module.exports = initRoutes;
