const { createController } = require('../../utils/controller.util');
const service = require('./portfolio.service');

module.exports = {
  getCapabilities: createController(service.getCapabilities, 'Portfolio module capabilities'),
  getOverview: createController(service.getOverview, 'Portfolio calculated successfully'),
};
