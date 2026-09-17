const express = require('express');
const router = express.Router();

const { registerSeller, loginSeller, getSellerProfile, updateSellerProfile } = require('../controllers/sellerAuthController');
const { submitVerificationDocuments } = require('../controllers/sellerDocumentController');
const { protectSeller, protectSellerAny } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');
const { getDashboardStats } = require('../controllers/sellerDashboardController');
const { getEarnings } = require('../controllers/sellerEarningsController');

// Public
router.post('/auth/register', registerSeller);
router.post('/auth/login', loginSeller);

// Private (any seller status — onboarding step before admin approval)
router.post('/verification/documents', protectSellerAny, submitVerificationDocuments);

// Private (approved sellers only)
router.post('/upload', protectSeller, upload.single('file'), uploadFile);
router.get('/me', protectSeller, getSellerProfile);
router.patch('/me', protectSeller, updateSellerProfile);
router.get('/dashboard/stats', protectSeller, getDashboardStats);
router.get('/earnings', protectSeller, getEarnings);

module.exports = router;