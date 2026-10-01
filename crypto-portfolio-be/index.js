const env = require('./src/configs/env.config');
const app = require('./src/app');

app.listen(env.app.port, '0.0.0.0', () => {
  console.log(`Crypto Portfolio API is running on port ${env.app.port}`);
});

