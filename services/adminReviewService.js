const Review = require('../models/reviewModel');

/*
 * Lists reviews, newest first. Optional filters:
 *   - product: one product id
 *   - rating: one exact star value (1-5)
 *   - search: matches product name or customer name, case-insensitive
 */
const getReviews = async ({ product, rating, search } = {}) => {
  const match = {};

  if (product) {
    match.product = product;
  }

  if (rating) {
    match.rating = Number(rating);
  }

  let query = Review.find(match)
    .sort({ createdAt: -1 })
    .populate('product', 'name image')
    .populate('customer', 'name')
    .populate({
      path: 'order',
      select: 'orderCode seller',
      populate: { path: 'seller', select: 'shopName' },
    });

  const reviews = await query;

  if (!search) {
    return reviews;
  }

  const needle = search.toLowerCase();
  return reviews.filter(
    (r) =>
      r.product?.name?.toLowerCase().includes(needle) ||
      r.customer?.name?.toLowerCase().includes(needle)
  );
};

/*
 * Aggregate rating stats across every review: average, total count,
 * and a 5-to-1 star breakdown (count + percentage of total).
 */
const getReviewStats = async () => {
  const rows = await Review.aggregate([
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let total = 0;
  let sum = 0;

  rows.forEach((row) => {
    breakdown[row._id] = row.count;
    total += row.count;
    sum += row._id * row.count;
  });

  const average = total > 0 ? sum / total : 0;

  const percentages = {};
  [5, 4, 3, 2, 1].forEach((star) => {
    percentages[star] = total > 0 ? Math.round((breakdown[star] / total) * 100) : 0;
  });

  return {
    average: Math.round(average * 10) / 10,
    total,
    breakdown,
    percentages,
  };
};

module.exports = { getReviews, getReviewStats };
