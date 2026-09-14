const mongoose = require('mongoose');

/*
 * One row per file successfully uploaded to Cloudinary through
 * POST /api/v1/upload. uploadedByType/uploadedById come from the
 * authenticated request (req.admin / req.seller) — never from
 * anything the client sends — so this is a trustworthy record of
 * who actually uploaded what.
 */
const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    fileType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    folder: {
      type: String,
      default: 'govaly/misc',
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    altText: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedByType: {
      type: String,
      enum: ['admin', 'seller'],
      required: true,
    },
    uploadedById: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Points at Admin or Seller depending on uploadedByType — see
      // uploadedByType for which collection to resolve against.
      refPath: 'uploadedByModel',
    },
    uploadedByModel: {
      type: String,
      required: true,
      enum: ['Admin', 'Seller'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Media', mediaSchema);
