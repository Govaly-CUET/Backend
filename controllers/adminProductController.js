const {
  createAdminProduct,
  getAdminProducts,
} = require('../services/adminProductService');

// ===============================
// CREATE PRODUCT (admin)
// ===============================
// @route   POST /api/v1/admin/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
  try {
    const product = await createAdminProduct(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create admin product error:', error);

    const status = error.status || 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// LIST PRODUCTS (admin)
// ===============================
// @route   GET /api/v1/admin/products
// @access  Private (Admin)
const getProducts = async (req, res) => {
  try {
    const products = await getAdminProducts(req.query);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get admin products error:', error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { createProduct, getProducts };
