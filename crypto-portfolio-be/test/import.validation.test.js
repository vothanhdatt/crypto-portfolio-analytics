const assert = require('node:assert/strict');
const test = require('node:test');
const { parsePriceCsv, parseTradeCsv } = require('../src/modules/import/import.parser');
const { findMissingColumns, isValidUtcTimestamp } = require('../src/modules/import/import.validation');
const { REQUIRED_TRADE_COLUMNS } = require('../src/modules/import/import.constant');

const tradeHeader = REQUIRED_TRADE_COLUMNS.join(',');
const tradeCsv = (...rows) => [tradeHeader, ...rows].join('\n');

test('findMissingColumns reports missing required fields', () => {
  assert.deepEqual(findMissingColumns(['trade_id', 'timestamp'], REQUIRED_TRADE_COLUMNS), [
    'exchange',
    'symbol',
    'side',
    'quantity',
    'price_usd',
    'fee_usd',
  ]);
});

test('UTC timestamp validation rejects normalized and non-UTC dates', () => {
  assert.equal(isValidUtcTimestamp('2026-03-31T23:59:59Z'), true);
  assert.equal(isValidUtcTimestamp('2026-02-30T00:00:00Z'), false);
  assert.equal(isValidUtcTimestamp('2026-03-31T23:59:59+07:00'), false);
});

test('trade parser normalizes and orders valid rows deterministically', () => {
  const trades = parseTradeCsv(
    tradeCsv(
      'TRD-0002,2026-01-02T00:00:00Z,Coinbase,BTC,SELL,0.5,120,1',
      'TRD-0001,2026-01-01T00:00:00Z,Binance,BTC,BUY,1,100,2'
    )
  );

  assert.equal(trades.length, 2);
  assert.equal(trades[0].tradeId, 'TRD-0001');
  assert.equal(trades[1].tradeId, 'TRD-0002');
  assert.equal(trades[0].sourceRow, 3);
});

test('trade parser reports missing headers with structured errors', () => {
  assert.throws(
    () => parseTradeCsv('trade_id,timestamp\nTRD-1,2026-01-01T00:00:00Z'),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, 'Trade CSV validation failed');
      assert.ok(error.details.some((detail) => detail.code === 'MISSING_COLUMN' && detail.field === 'exchange'));
      return true;
    }
  );
});

test('trade parser rejects duplicate headers', () => {
  const csv = `${tradeHeader},symbol\nTRD-1,2026-01-01T00:00:00Z,Binance,BTC,BUY,1,100,0,BTC`;

  assert.throws(
    () => parseTradeCsv(csv),
    (error) => error.details.some((detail) => detail.code === 'DUPLICATE_COLUMN' && detail.field === 'symbol')
  );
});

test('extra prototype-like headers cannot alter parsed record prototypes', () => {
  const csv = `${tradeHeader},__proto__\nTRD-1,2026-01-01T00:00:00Z,Binance,BTC,BUY,1,100,0,polluted`;
  const trades = parseTradeCsv(csv);

  assert.equal(trades.length, 1);
  assert.equal({}.polluted, undefined);
});

test('trade parser rejects duplicate IDs and invalid row values', () => {
  const csv = tradeCsv(
    'TRD-1,2026-01-01T00:00:00Z,Binance,BTC,BUY,1,100,0',
    'TRD-1,not-a-date,Unsupported,XRP,HOLD,-1,0,-2'
  );

  assert.throws(
    () => parseTradeCsv(csv),
    (error) => {
      const codes = new Set(error.details.map((detail) => detail.code));
      assert.ok(codes.has('DUPLICATE_TRADE_ID'));
      assert.ok(codes.has('INVALID_TIMESTAMP'));
      assert.ok(codes.has('UNSUPPORTED_EXCHANGE'));
      assert.ok(codes.has('UNSUPPORTED_SYMBOL'));
      assert.ok(codes.has('UNSUPPORTED_SIDE'));
      assert.ok(codes.has('INVALID_NUMBER'));
      return true;
    }
  );
});

test('trade parser rejects a SELL that would create a short position', () => {
  const csv = tradeCsv(
    'TRD-1,2026-01-01T00:00:00Z,Binance,ETH,BUY,1,100,0',
    'TRD-2,2026-01-02T00:00:00Z,Binance,ETH,SELL,1.1,110,0'
  );

  assert.throws(
    () => parseTradeCsv(csv),
    (error) => {
      assert.deepEqual(error.details[0], {
        row: 3,
        tradeId: 'TRD-2',
        field: 'quantity',
        code: 'SHORT_POSITION',
        message: 'SELL quantity 1.1 exceeds available 1 ETH.',
        value: '1.1',
      });
      return true;
    }
  );
});

test('parser reports empty and malformed CSV inputs', () => {
  assert.throws(
    () => parseTradeCsv('  '),
    (error) => error.details[0].code === 'EMPTY_FILE'
  );
  assert.throws(
    () => parseTradeCsv(`${tradeHeader}\n"unterminated`),
    (error) => error.statusCode === 400 && error.message === 'CSV syntax is invalid'
  );
});

test('price parser rejects duplicate symbols and mixed snapshot timestamps', () => {
  const csv = ['as_of,symbol,price_usd', '2026-03-31T23:59:59Z,BTC,100000', '2026-04-01T00:00:00Z,BTC,101000'].join(
    '\n'
  );

  assert.throws(
    () => parsePriceCsv(csv),
    (error) => {
      const codes = new Set(error.details.map((detail) => detail.code));
      assert.ok(codes.has('DUPLICATE_PRICE_SYMBOL'));
      assert.ok(codes.has('INCONSISTENT_PRICE_TIMESTAMP'));
      return true;
    }
  );
});
