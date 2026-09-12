const express = require('express');
const router = express.Router();

const { loginAdmin, getMe } = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  getPendingSellers,
  verifySeller,
} = require('../controllers/adminSellerController');

// Public
router.post('/auth/login', loginAdmin);

// Everything below requires a valid admin JWT
router.use(protectAdmin);

router.get('/auth/me', getMe);
router.get('/sellers/verification', getPendingSellers);
router.patch('/sellers/:id/verification', verifySeller);

module.exports = router;