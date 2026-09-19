const crypto = require('crypto');

const {
  normalizeEmail,
  requestCustomerOtp,
  verifyCustomerOtp,
  createPasswordResetToken,
  verifyAndConsumePasswordResetToken,
} = require('../services/customerOtpService');

const {
  createCustomerAfterOtp,
  customerData,
  authenticateCustomer,
  authenticateCustomerByOtp,
  loginCustomerWithGoogle: loginCustomerWithGoogleService,
  setCustomerPassword,
  resetCustomerPassword,
  findCustomerByEmail,
  generateCustomerToken,
} = require('../services/customerAuthService');

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const sendError = (res, error) => {
  const status = error.status || 500;

  return res.status(status).json({
    success: false,
    message: error.message || 'Something went wrong.',
  });
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const registerCustomer = async (req, res) => {
  return requestRegisterOtp(req, res);
};

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

/**
 * Request registration OTP
 *
 * POST /api/v1/customer/auth/register/request-otp
 *
 * Body:
 * {
 *   email
 * }
 */
const requestRegisterOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    /*
     * Do not allow a second account with the same email.
     */
    const existingUser = await findCustomerByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'An account with this email already exists. Please log in.',
      });
    }

    const result = await requestCustomerOtp(
      email,
      'register'
    );

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully.',
      data: {
        email,
        expiresInMinutes: result.expiresInMinutes,
        resendAfterSeconds: result.resendAfterSeconds,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Verify registration OTP and create customer account.
 *
 * POST /api/v1/customer/auth/register/verify-otp
 *
 * Body:
 * {
 *   email,
 *   otp
 * }
 */
const verifyRegisterOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const verification = await verifyCustomerOtp(
      email,
      'register',
      otp
    );

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message:
          verification.message || 'Invalid OTP.',
      });
    }

    /*
     * Create the account only after successful OTP verification.
     *
     * At this stage:
     * - name = ""
     * - password = null
     * - authProvider = "email"
     *
     * The user will set a password in the next step.
     */
    const user = await createCustomerAfterOtp(email);
    const token = generateCustomerToken(user);
    const responseUser = customerData(user);

    return res.status(201).json({
      success: true,
      message:
        'Email verified and account created successfully.',
      token,
      user: responseUser,
      data: {
        user: responseUser,
        requiresPasswordSetup: true,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN — PASSWORD
|--------------------------------------------------------------------------
*/

/**
 * Login using email + password.
 *
 * POST /api/v1/customer/auth/login/password
 *
 * Body:
 * {
 *   email,
 *   password
 * }
 */
const loginCustomerWithGoogle = async (req, res) => {
  try {
    const credential = String(req.body.credential || '').trim();

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required.',
      });
    }

    const { token, user } = await loginCustomerWithGoogleService(credential);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      token,
      data: user,
    });
  } catch (error) {
    console.error('========== GOOGLE AUTH ERROR ==========');
    console.error('Message:', error?.message);
    console.error('Name:', error?.name);
    console.error('Code:', error?.code);
    console.error('Response:', error?.response);
    console.error('Stack:', error?.stack);
    console.error('========================================');

    return res.status(error?.status || 500).json({
      success: false,
      message: error?.message || 'Google authentication failed.',
    });
  }
};

const loginCustomerWithPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required.',
      });
    }

    const { token, user } =
      await authenticateCustomer(
        email,
        password
      );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: user,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN — OTP
|--------------------------------------------------------------------------
*/

/**
 * Request login OTP.
 *
 * POST /api/v1/customer/auth/login/request-otp
 *
 * Body:
 * {
 *   email
 * }
 */
const requestLoginOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide a valid email address.',
      });
    }

    const existingUser =
      await findCustomerByEmail(email);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message:
          'No account exists with this email.',
      });
    }

    const result = await requestCustomerOtp(
      email,
      'login'
    );

    return res.status(200).json({
      success: true,
      message: 'Login OTP sent successfully.',
      data: {
        email,
        expiresInMinutes:
          result.expiresInMinutes,
        resendAfterSeconds:
          result.resendAfterSeconds,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Verify login OTP and issue JWT.
 *
 * POST /api/v1/customer/auth/login/verify-otp
 *
 * Body:
 * {
 *   email,
 *   otp
 * }
 */
const verifyLoginOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const verification =
      await verifyCustomerOtp(
        email,
        'login',
        otp
      );

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message:
          verification.message ||
          'Invalid OTP.',
      });
    }

    const { token, user } =
      await authenticateCustomerByOtp(email);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: user,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| SET PASSWORD
|--------------------------------------------------------------------------
*/

/**
 * Set password for an authenticated customer.
 *
 * PATCH /api/v1/customer/auth/set-password
 *
 * Body:
 * {
 *   password,
 *   confirmPassword
 * }
 *
 * Used after:
 *
 * Register
 *   ↓
 * Email OTP
 *   ↓
 * Account created
 *   ↓
 * Set New Password
 */
const setPassword = async (req, res) => {
  try {
    const password =
      String(req.body.password || '');

    const confirmPassword =
      String(req.body.confirmPassword || '');

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          'Password and confirm password are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters long.',
      });
    }

    const userId =
      req.customer?._id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Customer authentication required.',
      });
    }

    const user =
      await setCustomerPassword(
        userId,
        password
      );

    return res.status(200).json({
      success: true,
      message:
        'Password saved successfully.',
      data: user,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD — REQUEST OTP
|--------------------------------------------------------------------------
*/

/**
 * Request password-reset OTP.
 *
 * POST /api/v1/customer/auth/forgot-password/request-otp
 *
 * Body:
 * {
 *   email
 * }
 */
const requestForgotPasswordOtp =
  async (req, res) => {
    try {
      const email =
        normalizeEmail(req.body.email);

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required.',
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            'Please provide a valid email address.',
        });
      }

      const existingUser =
        await findCustomerByEmail(email);

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message:
            'No account exists with this email.',
        });
      }

      const result =
        await requestCustomerOtp(
          email,
          'forgot-password'
        );

      return res.status(200).json({
        success: true,
        message:
          'Password reset OTP sent successfully.',
        data: {
          email,
          expiresInMinutes:
            result.expiresInMinutes,
          resendAfterSeconds:
            result.resendAfterSeconds,
        },
      });
    } catch (error) {
      return sendError(res, error);
    }
  };

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD — VERIFY OTP
|--------------------------------------------------------------------------
*/

/**
 * Verify password-reset OTP.
 *
 * POST /api/v1/customer/auth/forgot-password/verify-otp
 *
 * Body:
 * {
 *   email,
 *   otp
 * }
 *
 * IMPORTANT:
 * This endpoint does NOT change the password.
 *
 * After OTP verification it creates a short-lived
 * password-reset token.
 */
const verifyForgotPasswordOtp =
  async (req, res) => {
    try {
      const email =
        normalizeEmail(req.body.email);

      const otp =
        String(req.body.otp || '').trim();

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message:
            'Email and OTP are required.',
        });
      }

      const verification =
        await verifyCustomerOtp(
          email,
          'forgot-password',
          otp
        );

      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          message:
            verification.message ||
            'Invalid OTP.',
        });
      }

      /*
       * Create a short-lived reset token.
       *
       * Raw token:
       *   sent to frontend
       *
       * Hash:
       *   stored in MongoDB
       */
      const {
        resetToken,
        expiresInMinutes,
      } =
        await createPasswordResetToken(
          email
        );

      return res.status(200).json({
        success: true,
        message:
          'OTP verified successfully.',
        data: {
          email,
          resetToken,
          expiresInMinutes,
        },
      });
    } catch (error) {
      return sendError(res, error);
    }
  };

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

/**
 * Reset password after successful OTP verification.
 *
 * POST /api/v1/customer/auth/reset-password
 *
 * Body:
 * {
 *   email,
 *   resetToken,
 *   password,
 *   confirmPassword
 * }
 */
const resetPassword = async (req, res) => {
  try {
    const email =
      normalizeEmail(req.body.email);

    const resetToken =
      String(req.body.resetToken || '').trim();

    const password =
      String(req.body.password || '');

    const confirmPassword =
      String(
        req.body.confirmPassword || ''
      );

    if (
      !email ||
      !resetToken ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Email, reset token, password and confirm password are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters long.',
      });
    }

    /*
     * Validate and consume the reset token.
     *
     * The token:
     * - must exist
     * - must belong to this email
     * - must not be expired
     * - can only be used once
     */
    await verifyAndConsumePasswordResetToken(
      email,
      resetToken
    );

    /*
     * Only after token validation do we
     * actually change the password.
     */
    const user =
      await resetCustomerPassword({
        email,
        password,
      });

    const persistedUser = await findCustomerByEmail(email);
    const token = generateCustomerToken(persistedUser || { _id: user.id });

    return res.status(200).json({
      success: true,
      message:
        'Password reset successfully.',
      token,
      data: user,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  // Registration
  registerCustomer,
  requestRegisterOtp,
  verifyRegisterOtp,

  // Password Login
  loginCustomerWithPassword,
  loginCustomerWithGoogle,

  // OTP Login
  requestLoginOtp,
  verifyLoginOtp,

  // Set Password
  setPassword,

  // Forgot Password
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
};