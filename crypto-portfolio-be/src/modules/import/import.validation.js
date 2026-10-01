const { REQUIRED_TRADE_COLUMNS } = require('./import.service');

const findMissingColumns = (columns) => REQUIRED_TRADE_COLUMNS.filter((column) => !columns.includes(column));

module.exports = {
  findMissingColumns,
};

