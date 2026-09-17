const express = require('express');
const router = express.Router();
const { createProduct, listMyProducts } = require('../controllers/sellerProductController');
const { protectSeller } = require('../middleware/authMiddleware');

router.get('/products', protectSeller, listMyProducts);
router.post('/products', protectSeller, createProduct);

module.exports = router;