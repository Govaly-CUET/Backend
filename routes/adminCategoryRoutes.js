const express = require("express");

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require(
  "../controllers/adminCategoryController"
);

const {
  protectAdmin,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();


// List categories
router.get(
  "/",
  protectAdmin,
  getCategories
);


// Create category
router.post(
  "/",
  protectAdmin,
  createCategory
);


// Category details
router.get(
  "/:id",
  protectAdmin,
  getCategoryById
);


// Update category
router.patch(
  "/:id",
  protectAdmin,
  updateCategory
);


// Delete category
router.delete(
  "/:id",
  protectAdmin,
  deleteCategory
);


module.exports = router;