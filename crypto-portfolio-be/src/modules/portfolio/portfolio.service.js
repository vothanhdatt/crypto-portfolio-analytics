const { SUPPORTED_EXCHANGES, SUPPORTED_SIDES, SUPPORTED_SYMBOLS } = require('../../constants/portfolio.constant');
const { assertPortfolioSnapshot } = require('../../contracts/portfolio.contract');
const { getPortfolioStore } = require('./portfolio.store');

const getCapabilities = async () => ({
  exchanges: SUPPORTED_EXCHANGES,
  symbols: SUPPORTED_SYMBOLS,
  sides: SUPPORTED_SIDES,
  costBasisMethod: 'weighted-average',
  precision: 'decimal.js with 40 significant digits; no display rounding in the API',
  implementationStatus: 'ready',
});

const getOverview = async () => assertPortfolioSnapshot(getPortfolioStore().getSnapshot());

module.exports = {
  getCapabilities,
  getOverview,
};
