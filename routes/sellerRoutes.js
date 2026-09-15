const express = require('express');
const router = express.Router();

const { registerSeller, loginSeller } = require('../controllers/sellerAuthController');
const { submitVerificationDocuments } = require('../controllers/sellerDocumentController');
const { protectSellerAny } = require('../middleware/authMiddleware');

// Public
router.post('/auth/register', registerSeller);
router.post('/auth/login', loginSeller);

// Private (any seller status — this is one of the onboarding steps a
// still-pending seller must be able to complete before an admin ever
// approves them; actual selling actions stay behind protectSeller).
router.post('/verification/documents', protectSellerAny, submitVerificationDocuments);

module.exports = router;
