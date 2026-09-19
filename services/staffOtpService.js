const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 30;
const RESET_TOKEN_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');
const safeCompare = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const requestOtp = async ({ Model, email, purpose, role, sendEmail }) => {
  email = normalizeEmail(email);
  if (purpose !== 'forgot-password') throw { status: 400, message: 'Invalid OTP purpose.' };

  const existing = await Model.findOne({ email, purpose });
  if (existing?.lastSentAt) {
    const elapsed = (Date.now() - existing.lastSentAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      throw { status: 429, message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)} seconds before requesting another OTP.` };
    }
  }

  const otp = generateOtp();
  await Model.findOneAndUpdate(
    { email, purpose },
    { email, purpose, otpHash: hashValue(otp), expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000), attempts: 0, lastSentAt: new Date() },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  try {
    await sendEmail(email, otp, role, purpose);
  } catch (error) {
    await Model.deleteOne({ email, purpose });
    throw { status: 500, message: 'Could not send OTP email. Please try again.' };
  }

  return { expiresInMinutes: OTP_EXPIRY_MINUTES, resendAfterSeconds: RESEND_COOLDOWN_SECONDS };
};

const verifyOtp = async ({ Model, email, purpose, otp }) => {
  email = normalizeEmail(email);
  otp = String(otp || '').trim();
  if (!/^\d{6}$/.test(otp)) return { verified: false, message: 'OTP must contain exactly 6 digits.' };

  const record = await Model.findOne({ email, purpose });
  if (!record) return { verified: false, message: 'OTP not found or already used. Please request a new OTP.' };
  if (record.expiresAt.getTime() < Date.now()) {
    await Model.deleteOne({ _id: record._id });
    return { verified: false, message: 'OTP has expired. Please request a new OTP.' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await Model.deleteOne({ _id: record._id });
    return { verified: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  record.attempts += 1;
  await record.save();
  if (!safeCompare(hashValue(otp), record.otpHash)) {
    const remaining = MAX_ATTEMPTS - record.attempts;
    return { verified: false, message: remaining ? `Invalid OTP. ${remaining} attempts remaining.` : 'Invalid OTP. Please request a new OTP.' };
  }

  await Model.deleteOne({ _id: record._id });
  return { verified: true, message: 'OTP verified successfully.' };
};

const createResetToken = async ({ Model, email }) => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  await Model.findOneAndUpdate(
    { email: normalizeEmail(email), purpose: 'forgot-password' },
    { email: normalizeEmail(email), purpose: 'forgot-password', otpHash: hashValue(resetToken), expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60000), attempts: 0, lastSentAt: new Date() },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  return { resetToken, expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES };
};

const consumeResetToken = async ({ Model, email, resetToken }) => {
  const record = await Model.findOne({ email: normalizeEmail(email), purpose: 'forgot-password' });
  if (!record) throw { status: 401, message: 'Reset token is invalid or has already been used.' };
  if (record.expiresAt.getTime() < Date.now()) {
    await Model.deleteOne({ _id: record._id });
    throw { status: 401, message: 'Reset token has expired. Please request a new OTP.' };
  }
  if (!safeCompare(hashValue(resetToken), record.otpHash)) throw { status: 401, message: 'Invalid password reset token.' };
  await Model.deleteOne({ _id: record._id });
};

module.exports = { normalizeEmail, requestOtp, verifyOtp, createResetToken, consumeResetToken };
