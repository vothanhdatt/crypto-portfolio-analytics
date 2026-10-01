const Decimal = require('decimal.js');
const AppError = require('../../utils/app-error.util');
const { SUPPORTED_EXCHANGES, SUPPORTED_SIDES, SUPPORTED_SYMBOLS } = require('../../constants/portfolio.constant');

const ISO_UTC_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/;

const errorDetail = ({ row = null, tradeId = null, field = null, code, message, value }) => ({
  row,
  tradeId,
  field,
  code,
  message,
  ...(value === undefined ? {} : { value }),
});

const findMissingColumns = (columns, requiredColumns = []) =>
  requiredColumns.filter((column) => !columns.includes(column));

const validateHeaders = (columns, requiredColumns) => {
  const errors = [];
  const duplicates = columns.filter((column, index) => column && columns.indexOf(column) !== index);
  const missing = findMissingColumns(columns, requiredColumns);

  if (columns.some((column) => !column)) {
    errors.push(
      errorDetail({
        row: 1,
        code: 'EMPTY_COLUMN_NAME',
        message: 'Every CSV column must have a non-empty name.',
      })
    );
  }

  [...new Set(duplicates)].forEach((column) => {
    errors.push(
      errorDetail({
        row: 1,
        field: column,
        code: 'DUPLICATE_COLUMN',
        message: `Column "${column}" appears more than once.`,
      })
    );
  });

  missing.forEach((column) => {
    errors.push(
      errorDetail({
        row: 1,
        field: column,
        code: 'MISSING_COLUMN',
        message: `Required column "${column}" is missing.`,
      })
    );
  });

  return errors;
};

const isValidUtcTimestamp = (value) => {
  const match = ISO_UTC_PATTERN.exec(value);
  if (!match) return false;

  const [, year, month, day, hour, minute, second] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const [y, m, d, h, min, s] = parts;
  const date = new Date(Date.UTC(y, m - 1, d, h, min, s));

  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d &&
    date.getUTCHours() === h &&
    date.getUTCMinutes() === min &&
    date.getUTCSeconds() === s
  );
};

const validateDecimal = ({ value, row, tradeId = null, field, allowZero }) => {
  try {
    const decimal = new Decimal(value);
    const valid = decimal.isFinite() && (allowZero ? decimal.greaterThanOrEqualTo(0) : decimal.greaterThan(0));
    if (valid) return null;
  } catch {
    // The shared error below is more actionable than the Decimal parser error.
  }

  return errorDetail({
    row,
    tradeId,
    field,
    code: 'INVALID_NUMBER',
    message: allowZero ? `${field} must be zero or greater.` : `${field} must be greater than zero.`,
    value,
  });
};

const throwValidationErrors = (message, errors) => {
  if (errors.length > 0) throw new AppError(message, 400, errors);
};

const validateTradeRows = ({ columns, rows, requiredColumns }) => {
  const errors = validateHeaders(columns, requiredColumns);
  if (rows.length === 0) {
    errors.push(
      errorDetail({ row: 2, code: 'NO_DATA_ROWS', message: 'The trade CSV must contain at least one data row.' })
    );
  }

  const seenTradeIds = new Map();
  const normalized = [];

  rows.forEach((row) => {
    const tradeId = String(row.trade_id || '').trim();
    const timestamp = String(row.timestamp || '').trim();
    const exchange = String(row.exchange || '').trim();
    const symbol = String(row.symbol || '').trim();
    const side = String(row.side || '').trim();
    const quantity = String(row.quantity || '').trim();
    const priceUsd = String(row.price_usd || '').trim();
    const feeUsd = String(row.fee_usd || '').trim();

    if (!tradeId) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          field: 'trade_id',
          code: 'REQUIRED_VALUE',
          message: 'trade_id is required.',
          value: row.trade_id,
        })
      );
    } else if (seenTradeIds.has(tradeId)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          tradeId,
          field: 'trade_id',
          code: 'DUPLICATE_TRADE_ID',
          message: `trade_id "${tradeId}" duplicates row ${seenTradeIds.get(tradeId)}.`,
          value: tradeId,
        })
      );
    } else {
      seenTradeIds.set(tradeId, row.sourceRow);
    }

    if (!isValidUtcTimestamp(timestamp)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          tradeId,
          field: 'timestamp',
          code: 'INVALID_TIMESTAMP',
          message: 'timestamp must be a valid UTC ISO-8601 value ending in Z.',
          value: timestamp,
        })
      );
    }

    if (!SUPPORTED_EXCHANGES.includes(exchange)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          tradeId,
          field: 'exchange',
          code: 'UNSUPPORTED_EXCHANGE',
          message: `exchange must be one of: ${SUPPORTED_EXCHANGES.join(', ')}.`,
          value: exchange,
        })
      );
    }

    if (!SUPPORTED_SYMBOLS.includes(symbol)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          tradeId,
          field: 'symbol',
          code: 'UNSUPPORTED_SYMBOL',
          message: `symbol must be one of: ${SUPPORTED_SYMBOLS.join(', ')}.`,
          value: symbol,
        })
      );
    }

    if (!SUPPORTED_SIDES.includes(side)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          tradeId,
          field: 'side',
          code: 'UNSUPPORTED_SIDE',
          message: `side must be one of: ${SUPPORTED_SIDES.join(', ')}.`,
          value: side,
        })
      );
    }

    [
      validateDecimal({ value: quantity, row: row.sourceRow, tradeId, field: 'quantity', allowZero: false }),
      validateDecimal({ value: priceUsd, row: row.sourceRow, tradeId, field: 'price_usd', allowZero: false }),
      validateDecimal({ value: feeUsd, row: row.sourceRow, tradeId, field: 'fee_usd', allowZero: true }),
    ]
      .filter(Boolean)
      .forEach((error) => errors.push(error));

    normalized.push({
      tradeId,
      timestamp,
      exchange,
      symbol,
      side,
      quantity,
      priceUsd,
      feeUsd,
      sourceRow: row.sourceRow,
    });
  });

  throwValidationErrors('Trade CSV validation failed', errors);

  const ordered = normalized.sort(
    (left, right) =>
      Date.parse(left.timestamp) - Date.parse(right.timestamp) || left.tradeId.localeCompare(right.tradeId)
  );
  const quantities = new Map();

  ordered.forEach((trade) => {
    const available = quantities.get(trade.symbol) || new Decimal(0);
    const quantity = new Decimal(trade.quantity);

    if (trade.side === 'BUY') {
      quantities.set(trade.symbol, available.plus(quantity));
      return;
    }

    if (quantity.greaterThan(available)) {
      errors.push(
        errorDetail({
          row: trade.sourceRow,
          tradeId: trade.tradeId,
          field: 'quantity',
          code: 'SHORT_POSITION',
          message: `SELL quantity ${trade.quantity} exceeds available ${available.toFixed()} ${trade.symbol}.`,
          value: trade.quantity,
        })
      );
      return;
    }

    quantities.set(trade.symbol, available.minus(quantity));
  });

  throwValidationErrors('Trade CSV validation failed', errors);
  return ordered;
};

const validatePriceRows = ({ columns, rows, requiredColumns }) => {
  const errors = validateHeaders(columns, requiredColumns);
  if (rows.length === 0) {
    errors.push(
      errorDetail({ row: 2, code: 'NO_DATA_ROWS', message: 'The price CSV must contain at least one data row.' })
    );
  }

  const seenSymbols = new Map();
  const timestamps = new Set();
  const normalized = [];

  rows.forEach((row) => {
    const asOf = String(row.as_of || '').trim();
    const symbol = String(row.symbol || '').trim();
    const priceUsd = String(row.price_usd || '').trim();

    if (!isValidUtcTimestamp(asOf)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          field: 'as_of',
          code: 'INVALID_TIMESTAMP',
          message: 'as_of must be a valid UTC ISO-8601 value ending in Z.',
          value: asOf,
        })
      );
    } else {
      timestamps.add(asOf);
    }

    if (!SUPPORTED_SYMBOLS.includes(symbol)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          field: 'symbol',
          code: 'UNSUPPORTED_SYMBOL',
          message: `symbol must be one of: ${SUPPORTED_SYMBOLS.join(', ')}.`,
          value: symbol,
        })
      );
    } else if (seenSymbols.has(symbol)) {
      errors.push(
        errorDetail({
          row: row.sourceRow,
          field: 'symbol',
          code: 'DUPLICATE_PRICE_SYMBOL',
          message: `symbol "${symbol}" duplicates row ${seenSymbols.get(symbol)}.`,
          value: symbol,
        })
      );
    } else {
      seenSymbols.set(symbol, row.sourceRow);
    }

    const numericError = validateDecimal({
      value: priceUsd,
      row: row.sourceRow,
      field: 'price_usd',
      allowZero: false,
    });
    if (numericError) errors.push(numericError);

    normalized.push({ asOf, symbol, priceUsd, sourceRow: row.sourceRow });
  });

  if (timestamps.size > 1) {
    errors.push(
      errorDetail({
        field: 'as_of',
        code: 'INCONSISTENT_PRICE_TIMESTAMP',
        message: 'All prices must belong to the same snapshot timestamp.',
      })
    );
  }

  throwValidationErrors('Price CSV validation failed', errors);
  return normalized;
};

module.exports = {
  findMissingColumns,
  isValidUtcTimestamp,
  validatePriceRows,
  validateTradeRows,
};
