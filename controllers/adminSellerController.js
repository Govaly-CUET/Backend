const { getAllSellers, getPendingSellers, updateSellerStatus } = require('../services/adminSellerService');

// @desc    Get all sellers (pending, approved, suspended)
// @route   GET /api/v1/admin/sellers/verification
// @access  Private (Admin)
const getAllSellersHandler = async (req, res) => {
  try {
    const sellers = await getAllSellers();

    res.status(200).json({
      success: true,
      count: sellers.length,
      data: sellers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// @desc    Get list of sellers pending approval
// @route   GET /api/v1/admin/sellers/verification
// @access  Private (Admin)
const getPendingSellersHandler = async (req, res) => {
  try {
    const pendingSellers = await getPendingSellers();

    res.status(200).json({
      success: true,
      count: pendingSellers.length,
      data: pendingSellers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Suspend a seller after checking NID + Trade License
// @route   PATCH /api/v1/admin/sellers/:id/verification
// @access  Private (Admin)
const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, commission } = req.body;

    if (!['approved', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be "approved" or "suspended".',
      });
    }

    const seller = await updateSellerStatus(id, status, commission);

    res.status(200).json({
      success: true,
      message: `Seller status updated to ${status}`,
      data: seller,
    });
  } catch (error) {
    const httpStatus = error.status || 500;
    res.status(httpStatus).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingSellers: getPendingSellersHandler, 
  getAllSellersHandler,
  verifySeller,
};