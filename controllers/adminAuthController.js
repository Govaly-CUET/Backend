const { authenticateAdmin } = require('../services/adminAuthService');

// @desc    Log in admin by email OR phone (pre-registered only — no signup, no OTP, no reset)
// @route   POST /api/v1/admin/auth/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your email/phone and password.' });
    }

    const { token, admin } = await authenticateAdmin(email.trim(), password);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        dept: admin.dept,
        designation: admin.designation,
        image: admin.image,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in admin profile
// @route   GET /api/v1/admin/auth/me
// @access  Private (Admin)
const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.admin });
};

module.exports = { loginAdmin, getMe };