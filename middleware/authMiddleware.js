const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Seller = require('../models/sellerModel');
const User = require('../models/userModel');

const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden — admin access only' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin no longer exists' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const protectSeller = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Forbidden — seller access only' });
    }

    const seller = await Seller.findById(decoded.id).select('-password');
    if (!seller) {
      return res.status(401).json({ success: false, message: 'Seller no longer exists' });
    }

    if (seller.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Account not active. Cannot perform this action.',
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/*
 * Any seller with a valid token, regardless of status — for the
 * onboarding steps a *pending* seller must be able to do before an
 * admin ever approves them: uploading NID/trade-license and
 * submitting them for review. Actual selling actions (creating
 * products, etc.) stay behind protectSeller's approved-only check.
 */
const protectSellerAny = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Forbidden — seller access only' });
    }

    const seller = await Seller.findById(decoded.id).select('-password');
    if (!seller) {
      return res.status(401).json({ success: false, message: 'Seller no longer exists' });
    }

    req.seller = seller;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/*
 * Accepts either an admin or a seller JWT and sets req.admin /
 * req.seller accordingly — for routes both roles need, like the
 * shared Cloudinary upload endpoint. A seller here can be any
 * status (including pending — they need to upload verification
 * documents before an admin ever approves them); routes that must
 * be approved-only still gate separately with protectSeller.
 * Whoever ends up calling the route, downstream code reads the
 * actual uploader off req.admin/req.seller — never off anything the
 * client claims.
 */
const protectAdminOrSeller = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Admin no longer exists' });
      }
      req.admin = admin;
      return next();
    }

    if (decoded.role === 'seller') {
      const seller = await Seller.findById(decoded.id).select('-password');
      if (!seller) {
        return res.status(401).json({ success: false, message: 'Seller no longer exists' });
      }
      req.seller = seller;
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};
const protectCustomer = async (req, res, next) => {
  try {
    let token;

<<<<<<< Updated upstream
module.exports = { protectAdmin, protectSeller, protectSellerAny, protectAdminOrSeller };
=======
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — customer access only',
      });
    }

    const customer = await User.findById(
      decoded.id
    ).select('-password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer no longer exists',
      });
    }

    req.customer = customer;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

module.exports = { protectAdmin, protectSeller, protectAdminOrSeller ,protectCustomer};
>>>>>>> Stashed changes
