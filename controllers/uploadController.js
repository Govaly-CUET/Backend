const { uploadToCloudinary } = require('../services/uploadService');

// @desc    Upload a single file to Cloudinary
// @route   POST /api/v1/upload
// @access  Private (Admin or Seller)
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file was uploaded.' });
    }

    const folder = req.body.folder || 'govaly/misc';
    const data = await uploadToCloudinary(req.file, folder);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      data,
    });
  } catch (error) {
    handleCloudinaryUploadError(error, res);
  }
};

const handleCloudinaryUploadError = (error, res) => {
  const statusCode = Number.isInteger(error.http_code)
    ? error.http_code
    : 500;

  const message = statusCode === 403
    ? 'Cloudinary rejected the upload. Check that this API key has upload permission and that the Cloudinary account is active.'
    : error.message || 'Upload failed.';

  res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
    success: false,
    message,
  });
};

module.exports = { uploadFile };