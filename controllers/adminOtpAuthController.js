const {
  normalizeEmail,
  findAdmin,
  requestAdminOtp: requestAdminOtpService,
  verifyAdminOtp,
  createAdminResetToken,
  consumeAdminResetToken,
} = require('../services/adminOtpService');
const { resetAdminPassword } = require('../services/adminAuthService');

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sendError = (res, error) => res.status(error.status || 500).json({ success: false, message: error.message || 'Something went wrong.' });

const requestAdminOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!validEmail(email)) return res.status(400).json({ success: false, message: 'A valid email is required.' });
    if (!await findAdmin(email)) return res.status(404).json({ success: false, message: 'Admin account not found.' });
    const result = await requestAdminOtpService(email, 'forgot-password');
    return res.status(200).json({ success: true, message: 'Password reset OTP sent successfully.', data: { email, purpose: 'forgot-password', ...result } });
  } catch (error) { return sendError(res, error); }
};

const verifyAdminForgotOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const result = await verifyAdminOtp(email, req.body.otp);
    if (!result.verified) return res.status(400).json({ success: false, message: result.message });
    const reset = await createAdminResetToken(email);
    return res.status(200).json({ success: true, message: 'OTP verified successfully.', data: { email, ...reset } });
  } catch (error) { return sendError(res, error); }
};

const resetAdminPasswordHandler = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    if (!email || !req.body.resetToken || !password || !confirmPassword) return res.status(400).json({ success: false, message: 'Email, reset token, password and confirm password are required.' });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    await consumeAdminResetToken(email, req.body.resetToken);
    const admin = await resetAdminPassword(email, password);
    return res.status(200).json({ success: true, message: 'Admin password reset successfully.', data: admin });
  } catch (error) { return sendError(res, error); }
};

module.exports = { requestAdminOtp, verifyAdminForgotOtp, resetAdminPassword: resetAdminPasswordHandler };
