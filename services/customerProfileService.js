const User = require('../models/userModel');

const getCustomerProfile = async (customerId) => {
  const user = await User.findById(customerId).select('-password');

  if (!user) {
    throw {
      status: 404,
      message: 'Customer not found.',
    };
  }

  return user;
};

const updateCustomerProfile = async (customerId, profileData) => {
  const allowedFields = [
    'name',
    'phone',
    'address',
    'gender',
    'DOB',
    'image',
  ];

  const updateData = {};

  allowedFields.forEach((field) => {
    if (profileData[field] !== undefined) {
      updateData[field] = profileData[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    customerId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  if (!user) {
    throw {
      status: 404,
      message: 'Customer not found.',
    };
  }

  return user;
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
};