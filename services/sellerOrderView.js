/*
 * What a seller may see of an order. They see their own earning and
 * whether they have been paid, but never Govaly's earning, the courier's
 * fee, or the admin's internal shipment timeline.
 *
 * Works on the plain objects adminOrderService returns.
 */
const toSellerOrder = (order) => {
  const { govalyEarning, shipment, ...rest } = order;

  if (!shipment) return rest;

  const { deliveryFee, history, ...visibleShipment } = shipment;

  return { ...rest, shipment: visibleShipment };
};

module.exports = { toSellerOrder };
