const { uploadToCloudinary } = require('../services/uploadService');
const Media = require('../models/mediaModel');

// @desc    Upload a single file to Cloudinary
// @route   POST /api/v1/upload
// @access  Private (Admin or Seller)
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      console.log('Upload debug: req.file is missing');

      return res.status(400).json({
        success: false,
        message: 'No file was uploaded.',
      });
    }

    // Debug information
    console.log('Upload debug: req.file details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      encoding: req.file.encoding,
    });

    const folder = req.body.folder || 'govaly/misc';

    console.log('Upload debug: selected folder:', folder);

    const data = await uploadToCloudinary(req.file, folder);

    console.log('Upload debug: Cloudinary response:', data);

    /*
     * Record who actually uploaded this — from the authenticated
     * request (req.admin / req.seller), never from anything the
     * client sent. protectAdminOrSeller (see routes/uploadRoutes.js)
     * guarantees exactly one of req.admin / req.seller is set.
     */
    let mediaDoc = null;

    try {
      mediaDoc = await Media.create({
        url: data.url,
        publicId: data.publicId,
        fileType: data.fileType,
        size: data.size,
        width: data.width,
        height: data.height,
        folder,
        uploadedByType: req.admin ? 'admin' : 'seller',
        uploadedById: req.admin ? req.admin._id : req.seller._id,
        uploadedByModel: req.admin ? 'Admin' : 'Seller',
      });
    } catch (mediaError) {
      // The file is already on Cloudinary and the caller already has
      // its URL — don't fail the whole request over a bookkeeping
      // write. Just log it so it's visible.
      console.error('Media record save failed:', mediaError.message);
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      data: {
        ...data,
        mediaId: mediaDoc?._id || null,
      },
    });
  } catch (error) {
    handleCloudinaryUploadError(error, res);
  }
};

const handleCloudinaryUploadError = (error, res) => {
  const statusCode = Number.isInteger(error.http_code)
    ? error.http_code
    : 500;

  const message =
    statusCode === 403
      ? 'Cloudinary rejected the upload. Check that this API key has upload permission and that the Cloudinary account is active.'
      : error.message || 'Upload failed.';

  res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
    success: false,
    message,
  });
};

module.exports = { uploadFile };