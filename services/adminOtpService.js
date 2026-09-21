const Admin = require('../models/adminModel');
const OTP = require('../models/otpModel');
const { sendStaffOtpEmail } = require('./staffEmailService');
const { normalizeEmail, requestOtp, verifyOtp, createResetToken, consumeResetToken } = require('./staffOtpService');

const findAdmin = (email) => Admin.findOne({ email: normalizeEmail(email) });
const requestAdminOtp = (email, purpose) => requestOtp({ Model: OTP, email, purpose, role: 'admin', sendEmail: sendStaffOtpEmail });
const verifyAdminOtp = (email, otp) => verifyOtp({ Model: OTP, email, purpose: 'forgot-password', otp });
const createAdminResetToken = (email) => createResetToken({ Model: OTP, email });
const consumeAdminResetToken = (email, token) => consumeResetToken({ Model: OTP, email, resetToken: token });

module.exports = { normalizeEmail, findAdmin, requestAdminOtp, verifyAdminOtp, createAdminResetToken, consumeAdminResetToken };
