const {
  getCustomerProfile,
  updateCustomerProfile,
} = require('../services/customerProfileService');

// @desc    Get customer profile
// @route   GET /api/v1/customer/me
// @access  Customer
const getProfile = async (req, res) => {
  try {
    const user = await getCustomerProfile(req.customer._id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        DOB: user.DOB,
        image: user.image,
      },
    });
  } catch (error) {
    const status = error.status || 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update customer profile
// @route   PATCH /api/v1/customer/me
// @access  Customer
const updateProfile = async (req, res) => {
  try {
    const user = await updateCustomerProfile(
      req.customer._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        DOB: user.DOB,
        image: user.image,
      },
    });
  } catch (error) {
    const status = error.status || 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};