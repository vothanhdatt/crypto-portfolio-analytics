const getHealth = async () => ({
  service: 'crypto-portfolio-service',
  state: 'ready',
  timestamp: new Date().toISOString(),
});

module.exports = {
  getHealth,
};

