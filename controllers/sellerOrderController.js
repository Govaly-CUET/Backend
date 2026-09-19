const { getOrders: getAdminOrders } = require('../services/adminOrderService');

// @desc    List orders belonging to the authenticated seller
// @route   GET /api/v1/seller/orders
// @access  Private (Seller)
const getOrders = async (req, res) => {
	try {
		const orders = await getAdminOrders({
			...req.query,
			seller: req.seller._id,
		});

		res.status(200).json({ success: true, data: orders });
	} catch (error) {
		const status = error.status || 500;
		res.status(status).json({ success: false, message: error.message });
	}
};

module.exports = { getOrders };
