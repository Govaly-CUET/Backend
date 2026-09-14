const Media = require('../models/mediaModel');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('./uploadService');

/*
 * Lists uploaded media, newest first. Every filter is optional:
 *   - uploadedByType: 'admin' | 'seller'
 *   - uploadedById: filter to one specific uploader
 *   - dateStart / dateEnd: inclusive createdAt range (YYYY-MM-DD)
 */
const listMedia = async ({ uploadedByType, uploadedById, dateStart, dateEnd } = {}) => {
  const query = {};

  if (uploadedByType) {
    query.uploadedByType = uploadedByType;
  }

  if (uploadedById) {
    query.uploadedById = uploadedById;
  }

  if (dateStart || dateEnd) {
    query.createdAt = {};

    if (dateStart) {
      query.createdAt.$gte = new Date(dateStart);
    }

    if (dateEnd) {
      // Push to the end of that calendar day so "End" is inclusive.
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  return Media.find(query)
    .sort({ createdAt: -1 })
    .populate('uploadedById', 'name shopName');
};

/*
 * Updates only the editable metadata (Title / Alternative Text) —
 * never url/publicId/uploadedBy*, which stay whatever they were at
 * upload time.
 */
const updateMediaMeta = async (id, { title, altText }) => {
  const update = {};

  if (title !== undefined) update.title = title;
  if (altText !== undefined) update.altText = altText;

  const media = await Media.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).populate('uploadedById', 'name shopName');

  if (!media) {
    throw { status: 404, message: 'Media not found.' };
  }

  return media;
};

/*
 * "Change Image" — swaps the underlying file for an existing Media
 * row. Uploads the new file first, then deletes the old Cloudinary
 * asset only once the swap has succeeded, so a failed upload never
 * leaves the row pointing at nothing. Title/Alternative Text and the
 * original uploader are left untouched; only the file itself and its
 * derived fields change (updatedAt moves — that's "Last Updated").
 */
const replaceMediaFile = async (id, file, folder) => {
  const media = await Media.findById(id);

  if (!media) {
    throw { status: 404, message: 'Media not found.' };
  }

  const uploaded = await uploadToCloudinary(file, folder || media.folder);
  const oldPublicId = media.publicId;

  media.url = uploaded.url;
  media.publicId = uploaded.publicId;
  media.fileType = uploaded.fileType;
  media.size = uploaded.size;
  media.width = uploaded.width;
  media.height = uploaded.height;

  await media.save();

  try {
    await cloudinary.uploader.destroy(oldPublicId);
  } catch (cleanupError) {
    // The row already points at the new file — a leftover orphaned
    // asset on Cloudinary is a cost, not a correctness problem.
    console.error('Old Cloudinary asset cleanup failed:', cleanupError.message);
  }

  return media.populate('uploadedById', 'name shopName');
};

module.exports = { listMedia, updateMediaMeta, replaceMediaFile };
