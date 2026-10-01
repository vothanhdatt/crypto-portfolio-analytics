const {
  SUPPORTED_EXCHANGES,
  SUPPORTED_SIDES,
  SUPPORTED_SYMBOLS,
} = require('../../constants/portfolio.constant');

const getCapabilities = async () => ({
  exchanges: SUPPORTED_EXCHANGES,
  symbols: SUPPORTED_SYMBOLS,
  sides: SUPPORTED_SIDES,
  costBasisMethod: 'weighted-average',
  implementationStatus: 'scaffolded',
});

module.exports = {
  getCapabilities,
};

