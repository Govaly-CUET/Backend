const categoryService = require(
  "../services/adminCategoryService"
);


// ===============================
// GET CATEGORIES
// ===============================

const getCategories = async (req, res) => {
  try {
    const categories =
      await categoryService.getCategories(
        req.query
      );

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// GET CATEGORY
// ===============================

const getCategoryById = async (req, res) => {
  try {
    const category =
      await categoryService.getCategoryById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error
    );

    const status =
      error.message ===
      "Category not found"
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// CREATE CATEGORY
// ===============================

const createCategory = async (req, res) => {
  try {
    const category =
      await categoryService.createCategory(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error(
      "Create category error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// UPDATE CATEGORY
// ===============================

const updateCategory = async (req, res) => {
  try {
    const category =
      await categoryService.updateCategory(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error(
      "Update category error:",
      error
    );

    const status =
      error.message ===
      "Category not found"
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// DELETE CATEGORY
// ===============================

const deleteCategory = async (req, res) => {
  try {
    const result =
      await categoryService.deleteCategory(
        req.params.id
      );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Delete category error:",
      error
    );

    const status =
      error.message ===
      "Category not found"
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};