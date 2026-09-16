const mongoose = require('mongoose');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

const statusName = (status) => status === 'canceled' ? 'Cancelled' : status === 'delivered' ? 'Delivered' : status === 'in_progress' ? 'Processing' : 'Placed';

const toCustomerOrder = (order) => {
  const value = order.toObject ? order.toObject() : order;
  return {
    ...value,
    status: statusName(value.financialStatus),
    subtotal: value.amount,
    deliveryInfo: {
      fullName: value.shippingAddress?.name,
      phone: value.shippingAddress?.phone,
      address: [value.shippingAddress?.address, value.shippingAddress?.area, value.shippingAddress?.district, value.shippingAddress?.division].filter(Boolean).join(', '),
      ...value.shippingAddress,
    },
  };
};

const checkout = async (userId, { deliveryInfo, paymentMethod }) => {
  if (!deliveryInfo?.fullName || !deliveryInfo?.phone || !deliveryInfo?.address || !deliveryInfo?.division || !deliveryInfo?.district) {
    throw { status: 400, message: 'Please complete your name, phone, address, division and district.' };
  }

  const user = await User.findById(userId);
  const cart = await Cart.findOne({ customer: userId }).populate({ path: 'items.product', model: Product });
  if (!cart?.items?.length) throw { status: 400, message: 'Your cart is empty.' };

  const items = cart.items.map((line) => {
    const product = line.product;
    if (!product) throw { status: 400, message: 'One of the items in your cart no longer exists.' };
    return {
      product: product._id,
      productName: product.name,
      image: product.image,
      price: product.sale_price,
      quantity: line.quantity,
      seller: product.seller,
    };
  });

  const groups = new Map();
  items.forEach((item) => {
    const key = String(item.seller);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const groupId = new mongoose.Types.ObjectId();
  const shippingAddress = {
    name: deliveryInfo.fullName,
    phone: deliveryInfo.phone,
    email: user.email,
    division: deliveryInfo.division,
    district: deliveryInfo.district,
    area: deliveryInfo.area || deliveryInfo.district,
    address: deliveryInfo.address,
  };
  const orders = [];

  for (const sellerItems of groups.values()) {
    const amount = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const seller = sellerItems[0].seller;
    const order = await Order.create({
      orderCode: `Go#${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      groupId,
      customer: userId,
      seller,
      shippingAddress,
      paymentMethod: String(paymentMethod || 'cod').toUpperCase() === 'COD' ? 'COD' : String(paymentMethod).toUpperCase(),
      amount,
      items: sellerItems.map(({ seller: ignored, ...item }) => item),
      sellerEarning: amount,
      govalyEarning: 0,
    });
    orders.push(order);
  }

  await Promise.all(items.map((item) => Product.updateOne(
    { _id: item.product },
    [
      { $set: { stock: { $max: [{ $subtract: ['$stock', item.quantity] }, 0] }, sold_items: { $add: ['$sold_items', item.quantity] } } },
      { $set: { status: { $cond: [{ $lte: ['$stock', 0] }, 'out_of_stock', 'in_stock'] } } },
    ],
    { updatePipeline: true }
  )));

  cart.items = [];
  await cart.save();
  return toCustomerOrder(orders[0]);
};

const listOrders = async (userId, status) => {
  const query = { customer: userId };
  if (status) query.financialStatus = status === 'Cancelled' ? 'canceled' : status === 'Processing' ? 'in_progress' : status.toLowerCase();
  const orders = await Order.find(query).populate('items.product', 'name image slug').populate('seller', 'shopName shopSlug').sort('-createdAt').lean();
  return orders.map(toCustomerOrder);
};

const getOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customer: userId }).populate('items.product', 'name image slug').populate('seller', 'shopName shopSlug').lean();
  if (!order) throw { status: 404, message: 'Order not found' };
  return toCustomerOrder(order);
};

const trackOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customer: userId }).select('financialStatus createdAt updatedAt').lean();
  if (!order) throw { status: 404, message: 'Order not found' };
  return { status: statusName(order.financialStatus), statusHistory: [{ status: statusName(order.financialStatus), at: order.updatedAt || order.createdAt }], updatedAt: order.updatedAt };
};

const cancelOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customer: userId });
  if (!order) throw { status: 404, message: 'Order not found' };
  if (!['pending', 'in_progress'].includes(order.financialStatus)) throw { status: 400, message: 'This order can no longer be cancelled.' };
  order.financialStatus = 'canceled';
  await order.save();
  await Promise.all(order.items.map((item) => Product.updateOne(
    { _id: item.product },
    [{ $set: { stock: { $add: ['$stock', item.quantity] }, status: 'in_stock' } }],
    { updatePipeline: true }
  )));
  return toCustomerOrder(order);
};

module.exports = { checkout, listOrders, getOrder, trackOrder, cancelOrder };
