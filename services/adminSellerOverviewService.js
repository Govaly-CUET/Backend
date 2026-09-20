const Seller = require('../models/sellerModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const { ORDER_STATUS_STAGES } = require('./orderStatusStages');

/*
 * One combined "Sellers" overview row per seller: their basic profile
 * plus a Product breakdown, Category breakdown, Order status
 * breakdown and Finance summary — everything the reference design
 * groups under one row, built only from fields that actually exist
 * on our models (no Type/Brand/Payment Method/Verification badge/
 * Social Links — none of that is tracked).
 */
const getSellersOverview = async ({ status, category, rating } = {}) => {
  const match = {};

  if (status) {
    match.status = status;
  }

  const sellers = await Seller.find(match)
    .select('shopName ownerName phone address status commission balance ratings')
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

  const productsBySeller = {};

  productRows.forEach((row) => {
    const sellerId = row._id.seller.toString();

    if (!productsBySeller[sellerId]) {
      productsBySeller[sellerId] = { total: 0, inStock: 0, outOfStock: 0, categories: [] };
    }

    productsBySeller[sellerId].total += row.count;
    productsBySeller[sellerId].inStock += row.inStock;
    productsBySeller[sellerId].outOfStock += row.outOfStock;
    productsBySeller[sellerId].categories.push({
      id: row._id.categoryId ? row._id.categoryId.toString() : null,
      name: row._id.categoryName || 'Uncategorized',
      count: row.count,
    });
  });

  const orderRows = await Order.aggregate([
    ...ORDER_STATUS_STAGES,
    {
      $group: {
        _id: { seller: '$seller', status: '$orderStatus' },
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
        sellerEarning: { $sum: '$sellerEarning' },
      },
    },
  ]);

  const ordersBySeller = {};

  orderRows.forEach((row) => {
    const sellerId = row._id.seller.toString();

    if (!ordersBySeller[sellerId]) {
      ordersBySeller[sellerId] = {
        total: 0,
        pending: 0,
        inProgress: 0,
        delivered: 0,
        canceled: 0,
        sale: 0,
        earning: 0,
      };
    }

    const bucket = ordersBySeller[sellerId];
    bucket.total += row.count;

    if (row._id.status === 'pending') bucket.pending += row.count;
    if (row._id.status === 'in_progress') bucket.inProgress += row.count;
    if (row._id.status === 'delivered') {
      bucket.delivered += row.count;
      bucket.sale += row.amount;
      bucket.earning += row.sellerEarning;
    }
    if (row._id.status === 'canceled') bucket.canceled += row.count;
  });

  let result = sellers.map((seller) => {
    const sellerId = seller._id.toString();

    return {
      ...seller,
      products: productsBySeller[sellerId] || { total: 0, inStock: 0, outOfStock: 0, categories: [] },
      orders: ordersBySeller[sellerId] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        delivered: 0,
        canceled: 0,
        sale: 0,
        earning: 0,
      },
    };
  });

  if (category) {
    result = result.filter((seller) =>
      seller.products.categories.some((c) => c.id === category)
    );
  }

  if (rating) {
    const minRating = Number(rating);
    result = result.filter((seller) => seller.ratings >= minRating);
  }

  return result;
};

module.exports = { getSellersOverview };
