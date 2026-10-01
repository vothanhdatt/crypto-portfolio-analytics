const fs = require('node:fs');
const path = require('node:path');
const AppError = require('../../utils/app-error.util');
const PortfolioCalculationError = require('../../domain/portfolio/portfolio-calculation.error');
const { calculatePortfolio } = require('../../domain/portfolio/portfolio.calculator');
const { parsePriceCsv, parseTradeCsv } = require('../import/import.parser');

const toApplicationError = (error) => {
  if (!(error instanceof PortfolioCalculationError)) throw error;

  const field = error.code === 'MISSING_CURRENT_PRICE' ? 'price_usd' : 'quantity';
  throw new AppError(error.message, 422, [
    {
      field,
      code: error.code,
      message: error.message,
      ...error.context,
    },
  ]);
};

const calculateSnapshot = (input) => {
  try {
    return calculatePortfolio(input);
  } catch (error) {
    return toApplicationError(error);
  }
};

class PortfolioStore {
  constructor({ tradesCsv, pricesCsv }) {
    this.sampleTrades = parseTradeCsv(tradesCsv);
    this.prices = parsePriceCsv(pricesCsv);
    this.currentTrades = this.sampleTrades;
    this.source = 'sample';
    this.snapshot = calculateSnapshot({ trades: this.currentTrades, prices: this.prices });
  }

  getSnapshot() {
    return {
      ...this.snapshot,
      source: this.source,
    };
  }

  importTrades(csv) {
    const candidateTrades = parseTradeCsv(csv);
    const candidateSnapshot = calculateSnapshot({ trades: candidateTrades, prices: this.prices });

    this.currentTrades = candidateTrades;
    this.snapshot = candidateSnapshot;
    this.source = 'import';
    return this.getSnapshot();
  }

  reset() {
    this.currentTrades = this.sampleTrades;
    this.snapshot = calculateSnapshot({ trades: this.currentTrades, prices: this.prices });
    this.source = 'sample';
    return this.getSnapshot();
  }
}

const dataPath = (filename) => path.resolve(__dirname, '../../../data', filename);
let defaultStore;

const createDefaultStore = () =>
  new PortfolioStore({
    tradesCsv: fs.readFileSync(dataPath('trades.csv')),
    pricesCsv: fs.readFileSync(dataPath('prices.csv')),
  });

const getPortfolioStore = () => {
  if (!defaultStore) defaultStore = createDefaultStore();
  return defaultStore;
};

module.exports = {
  PortfolioStore,
  createDefaultStore,
  getPortfolioStore,
};
