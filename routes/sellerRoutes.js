const express = require('express');
const router = express.Router();

const { registerSeller, loginSeller } = require('../controllers/sellerAuthController');
const { submitVerificationDocuments } = require('../controllers/sellerDocumentController');
const { protectSeller } = require('../middleware/authMiddleware');

// Public
router.post('/auth/register', registerSeller);
router.post('/auth/login', loginSeller);

// Private (Seller)
router.post('/verification/documents', protectSeller, submitVerificationDocuments);

module.exports = router;