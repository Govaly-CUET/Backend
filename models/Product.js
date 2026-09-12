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