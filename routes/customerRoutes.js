// const express = require('express');

// const router = express.Router();

// const {
//   registerCustomer,
//   loginCustomer,
// } = require('../controllers/customerAuthController');

// const {
//   getProfile,
//   updateProfile,
// } = require('../controllers/customerProfileController');

// const {
//   protectCustomer,
// } = require('../middleware/authMiddleware');

// // Public Customer Auth

// router.post('/auth/register', registerCustomer);

// router.post('/auth/login', loginCustomer);

// const {
//   getAddresses,
//   addAddress,
//   updateAddress,
//   deleteAddress,
// } = require("../controllers/customerAddressController");

// router.get(
//   "/addresses",
//   protectCustomer,
//   getAddresses
// );

// router.post(
//   "/addresses",
//   protectCustomer,
//   addAddress
// );

// router.patch(
//   "/addresses/:id",
//   protectCustomer,
//   updateAddress
// );

// router.delete(
//   "/addresses/:id",
//   protectCustomer,
//   deleteAddress
// );

// // Protected Customer Profile

// router.get('/me', protectCustomer, getProfile);

// router.patch('/me', protectCustomer, updateProfile);

// module.exports = router;



const express = require("express");

const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
} = require("../controllers/customerAuthController");

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/customerAddressController");

const {
  protectCustomer,
} = require("../middleware/authMiddleware");

router.post(
  "/auth/register",
  registerCustomer
);

router.post(
  "/auth/login",
  loginCustomer
);

router.get(
  "/delivery-addresses",
  protectCustomer,
  getAddresses
);

router.post(
  "/delivery-addresses",
  protectCustomer,
  addAddress
);

router.patch(
  "/delivery-addresses/:id",
  protectCustomer,
  updateAddress
);

router.delete(
  "/delivery-addresses/:id",
  protectCustomer,
  deleteAddress
);

module.exports = router;