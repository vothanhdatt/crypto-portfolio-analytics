const assert = require('node:assert/strict');
const test = require('node:test');
const PortfolioCalculationError = require('../src/domain/portfolio/portfolio-calculation.error');
const { calculatePortfolio } = require('../src/domain/portfolio/portfolio.calculator');

const asOf = '2026-03-31T23:59:59Z';
const prices = [{ asOf, symbol: 'BTC', priceUsd: '125' }];
const trade = ({ tradeId, timestamp, side, quantity, priceUsd, feeUsd = '0' }) => ({
  tradeId,
  timestamp,
  exchange: 'Binance',
  symbol: 'BTC',
  side,
  quantity,
  priceUsd,
  feeUsd,
});

const positionFrom = (trades, currentPrices = prices) =>
  calculatePortfolio({ trades, prices: currentPrices }).positions[0];

test('multiple BUYs use weighted-average cost and capitalize BUY fees', () => {
  const position = positionFrom([
    trade({
      tradeId: 'T-1',
      timestamp: '2026-01-01T00:00:00Z',
      side: 'BUY',
      quantity: '2',
      priceUsd: '100',
      feeUsd: '10',
    }),
    trade({
      tradeId: 'T-2',
      timestamp: '2026-01-02T00:00:00Z',
      side: 'BUY',
      quantity: '1',
      priceUsd: '130',
      feeUsd: '2',
    }),
  ]);

  assert.equal(position.quantity, '3');
  assert.equal(position.currentCostBasis, '342');
  assert.equal(position.averageCost, '114');
  assert.equal(position.totalFees, '12');
});

test('BUY fee is included in current cost basis', () => {
  const position = positionFrom([
    trade({
      tradeId: 'T-1',
      timestamp: '2026-01-01T00:00:00Z',
      side: 'BUY',
      quantity: '2',
      priceUsd: '100',
      feeUsd: '10',
    }),
  ]);

  assert.equal(position.currentCostBasis, '210');
  assert.equal(position.averageCost, '105');
});

test('partial SELL removes average cost and deducts SELL fees from realized P&L', () => {
  const position = positionFrom([
    trade({
      tradeId: 'T-1',
      timestamp: '2026-01-01T00:00:00Z',
      side: 'BUY',
      quantity: '2',
      priceUsd: '100',
      feeUsd: '10',
    }),
    trade({
      tradeId: 'T-2',
      timestamp: '2026-01-02T00:00:00Z',
      side: 'BUY',
      quantity: '1',
      priceUsd: '130',
      feeUsd: '2',
    }),
    trade({
      tradeId: 'T-3',
      timestamp: '2026-01-03T00:00:00Z',
      side: 'SELL',
      quantity: '1',
      priceUsd: '150',
      feeUsd: '5',
    }),
  ]);

  assert.equal(position.quantity, '2');
  assert.equal(position.currentCostBasis, '228');
  assert.equal(position.averageCost, '114');
  assert.equal(position.realizedPnl, '31');
  assert.equal(position.totalFees, '17');
});

test('SELL fee is deducted from gross proceeds', () => {
  const position = positionFrom([
    trade({ tradeId: 'T-1', timestamp: '2026-01-01T00:00:00Z', side: 'BUY', quantity: '1', priceUsd: '100' }),
    trade({
      tradeId: 'T-2',
      timestamp: '2026-01-02T00:00:00Z',
      side: 'SELL',
      quantity: '0.5',
      priceUsd: '120',
      feeUsd: '3',
    }),
  ]);

  assert.equal(position.quantity, '0.5');
  assert.equal(position.currentCostBasis, '50');
  assert.equal(position.realizedPnl, '7');
});

test('full close resets cost basis before a later BUY', () => {
  const position = positionFrom([
    trade({ tradeId: 'T-1', timestamp: '2026-01-01T00:00:00Z', side: 'BUY', quantity: '2', priceUsd: '100' }),
    trade({
      tradeId: 'T-2',
      timestamp: '2026-01-02T00:00:00Z',
      side: 'SELL',
      quantity: '2',
      priceUsd: '110',
      feeUsd: '2',
    }),
    trade({
      tradeId: 'T-3',
      timestamp: '2026-01-03T00:00:00Z',
      side: 'BUY',
      quantity: '1',
      priceUsd: '50',
      feeUsd: '1',
    }),
  ]);

  assert.equal(position.quantity, '1');
  assert.equal(position.currentCostBasis, '51');
  assert.equal(position.averageCost, '51');
  assert.equal(position.realizedPnl, '18');
});

test('calculation independently rejects a short position', () => {
  assert.throws(
    () =>
      positionFrom([
        trade({ tradeId: 'T-1', timestamp: '2026-01-01T00:00:00Z', side: 'SELL', quantity: '1', priceUsd: '100' }),
      ]),
    (error) => error instanceof PortfolioCalculationError && error.code === 'SHORT_POSITION'
  );
});

test('calculation rejects a missing price for an open position', () => {
  assert.throws(
    () =>
      positionFrom(
        [trade({ tradeId: 'T-1', timestamp: '2026-01-01T00:00:00Z', side: 'BUY', quantity: '1', priceUsd: '100' })],
        []
      ),
    (error) => error instanceof PortfolioCalculationError && error.code === 'MISSING_CURRENT_PRICE'
  );
});

test('calculation does not mutate input trades or prices', () => {
  const trades = Object.freeze([
    Object.freeze(
      trade({ tradeId: 'T-1', timestamp: '2026-01-01T00:00:00Z', side: 'BUY', quantity: '1', priceUsd: '100' })
    ),
  ]);
  const currentPrices = Object.freeze([Object.freeze({ asOf, symbol: 'BTC', priceUsd: '125' })]);

  const result = calculatePortfolio({ trades, prices: currentPrices });

  assert.equal(result.summary.currentValue, '125');
  assert.equal(trades[0].quantity, '1');
  assert.equal(currentPrices[0].priceUsd, '125');
});
