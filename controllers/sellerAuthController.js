const Seller = require('../models/sellerModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new seller (Pending Admin Approval)
// @route   POST /api/v1/seller/auth/register
// @access  Public
const registerSeller = async (req, res) => {
  try {
    const { shopName, shopSlug, ownerName, email, password, phone, address } = req.body;

    // 1. Check if required fields are present
    if (!shopName || !shopSlug || !ownerName || !email || !password || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    // 2. Check if email or shopSlug already exists
    const existingSeller = await Seller.findOne({ $or: [{ email }, { shopSlug }] });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'Seller with this email or shop URL slug already exists.',
      });
    }

    // 3. Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create new seller instance (status will default to 'pending')
    const seller = await Seller.create({
      shopName,
      shopSlug,
      ownerName,
      email,
      password: hashedPassword,
      phone,
      address,
      status: 'pending', // Explicitly setting status to pending for admin approval
    });

    // 5. Send successful response
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
    res.status(500).json({ success: false, message: error.message });
  }
};



// Login Module    JWT kore dilam: 


// @desc    Log in seller to dashboard
// @route   POST /api/v1/seller/auth/login
// @access  Public
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check for email and password input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // 2. Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 3. Verify status - Only 'active' sellers are allowed to log in
    if (seller.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait for verification.',
      });
    }

    if (seller.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact admin support.',
      });
    }

    // 4. Verify password match
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 5. Generate JWT Token
    const token = jwt.sign(
      { id: seller._id, role: 'seller' },
      process.env.JWT_SECRET || 'govaly_secret_key',
      { expiresIn: '7d' }
    );

    // 6. Send response with seller details and token
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerSeller,loginSeller };