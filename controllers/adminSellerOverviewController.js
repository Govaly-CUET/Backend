const { getSellersOverview } = require('../services/adminSellerOverviewService');

// @desc    List sellers with product/category/order/finance overview
// @route   GET /api/v1/admin/sellers/overview
// @access  Private (Admin)
const listSellersOverview = async (req, res) => {
  try {
    const sellers = await getSellersOverview(req.query);

    res.status(200).json({
      success: true,
      count: sellers.length,
      data: sellers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listSellersOverview };
