const express = require('express');
const router = express.Router();
const { registerSeller,loginSeller } = require('../controllers/sellerAuthController');

// Route for seller registration
router.post('/auth/register', registerSeller);
router.post('/auth/login',loginSeller);


module.exports = router;