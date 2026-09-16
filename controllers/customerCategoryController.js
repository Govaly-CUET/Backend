const { listCategories, getCategoryBySlug } = require('../services/customerCategoryService');

// @desc    List categories & subcategories for navigation
// @route   GET /api/v1/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await listCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get one category or subcategory by slug
// @route   GET /api/v1/categories/:slug
// @access  Public
const getCategory = async (req, res) => {
  try {
    const result = await getCategoryBySlug(req.params.slug);
    res.status(200).json({ success: true, data: result.category, isParent: result.isParent });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories, getCategory };
