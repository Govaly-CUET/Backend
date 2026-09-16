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

const router = express.Router();


// List categories
router.get("/", getCategories);


// Create category
router.post("/", createCategory);


// Category details
router.get("/:id", getCategoryById);


// Update category
router.patch("/:id", updateCategory);


// Delete category
router.delete("/:id", deleteCategory);


module.exports = router;
