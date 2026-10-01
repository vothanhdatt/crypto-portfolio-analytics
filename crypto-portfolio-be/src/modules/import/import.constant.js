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

module.exports = {
  REQUIRED_PRICE_COLUMNS,
  REQUIRED_TRADE_COLUMNS,
};
