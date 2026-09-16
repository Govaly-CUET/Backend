const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} = require('../services/customerCartService');

// @route   GET /api/v1/customer/cart
const viewCart = async (req, res) => {
  try {
    const cart = await getCart(req.user._id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/v1/customer/cart   body: { productId, quantity, size, color }
const addItem = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required.' });
    }
    const cart = await addToCart(req.user._id, productId, quantity, size, color);
    res.status(200).json({ success: true, message: 'Added to cart.', data: cart });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/v1/customer/cart/:itemId   body: { quantity }
const patchItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'quantity is required.' });
    }
    const cart = await updateCartItem(req.user._id, req.params.itemId, Number(quantity));
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/v1/customer/cart/:itemId
const removeItem = async (req, res) => {
  try {
    const cart = await removeCartItem(req.user._id, req.params.itemId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { viewCart, addItem, patchItem, removeItem };
