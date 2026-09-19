const Order = require('../models/orderModel');
const Shipment = require('../models/shipmentModel');
const { getOrderById } = require('./adminOrderService');
const { toSellerOrder } = require('./sellerOrderView');

/*
 * A seller moves their own stage on one of their own orders:
 * Accepted -> Packed -> Handed Over, forward only, and only after the
 * admin has started processing it. Handed Over also needs the courier's
 * tracking ID to exist.
 *
 * Deliberately narrow: no other shipment field is reachable from here,
 * and a seller only ever gets "not found" for someone else's order.
 * Returns the order in the same shape as GET /seller/orders rows.
 */
const updateSellerStage = async (sellerId, orderId, stage) => {
  if (!Shipment.SELLER_SETTABLE.includes(stage)) {
    throw {
      status: 400,
      message: `Choose one of: ${Shipment.SELLER_SETTABLE.join(', ')}.`,
    };
  }

  const order = await Order.findOne({ _id: orderId, seller: sellerId });

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  if (['delivered', 'canceled'].includes(order.financialStatus)) {
    throw { status: 409, message: 'This order is already finished.' };
  }

  let shipment = await Shipment.findOne({ order: order._id });

  if (!shipment) {
    const defaults = Shipment.defaultShipmentFor(order);
    shipment = new Shipment({
      order: order._id,
      sellerStatus: defaults.sellerStatus,
      status: defaults.status,
    });
  }

  if (shipment.status === 'pending') {
    throw { status: 409, message: 'Waiting for the admin to start processing this order.' };
  }

  if (shipment.status === 'cancelled') {
    throw { status: 409, message: 'This shipment was cancelled.' };
  }

  if (shipment.sellerStatus === 'handed_over') {
    throw { status: 409, message: 'The parcel has already been handed over and cannot be changed.' };
  }

  if (stage === 'handed_over' && !shipment.consignmentId) {
    throw {
      status: 409,
      message: 'The parcel can be handed over only after the courier shipment has been created.',
    };
  }

  const stages = Shipment.SELLER_STATUSES;

  if (stages.indexOf(stage) <= stages.indexOf(shipment.sellerStatus)) {
    throw {
      status: 409,
      message: `The stage is already "${shipment.sellerStatus}" — it can only move forward.`,
    };
  }

  shipment.sellerStatus = stage;
  shipment.history.push({ track: 'seller', status: stage, note: '', source: 'seller' });
  await shipment.save();

  return toSellerOrder(await getOrderById(order._id));
};

module.exports = { updateSellerStage };
