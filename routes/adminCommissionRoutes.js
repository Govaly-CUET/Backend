const express = require('express');

const router = express.Router();

const {
  getSellersCommission,
  updateCommission,
} = require('../controllers/adminCommissionController');

router.get('/commission', getSellersCommission);
router.patch('/:id/commission', updateCommission);

module.exports = router;
