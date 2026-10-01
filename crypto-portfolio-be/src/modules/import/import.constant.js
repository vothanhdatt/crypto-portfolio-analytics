const REQUIRED_TRADE_COLUMNS = Object.freeze([
  'trade_id',
  'timestamp',
  'exchange',
  'symbol',
  'side',
  'quantity',
  'price_usd',
  'fee_usd',
]);

const REQUIRED_PRICE_COLUMNS = Object.freeze(['as_of', 'symbol', 'price_usd']);
const MAX_CSV_FILE_SIZE_MB = 4;
const MAX_CSV_FILE_SIZE_BYTES = MAX_CSV_FILE_SIZE_MB * 1024 * 1024;

module.exports = {
  MAX_CSV_FILE_SIZE_BYTES,
  MAX_CSV_FILE_SIZE_MB,
  REQUIRED_PRICE_COLUMNS,
  REQUIRED_TRADE_COLUMNS,
};
