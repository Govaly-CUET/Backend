const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');

const makeSlug = (name, id) => {
  const base = String(name || 'product').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'product'}-${id}`;
};

const getWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ customer: userId }).populate({
    path: 'products',
    populate: [{ path: 'category', select: 'name slug' }, { path: 'seller', select: 'shopName shopSlug ratings' }],
  }).lean();
  return (wishlist?.products || []).filter(Boolean).map((product) => ({ ...product, slug: product.slug || makeSlug(product.name, product._id) }));
};

const addToWishlist = async (userId, productId) => {
  if (!await Product.exists({ _id: productId })) throw { status: 404, message: 'Product not found' };
  await Wishlist.findOneAndUpdate(
    { customer: userId },
    { $setOnInsert: { customer: userId }, $addToSet: { products: productId } },
    { upsert: true, new: true }
  );
  return getWishlist(userId);
};

const removeFromWishlist = async (userId, productId) => {
  await Wishlist.findOneAndUpdate({ customer: userId }, { $pull: { products: productId } });
  return getWishlist(userId);
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
