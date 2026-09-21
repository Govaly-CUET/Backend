const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Seller = require('../models/sellerModel');
const Category = require('../models/categoryModel');
const Review = require('../models/reviewModel');

const SORTS = {
  new: { createdAt: -1 },
  price_asc: { sale_price: 1 },
  price_desc: { sale_price: -1 },
  rating: { rating: -1 },
  popular: { sold_items: -1 },
};

const makeSlug = (name, id) => {
  const base = String(name || 'product')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'product'}-${id}`;
};

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Treat every word in a search phrase as a term. This makes "men sandal"
// match "Men's Sandals" as well as a product called "Men sandal".
const searchTerms = (value) => String(value || '')
  .toLowerCase()
  .match(/[a-z0-9]+/g)
  ?.slice(0, 8) || [];

const categoryMatchesTerms = (value, terms) => {
  const words = searchTerms(value);
  return terms.every((term) => words.some((word) => word.startsWith(term) || term.startsWith(word)));
};

const withCustomerFields = (product) => ({
  ...product,
  slug: product.slug || makeSlug(product.name, product._id),
});

// Ratings are derived from Review documents so existing reviews appear even
// when their product was created before rating fields were added to Product.
const withReviewStats = async (products) => {
  const productIds = products.map((product) => product._id);
  if (!productIds.length) return products;

  const reviewStats = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    {
      $group: {
        _id: '$product',
        rating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);
  const statsByProductId = new Map(
    reviewStats.map((stat) => [String(stat._id), stat])
  );

  return products.map((product) => {
    const stats = statsByProductId.get(String(product._id));
    return {
      ...product,
      rating: stats ? Math.round(stats.rating * 10) / 10 : 0,
      numReviews: stats?.numReviews || 0,
    };
  });
};

// category param can be a slug (top-level or sub) or a raw ObjectId
const resolveCategoryFilter = async (categorySlug) => {
  if (!categorySlug) return null;
  if (mongoose.Types.ObjectId.isValid(categorySlug)) return { category: categorySlug };

  const normalizedCategory = slugify(categorySlug);
  const categories = await Category.find().lean();
  const parent = categories.find((item) => item.slug === categorySlug || slugify(item.name) === normalizedCategory);
  if (parent) return { category: parent._id };

  const owner = categories.find((item) => (item.subcategory || []).some((subcategory) => slugify(subcategory.name) === normalizedCategory));
  if (owner) {
    const sub = owner.subcategory.find((item) => slugify(item.name) === normalizedCategory);
    return { category: owner._id, subcategory: sub?._id };
  }
  return { category: null }; // no match — return nothing rather than everything
};

const listProducts = async (query) => {
  const {
    search,
    category,
    subcategory,
    seller,
    min,
    max,
    size,
    sort,
    page = 1,
    limit = 20,
  } = query;
  const q = { status: 'in_stock' };
  const suspendedSellerIds = await Seller.find({ status: 'suspended' }).distinct('_id');
  q.seller = { $nin: suspendedSellerIds };

  const terms = searchTerms(search);
  if (terms.length) {
    // Match a specific product name/description even if its words are in a
    // different order, then add category and subcategory product groups.
    const productTextMatch = {
      $and: terms.map((term) => ({
        $or: [
          { name: new RegExp(escapeRegex(term), 'i') },
          { description: new RegExp(escapeRegex(term), 'i') },
        ],
      })),
    };

    const categories = await Category.find().select('name subcategory').lean();
    const categoryMatches = [productTextMatch];

    categories.forEach((item) => {
      // "men" returns every product in the Men category.
      if (categoryMatchesTerms(item.name, terms)) {
        categoryMatches.push({ category: item._id });
      }

      // "men sandal" only returns the matching Men > Sandals group, not
      // every Men product. Combining the parent and child names lets either
      // wording be found by the same search field.
      (item.subcategory || []).forEach((subcategory) => {
        if (categoryMatchesTerms(`${item.name} ${subcategory.name}`, terms)) {
          categoryMatches.push({ category: item._id, subcategory: subcategory._id });
        }
      });
    });

    q.$or = categoryMatches;
  }
  if (category) {
    const catFilter = await resolveCategoryFilter(category);
    if (catFilter) Object.assign(q, catFilter);
  }
  if (subcategory && mongoose.Types.ObjectId.isValid(subcategory)) {
    q.subcategory = subcategory;
  }
  if (seller && mongoose.Types.ObjectId.isValid(seller)) {
    q.seller = { $eq: seller, $nin: suspendedSellerIds };
  }
  if (min || max) {
    q.sale_price = {};
    if (Number.isFinite(Number(min))) q.sale_price.$gte = Number(min);
    if (Number.isFinite(Number(max))) q.sale_price.$lte = Number(max);
  }
  if (size) {
    q.sizes = size;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const lim = Math.min(60, Number(limit) || 20);

  const products = await Product.find(q)
    .populate('category', 'name slug')
    .populate('seller', 'shopName shopSlug ratings status')
    .lean();

  const allItems = (await withReviewStats(products))
    .map(withCustomerFields)
    .sort((left, right) => {
      const sortSpec = SORTS[sort] || SORTS.new;
      const [[field, direction]] = Object.entries(sortSpec);
      const leftValue = field === 'createdAt'
        ? new Date(left[field] || 0).getTime()
        : Number(left[field] || 0);
      const rightValue = field === 'createdAt'
        ? new Date(right[field] || 0).getTime()
        : Number(right[field] || 0);
      return (leftValue - rightValue) * direction;
    });
  const total = allItems.length;
  const items = allItems.slice((pageNum - 1) * lim, pageNum * lim);

  return { items, total, page: pageNum, pages: Math.ceil(total / lim) || 1 };
};

const getProductBySlug = async (slug) => {
  let product = await Product.findOne({ slug })
    .populate('category', 'name slug')
    .populate('seller', 'shopName shopSlug ratings status')
    .lean();

  if (!product) {
    const id = String(slug).split('-').pop();
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id)
        .populate('category', 'name slug')
        .populate('seller', 'shopName shopSlug ratings status')
        .lean();
    }
  }

  if (!product || product.seller?.status === 'suspended') {
    throw { status: 404, message: 'Product not found' };
  }
  return withCustomerFields((await withReviewStats([product]))[0]);
};

const listReviewsForProduct = async (slug) => {
  let product = await Product.findOne({ slug }).select('_id').lean();

  if (!product) {
    const id = String(slug).split('-').pop();
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).select('_id').lean();
    }
  }

  if (!product) throw { status: 404, message: 'Product not found' };
  return Review.find({ product: product._id })
    .populate('customer', 'name image')
    .sort('-createdAt')
    .lean();
};

module.exports = { listProducts, getProductBySlug, listReviewsForProduct };
