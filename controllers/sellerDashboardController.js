const { getSellerDashboardStats } = require('../services/sellerDashboardService');

// @desc    Get logged-in seller's dashboard stats
// @route   GET /api/v1/seller/dashboard/stats
// @access  Private (Seller only)
const getDashboardStats = async (req, res) => {
    try {
        const stats = await getSellerDashboardStats(req.seller._id);

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { getDashboardStats };