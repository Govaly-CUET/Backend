const { getSellerEarnings } = require('../services/sellerEarningsService');

// @desc    Get logged-in seller's earnings and commission breakdown
// @route   GET /api/v1/seller/earnings
// @access  Private (Seller only)
const getEarnings = async (req, res) => {
    try {
        const earnings = await getSellerEarnings(req.seller._id);

        res.status(200).json({
            success: true,
            data: earnings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { getEarnings };