const mongoose = require('mongoose');

/*
 * One product line within an order — no seller/status here, both
 * live on the parent Order now (see below for why).
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Snapshots — survive the product being edited or deleted later,
    // so an old order still reads correctly.
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

/*
 * One Order = one seller's fulfillment of one checkout. A checkout
 * spanning multiple sellers creates multiple Order documents, tied
 * together by a shared groupId — see the note on that field below.
 */
const addressEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    division: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^Go#/, 'Order code must start with "Go#"'],
    },
    // Shared by every sibling order created from the same checkout,
    // so the customer's UI can show "these N orders were one
    // purchase" without needing a separate Checkout collection.
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller is required'],
    },
    shippingAddress: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true },
      division: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      area: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
    },
    // Alternative delivery addresses for this order. Empty until an
    // admin adds one; then it also holds a copy of the original
    // address. `shippingAddress` above stays the single active one.
    addressBook: {
      type: [addressEntrySchema],
      default: [],
    },
    // This seller's portion only — product price, no shipping/
    // discount lines (per the simplified design).
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'An order needs at least one item.',
      },
    },
    // An order has no status of its own: its status is its shipment's.
    // Whether the seller has been paid for a delivered order. Only the
    // admin changes it, and only once the order is delivered. Earnings
    // below count only while this is "paid".
    sellerPayment: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    sellerPaymentAt: { type: Date },
    // Govaly/seller internal economics — never exposed to the
    // customer-facing API, admin-only.
    sellerEarning: {
      type: Number,
      required: true,
      min: [0, 'Seller earning cannot be negative'],
    },
    govalyEarning: {
      type: Number,
      required: true,
      min: [0, 'Govaly earning cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Earnings exist only once the seller payment is "paid". Enforced here so
// no code path (checkout, seeds, scripts) can store earnings for an order
// that has not been paid.
orderSchema.pre('validate', function zeroUnpaidEarnings() {
  if (this.sellerPayment !== 'paid') {
    this.sellerEarning = 0;
    this.govalyEarning = 0;
  }
});

module.exports = mongoose.model('Order', orderSchema);