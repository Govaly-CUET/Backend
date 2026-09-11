const express = require('express');
const router = express.Router();
const {
  getPendingSellers,
  verifySeller,
} = require('../controllers/adminSellerController');

// Routes for seller verification by admin
router.get('/sellers/verification', getPendingSellers);
router.patch('/sellers/:id/verification', verifySeller);

module.exports = router;