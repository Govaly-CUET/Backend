/*
 * Translates Pathao's status vocabulary into the shipment statuses used
 * here. Pathao names the same step differently in webhook events
 * ("order.in-transit") and in the order-info status slug ("In_Transit"),
 * so both are normalised to one key first ("in-transit").
 *
 * Built from Pathao's published event list — check it against the
 * current docs when you get sandbox access.
 */
const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^order[._-]/, '')
    .replace(/[\s_.]+/g, '-');

const STATUS_BY_KEY = {
  created: 'processing',
  updated: 'processing',
  pending: 'processing',
  'pickup-requested': 'processing',
  'assigned-for-pickup': 'processing',
  picked: 'picked_from_seller',
  pickup: 'picked_from_seller',
  'at-the-sorting-hub': 'in_transit',
  'in-transit': 'in_transit',
  'received-at-last-mile-hub': 'at_delivery_hub',
  'assigned-for-delivery': 'at_delivery_hub',
  delivered: 'delivered',
  'on-hold': 'hold',
  'delivery-failed': 'hold',
  'pickup-failed': 'hold',
  'pickup-cancelled': 'hold',
};

// Returns and exchanges are outside this project's status set. They must
// not be dropped silently, so they park the shipment on Hold with a note.
const UNTRACKED_KEYS = new Set([
  'partial-delivery',
  'return',
  'returned',
  'return-id-created',
  'return-in-transit',
  'returned-to-merchant',
  'paid-return',
  'exchange',
  'exchanged',
]);

// Money-settlement notices — nothing to change on the shipment.
const IGNORED_KEYS = new Set(['paid', 'payment-invoice', 'store-created', 'store-updated']);

// -> { ignore: true } | { status, note? } | { status: null } (unknown)
const mapKey = (key) => {
  if (IGNORED_KEYS.has(key)) return { ignore: true };

  if (UNTRACKED_KEYS.has(key)) {
    return {
      status: 'hold',
      note: `Pathao reported "${key}". Returns and exchanges are not tracked here, so the shipment is on hold.`,
    };
  }

  return { status: STATUS_BY_KEY[key] || null };
};

// Pulls the fields we need out of a Pathao webhook body.
const parseWebhookBody = (body = {}) => ({
  key: normalizeKey(body.event || body.order_status_slug || body.order_status),
  consignmentId: body.consignment_id || body.data?.consignment_id || '',
  merchantOrderId: body.merchant_order_id || body.data?.merchant_order_id || '',
});

module.exports = { normalizeKey, mapKey, parseWebhookBody };
