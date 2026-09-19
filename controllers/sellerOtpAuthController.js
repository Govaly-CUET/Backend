const {
  normalizeEmail,
  findSeller,
  requestSellerOtp: requestSellerOtpService,
  verifySellerOtp,
  createSellerResetToken,
  consumeSellerResetToken,
} = require('../services/sellerOtpService');
const { resetSellerPassword } = require('../services/sellerAuthService');

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sellerData = (seller) => ({ id: seller._id, shopName: seller.shopName, shopSlug: seller.shopSlug, ownerName: seller.ownerName, email: seller.email, phone: seller.phone, address: seller.address, status: seller.status, commission: seller.commission, balance: seller.balance, ratings: seller.ratings });
const sendError = (res, error) => res.status(error.status || 500).json({ success: false, message: error.message || 'Something went wrong.' });

const requestSellerOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!validEmail(email)) return res.status(400).json({ success: false, message: 'A valid email is required.' });
    const seller = await findSeller(email);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller account not found.' });
    if (seller.status === 'pending') return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
    if (seller.status === 'suspended') return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    const result = await requestSellerOtpService(email, 'forgot-password');
    return res.status(200).json({ success: true, message: 'Password reset OTP sent successfully.', data: { email, purpose: 'forgot-password', ...result } });
  } catch (error) { return sendError(res, error); }
};

const verifySellerForgotOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const result = await verifySellerOtp(email, req.body.otp);
    if (!result.verified) return res.status(400).json({ success: false, message: result.message });
    const reset = await createSellerResetToken(email);
    return res.status(200).json({ success: true, message: 'OTP verified successfully.', data: { email, ...reset } });
  } catch (error) { return sendError(res, error); }
};

const resetSellerPasswordHandler = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    if (!email || !req.body.resetToken || !password || !confirmPassword) return res.status(400).json({ success: false, message: 'Email, reset token, password and confirm password are required.' });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    await consumeSellerResetToken(email, req.body.resetToken);
    const seller = await resetSellerPassword(email, password);
    return res.status(200).json({ success: true, message: 'Seller password reset successfully.', data: sellerData(seller) });
  } catch (error) { return sendError(res, error); }
};

module.exports = { requestSellerOtp, verifySellerForgotOtp, resetSellerPassword: resetSellerPasswordHandler };
