const { createController } = require('../../utils/controller.util');
const service = require('./import.service');

module.exports = {
  describeImport: createController(service.describeImport, 'Import requirements'),
};

