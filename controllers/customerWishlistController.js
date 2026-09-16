const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../services/customerWishlistService');

// @route   GET /api/v1/customer/wishlist
const listWishlist = async (req, res) => {
  try {
    const wishlist = await getWishlist(req.user._id);
    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/v1/customer/wishlist/:productId
const addItem = async (req, res) => {
  try {
    const wishlist = await addToWishlist(req.user._id, req.params.productId);
    res.status(200).json({ success: true, message: 'Added to wishlist.', data: wishlist });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/v1/customer/wishlist/:productId
const removeItem = async (req, res) => {
  try {
    const wishlist = await removeFromWishlist(req.user._id, req.params.productId);
    res.status(200).json({ success: true, message: 'Removed from wishlist.', data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listWishlist, addItem, removeItem };
