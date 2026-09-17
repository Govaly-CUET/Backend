const { getProfile, updateProfile } = require('../services/customerProfileService');
const { changePassword } = require('../services/customerAuthService');
const { uploadToCloudinary } = require('../services/uploadService');
const cloudinary = require('../config/cloudinary');

// @desc    Get own profile
// @route   GET /api/v1/customer/me
// @access  Private (Customer)
const getMe = async (req, res) => {
  try {
    const user = await getProfile(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Update name, phone, address, gender, DOB, image
// @route   PATCH /api/v1/customer/me
// @access  Private (Customer)
const patchMe = async (req, res) => {
  try {
    const user = await updateProfile(req.user._id, req.body);
    res.status(200).json({ success: true, message: 'Profile updated.', data: user });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Upload or replace own profile picture
// @route   POST /api/v1/customer/me/avatar
// @access  Private (Customer)
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please choose a profile image.' });
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Profile photo must be a JPG, PNG, or WEBP image.' });
    }

    const uploaded = await uploadToCloudinary(req.file, 'govaly/customer-avatars');
    const oldPublicId = req.user.profileImagePublicId;

    // Update only the authenticated customer's image. The email is never
    // accepted here or by the general profile update service.
    req.user.image = uploaded.url;
    req.user.profileImagePublicId = uploaded.publicId;
    await req.user.save();

    if (oldPublicId) {
      cloudinary.uploader.destroy(oldPublicId).catch((error) => {
        console.error('Previous customer avatar cleanup failed:', error.message);
      });
    }

    const { password, ...user } = req.user.toObject();
    res.status(200).json({ success: true, message: 'Profile photo updated.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload profile photo.' });
  }
};

// @desc    Change own password (must know current password)
// @route   PATCH /api/v1/customer/change-password
// @access  Private (Customer)
const patchPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required.' });
    }
    await changePassword(req.user._id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getMe, patchMe, patchPassword, uploadAvatar };
