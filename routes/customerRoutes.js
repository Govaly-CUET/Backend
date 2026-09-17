const express = require('express');

const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
} = require('../controllers/customerAuthController');
const { getMe, patchMe, patchPassword, uploadAvatar } = require('../controllers/customerProfileController');
const upload = require('../middleware/uploadMiddleware');
const {
  listWishlist,
  addItem: addWishlistItem,
  removeItem: removeWishlistItem,
} = require('../controllers/customerWishlistController');
const {
  viewCart,
  addItem: addCartItem,
  patchItem: patchCartItem,
  removeItem: removeCartItem,
} = require('../controllers/customerCartController');
const {
  postCheckout,
  getOrders,
  getOrderDetail,
  getOrderTrack,
  postCancel,
} = require('../controllers/customerOrderController');
const { postReview } = require('../controllers/customerReviewController');
const {
  getCategories,
  getCategory,
} = require('../controllers/customerCategoryController');
const {
  getProducts,
  getProduct,
  getProductReviews,
} = require('../controllers/customerProductController');
const { getSeller } = require('../controllers/customerSellerController');
const { getMedia } = require('../controllers/customerMediaController');
const { protectCustomer } = require('../middleware/authMiddleware');

// Public Customer Auth
router.post('/auth/register', registerCustomer);
router.post('/auth/login', loginCustomer);

// Customer-facing category browsing
router.get('/categories', getCategories);
router.get('/categories/:slug', getCategory);
router.get('/products', getProducts);
router.get('/products/:slug', getProduct);
router.get('/products/:slug/reviews', getProductReviews);
router.get('/sellers/:slug', getSeller);
router.get('/media', getMedia);

// Everything below requires a valid customer JWT
router.use(protectCustomer);

router.get('/me', getMe);
router.patch('/me', patchMe);
router.post('/me/avatar', upload.single('image'), uploadAvatar);
router.patch('/change-password', patchPassword);

router.get('/wishlist', listWishlist);
router.post('/wishlist/:productId', addWishlistItem);
router.delete('/wishlist/:productId', removeWishlistItem);

router.get('/cart', viewCart);
router.post('/cart', addCartItem);
router.patch('/cart/:itemId', patchCartItem);
router.delete('/cart/:itemId', removeCartItem);

router.post('/checkout', postCheckout);
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);
router.get('/orders/:id/track', getOrderTrack);
router.post('/orders/:id/cancel', postCancel);

router.post('/products/:id/review', postReview);

module.exports = router;
