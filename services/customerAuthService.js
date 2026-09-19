const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeEmail = (email) => {
  return String(email || '').trim().toLowerCase();
};

const generateCustomerToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: 'customer',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

/*
|--------------------------------------------------------------------------
| Customer Response Data
|--------------------------------------------------------------------------
*/

const customerData = (user) => {
  return {
    id: user._id,
    name: user.name || '',
    email: user.email,
    phone: user.phone || null,
    address: user.address || null,
    addresses: user.addresses || [],
    gender: user.gender || null,
    DOB: user.DOB || null,
    image: user.image || null,
    authProvider: user.authProvider || 'email',
    hasPassword: Boolean(user.password),
  };
};

/*
|--------------------------------------------------------------------------
| Find Customer
|--------------------------------------------------------------------------
*/

const findCustomerByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  return User.findOne({
    email: normalizedEmail,
  });
};

const verifyGoogleCredential = async (credential) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw {
      status: 500,
      message: 'Google authentication is not configured on this server.',
    };
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
      throw {
        status: 401,
        message: 'Google authentication failed.',
      };
    }

    return payload;
  } catch (error) {
    if (error && (error.status === 401 || error.status === 400)) {
      throw error;
    }

    throw {
      status: 401,
      message: 'Google authentication failed or the account is not available.',
    };
  }
};

/*
|--------------------------------------------------------------------------
| CREATE CUSTOMER AFTER EMAIL OTP
|--------------------------------------------------------------------------
*/

const createCustomerAfterOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  /*
   * Prevent duplicate accounts.
   */
  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw {
      status: 409,
      message:
        'An account with this email already exists.',
    };
  }

  /*
   * Account is created without password.
   *
   * Password will be set later from:
   * Register → OTP → Set New Password
   */
  const user = await User.create({
    name: '',
    email: normalizedEmail,
    password: null,
    authProvider: 'email',
  });

  return user;
};

/*
|--------------------------------------------------------------------------
| SET CUSTOMER PASSWORD
|--------------------------------------------------------------------------
*/

const setCustomerPassword = async (
  userId,
  password
) => {
  if (!password || password.length < 6) {
    throw {
      status: 400,
      message:
        'Password must be at least 6 characters long.',
    };
  }

  const user = await User.findById(userId);

  if (!user) {
    throw {
      status: 404,
      message: 'Customer not found.',
    };
  }

  /*
   * bcrypt hash.
   */
  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hash(
    password,
    salt
  );

  await user.save();

  return customerData(user);
};

/*
|--------------------------------------------------------------------------
| PASSWORD LOGIN
|--------------------------------------------------------------------------
*/

const loginCustomerWithGoogle = async (credential) => {
  try {
    const payload = await verifyGoogleCredential(credential);
    const googleId = payload.sub;
    const email = normalizeEmail(payload.email);

    let user = await User.findOne({ googleId });

    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await User.create({
        name: payload.name || '',
        email,
        password: null,
        googleId,
        authProvider: 'google',
        image: payload.picture || null,
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
      }

      if (!user.name && payload.name) {
        user.name = payload.name;
      }

      if (!user.image && payload.picture) {
        user.image = payload.picture;
      }

      if (!user.email && email) {
        user.email = email;
      }

      if (!user.authProvider || user.authProvider === 'email') {
        user.authProvider = 'google';
      }

      await user.save();
    }

    const token = generateCustomerToken(user);

    return {
      token,
      user: customerData(user),
    };
  } catch (error) {
    console.error('========== GOOGLE AUTH SERVICE ERROR ==========');
    console.error('Message:', error?.message);
    console.error('Name:', error?.name);
    console.error('Code:', error?.code);
    console.error('Response:', error?.response);
    console.error('Stack:', error?.stack);
    console.error('============================================');

    throw error;
  }
};

const authenticateCustomer = async (
  email,
  password
) => {
  const normalizedEmail =
    normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw {
      status: 401,
      message: 'Invalid email or password.',
    };
  }

  /*
   * Google-only or no-password account should use OTP login.
   */
  if (!user.password) {
    throw {
      status: 400,
      message:
        'This account does not have a password yet. Please log in using OTP and set a password from Account Settings.',
    };
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw {
      status: 401,
      message: 'Invalid email or password.',
    };
  }

  const token =
    generateCustomerToken(user);

  return {
    token,
    user: customerData(user),
  };
};

/*
|--------------------------------------------------------------------------
| OTP LOGIN
|--------------------------------------------------------------------------
*/

const authenticateCustomerByOtp =
  async (email) => {
    const normalizedEmail =
      normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      throw {
        status: 404,
        message:
          'Customer account not found.',
      };
    }

    const token =
      generateCustomerToken(user);

    return {
      token,
      user: customerData(user),
    };
  };

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

const changePassword = async (
  userId,
  currentPassword,
  newPassword,
  confirmPassword = newPassword
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw {
      status: 404,
      message: 'Customer not found.',
    };
  }

  if (!user.password) {
    throw {
      status: 400,
      message:
        'This account does not have a password yet. Please set one from Account Settings.',
    };
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw {
      status: 401,
      message: 'Current password is incorrect.',
    };
  }

  if (!newPassword || !confirmPassword) {
    throw {
      status: 400,
      message:
        'New password and confirm password are required.',
    };
  }

  if (newPassword !== confirmPassword) {
    throw {
      status: 400,
      message: 'Passwords do not match.',
    };
  }

  if (newPassword.length < 6) {
    throw {
      status: 400,
      message:
        'Password must be at least 6 characters long.',
    };
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(
    newPassword,
    salt
  );
  await user.save();

  return customerData(user);
};

const resetCustomerPassword = async ({
  email,
  password,
}) => {
  const normalizedEmail =
    normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw {
      status: 404,
      message:
        'Customer account not found.',
    };
  }

  if (!password || password.length < 6) {
    throw {
      status: 400,
      message:
        'Password must be at least 6 characters long.',
    };
  }

  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hash(
    password,
    salt
  );

  /*
   * A password reset converts the account
   * into a password-capable email account.
   *
   * We do not change Google accounts away
   * from Google; password can simply be added.
   */
  if (!user.authProvider) {
    user.authProvider = 'email';
  }

  await user.save();

  return customerData(user);
};

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  normalizeEmail,
  generateCustomerToken,
  customerData,

  findCustomerByEmail,

  createCustomerAfterOtp,

  setCustomerPassword,
  changePassword,

  authenticateCustomer,
  authenticateCustomerByOtp,
  loginCustomerWithGoogle,

  resetCustomerPassword,
};