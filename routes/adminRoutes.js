const express = require('express');

const router = express.Router();

const { loginAdmin, getMe } = require('../controllers/adminAuthController');
const {
  requestAdminOtp,
  verifyAdminForgotOtp,
  resetAdminPassword,
} = require('../controllers/adminOtpAuthController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/adminProfileController');
const adminCustomerRoutes = require('./adminCustomerRoutes');
const adminCategoryRoutes = require('./adminCategoryRoutes');
const adminVerificationRoutes = require('./adminVerificationRoutes');
const adminCommissionRoutes = require('./adminCommissionRoutes');
const adminSellerOverviewRoutes = require('./adminSellerOverviewRoutes');
const adminProductRoutes = require('./adminProductRoutes');
const adminOrderRoutes = require('./adminOrderRoutes');
const adminReviewRoutes = require('./adminReviewRoutes');
const {
  getMedia,
  updateMedia,
  replaceMedia,
} = require('../controllers/adminMediaController');
const upload = require('../middleware/uploadMiddleware');

const adminPagesRoutes = require('./adminPagesRoutes');
const adminDashboardRoutes = require('./adminDashboardRoutes'); // here change


// Public
router.post('/auth/login', loginAdmin);
router.post('/auth/otp/request', requestAdminOtp);
router.post('/auth/forgot-password/verify-otp', verifyAdminForgotOtp);
router.post('/auth/forgot-password/reset', resetAdminPassword);

// Everything below requires a valid admin JWT
router.use(protectAdmin);

router.get('/auth/me', getMe);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.use('/dashboard', adminDashboardRoutes); // here change

router.use('/pages', adminPagesRoutes);

router.use('/customers', adminCustomerRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/sellers', adminVerificationRoutes);
router.use('/sellers', adminCommissionRoutes);
router.use('/sellers', adminSellerOverviewRoutes);
router.use('/products', adminProductRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/reviews', adminReviewRoutes);

router.get('/media', getMedia);
router.patch('/media/:id', updateMedia);
router.patch('/media/:id/file', upload.single('file'), replaceMedia);

module.exports = router;