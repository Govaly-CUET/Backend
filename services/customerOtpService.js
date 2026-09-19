const crypto = require('crypto');
const CustomerOTP = require('../models/customerOtpModel');
const { sendOtpEmail } = require('./customerEmailService');

const OTP_EXPIRY_MINUTES = 30;
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const RESET_TOKEN_EXPIRY_MINUTES = 10;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeEmail = (email) => {
  return String(email || '').trim().toLowerCase();
};

const generateOtp = () => {
  return crypto
    .randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
};

const hashValue = (value) => {
  return crypto
    .createHash('sha256')
    .update(String(value))
    .digest('hex');
};

const safeCompare = (a, b) => {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

/*
|--------------------------------------------------------------------------
| Request OTP
|--------------------------------------------------------------------------
*/

const requestCustomerOtp = async (email, purpose) => {
  email = normalizeEmail(email);

  const validPurposes = [
    'register',
    'login',
    'forgot-password',
  ];

  if (!validPurposes.includes(purpose)) {
    throw {
      status: 400,
      message: 'Invalid OTP purpose.',
    };
  }

  const existingOtp = await CustomerOTP.findOne({
    email,
    purpose,
  });

  /*
   * Prevent OTP spam.
   */
  if (existingOtp?.lastSentAt) {
    const secondsSinceLastSend =
      (Date.now() - existingOtp.lastSentAt.getTime()) / 1000;

    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      const remainingSeconds = Math.ceil(
        RESEND_COOLDOWN_SECONDS - secondsSinceLastSend
      );

      throw {
        status: 429,
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
      };
    }
  }

  const otp = generateOtp();
  const otpHash = hashValue(otp);

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  /*
   * Save the OTP first.
   */
  await CustomerOTP.findOneAndUpdate(
    {
      email,
      purpose,
    },
    {
      email,
      purpose,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );

  /*
   * Send OTP through Gmail SMTP.
   *
   * If sending fails, remove the saved OTP so the user
   * cannot accidentally use an OTP that was never delivered.
   */
  try {
    await sendOtpEmail(email, otp, purpose);
  } catch (error) {
    await CustomerOTP.deleteOne({
      email,
      purpose,
    });

    throw {
      status: 500,
      message: 'Could not send OTP email. Please try again.',
    };
  }

  return {
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
  };
};

/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
*/

const verifyCustomerOtp = async (email, purpose, otp) => {
  email = normalizeEmail(email);
  otp = String(otp || '').trim();

  if (!/^\d{6}$/.test(otp)) {
    return {
      verified: false,
      message: 'OTP must contain exactly 6 digits.',
    };
  }

  const record = await CustomerOTP.findOne({
    email,
    purpose,
  });

  if (!record) {
    return {
      verified: false,
      message: 'OTP not found or already used. Please request a new OTP.',
    };
  }

  /*
   * Check expiration.
   */
  if (record.expiresAt.getTime() < Date.now()) {
    await CustomerOTP.deleteOne({
      _id: record._id,
    });

    return {
      verified: false,
      message: 'OTP has expired. Please request a new OTP.',
    };
  }

  /*
   * Maximum verification attempts.
   */
  if (record.attempts >= MAX_ATTEMPTS) {
    await CustomerOTP.deleteOne({
      _id: record._id,
    });

    return {
      verified: false,
      message:
        'Too many incorrect attempts. Please request a new OTP.',
    };
  }

  const submittedHash = hashValue(otp);

  /*
   * Increment attempts before comparison.
   */
  record.attempts += 1;
  await record.save();

  if (!safeCompare(submittedHash, record.otpHash)) {
    const remainingAttempts =
      MAX_ATTEMPTS - record.attempts;

    return {
      verified: false,
      message:
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempt${
              remainingAttempts === 1 ? '' : 's'
            } remaining.`
          : 'Invalid OTP. Please request a new OTP.',
    };
  }

  /*
   * Successful OTP verification.
   *
   * For registration/login we no longer need the OTP record.
   *
   * For forgot-password, the controller will create a temporary
   * password-reset token immediately after verification.
   */
  await CustomerOTP.deleteOne({
    _id: record._id,
  });

  return {
    verified: true,
    message: 'OTP verified successfully.',
  };
};

/*
|--------------------------------------------------------------------------
| PASSWORD RESET TOKEN
|--------------------------------------------------------------------------
*/

/**
 * Create a short-lived password reset token.
 *
 * The raw token goes to the frontend.
 * Only the SHA-256 hash is stored in MongoDB.
 */
const createPasswordResetToken = async (email) => {
  email = normalizeEmail(email);

  const resetToken = crypto.randomBytes(32).toString('hex');

  const resetTokenHash = hashValue(resetToken);

  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  /*
   * Reuse the forgot-password OTP document as the temporary
   * reset-token record.
   */
  await CustomerOTP.findOneAndUpdate(
    {
      email,
      purpose: 'forgot-password',
    },
    {
      email,
      purpose: 'forgot-password',
      otpHash: resetTokenHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );

  return {
    resetToken,
    expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
  };
};

/**
 * Verify and consume a password reset token.
 */
const verifyAndConsumePasswordResetToken = async (
  email,
  resetToken
) => {
  email = normalizeEmail(email);
  resetToken = String(resetToken || '').trim();

  if (!email || !resetToken) {
    throw {
      status: 400,
      message: 'Email and reset token are required.',
    };
  }

  const record = await CustomerOTP.findOne({
    email,
    purpose: 'forgot-password',
  });

  if (!record) {
    throw {
      status: 401,
      message:
        'Reset token is invalid or has already been used.',
    };
  }

  /*
   * Check expiration.
   */
  if (record.expiresAt.getTime() < Date.now()) {
    await CustomerOTP.deleteOne({
      _id: record._id,
    });

    throw {
      status: 401,
      message:
        'Reset token has expired. Please request a new OTP.',
    };
  }

  const submittedHash = hashValue(resetToken);

  if (!safeCompare(submittedHash, record.otpHash)) {
    throw {
      status: 401,
      message: 'Invalid password reset token.',
    };
  }

  /*
   * Delete immediately after successful validation.
   *
   * This makes the reset token single-use.
   */
  await CustomerOTP.deleteOne({
    _id: record._id,
  });

  return true;
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  normalizeEmail,

  requestCustomerOtp,
  verifyCustomerOtp,

  createPasswordResetToken,
  verifyAndConsumePasswordResetToken,
};