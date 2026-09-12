const { saveVerificationDocuments } = require('../services/sellerDocumentService');

// @desc    Submit NID and Trade License documents for admin review
// @route   POST /api/v1/seller/verification/documents
// @access  Private (Seller)
const submitVerificationDocuments = async (req, res) => {
  try {
    const { nidDocument, tradeLicenseDocument } = req.body;

    if (!nidDocument || !tradeLicenseDocument) {
      return res.status(400).json({
        success: false,
        message: 'Both NID and Trade License document URLs are required.',
      });
    }

    const seller = await saveVerificationDocuments(req.seller._id, nidDocument, tradeLicenseDocument);

    res.status(200).json({
      success: true,
      message: 'Documents submitted. Awaiting admin review.',
      data: seller,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitVerificationDocuments };