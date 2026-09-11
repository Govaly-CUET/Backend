const Seller = require('../models/sellerModel');

// @desc    Get list of sellers pending verification
// @route   GET /api/v1/admin/sellers/verification
// @access  Private (Admin)
const getPendingSellers = async (req, res) => {
  try {
    // Fetch sellers with status 'pending'
    const pendingSellers = await Seller.find({ status: 'pending' }).select('-password');

    res.status(200).json({
      success: true,
      count: pendingSellers.length,
      data: pendingSellers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject seller verification status
// @route   PATCH /api/v1/admin/sellers/:id/verification
// @access  Private (Admin)
const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, commission } = req.body; // status can be 'active' or 'suspended'

    // Validate status value
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be "active" or "suspended".',
      });
    }

    const updateData = { status };
    if (commission !== undefined) {
      updateData.commission = commission;
    }

    const seller = await Seller.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Seller status updated to ${status}`,
      data: seller,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingSellers,
  verifySeller,
};