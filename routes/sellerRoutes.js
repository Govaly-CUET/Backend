const express = require('express');
const router = express.Router();

const { registerSeller, loginSeller } = require('../controllers/sellerAuthController');
const { submitVerificationDocuments } = require('../controllers/sellerDocumentController');
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
router.post('/auth/login', loginSeller);

// Private (Seller)
router.post('/verification/documents', protectSeller, submitVerificationDocuments);

module.exports = router;