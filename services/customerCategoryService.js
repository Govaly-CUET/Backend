const Category = require('../models/categoryModel');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const listCategories = async () => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  return categories.map((category) => ({
    ...category,
    slug: category.slug || slugify(category.name),
    subcategory: (category.subcategory || []).map((subcategory) => ({
      ...subcategory,
      slug: subcategory.slug || slugify(subcategory.name),
    })),
  }));
};

const getCategoryBySlug = async (slug) => {
  // A slug can point at a top-level category OR one of its subcategories
  // (the customer frontend routes both the same way, e.g. /category/:slug).
  const categories = await listCategories();
  const category = categories.find((item) => item.slug === slug);
  if (category) return { category, isParent: true };

  const parent = categories.find((item) => item.subcategory.some((item) => item.slug === slug));
  if (!parent) {
    throw { status: 404, message: 'Category not found' };
  }
  const sub = parent.subcategory.find((item) => item.slug === slug);
  return {
    category: { ...sub, parentSlug: parent.slug, parentName: parent.name },
    isParent: false,
  };
};

module.exports = { listCategories, getCategoryBySlug };
