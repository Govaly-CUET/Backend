const Seller = require('../models/sellerModel');

const getAllSellersCommission = async () => {
  return Seller.find({}).select('shopName commission status').sort({ shopName: 1 });
};

const updateSellerCommission = async (id, commission) => {
  if (typeof commission !== 'number' || commission < 0 || commission > 100) {
    throw { status: 400, message: 'Commission must be a number between 0 and 100.' };
  }

  const seller = await Seller.findByIdAndUpdate(
    id,
    { commission },
    { new: true, runValidators: true }
  ).select('shopName commission status');

  if (!seller) {
    throw { status: 404, message: 'Seller not found.' };
  }

  return seller;
};

module.exports = { getAllSellersCommission, updateSellerCommission };