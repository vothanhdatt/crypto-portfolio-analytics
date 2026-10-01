const express = require('express');
const controller = require('./import.controller');

const router = express.Router();

router.get('/requirements', controller.describeImport);

module.exports = router;

