const express = require('express');
const router = express.Router();

const { registerSeller, loginSeller, getSellerProfile, updateSellerProfile } = require('../controllers/sellerAuthController');
const {
	requestSellerOtp,
	verifySellerForgotOtp,
	resetSellerPassword,
} = require('../controllers/sellerOtpAuthController');
const { submitVerificationDocuments } = require('../controllers/sellerDocumentController');
const { protectSeller, protectSellerAny } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');
const { getDashboardStats } = require('../controllers/sellerDashboardController');
const { getEarnings } = require('../controllers/sellerEarningsController');
const { getReviews } = require('../controllers/sellerReviewsController');

// Public
router.post('/auth/register', registerSeller);
router.post('/auth/login', loginSeller);
router.post('/auth/otp/request', requestSellerOtp);
router.post('/auth/forgot-password/verify-otp', verifySellerForgotOtp);
router.post('/auth/forgot-password/reset', resetSellerPassword);

// Private (any seller status — onboarding step before admin approval)
router.post('/verification/documents', protectSellerAny, submitVerificationDocuments);

// Private (approved sellers only)
router.post('/upload', protectSeller, upload.single('file'), uploadFile);
router.get('/me', protectSeller, getSellerProfile);
router.patch('/me', protectSeller, updateSellerProfile);
router.get('/dashboard/stats', protectSeller, getDashboardStats);
router.get('/orders', protectSeller, require('../controllers/sellerOrderController').getOrders);
router.patch('/orders/:id/shipment', protectSeller, require('../controllers/sellerShipmentController').updateStage);
router.get('/earnings', protectSeller, getEarnings);
router.get('/reviews', protectSeller, getReviews);

module.exports = router;