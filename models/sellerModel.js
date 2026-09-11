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
      enum: ['pending', 'active', 'suspended'],
      default: 'pending', // Defaults to pending for admin approval
    },
    commission: {
      type: Number,
      default: 0, // Platform cut percentage per order
    },
    balance: {
      type: Number,
      default: 0, // Cached wallet balance updated on delivery
    },
    ratings: {
      type: Number,
      default: 0, // Seller's average rating
    },
  },
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

module.exports = mongoose.model('Seller', sellerSchema);