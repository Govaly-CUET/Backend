const {
  getOrders,
  getOrderById,
  updateSellerPayment,
  updateShippingAddress,
  addOrderAddress,
  selectOrderAddress,
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

// Wraps an address service call in the shared response/error shape.
const addressHandler = (run, message) => async (req, res) => {
  try {
    const order = await run(req);

    res.status(200).json({ success: true, message, data: order });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/v1/admin/orders/:id/payment
const updatePayment = addressHandler(
  (req) => updateSellerPayment(req.params.id, req.body.status),
  'Seller payment updated.'
);

// @route   PATCH /api/v1/admin/orders/:id/address
const updateAddress = addressHandler(
  (req) => updateShippingAddress(req.params.id, req.body),
  'Shipping address updated.'
);

// @route   POST /api/v1/admin/orders/:id/addresses
const addAddress = addressHandler(
  (req) => addOrderAddress(req.params.id, req.body),
  'Address added.'
);

// @route   PATCH /api/v1/admin/orders/:id/address/select
const selectAddress = addressHandler(
  (req) => selectOrderAddress(req.params.id, req.body.addressId),
  'Shipping address changed.'
);

module.exports = {
  listOrders,
  getOrder,
  updatePayment,
  updateAddress,
  addAddress,
  selectAddress,
};
