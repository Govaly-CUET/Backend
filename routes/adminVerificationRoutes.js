const express = require('express');

const router = express.Router();

const {
  getAll,
  getPending,
  getApproved,
  getSuspended,
  verifySeller,
} = require('../controllers/adminSellerController');

router.get('/verification/all', getAll);
router.get('/verification/pending', getPending);
router.get('/verification/approved', getApproved);
router.get('/verification/suspended', getSuspended);
router.patch('/:id/verification', verifySeller);

module.exports = router;
