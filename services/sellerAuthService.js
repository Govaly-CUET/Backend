const Seller = require('../models/sellerModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerSeller = async ({
  shopName, shopSlug, ownerName, email, password, phone, address,
  nidDocument, tradeLicenseDocument,
}) => {
  const existingSeller = await Seller.findOne({ $or: [{ email }, { shopSlug }] });
  if (existingSeller) {
    throw { status: 400, message: 'Seller with this email or shop URL slug already exists.' };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const seller = await Seller.create({
    shopName,
    shopSlug,
    ownerName,
    email,
    password: hashedPassword,
    phone,
    address,
    status: 'pending',
    nidDocument,
    tradeLicenseDocument,
  });

  return seller;
};

const authenticateSeller = async (email, password) => {
  const seller = await Seller.findOne({ email });
  if (!seller) {
    throw { status: 401, message: 'Invalid credentials.' };
  }

  if (seller.status === 'pending') {
    throw { status: 403, message: 'Your account is pending admin approval. Please wait for verification.' };
  }

  if (seller.status === 'suspended') {
    throw { status: 403, message: 'Your account has been suspended. Please contact admin support.' };
  }

  const isMatch = await bcrypt.compare(password, seller.password);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid credentials.' };
  }

  const token = jwt.sign(
    { id: seller._id, role: 'seller' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, seller };
};

module.exports = { registerSeller, authenticateSeller };