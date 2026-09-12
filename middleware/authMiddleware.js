const jwt = require('jsonwebtoken');
const Seller = require('../models/sellerModel');

// @desc    Protect seller routes - verify JWT and attach seller to req
const protectSeller = async (req, res, next) => {
  try {
    let token;

    // 1. Check for token in Authorization header (format: "Bearer <token>")
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided.',
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govaly_secret_key');

    // 3. Check role
    if (decoded.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as a seller.',
      });
    }

    // 4. Find seller and attach to req (exclude password)
    const seller = await Seller.findById(decoded.id).select('-password');
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'Seller not found, token invalid.',
      });
    }

    // 5. Check status - only active sellers allowed
    if (seller.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account not active. Cannot perform this action.',
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed.',
    });
  }
};

module.exports = { protectSeller };