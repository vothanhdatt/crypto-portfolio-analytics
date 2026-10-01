const assert = require('node:assert/strict');
const test = require('node:test');
const { getHealth } = require('../src/modules/health/health.service');

test('health service describes a ready API', async () => {
  const health = await getHealth();

  assert.equal(health.service, 'crypto-portfolio-service');
  assert.equal(health.state, 'ready');
  assert.match(health.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
