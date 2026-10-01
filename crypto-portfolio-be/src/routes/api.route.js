const express = require('express');
const healthRoutes = require('../modules/health/health.route');
const importRoutes = require('../modules/import/import.route');
const portfolioRoutes = require('../modules/portfolio/portfolio.route');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/import', importRoutes);
router.use('/portfolio', portfolioRoutes);

module.exports = router;
