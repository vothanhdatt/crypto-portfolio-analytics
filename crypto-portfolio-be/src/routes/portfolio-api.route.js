const express = require('express');
const { uploadCsv } = require('../middlewares/file.middleware');
const importController = require('../modules/import/import.controller');
const portfolioController = require('../modules/portfolio/portfolio.controller');

const router = express.Router();

router.get('/portfolio', portfolioController.getOverview);
router.post('/import', uploadCsv.single('file'), importController.importTrades);
router.post('/reset', importController.resetTrades);

module.exports = router;
