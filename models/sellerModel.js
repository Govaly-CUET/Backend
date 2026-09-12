const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    shopSlug: {
      type: String,
      required: [true, 'Shop slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Shop address is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
    },
    commission: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    nidDocument: {
      type: String,
      default: null,
    },
    tradeLicenseDocument: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Seller', sellerSchema);