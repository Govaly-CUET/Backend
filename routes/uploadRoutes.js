const express = require('express');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');
const { protectAdminOrSeller } = require('../middleware/authMiddleware');

router.post(
  '/',
  protectAdminOrSeller,
  upload.single('file'),
  uploadFile
);

module.exports = router;