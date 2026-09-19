const express = require('express');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Customer Authentication Controller
|--------------------------------------------------------------------------
*/

const {
  registerCustomer,
  requestRegisterOtp,
  verifyRegisterOtp,

  loginCustomerWithPassword,
  loginCustomerWithGoogle,

  requestLoginOtp,
  verifyLoginOtp,

  setPassword,

  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} = require('../controllers/customerAuthController');

/*
|--------------------------------------------------------------------------
| Customer Profile Controller
|--------------------------------------------------------------------------
*/

const {
  getMe,
  patchMe,
  patchPassword,
  uploadAvatar,
} = require('../controllers/customerProfileController');

const upload = require('../middleware/uploadMiddleware');

/*
|--------------------------------------------------------------------------
| Customer Wishlist Controller
|--------------------------------------------------------------------------
*/

const {
  listWishlist,
  addItem: addWishlistItem,
  removeItem: removeWishlistItem,
} = require('../controllers/customerWishlistController');

/*
|--------------------------------------------------------------------------
| Customer Cart Controller
|--------------------------------------------------------------------------
*/

const {
  viewCart,
  addItem: addCartItem,
  patchItem: patchCartItem,
  removeItem: removeCartItem,
} = require('../controllers/customerCartController');

/*
|--------------------------------------------------------------------------
| Customer Order Controller
|--------------------------------------------------------------------------
*/

const {
  postCheckout,
  getOrders,
  getOrderDetail,
  getOrderTrack,
  postCancel,
} = require('../controllers/customerOrderController');

/*
|--------------------------------------------------------------------------
| Customer Review Controller
|--------------------------------------------------------------------------
*/

const {
  postReview,
} = require('../controllers/customerReviewController');

/*
|--------------------------------------------------------------------------
| Customer Category Controller
|--------------------------------------------------------------------------
*/

const {
  getCategories,
  getCategory,
} = require('../controllers/customerCategoryController');

/*
|--------------------------------------------------------------------------
| Customer Product Controller
|--------------------------------------------------------------------------
*/

const {
  getProducts,
  getProduct,
  getProductReviews,
} = require('../controllers/customerProductController');

/*
|--------------------------------------------------------------------------
| Customer Seller / Media
|--------------------------------------------------------------------------
*/

const {
  getSeller,
} = require('../controllers/customerSellerController');

const {
  getMedia,
} = require('../controllers/customerMediaController');

/*
|--------------------------------------------------------------------------
| Customer Authentication Middleware
|--------------------------------------------------------------------------
*/

const {
  protectCustomer,
} = require('../middleware/authMiddleware');

/*
|--------------------------------------------------------------------------
| PUBLIC CUSTOMER AUTH
|--------------------------------------------------------------------------
*/

/*
 * REGISTER
 *
 * Email
 *   ↓
 * Request OTP
 *   ↓
 * Verify OTP
 *   ↓
 * Account Created
 *   ↓
 * Set Password
 */

router.post(
  '/auth/register',
  registerCustomer
);

router.post(
  '/auth/register/request-otp',
  requestRegisterOtp
);

router.post(
  '/auth/register/verify-otp',
  verifyRegisterOtp
);


/*
 * LOGIN — PASSWORD
 *
 * Email + Password
 *       ↓
 *      JWT
 */

router.post(
  '/auth/login/password',
  loginCustomerWithPassword
);

router.post(
  '/auth/google',
  loginCustomerWithGoogle
);


/*
 * LOGIN — OTP
 *
 * Email
 *   ↓
 * Send OTP
 *   ↓
 * Verify OTP
 *   ↓
 * JWT
 */

router.post(
  '/auth/login/request-otp',
  requestLoginOtp
);

router.post(
  '/auth/login/verify-otp',
  verifyLoginOtp
);


/*
 * FORGOT PASSWORD
 *
 * Email
 *   ↓
 * Send OTP
 *   ↓
 * Verify OTP
 *   ↓
 * Reset Token
 *   ↓
 * New Password
 */

router.post(
  '/auth/forgot-password/request-otp',
  requestForgotPasswordOtp
);

router.post(
  '/auth/forgot-password/verify-otp',
  verifyForgotPasswordOtp
);

router.post(
  '/auth/reset-password',
  resetPassword
);


/*
|--------------------------------------------------------------------------
| PUBLIC CUSTOMER BROWSING
|--------------------------------------------------------------------------
*/

router.get(
  '/categories',
  getCategories
);

router.get(
  '/categories/:slug',
  getCategory
);

router.get(
  '/products',
  getProducts
);

router.get(
  '/products/:slug',
  getProduct
);

router.get(
  '/products/:slug/reviews',
  getProductReviews
);

router.get(
  '/sellers/:slug',
  getSeller
);

router.get(
  '/media',
  getMedia
);


/*
|--------------------------------------------------------------------------
| PROTECTED CUSTOMER ROUTES
|--------------------------------------------------------------------------
|
| Everything below this line requires:
|
| Authorization: Bearer <JWT>
|
*/

router.use(protectCustomer);


/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

router.get(
  '/me',
  getMe
);

router.patch(
  '/me',
  patchMe
);

router.post(
  '/me/avatar',
  upload.single('image'),
  uploadAvatar
);


/*
 * Existing password-change functionality.
 *
 * This is different from:
 *
 * PATCH /auth/set-password
 *
 * /auth/set-password
 *     → used when user has no password yet
 *
 * /change-password
 *     → used when user already has a password
 */

router.patch(
  '/change-password',
  patchPassword
);


/*
 * Set password after registration.
 *
 * PATCH /customer/auth/set-password
 *
 * Requires JWT.
 */

router.patch(
  '/auth/set-password',
  setPassword
);


/*
|--------------------------------------------------------------------------
| WISHLIST
|--------------------------------------------------------------------------
*/

router.get(
  '/wishlist',
  listWishlist
);

router.post(
  '/wishlist/:productId',
  addWishlistItem
);

router.delete(
  '/wishlist/:productId',
  removeWishlistItem
);


/*
|--------------------------------------------------------------------------
| CART
|--------------------------------------------------------------------------
*/

router.get(
  '/cart',
  viewCart
);

router.post(
  '/cart',
  addCartItem
);

router.patch(
  '/cart/:itemId',
  patchCartItem
);

router.delete(
  '/cart/:itemId',
  removeCartItem
);


/*
|--------------------------------------------------------------------------
| CHECKOUT / ORDERS
|--------------------------------------------------------------------------
*/

router.post(
  '/checkout',
  postCheckout
);

router.get(
  '/orders',
  getOrders
);

router.get(
  '/orders/:id',
  getOrderDetail
);

router.get(
  '/orders/:id/track',
  getOrderTrack
);

router.post(
  '/orders/:id/cancel',
  postCancel
);


/*
|--------------------------------------------------------------------------
| PRODUCT REVIEWS
|--------------------------------------------------------------------------
*/

router.post(
  '/products/:id/review',
  postReview
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = router;