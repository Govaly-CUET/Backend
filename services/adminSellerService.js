const Seller = require('../models/sellerModel');

const VALID_STATUSES = ['pending', 'approved', 'suspended'];

const getAllSellers = async () => {
  return Seller.find({}).select('-password').sort({ createdAt: -1 });
};

const getSellersByStatus = async (status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw { status: 400, message: 'Invalid status. Must be pending, approved, or suspended.' };
  }

  return Seller.find({ status }).select('-password').sort({ createdAt: -1 });
};

const updateSellerStatus = async (id, status, commission) => {
  const seller = await Seller.findById(id);
  if (!seller) {
    throw { status: 404, message: 'Seller not found.' };
  }

  if (status === 'approved' && (!seller.nidDocument || !seller.tradeLicenseDocument)) {
    throw {
      status: 400,
      message: 'Cannot approve — seller has not submitted both NID and Trade License documents.',
    };
  }

  seller.status = status;
  if (commission !== undefined) {
    seller.commission = commission;
  }
  await seller.save();

  const result = seller.toObject();
  delete result.password;
  return result;
};

module.exports = { getAllSellers, getSellersByStatus, updateSellerStatus };