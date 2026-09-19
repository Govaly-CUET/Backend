const { buildParcel } = require('./parcel');

/*
 * Stand-in for Pathao while developing: books nothing and contacts
 * nobody. It follows the same interface as the real adapter and the
 * same input rules, and its "events" are shaped like Pathao's webhook
 * bodies so they run through the very same status-mapping code.
 */
const SIMULATION_EVENTS = [
  { value: 'order.pickup-requested', label: 'Pickup requested' },
  { value: 'order.picked', label: 'Picked up' },
  { value: 'order.in-transit', label: 'In transit' },
  { value: 'order.received-at-last-mile-hub', label: 'At last-mile hub' },
  { value: 'order.delivered', label: 'Delivered' },
  { value: 'order.on-hold', label: 'On hold' },
  { value: 'order.delivery-failed', label: 'Delivery failed' },
];

const mockCourier = {
  name: 'pathao',
  mode: 'mock',

  async createParcel(order) {
    buildParcel(order);

    const digits = String(order.orderCode).replace(/\D/g, '') || 'X';
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

    return { consignmentId: `MOCK-${digits}-${suffix}`, deliveryFee: 60, mode: 'mock' };
  },

  async getStatus() {
    return { rawStatus: null };
  },

  buildEvent(shipment, orderCode, event) {
    return {
      event,
      consignment_id: shipment.consignmentId,
      merchant_order_id: orderCode,
      updated_at: new Date().toISOString(),
    };
  },

  simulationEvents: SIMULATION_EVENTS,
};

module.exports = mockCourier;
