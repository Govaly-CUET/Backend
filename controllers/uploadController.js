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
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
};

module.exports = { uploadFile };