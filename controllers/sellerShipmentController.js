const { updateSellerStage } = require('../services/sellerShipmentService');

// @desc    A seller moves their own stage (accepted / packed / handed_over)
// @route   PATCH /api/v1/seller/orders/:id/shipment
// @access  Private (approved seller, own orders only)
const updateStage = async (req, res) => {
  try {
    const order = await updateSellerStage(req.seller._id, req.params.id, req.body.sellerStatus);

    res.status(200).json({ success: true, message: 'Shipment stage updated.', data: order });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { updateStage };
