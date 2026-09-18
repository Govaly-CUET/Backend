const Seller = require('../models/sellerModel');
const Product = require('../models/productModel');

const getAllSellersCommission = async ({ status, category, sort } = {}) => {
  const match = {};

  if (status) {
    match.status = status;
  }

  const sellers = await Seller.find(match)
    .select('shopName commission status')
    .sort({ shopName: 1 })
    .lean();

  const productRows = await Product.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { seller: '$seller', categoryId: '$categoryDoc._id', categoryName: '$categoryDoc.name' },
        count: { $sum: 1 },
        inStock: { $sum: { $cond: [{ $eq: ['$status', 'in_stock'] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] } },
      },
    },
  ]);

  const bySeller = {};

  productRows.forEach((row) => {
    const sellerId = row._id.seller.toString();

    if (!bySeller[sellerId]) {
      bySeller[sellerId] = {
        total: 0,
        inStock: 0,
        outOfStock: 0,
        categories: [],
      };
    }

    bySeller[sellerId].total += row.count;
    bySeller[sellerId].inStock += row.inStock;
    bySeller[sellerId].outOfStock += row.outOfStock;
    bySeller[sellerId].categories.push({
      id: row._id.categoryId ? row._id.categoryId.toString() : null,
      name: row._id.categoryName || 'Uncategorized',
      count: row.count,
    });
  });

  let result = sellers.map((seller) => ({
    ...seller,
    products: bySeller[seller._id.toString()] || {
      total: 0,
      inStock: 0,
      outOfStock: 0,
      categories: [],
    },
  }));

  if (category) {
    result = result.filter((seller) =>
      seller.products.categories.some((c) => c.id === category)
    );
  }

  if (sort === 'commission_asc') {
    result.sort((a, b) => a.commission - b.commission);
  } else if (sort === 'commission_desc') {
    result.sort((a, b) => b.commission - a.commission);
  }

  return result;
};

const updateSellerCommission = async (id, commission) => {
  if (typeof commission !== 'number' || commission < 0 || commission > 100) {
    throw { status: 400, message: 'Commission must be a number between 0 and 100.' };
  }

  const seller = await Seller.findByIdAndUpdate(
    id,
    { commission },
    { new: true, runValidators: true }
  ).select('shopName commission status');

  if (!seller) {
    throw { status: 404, message: 'Seller not found.' };
  }

  return seller;
};

module.exports = { getAllSellersCommission, updateSellerCommission };