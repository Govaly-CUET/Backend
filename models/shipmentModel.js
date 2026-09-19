const mongoose = require('mongoose');

// Pathao is the only agent for now; adding one means a new adapter in
// services/couriers/ plus its name here.
const COURIERS = ['pathao'];

// The seller's own stage, before/while the courier collects the parcel.
const SELLER_STATUSES = ['waiting', 'accepted', 'packed', 'handed_over'];

// The seller moves their own stage forward through these. "Waiting" is
// the starting point, and "Picked from Seller" is recorded when the
// parcel is actually collected — neither is the seller's to set.
const SELLER_SETTABLE = ['accepted', 'packed', 'handed_over'];

// Processing only opens the order to the seller. From the next status on
// the courier is booked, so the agent and tracking ID must already exist.
const NEEDS_COURIER = ['picked_from_seller', 'in_transit', 'at_delivery_hub', 'delivered'];

// Overall shipment lifecycle. Exchange / partial-delivery / refund
// states are deliberately absent (removed from the Order SRS).
const SHIPMENT_STATUSES = [
  'pending',
  'processing',
  'picked_from_seller',
  'in_transit',
  'at_delivery_hub',
  'delivered',
  'hold',
  'cancelled',
];

// Shipment status drives the order's financialStatus, which in turn
// drives the earnings split (see adminOrderService.updateOrderStatus).
const FINANCIAL_FROM_SHIPMENT = {
  pending: 'pending',
  processing: 'in_progress',
  picked_from_seller: 'in_progress',
  in_transit: 'in_progress',
  at_delivery_hub: 'in_progress',
  hold: 'in_progress',
  delivered: 'delivered',
  cancelled: 'canceled',
};

// Orders that have no Shipment document yet show a status derived from
// their existing financialStatus, so nothing needs migrating.
const SHIPMENT_FROM_FINANCIAL = {
  pending: 'pending',
  in_progress: 'processing',
  delivered: 'delivered',
  canceled: 'cancelled',
};

// Once the shipment is at or past pickup, the seller's part is done.
const PICKED_UP = ['picked_from_seller', 'in_transit', 'at_delivery_hub', 'delivered'];

const historySchema = new mongoose.Schema(
  {
    track: { type: String, enum: ['seller', 'shipment', 'delivery'], required: true },
    // A status key for seller/shipment entries; free text ("Pathao · ID")
    // for delivery entries.
    status: { type: String, required: true },
    note: { type: String, trim: true, default: '' },
    source: { type: String, enum: ['admin', 'courier', 'seller', 'customer'], default: 'admin' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    // One shipment per order — orders are already split per seller.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    courier: { type: String, enum: COURIERS },
    consignmentId: { type: String, trim: true, default: '' },
    // Which environment created the consignment — a "mock" or "sandbox"
    // shipment is never a real parcel. Unset for manually entered IDs.
    mode: { type: String, enum: ['mock', 'sandbox'] },
    // Courier's delivery charge as returned when the parcel was booked.
    deliveryFee: { type: Number, default: 0 },
    sellerStatus: { type: String, enum: SELLER_STATUSES, default: 'waiting' },
    status: { type: String, enum: SHIPMENT_STATUSES, default: 'pending' },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

const Shipment = mongoose.model('Shipment', shipmentSchema);

const defaultShipmentFor = (order) => ({
  courier: null,
  consignmentId: '',
  sellerStatus: order.financialStatus === 'delivered' ? 'handed_over' : 'waiting',
  status: SHIPMENT_FROM_FINANCIAL[order.financialStatus] || 'pending',
  history: [],
  updatedAt: null,
});

Object.assign(Shipment, {
  COURIERS,
  SELLER_STATUSES,
  SELLER_SETTABLE,
  NEEDS_COURIER,
  SHIPMENT_STATUSES,
  FINANCIAL_FROM_SHIPMENT,
  PICKED_UP,
  defaultShipmentFor,
});

module.exports = Shipment;
