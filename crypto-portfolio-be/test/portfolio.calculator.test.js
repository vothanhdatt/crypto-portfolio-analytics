const assert = require('node:assert/strict');
const test = require('node:test');
const Decimal = require('decimal.js');
const { calculatePortfolio } = require('../src/modules/portfolio/portfolio.calculator');
const { createDefaultStore } = require('../src/modules/portfolio/portfolio.store');

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
    (error) => error.statusCode === 422 && error.details[0].code === 'SHORT_POSITION'
  );
});

test('calculation rejects a missing price for an open position', () => {
  assert.throws(
    () =>
      positionFrom(
        [trade({ tradeId: 'T-1', timestamp: '2026-01-01T00:00:00Z', side: 'BUY', quantity: '1', priceUsd: '100' })],
        []
      ),
    (error) => error.statusCode === 422 && error.details[0].code === 'MISSING_CURRENT_PRICE'
  );
});

test('sample data reconciles to the assessment benchmark', () => {
  const portfolio = createDefaultStore().getSnapshot();
  const rounded = (value) => new Decimal(value).toFixed(2);

  assert.equal(portfolio.transactionCount, 200);
  assert.equal(portfolio.priceAsOf, asOf);
  assert.equal(rounded(portfolio.summary.currentValue), '60620.89');
  assert.equal(rounded(portfolio.summary.currentCostBasis), '59969.24');
  assert.equal(rounded(portfolio.summary.realizedPnl), '-5052.96');
  assert.equal(rounded(portfolio.summary.unrealizedPnl), '651.65');
  assert.equal(rounded(portfolio.summary.totalPnl), '-4401.31');
  assert.equal(portfolio.summary.totalFees, '2708.86');
  assert.equal(portfolio.positions.length, 5);

  const positions = Object.fromEntries(portfolio.positions.map((position) => [position.symbol, position]));
  assert.equal(positions.BTC.quantity, '0.0774292');
  assert.equal(rounded(positions.BTC.totalPnl), '-944.73');
  assert.equal(positions.CKB.quantity, '1947047');
  assert.equal(rounded(positions.CKB.totalPnl), '2038.25');
  assert.equal(positions.DOGE.quantity, '63970.78');
  assert.equal(rounded(positions.DOGE.totalPnl), '-1605.09');
  assert.equal(positions.ETH.quantity, '2.846898');
  assert.equal(rounded(positions.ETH.totalPnl), '-1174.09');
  assert.equal(positions.SOL.quantity, '53.3643');
  assert.equal(rounded(positions.SOL.totalPnl), '-2715.66');

  const allocation = portfolio.positions.reduce((total, position) => total.plus(position.allocation), new Decimal(0));
  assert.equal(allocation.toFixed(20), '1.00000000000000000000');
});
