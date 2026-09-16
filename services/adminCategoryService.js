const mongoose = require("mongoose");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");


// ===============================
// GET ALL CATEGORIES
// ===============================

const getCategories = async (filters = {}) => {
  const { search } = filters;

  const match = {};

  if (search) {
    match.name = {
      $regex: search,
      $options: "i",
    };
  }

  const categories = await Category.find(match)
    .sort({ name: 1 })
    .lean();

  const categoryIds = categories.map((category) => category._id);
  const productCounts = categoryIds.length
    ? await Product.aggregate([
      {
        $match: {
          category: { $in: categoryIds },
          subcategory: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            category: '$category',
            subcategory: '$subcategory',
          },
          productCount: { $sum: 1 },
        },
      },
    ])
    : [];

  const countsBySubcategory = new Map(
    productCounts.map((count) => [
      `${count._id.category}-${count._id.subcategory}`,
      count.productCount,
    ])
  );

  return categories.map((category) => ({
    ...category,
    subcategory: (category.subcategory || []).map((subcategory) => ({
      ...subcategory,
      productCount: countsBySubcategory.get(
        `${category._id}-${subcategory._id}`
      ) || 0,
    })),
  }));
};


// ===============================
// GET CATEGORY BY ID
// ===============================

const getCategoryById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID");
  }

  const category = await Category.findById(id).lean();

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};


// ===============================
// CREATE CATEGORY
// ===============================

const createCategory = async ({
  name,
  subcategory = [],
}) => {
  if (!name || !name.trim()) {
    throw new Error("Category name is required");
  }

  const existing = await Category.findOne({
    name: name.trim(),
  });

  if (existing) {
    throw new Error(
      "Category with this name already exists"
    );
  }

  const category = await Category.create({
    name: name.trim(),

    subcategory: subcategory.map((item) => ({
      name: item.name.trim(),
      image: item.image,
    })),
  });

  return category;
};


// ===============================
// UPDATE CATEGORY
// ===============================

const updateCategory = async (
  id,
  { name, subcategory }
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  if (name !== undefined) {
    if (!name.trim()) {
      throw new Error(
        "Category name is required"
      );
    }

    const duplicate = await Category.findOne({
      name: name.trim(),
      _id: { $ne: id },
    });

    if (duplicate) {
      throw new Error(
        "Category with this name already exists"
      );
    }

    category.name = name.trim();
  }

  if (subcategory !== undefined) {
    category.subcategory =
      subcategory.map((item) => ({
        _id:
          item._id &&
          mongoose.Types.ObjectId.isValid(
            item._id
          )
            ? item._id
            : new mongoose.Types.ObjectId(),

        name: item.name.trim(),

        image: item.image,
      }));
  }

  await category.save();

  return category;
};


// ===============================
// DELETE CATEGORY
// ===============================

const deleteCategory = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID");
  }

  const category =
    await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  await Category.findByIdAndDelete(id);

  return {
    message: "Category deleted successfully",
  };
};


module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
