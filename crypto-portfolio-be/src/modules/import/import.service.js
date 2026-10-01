const path = require('node:path');
const AppError = require('../../utils/app-error.util');
const { getPortfolioStore } = require('../portfolio/portfolio.store');
const { REQUIRED_PRICE_COLUMNS, REQUIRED_TRADE_COLUMNS } = require('./import.constant');

const describeImport = async () => ({
  requiredTradeColumns: REQUIRED_TRADE_COLUMNS,
  requiredPriceColumns: REQUIRED_PRICE_COLUMNS,
  maxFileSizeBytes: 5 * 1024 * 1024,
  atomic: true,
  implementationStatus: 'ready',
});

const importTrades = async ({ file }) => {
  if (!file) {
    throw new AppError('A trades CSV file is required in the "file" field', 400, [
      { field: 'file', code: 'FILE_REQUIRED', message: 'Select a CSV file and try again.' },
    ]);
  }

  if (path.extname(file.originalname || '').toLowerCase() !== '.csv') {
    throw new AppError('Only CSV files are supported', 400, [
      {
        field: 'file',
        code: 'INVALID_FILE_TYPE',
        message: 'Rename or export the input as a .csv file.',
        value: file.originalname,
      },
    ]);
  }

  return getPortfolioStore().importTrades(file.buffer);
};

const resetTrades = async () => getPortfolioStore().reset();

module.exports = {
  describeImport,
  importTrades,
  resetTrades,
};
