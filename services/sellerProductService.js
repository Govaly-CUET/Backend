const Product = require('../models/productModel');

/*
 * Lists only the logged-in seller's own products, newest first.
 * `search` is an optional case-insensitive partial match on name.
 */
const getSellerProducts = async (sellerId, { search } = {}) => {
  const match = { seller: sellerId };

  if (search) {
    match.name = { $regex: search, $options: 'i' };
  }

  return Product.find(match)
    .sort({ createdAt: -1 })
    .populate('category', 'name');
};

/*
 * Creates a new product owned by the given seller.
 */
const createSellerProduct = async (sellerId, productData) => {
  return Product.create({
    ...productData,
    seller: sellerId,
  });
};

module.exports = { getSellerProducts, createSellerProduct };