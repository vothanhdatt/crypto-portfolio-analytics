const fs = require('node:fs');
const path = require('node:path');
const { parsePriceCsv, parseTradeCsv } = require('../import/import.parser');
const { calculatePortfolio } = require('./portfolio.calculator');

class PortfolioStore {
  constructor({ tradesCsv, pricesCsv }) {
    this.sampleTrades = parseTradeCsv(tradesCsv);
    this.prices = parsePriceCsv(pricesCsv);
    this.currentTrades = this.sampleTrades;
    this.source = 'sample';
    this.snapshot = calculatePortfolio({ trades: this.currentTrades, prices: this.prices });
  }

  getSnapshot() {
    return {
      ...this.snapshot,
      source: this.source,
    };
  }

  importTrades(csv) {
    const candidateTrades = parseTradeCsv(csv);
    const candidateSnapshot = calculatePortfolio({ trades: candidateTrades, prices: this.prices });

    this.currentTrades = candidateTrades;
    this.snapshot = candidateSnapshot;
    this.source = 'import';
    return this.getSnapshot();
  }

  reset() {
    this.currentTrades = this.sampleTrades;
    this.snapshot = calculatePortfolio({ trades: this.currentTrades, prices: this.prices });
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
