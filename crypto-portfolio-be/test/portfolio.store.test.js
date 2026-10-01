const assert = require('node:assert/strict');
const test = require('node:test');
const { PortfolioStore } = require('../src/modules/portfolio/portfolio.store');

const header = 'trade_id,timestamp,exchange,symbol,side,quantity,price_usd,fee_usd';
const initialTrades = [header, 'T-1,2026-01-01T00:00:00Z,Binance,BTC,BUY,1,100,0'].join('\n');
const prices = ['as_of,symbol,price_usd', '2026-03-31T23:59:59Z,BTC,125'].join('\n');

test('invalid import is atomic and leaves the previous portfolio unchanged', () => {
  const store = new PortfolioStore({ tradesCsv: initialTrades, pricesCsv: prices });
  const before = store.getSnapshot();
  const invalid = [header, 'T-2,2026-01-02T00:00:00Z,Binance,BTC,SELL,2,120,0'].join('\n');

  assert.throws(
    () => store.importTrades(invalid),
    (error) => error.statusCode === 400
  );
  assert.deepEqual(store.getSnapshot(), before);
});

test('valid import replaces the dataset and reset restores sample trades', () => {
  const store = new PortfolioStore({ tradesCsv: initialTrades, pricesCsv: prices });
  const imported = [header, 'T-2,2026-01-02T00:00:00Z,Coinbase,BTC,BUY,2,110,1'].join('\n');

  const importedSnapshot = store.importTrades(imported);
  assert.equal(importedSnapshot.source, 'import');
  assert.equal(importedSnapshot.summary.currentCostBasis, '221');
  assert.equal(importedSnapshot.transactionCount, 1);

  const resetSnapshot = store.reset();
  assert.equal(resetSnapshot.source, 'sample');
  assert.equal(resetSnapshot.summary.currentCostBasis, '100');
});

test('store translates domain calculation errors into application errors', () => {
  const pricesWithoutBtc = ['as_of,symbol,price_usd', '2026-03-31T23:59:59Z,ETH,125'].join('\n');

  assert.throws(
    () => new PortfolioStore({ tradesCsv: initialTrades, pricesCsv: pricesWithoutBtc }),
    (error) => {
      assert.equal(error.name, 'AppError');
      assert.equal(error.statusCode, 422);
      assert.equal(error.details[0].code, 'MISSING_CURRENT_PRICE');
      assert.equal(error.details[0].symbol, 'BTC');
      return true;
    }
  );
});
