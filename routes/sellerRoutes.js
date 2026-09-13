const express = require('express');
const router = express.Router();
const { registerSeller, loginSeller } = require('../controllers/sellerAuthController');
const { protectSeller } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');

router.post('/auth/register', registerSeller);
router.post('/auth/login', loginSeller);
router.post('/upload', protectSeller, upload.single('file'), uploadFile);

module.exports = router;