const express = require('express');
const controller = require('./portfolio.controller');

const router = express.Router();

router.get('/capabilities', controller.getCapabilities);
router.get('/overview', controller.getOverview);

module.exports = router;
