const {
  getAdminProfile,
  updateAdminProfile,
} = require('../services/adminProfileService');


/*
 * @desc    Get logged-in admin profile
 * @route   GET /api/v1/admin/me
 * @access  Private (Admin)
 */
const getProfile = async (req, res) => {
  try {
    const admin = await getAdminProfile(req.admin._id);

    return res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        dept: admin.dept,
        designation: admin.designation,
        phone: admin.phone,
        email: admin.email,
        image: admin.image,
      },
    });
  } catch (error) {
    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};


/*
 * @desc    Update logged-in admin profile
 * @route   PATCH /api/v1/admin/me
 * @access  Private (Admin)
 */
const updateProfile = async (req, res) => {
  try {
    const admin = await updateAdminProfile(
      req.admin._id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: admin._id,
        name: admin.name,
        dept: admin.dept,
        designation: admin.designation,
        phone: admin.phone,
        email: admin.email,
        image: admin.image,
      },
    });
  } catch (error) {
    const status = error.status || 500;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getProfile,
  updateProfile,
};