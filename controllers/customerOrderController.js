const { checkout, listOrders, getOrder, trackOrder, cancelOrder } = require('../services/customerOrderService');

// @desc    Submit delivery info + payment method (COD only) -> creates order(s)
// @route   POST /api/v1/customer/checkout
const postCheckout = async (req, res) => {
  try {
    const order = await checkout(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Order placed.', data: order });
  } catch (error) {
    console.error('Customer checkout error:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   GET /api/v1/customer/orders
const getOrders = async (req, res) => {
  try {
    const orders = await listOrders(req.user._id, req.query.status);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/v1/customer/orders/:id
const getOrderDetail = async (req, res) => {
  try {
    const order = await getOrder(req.user._id, req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   GET /api/v1/customer/orders/:id/track
const getOrderTrack = async (req, res) => {
  try {
    const track = await trackOrder(req.user._id, req.params.id);
    res.status(200).json({ success: true, data: track });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   POST /api/v1/customer/orders/:id/cancel
const postCancel = async (req, res) => {
  try {
    const order = await cancelOrder(req.user._id, req.params.id);
    res.status(200).json({ success: true, message: 'Order cancelled.', data: order });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { postCheckout, getOrders, getOrderDetail, getOrderTrack, postCancel };
