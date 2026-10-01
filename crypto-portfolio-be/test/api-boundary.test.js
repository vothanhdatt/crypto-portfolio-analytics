const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { assertPortfolioSnapshot } = require('../src/contracts/portfolio.contract');
const importService = require('../src/modules/import/import.service');
const portfolioService = require('../src/modules/portfolio/portfolio.service');
const portfolioApiRoutes = require('../src/routes/portfolio-api.route');

const sampleTradesPath = path.resolve(__dirname, '../data/trades.csv');

test('public API boundary exposes the required routes', () => {
  const routes = portfolioApiRoutes.stack
    .filter((layer) => layer.route)
    .flatMap((layer) =>
      Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`)
    );

  assert.deepEqual(routes, ['GET /portfolio', 'POST /import', 'POST /reset']);
});

test('portfolio service reads sample data and returns the response contract', async () => {
  const portfolio = await portfolioService.getOverview();

  assert.equal(portfolio.source, 'sample');
  assert.equal(portfolio.transactionCount, 200);
  assert.equal(assertPortfolioSnapshot(portfolio), portfolio);
});

test('import and reset services return calculated snapshots', async () => {
  const imported = await importService.importTrades({
    file: {
      originalname: 'trades.csv',
      buffer: fs.readFileSync(sampleTradesPath),
    },
  });

  assert.equal(imported.source, 'import');
  assert.equal(imported.transactionCount, 200);

  const reset = await importService.resetTrades();
  assert.equal(reset.source, 'sample');
  assert.equal(reset.transactionCount, 200);
});

test('import service rejects a missing file before calculation', async () => {
  await assert.rejects(
    () => importService.importTrades({}),
    (error) => error.statusCode === 400 && error.details[0].code === 'FILE_REQUIRED'
  );
});

test('response contract rejects an invalid snapshot', () => {
  assert.throws(
    () => assertPortfolioSnapshot({ source: 'sample' }),
    /Portfolio snapshot does not satisfy the API contract/
  );
});
