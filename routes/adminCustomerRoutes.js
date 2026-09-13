const express = require('express');

const {
  getCustomers,
  removeCustomer,
} = require('../controllers/adminCustomerController');

const router = express.Router();

router.get('/', getCustomers);
router.delete('/:id', removeCustomer);

module.exports = router;
