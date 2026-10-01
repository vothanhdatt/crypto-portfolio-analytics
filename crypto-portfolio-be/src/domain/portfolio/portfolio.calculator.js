const Decimal = require('decimal.js');
const PortfolioCalculationError = require('./portfolio-calculation.error');

const PortfolioDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

const decimal = (value = 0) => new PortfolioDecimal(value);
const decimalString = (value) => value.toFixed();

const createPositionState = (symbol) => ({
  symbol,
  quantity: decimal(),
  costBasis: decimal(),
  realizedPnl: decimal(),
  totalFees: decimal(),
});

const byTimestampAndTradeId = (left, right) =>
  Date.parse(left.timestamp) - Date.parse(right.timestamp) || left.tradeId.localeCompare(right.tradeId);

const applyTrade = (states, trade) => {
  const state = states.get(trade.symbol) || createPositionState(trade.symbol);
  const quantity = decimal(trade.quantity);
  const executionPrice = decimal(trade.priceUsd);
  const fee = decimal(trade.feeUsd);
  const grossValue = quantity.times(executionPrice);

  state.totalFees = state.totalFees.plus(fee);

  if (trade.side === 'BUY') {
    state.quantity = state.quantity.plus(quantity);
    state.costBasis = state.costBasis.plus(grossValue).plus(fee);
    states.set(trade.symbol, state);
    return;
  }

  if (quantity.greaterThan(state.quantity)) {
    throw new PortfolioCalculationError({
      code: 'SHORT_POSITION',
      message: `Trade ${trade.tradeId} would create a short ${trade.symbol} position.`,
      context: {
        tradeId: trade.tradeId,
        symbol: trade.symbol,
        requestedQuantity: decimalString(quantity),
        availableQuantity: decimalString(state.quantity),
      },
    });
  }

  const averageCost = state.quantity.isZero() ? decimal() : state.costBasis.dividedBy(state.quantity);
  const costRemoved = averageCost.times(quantity);
  const netProceeds = grossValue.minus(fee);

  state.realizedPnl = state.realizedPnl.plus(netProceeds.minus(costRemoved));
  state.quantity = state.quantity.minus(quantity);
  state.costBasis = state.costBasis.minus(costRemoved);

  if (state.quantity.isZero()) {
    state.quantity = decimal();
    state.costBasis = decimal();
  }

  states.set(trade.symbol, state);
};

const valuePosition = (state, priceBySymbol) => {
  const priceRecord = priceBySymbol.get(state.symbol);

  if (!state.quantity.isZero() && !priceRecord) {
    throw new PortfolioCalculationError({
      code: 'MISSING_CURRENT_PRICE',
      message: `Current price is missing for open ${state.symbol} position.`,
      context: { symbol: state.symbol },
    });
  }

  const currentPrice = priceRecord ? decimal(priceRecord.priceUsd) : decimal();
  const currentValue = state.quantity.times(currentPrice);
  const unrealizedPnl = currentValue.minus(state.costBasis);

  return {
    ...state,
    averageCost: state.quantity.isZero() ? decimal() : state.costBasis.dividedBy(state.quantity),
    currentPrice: priceRecord ? currentPrice : null,
    currentValue,
    unrealizedPnl,
    totalPnl: state.realizedPnl.plus(unrealizedPnl),
  };
};

const sumPortfolio = (states) =>
  states.reduce(
    (result, state) => ({
      currentValue: result.currentValue.plus(state.currentValue),
      currentCostBasis: result.currentCostBasis.plus(state.costBasis),
      realizedPnl: result.realizedPnl.plus(state.realizedPnl),
      unrealizedPnl: result.unrealizedPnl.plus(state.unrealizedPnl),
      totalPnl: result.totalPnl.plus(state.totalPnl),
      totalFees: result.totalFees.plus(state.totalFees),
    }),
    {
      currentValue: decimal(),
      currentCostBasis: decimal(),
      realizedPnl: decimal(),
      unrealizedPnl: decimal(),
      totalPnl: decimal(),
      totalFees: decimal(),
    }
  );

const serializePosition = (state, portfolioValue) => ({
  symbol: state.symbol,
  quantity: decimalString(state.quantity),
  averageCost: decimalString(state.averageCost),
  currentPrice: state.currentPrice ? decimalString(state.currentPrice) : null,
  currentCostBasis: decimalString(state.costBasis),
  currentValue: decimalString(state.currentValue),
  realizedPnl: decimalString(state.realizedPnl),
  unrealizedPnl: decimalString(state.unrealizedPnl),
  totalPnl: decimalString(state.totalPnl),
  allocation: portfolioValue.isZero() ? '0' : decimalString(state.currentValue.dividedBy(portfolioValue)),
  totalFees: decimalString(state.totalFees),
});

const serializeTransaction = (trade) => ({
  tradeId: trade.tradeId,
  timestamp: trade.timestamp,
  exchange: trade.exchange,
  symbol: trade.symbol,
  side: trade.side,
  quantity: trade.quantity,
  priceUsd: trade.priceUsd,
  feeUsd: trade.feeUsd,
  grossValue: decimalString(decimal(trade.quantity).times(trade.priceUsd)),
});

const calculatePortfolio = ({ trades, prices }) => {
  const orderedTrades = [...trades].sort(byTimestampAndTradeId);
  const priceBySymbol = new Map(prices.map((price) => [price.symbol, price]));
  const states = new Map();

  orderedTrades.forEach((trade) => applyTrade(states, trade));

  const valuedStates = [...states.values()].map((state) => valuePosition(state, priceBySymbol));
  const totals = sumPortfolio(valuedStates);
  const positions = valuedStates
    .filter((state) => !state.quantity.isZero() || !state.realizedPnl.isZero())
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
    .map((state) => serializePosition(state, totals.currentValue));

  return {
    priceAsOf: prices[0]?.asOf || null,
    summary: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, decimalString(value)])),
    positions,
    transactions: orderedTrades.map(serializeTransaction),
    transactionCount: orderedTrades.length,
  };
};

module.exports = {
  calculatePortfolio,
};
