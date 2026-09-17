const Review = require('../models/reviewModel');
const Product = require('../models/productModel');

/*
 * Returns all reviews left on products owned by this seller,
 * newest first, with product name/image and reviewer name attached.
 */
const getSellerReviews = async (sellerId) => {
  // First find this seller's product IDs
  const products = await Product.find({ seller: sellerId }).select('_id name image');
  const productIds = products.map((p) => p._id);
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const reviews = await Review.find({ product: { $in: productIds } })
    .sort({ createdAt: -1 })
    .populate('customer', 'fullName')
    .lean();

  return reviews.map((review) => {
    const product = productMap.get(review.product.toString());
    return {
      id: review._id,
      productName: product?.name || 'Unknown Product',
      productImage: product?.image || '',
      customerName: review.customer?.fullName || 'Anonymous',
      rating: review.rating,
      comment: review.comment || '',
      date: review.createdAt,
    };
  });
};

module.exports = { getSellerReviews };