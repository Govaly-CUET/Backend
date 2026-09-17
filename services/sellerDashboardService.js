const Order = require('../models/orderModel');

/*
 * Returns the seller's key dashboard stats:
 * - monthlySales: sum of order amounts placed this calendar month (excluding canceled)
 * - pendingOrders: count of orders awaiting action
 * - completedShipments: count of delivered orders
 * - totalEarnings: sum of sellerEarning across all delivered orders (all-time)
 */
const getSellerDashboardStats = async (sellerId) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [monthlySalesResult, pendingOrders, completedShipments, totalEarningsResult] =
    await Promise.all([
      Order.aggregate([
        {
          $match: {
            seller: sellerId,
            createdAt: { $gte: startOfMonth },
            financialStatus: { $ne: 'canceled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.countDocuments({ seller: sellerId, financialStatus: 'pending' }),
      Order.countDocuments({ seller: sellerId, financialStatus: 'delivered' }),
      Order.aggregate([
        { $match: { seller: sellerId, financialStatus: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$sellerEarning' } } },
      ]),
    ]);

  return {
    monthlySales: monthlySalesResult[0]?.total || 0,
    pendingOrders,
    completedShipments,
    totalEarnings: totalEarningsResult[0]?.total || 0,
  };
};

module.exports = { getSellerDashboardStats };