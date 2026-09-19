const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password is optional because a customer can
    // register/login using email OTP or Google.
    password: {
      type: String,
      required: false,
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    // Google authentication
    googleId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
    },

    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
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

    // The Cloudinary asset id lets an avatar replacement remove the old
    // image without trusting any value supplied by the browser.
    profileImagePublicId: {
      type: String,
      default: null,
    },

    cartItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        productModel: {
          type: String,
          default: "Product",
        },

        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },

        size: {
          type: String,
          default: "",
        },

        color: {
          type: String,
          default: "",
        },
      },
    ],

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);