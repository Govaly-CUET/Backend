const Order = require('../models/orderModel');
const Seller = require('../models/sellerModel');

const VALID_STATUSES = ['pending', 'in_progress', 'delivered', 'canceled'];

/*
 * Payment is only recognized once an order is actually delivered
 * (cash on delivery). Before that, both earnings sit at 0 — nothing
 * has been collected yet.
 */
const computeEarnings = (amount, commissionPct) => {
  const govalyEarning = Math.round(((amount * (commissionPct || 0)) / 100) * 100) / 100;
  const sellerEarning = Math.round((amount - govalyEarning) * 100) / 100;
  return { govalyEarning, sellerEarning };
};

/*
 * Lists orders, newest first. Every filter is optional:
 *   - status: one financialStatus value
 *   - seller: one seller id
 *   - search: orderCode, case-insensitive, partial
 *   - dateStart / dateEnd: inclusive createdAt range (YYYY-MM-DD)
 */
const getOrders = async ({
  status,
  seller,
  search,
  dateStart,
  dateEnd,
  amountMin,
  amountMax,
} = {}) => {
  const match = {};

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      throw { status: 400, message: 'Invalid status filter.' };
    }
    match.financialStatus = status;
  }

  if (seller) {
    match.seller = seller;
  }

  if (search) {
    match.orderCode = { $regex: search, $options: 'i' };
  }

  if (dateStart || dateEnd) {
    match.createdAt = {};

    if (dateStart) {
      match.createdAt.$gte = new Date(dateStart);
    }

    if (dateEnd) {
      // Push to the end of that calendar day so "End" is inclusive.
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }

  if (amountMin || amountMax) {
    match.amount = {};
    if (amountMin) match.amount.$gte = Number(amountMin);
    if (amountMax) match.amount.$lte = Number(amountMax);
  }

  return Order.find(match)
    .sort({ createdAt: -1 })
    .populate('customer', 'name email phone')
    .populate('seller', 'shopName')
    .populate('items.product', 'name');
};

const getOrderById = async (id) => {
  const order = await Order.findById(id)
    .populate('customer', 'name email phone')
    .populate('seller', 'shopName')
    .populate('items.product', 'name');

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  return order;
};

const updateOrderStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw { status: 400, message: 'Invalid status. Must be pending, in_progress, delivered, or canceled.' };
  }

  const existing = await Order.findById(id);

  if (!existing) {
    throw { status: 404, message: 'Order not found.' };
  }

  let earnings = { govalyEarning: 0, sellerEarning: 0 };

  if (status === 'delivered') {
    const seller = await Seller.findById(existing.seller, 'commission');
    earnings = computeEarnings(existing.amount, seller?.commission);
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { financialStatus: status, ...earnings },
    { new: true, runValidators: true }
  )
    .populate('customer', 'name email phone')
    .populate('seller', 'shopName')
    .populate('items.product', 'name');

  return order;
};

module.exports = { getOrders, getOrderById, updateOrderStatus };
