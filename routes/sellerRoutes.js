const express = require('express');
const router = express.Router();
const { registerSeller, loginSeller } = require('../controllers/sellerAuthController');
const { protectSeller } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.post(
  '/auth/register',
  upload.fields([
    { name: 'nid', maxCount: 1 },
    { name: 'tradeLicense', maxCount: 1 },
  ]),
  registerSeller
);
// const { uploadFile } = require('../controllers/uploadController');

router.post('/auth/login', loginSeller);
// router.post('/upload', protectSeller, upload.single('file'), uploadFile);

module.exports = router;