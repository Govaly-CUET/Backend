const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    // Points at one item inside the parent category's own
    // subcategory[] array — not a separate collection, so no ref
    // here. Look it up with Category.findOne({ _id: category,
    // 'subcategory._id': subcategory }) rather than .populate().
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Subcategory is required'],

    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    sale_price: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    sold_items: {
      type: Number,
      default: 0,
    },
    // The shop this product belongs to. The admin create-product form
    // picks this explicitly from a Shop dropdown (see
    // adminProductService.js) — "Shop" in the UI is a label over this
    // same Seller reference, not a different field.
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
