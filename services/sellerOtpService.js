const Seller = require('../models/sellerModel');
const SellerOTP = require('../models/sellerOtpModel');
const { sendStaffOtpEmail } = require('./staffEmailService');
const { normalizeEmail, requestOtp, verifyOtp, createResetToken, consumeResetToken } = require('./staffOtpService');

const findSeller = (email) => Seller.findOne({ email: normalizeEmail(email) });
const requestSellerOtp = (email, purpose) => requestOtp({ Model: SellerOTP, email, purpose, role: 'seller', sendEmail: sendStaffOtpEmail });
const verifySellerOtp = (email, otp) => verifyOtp({ Model: SellerOTP, email, purpose: 'forgot-password', otp });
const createSellerResetToken = (email) => createResetToken({ Model: SellerOTP, email });
const consumeSellerResetToken = (email, token) => consumeResetToken({ Model: SellerOTP, email, resetToken: token });

module.exports = { normalizeEmail, findSeller, requestSellerOtp, verifySellerOtp, createSellerResetToken, consumeSellerResetToken };
