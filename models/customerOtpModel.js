const mongoose = require('mongoose');

const customerOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    purpose: {
      type: String,
      required: true,
      enum: [
        'register',
        'login',
        'forgot-password',
      ],
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB automatically removes expired OTP documents.
// The field-level `expiresAt` index is enough for TTL cleanup.

module.exports = mongoose.model(
  'CustomerOTP',
  customerOtpSchema
);