const { submitReview } = require('../services/customerReviewService');

// @desc    Submit rating + description for a purchased, eligible item
// @route   POST /api/v1/customer/products/:id/review
const postReview = async (req, res) => {
  try {
    const review = await submitReview(req.user._id, req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Review submitted.', data: review });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { postReview };
