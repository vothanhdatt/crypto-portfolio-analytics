const env = require('./src/configs/env.config');
const app = require('./src/app');

if (require.main === module) {
  app.listen(env.app.port, '0.0.0.0', () => {
    console.log(`Crypto Portfolio API is running on port ${env.app.port}`);
  });
}

module.exports = app;
