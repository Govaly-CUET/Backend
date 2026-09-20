const Order = require('../models/orderModel');
const Seller = require('../models/sellerModel');
const Shipment = require('../models/shipmentModel');

const VALID_STATUSES = ['pending', 'in_progress', 'delivered', 'canceled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'cancelled'];

/*
 * Earnings are only recognised once the admin marks the seller payment
 * "paid" (see updateSellerPayment). Delivery alone records nothing.
 */
const computeEarnings = (amount, commissionPct) => {
  const govalyEarning = Math.round(((amount * (commissionPct || 0)) / 100) * 100) / 100;
  const sellerEarning = Math.round((amount - govalyEarning) * 100) / 100;
  return { govalyEarning, sellerEarning };
};

// Earnings exist only once the seller payment is "paid". The model enforces
// this when it saves, but an order written by an older copy of the backend
// can still carry an amount, so what leaves the API is checked as well.
const withPaymentRule = (order) => {
  const sellerPayment = order.sellerPayment || 'pending';

  return sellerPayment === 'paid'
    ? { ...order, sellerPayment }
    : { ...order, sellerPayment, sellerEarning: 0, govalyEarning: 0 };
};

// Adds a `shipment` object to each order: the real Shipment document if
// one exists, otherwise defaults derived from the order's financialStatus.
const attachShipments = async (orders) => {
  const shipments = await Shipment.find({
    order: { $in: orders.map((order) => order._id) },
  }).lean();

  const byOrder = new Map(shipments.map((shipment) => [String(shipment.order), shipment]));

  return orders.map((order) => {
    const plain = typeof order.toObject === 'function' ? order.toObject() : order;

    return {
      ...withPaymentRule(plain),
      shipment: byOrder.get(String(plain._id)) || Shipment.defaultShipmentFor(plain),
    };
  });
};

const attachShipment = async (order) => (await attachShipments([order]))[0];

/*
 * Lists orders, newest first. Every filter is optional:
 *   - status: one financialStatus value
 *   - shipment: one shipment status (the Shipment column)
 *   - payment: "not_delivered" | pending | paid | cancelled (the Seller Payment column)
 *   - seller: one seller id
 *   - search: orderCode, case-insensitive, partial
 *   - dateStart / dateEnd: inclusive createdAt range (YYYY-MM-DD)
 */
const getOrders = async ({
  status,
  shipment,
  payment,
  seller,
  search,
  dateStart,
  dateEnd,
  amountMin,
  amountMax,
} = {}) => {
  const match = {};

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      throw { status: 400, message: 'Invalid status filter.' };
    }
    match.financialStatus = status;
  }

  if (shipment && !Shipment.SHIPMENT_STATUSES.includes(shipment)) {
    throw { status: 400, message: 'Invalid shipment filter.' };
  }

  // The Seller Payment column reads "Not delivered yet" until delivery,
  // and only then shows the admin's Pending / Paid / Cancelled choice.
  if (payment === 'not_delivered') {
    match.financialStatus = { $ne: 'delivered' };
  } else if (payment) {
    if (!PAYMENT_STATUSES.includes(payment)) {
      throw { status: 400, message: 'Invalid seller payment filter.' };
    }
    match.financialStatus = 'delivered';
    match.sellerPayment = payment;
  }

  if (seller) {
    match.seller = seller;
  }

  if (search) {
    match.orderCode = { $regex: search, $options: 'i' };
  }

  if (dateStart || dateEnd) {
    match.createdAt = {};

    if (dateStart) {
      match.createdAt.$gte = new Date(dateStart);
    }

    if (dateEnd) {
      // Push to the end of that calendar day so "End" is inclusive.
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }

  if (amountMin || amountMax) {
    match.amount = {};
    if (amountMin) match.amount.$gte = Number(amountMin);
    if (amountMax) match.amount.$lte = Number(amountMax);
  }

  const orders = await Order.find(match)
    .sort({ createdAt: -1 })
    .populate('customer', 'name email phone')
    .populate('seller', 'shopName')
    .populate('items.product', 'name');

  const withShipments = await attachShipments(orders);

  // Orders without a shipment document get a derived status, so this has
  // to look at the attached shipment rather than query the collection.
  return shipment ? withShipments.filter((order) => order.shipment.status === shipment) : withShipments;
};

const getOrderById = async (id) => {
  const order = await Order.findById(id)
    .populate('customer', 'name email phone')
    .populate('seller', 'shopName')
    .populate('items.product', 'name');

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  return attachShipment(order);
};

const updateOrderStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw { status: 400, message: 'Invalid status. Must be pending, in_progress, delivered, or canceled.' };
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { financialStatus: status },
    { new: true, runValidators: true }
  )
    .populate('customer', 'name email phone')
    .populate('seller', 'shopName')
    .populate('items.product', 'name');

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  return attachShipment(order);
};


/*
 * Seller payment, set by the admin once an order is delivered.
 *   paid              -> seller + Govaly earnings are recorded, using the
 *                        seller's commission at that moment
 *   pending/cancelled -> both earnings are 0
 * Setting the value it already has changes nothing, so a recorded
 * amount is never recalculated behind anyone's back.
 */
const updateSellerPayment = async (id, status) => {
  if (!PAYMENT_STATUSES.includes(status)) {
    throw { status: 400, message: 'Seller payment must be pending, paid or cancelled.' };
  }

  const order = await Order.findById(id);

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  if (order.financialStatus !== 'delivered') {
    throw { status: 409, message: 'The seller payment can only be set after the order is delivered.' };
  }

  if (order.sellerPayment === status) {
    return getOrderById(id);
  }

  let earnings = { govalyEarning: 0, sellerEarning: 0 };

  if (status === 'paid') {
    const seller = await Seller.findById(order.seller, 'commission');
    earnings = computeEarnings(order.amount, seller?.commission);
  }

  await Order.updateOne(
    { _id: id },
    { $set: { sellerPayment: status, sellerPaymentAt: new Date(), ...earnings } }
  );

  return getOrderById(id);
};

const ADDRESS_FIELDS = ['name', 'phone', 'email', 'division', 'district', 'area', 'address'];
const REQUIRED_ADDRESS_FIELDS = ['name', 'phone', 'division', 'district', 'area', 'address'];

// Whitelists + trims the fields and rejects a missing required one.
const cleanAddress = (input = {}) => {
  const cleaned = {};

  ADDRESS_FIELDS.forEach((field) => {
    const value = input[field];
    cleaned[field] = typeof value === 'string' ? value.trim() : '';
  });

  const missing = REQUIRED_ADDRESS_FIELDS.filter((field) => !cleaned[field]);

  if (missing.length > 0) {
    throw { status: 400, message: `Please fill in: ${missing.join(', ')}.` };
  }

  return cleaned;
};

const sameAddress = (a, b) =>
  ADDRESS_FIELDS.every((field) => (a?.[field] || '') === (b?.[field] || ''));

const pickAddress = (source) => {
  const copy = {};
  ADDRESS_FIELDS.forEach((field) => {
    copy[field] = source?.[field] || '';
  });
  return copy;
};

const findOrderOrThrow = async (id) => {
  const order = await Order.findById(id);

  if (!order) {
    throw { status: 404, message: 'Order not found.' };
  }

  return order;
};

const saveAndPopulate = async (order) => {
  await order.save();
  return getOrderById(order._id);
};

// Edits the active shipping address. If it is also listed in the
// address book, that entry is edited too so the two never drift apart.
const updateShippingAddress = async (id, input) => {
  const cleaned = cleanAddress(input);
  const order = await findOrderOrThrow(id);

  const previous = pickAddress(order.shippingAddress);
  const entry = order.addressBook.find((item) => sameAddress(item, previous));

  order.shippingAddress = cleaned;
  if (entry) entry.set(cleaned);

  return saveAndPopulate(order);
};

// Adds an alternative address without switching to it. The first time,
// the current address is copied in as "Address 1".
const addOrderAddress = async (id, input) => {
  const cleaned = cleanAddress(input);
  const order = await findOrderOrThrow(id);

  if (order.addressBook.length === 0) {
    order.addressBook.push(pickAddress(order.shippingAddress));
  }

  order.addressBook.push(cleaned);

  return saveAndPopulate(order);
};

// Makes one address-book entry the active shipping address.
const selectOrderAddress = async (id, addressId) => {
  const order = await findOrderOrThrow(id);
  const entry = order.addressBook.id(addressId);

  if (!entry) {
    throw { status: 404, message: 'That address is not saved on this order.' };
  }

  order.shippingAddress = pickAddress(entry);

  return saveAndPopulate(order);
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateSellerPayment,
  updateShippingAddress,
  addOrderAddress,
  selectOrderAddress,
};
