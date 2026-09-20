const Shipment = require('../models/shipmentModel');

/*
 * What the customer sees of an order's shipment. The customer pipeline is
 * Placed -> Processing -> Shipped -> Delivered (or Cancelled), and it is
 * worked out from the shipment, so it moves when the admin, the seller or
 * Pathao move the shipment.
 *
 *   Placed      shipment Pending          (the admin has not started it)
 *   Processing  shipment Processing       (seller accepting / packing)
 *   Shipped     picked up, in transit, at the delivery hub
 *   Delivered   shipment Delivered
 *   Cancelled   order or shipment cancelled
 *
 * Only what a customer may see leaves this file: never fees, seller stage
 * history or internal notes.
 */
const SHIPPED = ['picked_from_seller', 'in_transit', 'at_delivery_hub'];

const STAGE_TEXT = {
  pending: 'We received your order.',
  processing: {
    waiting: 'The shop is getting your order ready.',
    accepted: 'The shop accepted your order.',
    packed: 'Your parcel is packed.',
    handed_over: 'Your parcel was handed over to the courier.',
  },
  picked_from_seller: 'The courier picked up your parcel.',
  in_transit: 'Your parcel is on its way.',
  at_delivery_hub: 'Your parcel reached the delivery hub near you.',
  delivered: 'Your parcel was delivered.',
  cancelled: 'This order was cancelled.',
};

const shipmentOf = (order, shipment) => shipment || Shipment.defaultShipmentFor(order);

const customerStatus = (order, shipment) => {
  const current = shipmentOf(order, shipment);

  if (current.status === 'cancelled') return 'Cancelled';
  if (current.status === 'delivered') return 'Delivered';
  if (SHIPPED.includes(current.status)) return 'Shipped';

  // On hold: with the courier once picked up, otherwise still being prepared.
  if (current.status === 'hold') {
    return current.sellerStatus === 'handed_over' ? 'Shipped' : 'Processing';
  }

  if (current.status === 'processing') return 'Processing';

  return 'Placed';
};

const stageText = (order, shipment) => {
  const current = shipmentOf(order, shipment);

  if (customerStatus(order, shipment) === 'Cancelled') return STAGE_TEXT.cancelled;
  if (current.status === 'hold') return 'Your parcel is on hold. We are sorting it out with the courier.';
  if (current.status === 'processing') return STAGE_TEXT.processing[current.sellerStatus] || STAGE_TEXT.processing.waiting;

  return STAGE_TEXT[current.status] || STAGE_TEXT.pending;
};

// Once the courier has a parcel for this order it can no longer be cancelled here.
const isCancellable = (order, shipment) => {
  const current = shipmentOf(order, shipment);

  if (!['pending', 'processing'].includes(current.status)) return false;

  return !current.consignmentId;
};

const shipmentSummary = (order, shipment) => {
  const current = shipmentOf(order, shipment);

  return {
    courier: current.courier || null,
    consignmentId: current.consignmentId || '',
    stage: stageText(order, shipment),
  };
};

// One dated entry per customer step, taken from the real shipment history.
const statusHistory = (order, shipment) => {
  const current = shipmentOf(order, shipment);
  const status = customerStatus(order, shipment);
  const entries = current.history.filter((entry) => entry.track === 'shipment');
  const firstAt = (keys) => entries.find((entry) => keys.includes(entry.status))?.at;
  const history = [{ status: 'Placed', at: order.createdAt }];

  const steps = [
    ['Processing', firstAt(['processing'])],
    ['Shipped', firstAt(SHIPPED)],
    ['Delivered', firstAt(['delivered'])],
    ['Cancelled', firstAt(['cancelled'])],
  ];

  for (const [name, at] of steps) {
    if (at) history.push({ status: name, at });
  }

  // Older orders, or ones moved by hand, may have no history for the step
  // they are on now. Fall back to the last update so the step still shows.
  if (!history.some((entry) => entry.status === status)) {
    history.push({ status, at: current.updatedAt || order.updatedAt || order.createdAt });
  }

  return history;
};

const attachShipments = async (orders) => {
  const shipments = await Shipment.find({
    order: { $in: orders.map((order) => order._id) },
  }).lean();

  const byOrder = new Map(shipments.map((shipment) => [String(shipment.order), shipment]));

  return orders.map((order) => ({ order, shipment: byOrder.get(String(order._id)) || null }));
};

module.exports = {
  customerStatus,
  isCancellable,
  shipmentSummary,
  statusHistory,
  attachShipments,
};
