const assert = require('node:assert/strict');
const test = require('node:test');
const { findMissingColumns } = require('../src/modules/import/import.validation');
const { REQUIRED_TRADE_COLUMNS } = require('../src/modules/import/import.service');

test('findMissingColumns accepts the complete trade schema', () => {
  assert.deepEqual(findMissingColumns(REQUIRED_TRADE_COLUMNS), []);
});

test('findMissingColumns reports missing fields', () => {
  assert.deepEqual(findMissingColumns(['trade_id', 'timestamp']), [
    'exchange',
    'symbol',
    'side',
    'quantity',
    'price_usd',
    'fee_usd',
  ]);
});

