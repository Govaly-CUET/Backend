const { getAllSellersCommission, updateSellerCommission } = require('../services/adminCommissionService');

// @desc    Get all sellers with their commission %
// @route   GET /api/v1/admin/sellers/commission
// @access  Private (Admin)
const getSellersCommission = async (req, res) => {
  try {
    const sellers = await getAllSellersCommission();

    res.status(200).json({
      success: true,
      count: sellers.length,
      data: sellers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a seller's commission percentage
// @route   PATCH /api/v1/admin/sellers/:id/commission
// @access  Private (Admin)
const updateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commission } = req.body;

    const seller = await updateSellerCommission(id, commission);

    res.status(200).json({
      success: true,
      message: 'Commission updated.',
      data: seller,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getSellersCommission, updateCommission };