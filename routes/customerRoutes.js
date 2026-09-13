const express = require('express');

const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
} = require('../controllers/customerAuthController');

// Public Customer Auth
router.post('/auth/register', registerCustomer);
router.post('/auth/login', loginCustomer);

module.exports = router;