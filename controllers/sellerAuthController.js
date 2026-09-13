const { registerSeller, authenticateSeller } = require('../services/sellerAuthService');

// @desc    Register a new seller (Pending Admin Approval)
// @route   POST /api/v1/seller/auth/register
// @access  Public
const registerSellerHandler = async (req, res) => {
  try {
    const { shopName, shopSlug, ownerName, email, password, phone, address } = req.body;

    if (!shopName || !shopSlug || !ownerName || !email || !password || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    const seller = await registerSeller({ shopName, shopSlug, ownerName, email, password, phone, address });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Pending admin approval.',
      data: {
        id: seller._id,
        shopName: seller.shopName,
        shopSlug: seller.shopSlug,
        ownerName: seller.ownerName,
        email: seller.email,
        status: seller.status,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc    Log in seller to dashboard
// @route   POST /api/v1/seller/auth/login
// @access  Public
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const { token, seller } = await authenticateSeller(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        id: seller._id,
        shopName: seller.shopName,
        shopSlug: seller.shopSlug,
        ownerName: seller.ownerName,
        email: seller.email,
        phone: seller.phone,
        address: seller.address,
        status: seller.status,
        commission: seller.commission,
        balance: seller.balance,
        ratings: seller.ratings,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { registerSeller: registerSellerHandler, loginSeller };