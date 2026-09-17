const Seller = require('../models/sellerModel');
const { registerSeller, authenticateSeller, issueSellerToken } = require('../services/sellerAuthService');

// @desc    Register a new seller account (no documents required here —
//          those are uploaded afterward via POST /api/v1/upload, then
//          submitted with POST /api/v1/seller/verification/documents,
//          using the token this endpoint returns)
// @route   POST /api/v1/seller/auth/register
// @access  Public
const registerSellerHandler = async (req, res) => {
  try {
    const { shopName, shopSlug, ownerName, email, password, phone, address } = req.body;

    if (!shopName || !shopSlug || !ownerName || !email || !password || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    const seller = await registerSeller({
      shopName,
      shopSlug,
      ownerName,
      email,
      password,
      phone,
      address,
    });

    const token = issueSellerToken(seller);

    res.status(201).json({
      success: true,
      message: 'Account created. Upload your NID and Trade License to finish your application.',
      token,
      data: {
        id: seller._id,
        shopName: seller.shopName,
        shopSlug: seller.shopSlug,
        ownerName: seller.ownerName,
        email: seller.email,
        status: seller.status,
        nidDocument: seller.nidDocument,
        tradeLicenseDocument: seller.tradeLicenseDocument,
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
const loginSellerHandler = async (req, res) => {
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

// @desc    Get logged-in seller's own profile
// @route   GET /api/v1/seller/me
// @access  Private (Seller only)
const getSellerProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.seller,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update logged-in seller's shop info
// @route   PATCH /api/v1/seller/me
// @access  Private (Seller only)
const updateSellerProfile = async (req, res) => {
  try {
    const { shopName, phone, address, logoUrl } = req.body;

    const updateFields = {};
    if (shopName !== undefined) updateFields.shopName = shopName;
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (logoUrl !== undefined) updateFields.logoUrl = logoUrl;

    const updatedSeller = await Seller.findByIdAndUpdate(
      req.seller._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedSeller,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerSeller: registerSellerHandler,
  loginSeller: loginSellerHandler,
  getSellerProfile,
  updateSellerProfile,
};