const mongoose = require("mongoose");

const deliveryAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    division: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    additionalInstruction: {
      type: String,
      default: "",
      trim: true,
    },

    label: {
      type: String,
      enum: ["Home", "Office"],
      default: "Home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

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

    address: {
      type: String,
      default: null,
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

    deliveryAddresses: {
      type: [deliveryAddressSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);