const SUMMARY_FIELDS = Object.freeze([
  'currentValue',
  'currentCostBasis',
  'realizedPnl',
  'unrealizedPnl',
  'totalPnl',
  'totalFees',
]);

const POSITION_STRING_FIELDS = Object.freeze([
  'symbol',
  'quantity',
  'averageCost',
  'currentCostBasis',
  'currentValue',
  'realizedPnl',
  'unrealizedPnl',
  'totalPnl',
  'allocation',
  'totalFees',
]);

const TRANSACTION_FIELDS = Object.freeze([
  'tradeId',
  'timestamp',
  'exchange',
  'symbol',
  'side',
  'quantity',
  'priceUsd',
  'feeUsd',
  'grossValue',
]);

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasFields = (value, fields) => isRecord(value) && fields.every((field) => Object.hasOwn(value, field));

/**
 * Runtime boundary check for the object returned to API consumers.
 * Financial values remain decimal strings so JSON transport cannot lose precision.
 *
 * @param {unknown} value
 * @returns {object}
 */
const assertPortfolioSnapshot = (value) => {
  const valid =
    isRecord(value) &&
    (value.priceAsOf === null || typeof value.priceAsOf === 'string') &&
    ['sample', 'import'].includes(value.source) &&
    Number.isInteger(value.transactionCount) &&
    hasFields(value.summary, SUMMARY_FIELDS) &&
    SUMMARY_FIELDS.every((field) => typeof value.summary[field] === 'string') &&
    Array.isArray(value.positions) &&
    value.positions.every(
      (position) =>
        hasFields(position, [...POSITION_STRING_FIELDS, 'currentPrice']) &&
        POSITION_STRING_FIELDS.every((field) => typeof position[field] === 'string') &&
        (position.currentPrice === null || typeof position.currentPrice === 'string')
    ) &&
    Array.isArray(value.transactions) &&
    value.transactions.every(
      (transaction) =>
        hasFields(transaction, TRANSACTION_FIELDS) &&
        TRANSACTION_FIELDS.every((field) => typeof transaction[field] === 'string')
    );

  if (!valid) throw new TypeError('Portfolio snapshot does not satisfy the API contract');
  return value;
};

module.exports = {
  POSITION_STRING_FIELDS,
  SUMMARY_FIELDS,
  TRANSACTION_FIELDS,
  assertPortfolioSnapshot,
};
