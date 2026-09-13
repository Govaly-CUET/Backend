const { uploadToCloudinary } = require('../services/uploadService');

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