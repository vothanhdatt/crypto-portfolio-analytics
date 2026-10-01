const Decimal = require('decimal.js');
const AppError = require('../../utils/app-error.util');

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const ZERO = new Decimal(0);
const decimalString = (value) => value.toFixed();

const createPositionState = (symbol) => ({
  symbol,
  quantity: new Decimal(0),
  costBasis: new Decimal(0),
  realizedPnl: new Decimal(0),
  totalFees: new Decimal(0),
});

const calculatePortfolio = ({ trades, prices }) => {
  const orderedTrades = [...trades].sort(
    (left, right) =>
      Date.parse(left.timestamp) - Date.parse(right.timestamp) || left.tradeId.localeCompare(right.tradeId)
  );
  const priceBySymbol = new Map(prices.map((price) => [price.symbol, price]));
  const states = new Map();

  orderedTrades.forEach((trade) => {
    const state = states.get(trade.symbol) || createPositionState(trade.symbol);
    const quantity = new Decimal(trade.quantity);
    const price = new Decimal(trade.priceUsd);
    const fee = new Decimal(trade.feeUsd);
    const grossValue = quantity.times(price);

    state.totalFees = state.totalFees.plus(fee);

    if (trade.side === 'BUY') {
      state.quantity = state.quantity.plus(quantity);
      state.costBasis = state.costBasis.plus(grossValue).plus(fee);
    } else {
      if (quantity.greaterThan(state.quantity)) {
        throw new AppError(`Trade ${trade.tradeId} would create a short ${trade.symbol} position`, 422, [
          {
            row: trade.sourceRow || null,
            tradeId: trade.tradeId,
            field: 'quantity',
            code: 'SHORT_POSITION',
            message: `SELL quantity ${trade.quantity} exceeds available ${state.quantity.toFixed()} ${trade.symbol}.`,
          },
        ]);
      }

      const averageCost = state.quantity.isZero() ? ZERO : state.costBasis.dividedBy(state.quantity);
      const costRemoved = averageCost.times(quantity);
      const netProceeds = grossValue.minus(fee);

      state.realizedPnl = state.realizedPnl.plus(netProceeds.minus(costRemoved));
      state.quantity = state.quantity.minus(quantity);
      state.costBasis = state.costBasis.minus(costRemoved);

      if (state.quantity.isZero()) {
        state.quantity = new Decimal(0);
        state.costBasis = new Decimal(0);
      }
    }

    states.set(trade.symbol, state);
  });

  const valuedStates = [...states.values()].map((state) => {
    const priceRecord = priceBySymbol.get(state.symbol);
    if (!state.quantity.isZero() && !priceRecord) {
      throw new AppError(`Current price is missing for open ${state.symbol} position`, 422, [
        {
          field: 'price_usd',
          code: 'MISSING_CURRENT_PRICE',
          message: `Add a current price for ${state.symbol} before calculating the portfolio.`,
        },
      ]);
    }

    const currentPrice = priceRecord ? new Decimal(priceRecord.priceUsd) : new Decimal(0);
    const currentValue = state.quantity.times(currentPrice);
    const unrealizedPnl = currentValue.minus(state.costBasis);
    const totalPnl = state.realizedPnl.plus(unrealizedPnl);
    const averageCost = state.quantity.isZero() ? new Decimal(0) : state.costBasis.dividedBy(state.quantity);

    return {
      ...state,
      averageCost,
      currentPrice: priceRecord ? currentPrice : null,
      currentValue,
      unrealizedPnl,
      totalPnl,
    };
  });

  const totals = valuedStates.reduce(
    (result, state) => ({
      currentValue: result.currentValue.plus(state.currentValue),
      currentCostBasis: result.currentCostBasis.plus(state.costBasis),
      realizedPnl: result.realizedPnl.plus(state.realizedPnl),
      unrealizedPnl: result.unrealizedPnl.plus(state.unrealizedPnl),
      totalPnl: result.totalPnl.plus(state.totalPnl),
      totalFees: result.totalFees.plus(state.totalFees),
    }),
    {
      currentValue: new Decimal(0),
      currentCostBasis: new Decimal(0),
      realizedPnl: new Decimal(0),
      unrealizedPnl: new Decimal(0),
      totalPnl: new Decimal(0),
      totalFees: new Decimal(0),
    }
  );

  const positions = valuedStates
    .filter((state) => !state.quantity.isZero() || !state.realizedPnl.isZero())
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
    .map((state) => ({
      symbol: state.symbol,
      quantity: decimalString(state.quantity),
      averageCost: decimalString(state.averageCost),
      currentPrice: state.currentPrice ? decimalString(state.currentPrice) : null,
      currentCostBasis: decimalString(state.costBasis),
      currentValue: decimalString(state.currentValue),
      realizedPnl: decimalString(state.realizedPnl),
      unrealizedPnl: decimalString(state.unrealizedPnl),
      totalPnl: decimalString(state.totalPnl),
      allocation: totals.currentValue.isZero() ? '0' : decimalString(state.currentValue.dividedBy(totals.currentValue)),
      totalFees: decimalString(state.totalFees),
    }));

  const transactions = orderedTrades.map((trade) => {
    const grossValue = new Decimal(trade.quantity).times(trade.priceUsd);
    return {
      tradeId: trade.tradeId,
      timestamp: trade.timestamp,
      exchange: trade.exchange,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      priceUsd: trade.priceUsd,
      feeUsd: trade.feeUsd,
      grossValue: decimalString(grossValue),
    };
  });

  return {
    priceAsOf: prices[0]?.asOf || null,
    summary: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, decimalString(value)])),
    positions,
    transactions,
    transactionCount: transactions.length,
  };
};

module.exports = {
  calculatePortfolio,
};
