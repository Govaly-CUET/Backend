const { getAllSellers, getSellersByStatus, updateSellerStatus } = require('../services/adminSellerService');

const respondWithSellers = (res, sellers) => {
  res.status(200).json({
    success: true,
    count: sellers.length,
    data: sellers,
  });
};

// @desc    Get every seller, regardless of status
// @route   GET /api/v1/admin/sellers/verification/all
// @access  Private (Admin)
const getAll = async (req, res) => {
  try {
    const sellers = await getAllSellers();
    respondWithSellers(res, sellers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get sellers with status = pending
// @route   GET /api/v1/admin/sellers/verification/pending
// @access  Private (Admin)
const getPending = async (req, res) => {
  try {
    const sellers = await getSellersByStatus('pending');
    respondWithSellers(res, sellers);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Get sellers with status = approved
// @route   GET /api/v1/admin/sellers/verification/approved
// @access  Private (Admin)
const getApproved = async (req, res) => {
  try {
    const sellers = await getSellersByStatus('approved');
    respondWithSellers(res, sellers);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Get sellers with status = suspended
// @route   GET /api/v1/admin/sellers/verification/suspended
// @access  Private (Admin)
const getSuspended = async (req, res) => {
  try {
    const sellers = await getSellersByStatus('suspended');
    respondWithSellers(res, sellers);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
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

module.exports = { getAll, getPending, getApproved, getSuspended, verifySeller };