const express = require('express');

const router = express.Router();

const { loginAdmin, getMe } = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/adminProfileController');
const {
  getAll,
  getPending,
  getApproved,
  getSuspended,
  verifySeller,
} = require('../controllers/adminSellerController');
const adminCustomerRoutes = require('./adminCustomerRoutes');
const {
  getSellersCommission,
  updateCommission,
} = require('../controllers/adminCommissionController');

// Public
router.post('/auth/login', loginAdmin);

// Everything below requires a valid admin JWT
router.use(protectAdmin);

router.get('/auth/me', getMe);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.get('/sellers/verification/all', getAll);
router.get('/sellers/verification/pending', getPending);
router.get('/sellers/verification/approved', getApproved);
router.get('/sellers/verification/suspended', getSuspended);
router.patch('/sellers/:id/verification', verifySeller);

router.use('/customers', adminCustomerRoutes);

router.get('/sellers/commission', getSellersCommission);
router.patch('/sellers/:id/commission', updateCommission);

module.exports = router;