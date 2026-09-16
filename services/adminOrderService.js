const Order = require('../models/orderModel');

const VALID_STATUSES = ['pending', 'in_progress', 'delivered', 'canceled'];

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

  const order = await Order.findByIdAndUpdate(
    id,
    { financialStatus: status },
    { new: true, runValidators: true }
  )
    .populate('customer', 'name email phone')
    .populate('seller', 'shopName')
    .populate('items.product', 'name');

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  return order;
};

module.exports = { getOrders, getOrderById, updateOrderStatus };
