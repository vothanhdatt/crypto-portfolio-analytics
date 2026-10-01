const express = require('express');
const controller = require('./import.controller');
const { uploadCsv } = require('../../middlewares/file.middleware');

const router = express.Router();

router.get('/requirements', controller.describeImport);
router.post('/trades', uploadCsv.single('file'), controller.importTrades);
router.post('/reset', controller.resetTrades);

module.exports = router;
