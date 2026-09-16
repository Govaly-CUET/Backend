const express = require('express');

const router = express.Router();

const { loginAdmin, getMe } = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/adminProfileController');
const adminCustomerRoutes = require('./adminCustomerRoutes');
const adminCategoryRoutes = require('./adminCategoryRoutes');
const adminVerificationRoutes = require('./adminVerificationRoutes');
const adminCommissionRoutes = require('./adminCommissionRoutes');
const adminProductRoutes = require('./adminProductRoutes');
const {
  getMedia,
  updateMedia,
  replaceMedia,
} = require('../controllers/adminMediaController');
const upload = require('../middleware/uploadMiddleware');

const adminPagesRoutes = require('./adminPagesRoutes');



// Public
router.post('/auth/login', loginAdmin);

// Everything below requires a valid admin JWT
router.use(protectAdmin);

router.get('/auth/me', getMe);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.use('/pages', adminPagesRoutes);

router.use('/customers', adminCustomerRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/sellers', adminVerificationRoutes);
router.use('/sellers', adminCommissionRoutes);
router.use('/products', adminProductRoutes);

router.get('/media', getMedia);
router.patch('/media/:id', updateMedia);
router.patch('/media/:id/file', upload.single('file'), replaceMedia);

module.exports = router;