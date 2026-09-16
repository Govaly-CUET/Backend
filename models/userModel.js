const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: null,
    },

    // Kept flexible so existing string addresses remain readable while new
    // profile and checkout forms can store structured delivery details.
    address: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    addresses: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    gender: {
      type: String,
      default: null,
    },

    DOB: {
      type: Date,
      default: null,
    },

    image: {
      type: String,
      default: null,
    },

    cartItems: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      productModel: {
        type: String,
        default: 'Product',
      },
      quantity: { type: Number, min: 1, default: 1 },
      size: { type: String, default: '' },
      color: { type: String, default: '' },
    }],

    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);