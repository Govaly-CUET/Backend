const mongoose = require('mongoose');

/*
 * One review = one customer's rating (+ optional text) for one
 * product they actually bought. Admin-created products only, same
 * simplification as orderModel.js — plain ref, no refPath.
 */
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Proves this is a real, delivered purchase — what makes
    // "Verified Buyer" true rather than just a label. The
    // create-review controller must check this order actually
    // belongs to this customer, contains this product, and has
    // financialStatus 'delivered' before allowing the review.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    // Optional — a buyer can rate without leaving text.
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per customer per product — stops the same buyer
// reviewing the same product twice.
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
