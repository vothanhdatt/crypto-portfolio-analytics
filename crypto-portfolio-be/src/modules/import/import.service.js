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

const describeImport = async () => ({
  requiredColumns: REQUIRED_TRADE_COLUMNS,
  atomic: true,
  implementationStatus: 'pending',
});

module.exports = {
  REQUIRED_TRADE_COLUMNS,
  describeImport,
};

