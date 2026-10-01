const { createController } = require('../../utils/controller.util');
const service = require('./import.service');

module.exports = {
  describeImport: createController(service.describeImport, 'Import requirements'),
  importTrades: createController(service.importTrades, 'Trades imported successfully'),
  resetTrades: createController(service.resetTrades, 'Sample trades restored successfully'),
};
