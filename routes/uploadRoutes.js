const express = require('express');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post(
  '/',
  protectAdmin,
  upload.single('file'),
  uploadFile
);

module.exports = router;