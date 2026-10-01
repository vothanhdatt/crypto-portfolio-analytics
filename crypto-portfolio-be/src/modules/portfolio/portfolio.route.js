const express = require('express');
const controller = require('./portfolio.controller');

const router = express.Router();

router.get('/capabilities', controller.getCapabilities);

module.exports = router;

