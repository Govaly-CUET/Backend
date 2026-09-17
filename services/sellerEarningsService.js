const Order = require('../models/orderModel');
const Seller = require('../models/sellerModel');

/*
 * Returns the seller's delivered orders with earnings breakdown,
 * plus summary totals (gross sales, total commission, net payable).
 */
const getSellerEarnings = async (sellerId) => {
  const seller = await Seller.findById(sellerId).select('commission');

  const orders = await Order.find({ seller: sellerId, financialStatus: 'delivered' })
    .sort({ createdAt: -1 })
    .select('orderCode amount sellerEarning govalyEarning createdAt');

  const earnings = orders.map((order) => ({
    orderCode: order.orderCode,
    date: order.createdAt,
    grossSale: order.amount,
    commissionAmount: order.govalyEarning,
    netPayable: order.sellerEarning,
  }));

  const summary = earnings.reduce(
    (acc, item) => {
      acc.totalGrossSales += item.grossSale;
      acc.totalCommission += item.commissionAmount;
      acc.totalNetPayable += item.netPayable;
      return acc;
    },
    { totalGrossSales: 0, totalCommission: 0, totalNetPayable: 0 }
  );

  return {
    commissionRate: seller.commission,
    summary,
    orders: earnings,
  };
};

module.exports = { getSellerEarnings };