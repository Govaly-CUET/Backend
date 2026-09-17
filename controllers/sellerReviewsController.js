const { getSellerReviews } = require('../services/sellerReviewsService');

// @desc    Get reviews left on the logged-in seller's products
// @route   GET /api/v1/seller/reviews
// @access  Private (Seller only)
const getReviews = async (req, res) => {
    try {
        const reviews = await getSellerReviews(req.seller._id);

        res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { getReviews };