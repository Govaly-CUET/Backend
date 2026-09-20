const Order = require('../models/orderModel');
const Shipment = require('../models/shipmentModel');
const { getOrderById } = require('./adminOrderService');
const { getCourier, getCourierInfo, pathaoMode } = require('./couriers');
const { normalizeKey, mapKey, parseWebhookBody } = require('./couriers/pathaoStatus');

const FINISHED_SHIPMENT = ['delivered', 'cancelled'];

// Forward order of a normal delivery. `hold` is deliberately not on it:
// a shipment can drop onto hold from anywhere and resume from it.
const STATUS_RANK = {
  pending: 0,
  processing: 1,
  picked_from_seller: 2,
  in_transit: 3,
  at_delivery_hub: 4,
  delivered: 5,
};

// One courier booking per order at a time (single-process guard against
// a double click booking two real parcels).
const booking = new Set();

const findOrderOrThrow = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  return order;
};

// The order's Shipment, or an unsaved one seeded with the same defaults
// the order list shows for orders that have none yet.
const loadShipment = async (order) => {
  const existing = await Shipment.findOne({ order: order._id });

  if (existing) return existing;

  const defaults = Shipment.defaultShipmentFor(order);

  return new Shipment({
    order: order._id,
    sellerStatus: defaults.sellerStatus,
    status: defaults.status,
  });
};

/*
 * The single place a shipment status changes. Logs the change, and once
 * the parcel is picked up the seller's part is done, so their stage
 * is Handed Over from then on, whoever moved the shipment. Returns whether anything changed.
 */
const applyStatus = (shipment, status, { note = '', source = 'admin' } = {}) => {
  if (status === shipment.status) return false;

  shipment.status = status;
  shipment.history.push({ track: 'shipment', status, note, source });

  if (Shipment.PICKED_UP.includes(status) && shipment.sellerStatus !== 'handed_over') {
    shipment.sellerStatus = 'handed_over';
    shipment.history.push({
      track: 'seller',
      status: 'handed_over',
      note: 'Updated automatically with the shipment.',
      source,
    });
  }

  return true;
};

/*
 * Manual update of one order's shipment by the admin: the status and a note.
 *
 *  - Pending -> Processing needs nothing else. It is what lets the seller
 *    start (Accepted, then Packed).
 *  - The agent and tracking ID are never typed in. They come from "Create
 *    Pathao Shipment" (createCourierShipment) and are locked from then on.
 *  - Statuses after Processing need that tracking ID to exist already.
 *  - The seller stage is the seller's to change, never the admin's.
 *
 * Only what actually changed is written and logged to the timeline.
 */
const updateShipment = async (orderId, input = {}) => {
  const order = await findOrderOrThrow(orderId);
  const { courier, consignmentId, sellerStatus, status, note } = input;

  if (sellerStatus !== undefined) {
    throw { status: 400, message: 'The seller stage is updated by the seller, not the admin.' };
  }

  if (status !== undefined && !Shipment.SHIPMENT_STATUSES.includes(status)) {
    throw { status: 400, message: 'Invalid shipment status.' };
  }

  const shipment = await loadShipment(order);

  // Re-sending the values it already has is harmless; changing them is not.
  const sameCourier = courier === undefined || (courier || undefined) === shipment.courier;
  const sameConsignment =
    consignmentId === undefined || String(consignmentId).trim() === shipment.consignmentId;

  if (!sameCourier || !sameConsignment) {
    throw {
      status: 400,
      message: 'The agent and tracking ID come from "Create Pathao Shipment" and cannot be typed in.',
    };
  }

  const cleanNote = typeof note === 'string' ? note.trim() : '';
  const statusChanging = status !== undefined && status !== shipment.status;

  // A recorded payment stands on the delivery. Undo the payment first.
  if (statusChanging && shipment.status === 'delivered' && order.sellerPayment === 'paid') {
    throw {
      status: 400,
      message: 'The seller has been paid for this delivery. Set the seller payment back to Pending before changing the shipment status.',
    };
  }

  if (statusChanging && Shipment.NEEDS_COURIER.includes(status) && !shipment.consignmentId) {
    throw {
      status: 400,
      message: 'Create the Pathao shipment first, so there is a tracking ID, before moving past Processing.',
    };
  }

  if (statusChanging && applyStatus(shipment, status, { note: cleanNote })) {
    await shipment.save();
  }

  return getOrderById(order._id);
};

/*
 * Books the parcel with the courier and records the consignment. Runs
 * against the mock or Pathao's sandbox, depending on PATHAO_MODE.
 */
const createCourierShipment = async (orderId) => {
  const order = await findOrderOrThrow(orderId);

  const key = String(order._id);

  if (booking.has(key)) {
    throw { status: 409, message: 'A courier shipment is already being created for this order.' };
  }

  booking.add(key);

  try {
    const shipment = await loadShipment(order);

    if (FINISHED_SHIPMENT.includes(shipment.status)) {
      throw { status: 409, message: 'This order is already finished.' };
    }

    if (shipment.consignmentId) {
      throw { status: 409, message: 'This order already has a consignment ID.' };
    }

    if (shipment.status === 'pending') {
      throw {
        status: 409,
        message: 'Set the shipment to Processing first, so the seller can accept the order.',
      };
    }

    const acceptedAt = Shipment.SELLER_STATUSES.indexOf('accepted');

    if (Shipment.SELLER_STATUSES.indexOf(shipment.sellerStatus) < acceptedAt) {
      throw {
        status: 409,
        message: 'Waiting for the seller to accept the order before a courier shipment can be created.',
      };
    }

    const result = await getCourier('pathao').createParcel(order);

    shipment.courier = 'pathao';
    shipment.consignmentId = result.consignmentId;
    shipment.deliveryFee = result.deliveryFee;
    shipment.mode = result.mode;

    shipment.history.push({
      track: 'delivery',
      status: `Pathao · ${result.consignmentId} (${result.mode})`,
      note: 'Shipment created through the courier API.',
      source: 'courier',
    });

    await shipment.save();
  } finally {
    booking.delete(key);
  }

  return getOrderById(order._id);
};

/*
 * Applies one courier status (already normalised to a key such as
 * "in-transit") to a shipment. Shared by webhooks, polling and the mock
 * simulator so they can never disagree. Returns whether it changed.
 */
const applyCourierKey = (shipment, key) => {
  const mapped = mapKey(key);

  if (mapped.ignore) return false;

  if (!mapped.status) {
    // Unknown to us: keep the fact, change nothing.
    if (!key) return false;
    shipment.history.push({ track: 'delivery', status: `Pathao: ${key}`, source: 'courier' });
    return true;
  }

  // Webhooks can arrive late or out of order. A finished shipment stays
  // finished, and a normal delivery never steps backwards on its own.
  if (FINISHED_SHIPMENT.includes(shipment.status)) return false;

  const from = STATUS_RANK[shipment.status];
  const to = STATUS_RANK[mapped.status];
  const involvesHold = mapped.status === 'hold' || shipment.status === 'hold';

  if (!involvesHold && from !== undefined && to !== undefined && to < from) return false;

  return applyStatus(shipment, mapped.status, {
    note: mapped.note || `Pathao: ${key}`,
    source: 'courier',
  });
};

// Shared tail of every courier-driven update.
const commitCourierUpdate = async (shipment, key) => {
  const order = await Order.findById(shipment.order);
  const changed = applyCourierKey(shipment, key);

  if (changed) {
    await shipment.save();
  }

  return changed;
};

// Webhook body (real or mock-built) -> the matching shipment.
const handleCourierEvent = async (body) => {
  const { key, consignmentId, merchantOrderId } = parseWebhookBody(body);

  let shipment = consignmentId ? await Shipment.findOne({ consignmentId }) : null;

  if (!shipment && merchantOrderId) {
    const order = await Order.findOne({ orderCode: merchantOrderId });
    shipment = order ? await Shipment.findOne({ order: order._id }) : null;
  }

  if (!shipment) {
    return { handled: false, reason: 'No shipment matches this consignment.' };
  }

  const changed = await commitCourierUpdate(shipment, key);

  return { handled: true, changed };
};

const assertSameMode = (shipment) => {
  const current = pathaoMode();

  if (shipment.mode && shipment.mode !== current) {
    throw {
      status: 409,
      message: `This shipment was created in ${shipment.mode} mode but the server is now in ${current} mode.`,
    };
  }
};

// Asks the courier for the current status of one shipment document.
const syncShipmentDoc = async (shipment) => {
  if (!shipment.mode) {
    throw {
      status: 400,
      message:
        'This tracking ID was entered by hand, so the courier has no record of it. Only shipments created with "Create Pathao Shipment" can be synced.',
    };
  }

  assertSameMode(shipment);

  if (shipment.mode === 'mock') {
    throw { status: 400, message: 'A mock shipment has no courier to sync with — use Simulate instead.' };
  }

  const { rawStatus } = await getCourier(shipment.courier || 'pathao').getStatus(shipment.consignmentId);

  return commitCourierUpdate(shipment, normalizeKey(rawStatus));
};

const requireShipmentWithConsignment = async (orderId) => {
  const order = await findOrderOrThrow(orderId);
  const shipment = await Shipment.findOne({ order: order._id });

  if (!shipment || !shipment.consignmentId) {
    throw { status: 409, message: 'This order has no courier consignment yet.' };
  }

  return { order, shipment };
};

const syncShipment = async (orderId) => {
  const { order, shipment } = await requireShipmentWithConsignment(orderId);

  await syncShipmentDoc(shipment);

  return getOrderById(order._id);
};

// Mock mode only: pushes a Pathao-shaped event through the real handler.
const simulateCourierEvent = async (orderId, event) => {
  const mock = require('./couriers/mockCourier');

  if (pathaoMode() !== 'mock') {
    throw { status: 400, message: 'Simulation is only available in mock mode.' };
  }

  if (!mock.simulationEvents.some((item) => item.value === event)) {
    throw { status: 400, message: 'Unknown simulation event.' };
  }

  const { order, shipment } = await requireShipmentWithConsignment(orderId);

  if (shipment.mode !== 'mock') {
    throw { status: 400, message: 'Only mock shipments can be simulated.' };
  }

  await handleCourierEvent(mock.buildEvent(shipment, order.orderCode, event));

  return getOrderById(order._id);
};

// Periodic catch-up for couriers that cannot reach a local webhook URL.
const syncOpenShipments = async () => {
  const mode = pathaoMode();

  if (mode === 'mock') return { checked: 0, updated: 0 };

  const open = await Shipment.find({
    consignmentId: { $ne: '' },
    mode,
    status: { $nin: FINISHED_SHIPMENT },
  }).limit(50);

  let updated = 0;

  for (const shipment of open) {
    try {
      if (await syncShipmentDoc(shipment)) updated += 1;
    } catch (error) {
      console.error(`Shipment sync failed for ${shipment.consignmentId}: ${error.message}`);
    }
  }

  return { checked: open.length, updated };
};

module.exports = {
  updateShipment,
  createCourierShipment,
  syncShipment,
  simulateCourierEvent,
  handleCourierEvent,
  syncOpenShipments,
  getCourierInfo,
};
