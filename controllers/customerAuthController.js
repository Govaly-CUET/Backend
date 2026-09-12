const {
  registerCustomer,
  authenticateCustomer,
} = require('../services/customerAuthService');

// @desc    Register a new customer
// @route   POST /api/v1/customer/auth/register
// @access  Public
const registerCustomerHandler = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password.',
      });
    }

    const user = await registerCustomer({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
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

// @desc    Login customer
// @route   POST /api/v1/customer/auth/login
// @access  Public
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const { token, user } = await authenticateCustomer(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
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
  registerCustomer: registerCustomerHandler,
  loginCustomer,
};