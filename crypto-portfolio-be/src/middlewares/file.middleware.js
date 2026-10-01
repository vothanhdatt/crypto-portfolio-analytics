const multer = require('multer');
const { MAX_CSV_FILE_SIZE_BYTES } = require('../modules/import/import.constant');

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_CSV_FILE_SIZE_BYTES,
    files: 1,
  },
});

module.exports = {
  uploadCsv,
};
