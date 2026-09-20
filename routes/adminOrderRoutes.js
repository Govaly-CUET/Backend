const express = require('express');

const router = express.Router();

const {
  listOrders,
  getOrder,
  updatePayment,
  updateAddress,
  addAddress,
  selectAddress,
} = require('../controllers/adminOrderController');
const {
  updateOrderShipment,
  createShipment,
  syncOrderShipment,
  simulateShipment,
  courierConfig,
} = require('../controllers/adminShipmentController');

router.get('/', listOrders);
router.get('/courier/config', courierConfig); // before '/:id'
router.get('/:id', getOrder);
router.patch('/:id/payment', updatePayment);
router.patch('/:id/address', updateAddress);
router.post('/:id/addresses', addAddress);
router.patch('/:id/address/select', selectAddress);
router.patch('/:id/shipment', updateOrderShipment);
router.post('/:id/shipment/create', createShipment);
router.post('/:id/shipment/sync', syncOrderShipment);
router.post('/:id/shipment/simulate', simulateShipment);

module.exports = router;
