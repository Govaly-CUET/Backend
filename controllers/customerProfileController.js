const { getProfile, updateProfile } = require('../services/customerProfileService');
const { changePassword } = require('../services/customerAuthService');

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

module.exports = { getMe, patchMe, patchPassword };
