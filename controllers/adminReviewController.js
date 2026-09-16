const { getReviews, getReviewStats } = require('../services/adminReviewService');

// @desc    List reviews (optionally filtered by product/rating/search)
// @route   GET /api/v1/admin/reviews
// @access  Private (Admin)
const listReviews = async (req, res) => {
  try {
    const reviews = await getReviews(req.query);

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Aggregate rating stats (average, count, star breakdown)
// @route   GET /api/v1/admin/reviews/stats
// @access  Private (Admin)
const reviewStats = async (req, res) => {
  try {
    const stats = await getReviewStats();

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { listReviews, reviewStats };
