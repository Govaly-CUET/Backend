const Seller = require('../models/sellerModel');

const getPendingSellers = async () => {
  return Seller.find({ status: 'pending' }).select('-password');
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

module.exports = { getPendingSellers, updateSellerStatus };