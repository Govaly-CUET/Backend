const Admin = require('../models/adminModel');

/*
 * Get logged-in admin profile
 */
const getAdminProfile = async (adminId) => {
  const admin = await Admin.findById(adminId).select('-password');

  if (!admin) {
    throw {
      status: 404,
      message: 'Admin not found.',
    };
  }

  return admin;
};


/*
 * Update logged-in admin profile
 */
const updateAdminProfile = async (adminId, updates) => {
  const allowedFields = [
    'name',
    'phone',
    'image',
  ];

  const updateData = {};

  /*
   * Only allow approved profile fields
   * to be updated.
   */
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  });

  /*
   * Check whether the phone number
   * already belongs to another admin.
   */
  if (updateData.phone) {
    const existingAdmin = await Admin.findOne({
      phone: updateData.phone,
      _id: { $ne: adminId },
    });

    if (existingAdmin) {
      throw {
        status: 409,
        message: 'Phone number is already in use.',
      };
    }
  }

  const admin = await Admin.findByIdAndUpdate(
    adminId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  if (!admin) {
    throw {
      status: 404,
      message: 'Admin not found.',
    };
  }

  return admin;
};


module.exports = {
  getAdminProfile,
  updateAdminProfile,
};