const express = require('express');
const router = express.Router();
const { createProduct } = require('../controllers/productController');
const { protectSeller } = require('../middleware/authMiddleware'); // naam mile kina check koro

router.post('/products', protectSeller, createProduct);

module.exports = router;