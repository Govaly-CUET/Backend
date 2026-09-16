const Order = require('../models/orderModel');
const Review = require('../models/reviewModel');
const Product = require('../models/productModel');

const recomputeProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.updateOne({ _id: productId }, { rating: Math.round(avg * 10) / 10, numReviews: count });
};

const submitReview = async (userId, productId, { rating, comment, orderId }) => {
  if (!rating || rating < 1 || rating > 5) {
    throw { status: 400, message: 'rating must be between 1 and 5.' };
  }

  // Must have a delivered order containing this product to be eligible.
  // Order stores this as the lowercase `financialStatus` enum.
  const orderQuery = {
    customer: userId,
    'items.product': productId,
    financialStatus: 'delivered',
  };
  if (orderId) orderQuery._id = orderId;
  const order = await Order.findOne(orderQuery).sort('-createdAt');
  if (!order) {
    throw { status: 403, message: 'You can only review products from a delivered order.' };
  }

  const review = await Review.findOneAndUpdate(
    { product: productId, customer: userId, order: order._id },
    { rating, comment: comment || '' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recomputeProductRating(productId);
  return review;
};

module.exports = { submitReview };
