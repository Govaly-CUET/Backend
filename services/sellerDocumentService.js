const Seller = require('../models/sellerModel');

const saveVerificationDocuments = async (sellerId, nidDocument, tradeLicenseDocument) => {
  const seller = await Seller.findByIdAndUpdate(
    sellerId,
    { nidDocument, tradeLicenseDocument },
    { new: true, runValidators: true }
  ).select('-password');

  return seller;
};

module.exports = { saveVerificationDocuments };