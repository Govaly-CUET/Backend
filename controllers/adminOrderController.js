const {
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require('../services/adminOrderService');

// @desc    List orders (optionally filtered by status/search)
// @route   GET /api/v1/admin/orders
// @access  Private (Admin)
const listOrders = async (req, res) => {
  try {
    const orders = await getOrders(req.query);

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Get a single order
// @route   GET /api/v1/admin/orders/:id
// @access  Private (Admin)
const getOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Update an order's financial status
// @route   PATCH /api/v1/admin/orders/:id/status
// @access  Private (Admin)
const updateStatus = async (req, res) => {
  try {
    const order = await updateOrderStatus(req.params.id, req.body.status);

    res.status(200).json({
      success: true,
      message: 'Order status updated.',
      data: order,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { listOrders, getOrder, updateStatus };
