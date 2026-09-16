const Seller = require('../models/sellerModel');
const Product = require('../models/productModel');

const getSellerBySlug = async (shopSlug) => {
  const seller = await Seller.findOne({ shopSlug, status: 'approved' }).select(
    'shopName shopSlug ratings'
  ).lean();
  if (!seller) throw { status: 404, message: 'Seller not found' };

  const total = await Product.countDocuments({ seller: seller._id, status: 'in_stock' });
  return { seller, total };
};

module.exports = { getSellerBySlug };
