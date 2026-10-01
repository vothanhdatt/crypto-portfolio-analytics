const { parse } = require('csv-parse/sync');
const AppError = require('../../utils/app-error.util');
const { REQUIRED_PRICE_COLUMNS, REQUIRED_TRADE_COLUMNS } = require('./import.constant');
const { validatePriceRows, validateTradeRows } = require('./import.validation');

const toText = (input) => {
  if (Buffer.isBuffer(input)) return input.toString('utf8');
  return String(input ?? '');
};

const parseMatrix = (input) => {
  const text = toText(input);
  if (!text.trim()) {
    throw new AppError('CSV file is empty', 400, [
      { row: 1, field: null, code: 'EMPTY_FILE', message: 'Provide a CSV file with a header row and data rows.' },
    ]);
  }

  try {
    return parse(text, {
      bom: true,
      relax_column_count: false,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    throw new AppError('CSV syntax is invalid', 400, [
      {
        row: error.lines || null,
        field: null,
        code: error.code || 'INVALID_CSV',
        message: error.message,
      },
    ]);
  }
};

const matrixToRows = (matrix) => {
  if (matrix.length === 0) return { columns: [], rows: [] };

  const columns = matrix[0].map((column) => String(column).trim());
  const rows = matrix.slice(1).map((values, index) => {
    const record = Object.create(null);
    record.sourceRow = index + 2;
    columns.forEach((column, columnIndex) => {
      if (column) record[column] = values[columnIndex] ?? '';
    });
    return record;
  });

  return { columns, rows };
};

const parseTradeCsv = (input) => {
  const { columns, rows } = matrixToRows(parseMatrix(input));
  return validateTradeRows({ columns, rows, requiredColumns: REQUIRED_TRADE_COLUMNS });
};

const parsePriceCsv = (input) => {
  const { columns, rows } = matrixToRows(parseMatrix(input));
  return validatePriceRows({ columns, rows, requiredColumns: REQUIRED_PRICE_COLUMNS });
};

module.exports = {
  parsePriceCsv,
  parseTradeCsv,
};
