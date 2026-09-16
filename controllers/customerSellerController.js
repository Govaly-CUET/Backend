const { getSellerBySlug } = require('../services/customerSellerService');

// @route   GET /api/v1/sellers/:slug
// @access  Public
const getSeller = async (req, res) => {
  try {
    const result = await getSellerBySlug(req.params.slug);
    res.status(200).json({ success: true, data: result.seller, total: result.total });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getSeller };
