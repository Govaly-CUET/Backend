const express = require('express');
const router = express.Router();
const { createProduct } = require('../controllers/sellerProductController');
const { protectSeller } = require('../middleware/authMiddleware');

router.post('/products', protectSeller, createProduct);

module.exports = router;