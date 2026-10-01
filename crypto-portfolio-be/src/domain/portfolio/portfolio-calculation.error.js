class PortfolioCalculationError extends Error {
  constructor({ code, message, context = {} }) {
    super(message);
    this.name = 'PortfolioCalculationError';
    this.code = code;
    this.context = context;
  }
}

module.exports = PortfolioCalculationError;
