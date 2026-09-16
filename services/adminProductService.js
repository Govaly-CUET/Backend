const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Seller = require('../models/sellerModel');
const Review = require('../models/reviewModel');

/*
 * Confirms `subcategoryId` is actually one of `categoryId`'s own
 * subcategory[] entries — subcategory is an embedded ObjectId, not a
 * ref, so this is the manual check that stands in for what a real
 * ref+populate would validate for free.
 */
const assertValidCategoryAndSubcategory = async (categoryId, subcategoryId) => {
  const category = await Category.findOne({
    _id: categoryId,
    'subcategory._id': subcategoryId,
  }).select('_id');

  if (!category) {
    throw {
      status: 400,
      message: 'That subcategory does not belong to the selected category.',
    };
  }
};

const assertSellerExists = async (sellerId) => {
  const seller = await Seller.findById(sellerId).select('_id');

  if (!seller) {
    throw { status: 400, message: 'Selected shop (seller) not found.' };
  }
};

// ===============================
// CREATE ADMIN PRODUCT
// ===============================

const createAdminProduct = async ({
  name,
  category,
  subcategory,
  description,
  image,
  sale_price,
  stock,
  status,
  seller,
}) => {
  if (!name || !name.trim()) {
    throw { status: 400, message: 'Product name is required.' };
  }

  if (!category) {
    throw { status: 400, message: 'Category is required.' };
  }

  if (!subcategory) {
    throw { status: 400, message: 'Subcategory is required.' };
  }

  if (!description || !description.trim()) {
    throw { status: 400, message: 'Product description is required.' };
  }

  if (!image) {
    throw { status: 400, message: 'Product image is required.' };
  }

  if (sale_price === undefined || sale_price === null || Number.isNaN(Number(sale_price)) || Number(sale_price) < 0) {
    throw { status: 400, message: 'A valid, non-negative price is required.' };
  }

  if (stock === undefined || stock === null || Number.isNaN(Number(stock)) || Number(stock) < 0) {
    throw { status: 400, message: 'A valid, non-negative stock quantity is required.' };
  }

  if (!seller) {
    throw { status: 400, message: 'Shop (seller) is required.' };
  }

  await assertValidCategoryAndSubcategory(category, subcategory);
  await assertSellerExists(seller);

  const product = await Product.create({
    name: name.trim(),
    category,
    subcategory,
    description: description.trim(),
    image,
    sale_price: Number(sale_price),
    stock: Number(stock),
    status: status || 'in_stock',
    seller,
  });

  return product.populate([
    { path: 'category', select: 'name' },
    { path: 'seller', select: 'shopName' },
  ]);
};

// ===============================
// LIST ADMIN PRODUCTS
// ===============================

const getAdminProducts = async (filters = {}) => {
  const { search, seller, category, status, sortBy } = filters;

  const match = {};

  if (search) {
    match.name = { $regex: search, $options: 'i' };
  }

  if (seller) {
    match.seller = seller;
  }

  if (category) {
    match.category = category;
  }

  if (status) {
    match.status = status;
  }

  let sort = { createdAt: -1 };

  if (sortBy === 'price_asc') sort = { sale_price: 1 };
  if (sortBy === 'price_desc') sort = { sale_price: -1 };
  if (sortBy === 'sold_asc') sort = { sold_items: 1 };
  if (sortBy === 'sold_desc') sort = { sold_items: -1 };

  const products = await Product.find(match)
    .sort(sort)
    .populate('category', 'name')
    .populate('seller', 'shopName')
    .lean();

  const ratingRows = await Review.aggregate([
    { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const ratingByProduct = {};
  ratingRows.forEach((row) => {
    ratingByProduct[row._id.toString()] = {
      average: Math.round(row.average * 10) / 10,
      count: row.count,
    };
  });

  let withRatings = products.map((p) => ({
    ...p,
    rating: ratingByProduct[p._id.toString()] || { average: 0, count: 0 },
  }));

  if (filters.rating) {
    const minRating = Number(filters.rating);
    withRatings = withRatings.filter((p) => p.rating.average >= minRating);
  }

  return withRatings;
};

module.exports = { createAdminProduct, getAdminProducts };
