const express = require('express');
const router = express.Router();
const { createProduct, getSellerProducts } = require('../controllers/sellerProductController');
const { protectSeller } = require('../middleware/authMiddleware');

router.get('/products', protectSeller, getSellerProducts);
router.post('/products', protectSeller, createProduct);

module.exports = router;