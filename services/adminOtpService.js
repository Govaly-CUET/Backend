const Admin = require('../models/adminModel');
const AdminOTP = require('../models/adminOtpModel');
const { sendStaffOtpEmail } = require('./staffEmailService');
const { normalizeEmail, requestOtp, verifyOtp, createResetToken, consumeResetToken } = require('./staffOtpService');

const findAdmin = (email) => Admin.findOne({ email: normalizeEmail(email) });
const requestAdminOtp = (email, purpose) => requestOtp({ Model: AdminOTP, email, purpose, role: 'admin', sendEmail: sendStaffOtpEmail });
const verifyAdminOtp = (email, otp) => verifyOtp({ Model: AdminOTP, email, purpose: 'forgot-password', otp });
const createAdminResetToken = (email) => createResetToken({ Model: AdminOTP, email });
const consumeAdminResetToken = (email, token) => consumeResetToken({ Model: AdminOTP, email, resetToken: token });

module.exports = { normalizeEmail, findAdmin, requestAdminOtp, verifyAdminOtp, createAdminResetToken, consumeAdminResetToken };
