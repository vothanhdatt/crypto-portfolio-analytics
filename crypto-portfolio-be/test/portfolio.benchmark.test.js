const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Decimal = require('decimal.js');
const { calculatePortfolio } = require('../src/domain/portfolio/portfolio.calculator');
const { parsePriceCsv, parseTradeCsv } = require('../src/modules/import/import.parser');
const { createDefaultStore } = require('../src/modules/portfolio/portfolio.store');

const dataPath = (filename) => path.resolve(__dirname, '../data', filename);

test('sample data reconciles to the assessment benchmark', () => {
  const portfolio = createDefaultStore().getSnapshot();
  const rounded = (value) => new Decimal(value).toFixed(2);

  assert.equal(portfolio.transactionCount, 200);
  assert.equal(portfolio.priceAsOf, '2026-03-31T23:59:59Z');
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

  const reconcile = (field) =>
    portfolio.positions.reduce((total, position) => total.plus(position[field]), new Decimal(0));

  for (const field of ['currentValue', 'currentCostBasis', 'realizedPnl', 'unrealizedPnl', 'totalPnl', 'totalFees']) {
    assert.equal(rounded(reconcile(field)), rounded(portfolio.summary[field]));
  }

  const allocation = portfolio.positions.reduce((total, position) => total.plus(position.allocation), new Decimal(0));
  assert.equal(allocation.toFixed(20), '1.00000000000000000000');
});

test('reversing every row in the sample trade CSV produces the same portfolio', () => {
  const originalCsv = fs.readFileSync(dataPath('trades.csv'), 'utf8').trim();
  const prices = parsePriceCsv(fs.readFileSync(dataPath('prices.csv')));
  const [header, ...rows] = originalCsv.split(/\r?\n/);
  const reversedCsv = [header, ...rows.reverse()].join('\n');

  const original = calculatePortfolio({ trades: parseTradeCsv(originalCsv), prices });
  const reversed = calculatePortfolio({ trades: parseTradeCsv(reversedCsv), prices });

  assert.deepEqual(reversed, original);
});
