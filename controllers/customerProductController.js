const {
  listProducts,
  getProductBySlug,
  listReviewsForProduct,
} = require('../services/customerProductService');

// @desc    Browse/search products
// @route   GET /api/v1/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const result = await listProducts(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Product detail
// @route   GET /api/v1/products/:slug
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    List reviews for a product
// @route   GET /api/v1/products/:slug/reviews
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const reviews = await listReviewsForProduct(req.params.slug);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProduct, getProductReviews };
