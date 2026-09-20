const Order = require('../models/orderModel');
const { ORDER_STATUS_STAGES } = require('./orderStatusStages');

// How many of a seller's orders are in one status (an order's status is its shipment's).
const countByStatus = async (sellerId, orderStatus) => {
  const [row] = await Order.aggregate([
    { $match: { seller: sellerId } },
    ...ORDER_STATUS_STAGES,
    { $match: { orderStatus } },
    { $count: 'total' },
  ]);

  return row?.total || 0;
};

const getSellerDashboardStats = async (sellerId) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    monthlySalesResult,
    pendingOrders,
    completedShipments,
    totalEarningsResult,
    salesTrendRaw,
    earningsTrendRaw,
  ] = await Promise.all([
    Order.aggregate([
      {
        $match: { seller: sellerId, createdAt: { $gte: startOfMonth } },
      },
      ...ORDER_STATUS_STAGES,
      { $match: { orderStatus: { $ne: 'canceled' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    countByStatus(sellerId, 'pending'),
    countByStatus(sellerId, 'delivered'),
    Order.aggregate([
      { $match: { seller: sellerId } },
      ...ORDER_STATUS_STAGES,
      { $match: { orderStatus: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$sellerEarning' } } },
    ]),
    Order.aggregate([
      {
        $match: { seller: sellerId, createdAt: { $gte: sixMonthsAgo } },
      },
      ...ORDER_STATUS_STAGES,
      { $match: { orderStatus: { $ne: 'canceled' } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Order.aggregate([
      {
        $match: { seller: sellerId, createdAt: { $gte: sixMonthsAgo } },
      },
      ...ORDER_STATUS_STAGES,
      { $match: { orderStatus: 'delivered' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$sellerEarning' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const buildTrend = (raw) => {
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const match = raw.find((r) => r._id.year === year && r._id.month === month);
      trend.push({
        label: monthNames[month - 1],
        amount: match ? match.total : 0,
      });
    }
    return trend;
  };

  return {
    monthlySales: monthlySalesResult[0]?.total || 0,
    pendingOrders,
    completedShipments,
    totalEarnings: totalEarningsResult[0]?.total || 0,
    salesTrend: buildTrend(salesTrendRaw),
    earningsTrend: buildTrend(earningsTrendRaw),
  };
};

module.exports = { getSellerDashboardStats };