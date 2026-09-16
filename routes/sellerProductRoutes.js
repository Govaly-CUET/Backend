const express = require('express');
const router = express.Router();
const { createProduct, listMyProducts } = require('../controllers/sellerProductController');
const { protectSeller } = require('../middleware/authMiddleware');

router.post('/products', protectSeller, createProduct);
router.get('/products', protectSeller, listMyProducts);

module.exports = router;