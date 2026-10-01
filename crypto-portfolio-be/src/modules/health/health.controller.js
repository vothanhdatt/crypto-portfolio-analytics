const { createController } = require('../../utils/controller.util');
const service = require('./health.service');

module.exports = {
  getHealth: createController(service.getHealth, 'API is healthy'),
};

