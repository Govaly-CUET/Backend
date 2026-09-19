const User = require('../models/userModel');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  const { password, ...profile } = user.toObject();
  return { ...profile, hasPassword: Boolean(password) };
};

const updateProfile = async (userId, { name, phone, address, addresses, gender, DOB, image }) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (addresses !== undefined) user.addresses = addresses;
  if (gender !== undefined) user.gender = gender;
  if (DOB !== undefined) user.DOB = DOB;
  if (image !== undefined) user.image = image;

  await user.save();
  const { password, ...rest } = user.toObject();
  return { ...rest, hasPassword: Boolean(password) };
};

module.exports = { getProfile, updateProfile };
