require('dotenv').config();

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error(`Invalid numeric environment value: ${value}`);
  return parsed;
};

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

module.exports = {
  app: {
    port: toNumber(process.env.PORT, 1113),
    mode: process.env.APP_MODE || 'development',
  },
  server: {
    clientUrls: splitList(process.env.CLIENT_URLS || 'http://localhost:3002'),
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '4mb',
  },
};
