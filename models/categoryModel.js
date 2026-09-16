const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      trim: true,
    },

    // True when this subcategory was added through the (not yet
    // built) category carousel flow — shown in the customer-facing
    // body section. The only creation path that currently exists is
    // the regular admin category form, which is NOT the carousel, so
    // the default matches that (false)
    isBody: {
      type: Boolean,
      default: false,
    },

    // Which carousel row (if any) this subcategory shows in on the
    // customer body section: 0 = not in a carousel, 1 = Carousal-1,
    // 2 = Carousal-2. No other value is valid.
    carousal: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    subcategory: {
      type: [subcategorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Category",
  categorySchema
);