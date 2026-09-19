const {
  updateShipment,
  createCourierShipment,
  syncShipment,
  simulateCourierEvent,
  getCourierInfo,
} = require('../services/adminShipmentService');

// Runs a service call and sends the shared { success, message, data } shape.
const respond = (run, message) => async (req, res) => {
  try {
    const data = await run(req);

    res.status(200).json({ success: true, message, data });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/v1/admin/orders/:id/shipment
const updateOrderShipment = respond((req) => updateShipment(req.params.id, req.body), 'Shipment updated.');

// @route   POST /api/v1/admin/orders/:id/shipment/create
const createShipment = respond((req) => createCourierShipment(req.params.id), 'Courier shipment created.');

// @route   POST /api/v1/admin/orders/:id/shipment/sync
const syncOrderShipment = respond((req) => syncShipment(req.params.id), 'Shipment synced.');

// @route   POST /api/v1/admin/orders/:id/shipment/simulate   (mock mode only)
const simulateShipment = respond(
  (req) => simulateCourierEvent(req.params.id, req.body.event),
  'Event simulated.'
);

// @route   GET /api/v1/admin/orders/courier/config
const courierConfig = respond(() => getCourierInfo(), 'Courier configuration.');

module.exports = {
  updateOrderShipment,
  createShipment,
  syncOrderShipment,
  simulateShipment,
  courierConfig,
};
