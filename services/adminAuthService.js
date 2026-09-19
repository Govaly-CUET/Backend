const Admin = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const issueAdminToken = (admin) => jwt.sign(
  { id: admin._id, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const adminData = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  phone: admin.phone,
  dept: admin.dept,
  designation: admin.designation,
  image: admin.image,
});

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

  const token = issueAdminToken(admin);

  return { token, admin };
};

const resetAdminPassword = async (email, password) => {
  const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() });
  if (!admin) throw { status: 404, message: 'Admin account not found.' };
  if (!password || password.length < 6) throw { status: 400, message: 'Password must be at least 6 characters long.' };
  admin.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
  await admin.save();
  return adminData(admin);
};

module.exports = { authenticateAdmin, resetAdminPassword, issueAdminToken, adminData };