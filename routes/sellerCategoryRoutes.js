const express = require('express');

const { getCategories } = require('../controllers/adminCategoryController');
const { protectSeller } = require('../middleware/authMiddleware');

const router = express.Router();

// Sellers need read-only access to categories when creating products.
router.get('/', protectSeller, getCategories);

module.exports = router;