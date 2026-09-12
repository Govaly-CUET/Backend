const Admin = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authenticateAdmin = async (identifier, password) => {
  const admin = await Admin.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });

  if (!admin) {
    throw { status: 401, message: 'Invalid credentials.' };
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid credentials.' };
  }

  const token = jwt.sign(
    { id: admin._id, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, admin };
};

module.exports = { authenticateAdmin };