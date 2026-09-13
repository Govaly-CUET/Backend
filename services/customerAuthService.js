const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerCustomer = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw {
      status: 400,
      message: 'User with this email already exists.',
    };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};

const authenticateCustomer = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw {
      status: 401,
      message: 'Invalid credentials.',
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw {
      status: 401,
      message: 'Invalid credentials.',
    };
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: 'customer',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );

  return { token, user };
};

module.exports = {
  registerCustomer,
  authenticateCustomer,
};