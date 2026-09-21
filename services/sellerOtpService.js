const Seller = require('../models/sellerModel');
const OTP = require('../models/otpModel');
const { sendStaffOtpEmail } = require('./staffEmailService');
const { normalizeEmail, requestOtp, verifyOtp, createResetToken, consumeResetToken } = require('./staffOtpService');

const findSeller = (email) => Seller.findOne({ email: normalizeEmail(email) });
const requestSellerOtp = (email, purpose) => requestOtp({ Model: OTP, email, purpose, role: 'seller', sendEmail: sendStaffOtpEmail });
const verifySellerOtp = (email, otp) => verifyOtp({ Model: OTP, email, purpose: 'forgot-password', otp });
const createSellerResetToken = (email) => createResetToken({ Model: OTP, email });
const consumeSellerResetToken = (email, token) => consumeResetToken({ Model: OTP, email, resetToken: token });

module.exports = { normalizeEmail, findSeller, requestSellerOtp, verifySellerOtp, createSellerResetToken, consumeSellerResetToken };
