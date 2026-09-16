const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

const makeSlug = (name, id) => {
  const base = String(name || 'product').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'product'}-${id}`;
};

const getCart = async (userId) => {
  const cart = await Cart.findOne({ customer: userId }).lean();
  if (!cart) return [];
  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate('seller', 'shopName shopSlug')
    .populate('category', 'name slug')
    .lean();
  const productMap = new Map(products.map((product) => [String(product._id), { ...product, slug: product.slug || makeSlug(product.name, product._id) }]));
  return cart.items.map((item) => ({ itemId: item._id, product: productMap.get(String(item.product)) || null, size: item.size, color: item.color, quantity: item.quantity }));
};

const addToCart = async (userId, productId, quantity = 1, size = '', color = '') => {
  if (!await Product.exists({ _id: productId })) throw { status: 404, message: 'Product not found' };
  const cart = await Cart.findOneAndUpdate({ customer: userId }, { $setOnInsert: { customer: userId } }, { upsert: true, new: true });
  const existing = cart.items.find((item) => item.product.toString() === productId);
  if (existing) existing.quantity += Number(quantity) || 1;
  else cart.items.push({ product: productId, quantity: Number(quantity) || 1, size: size || '', color: color || '' });
  await cart.save();
  return getCart(userId);
};

const updateCartItem = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ customer: userId });
  const item = cart?.items.id(itemId);
  if (!item) throw { status: 404, message: 'Cart item not found' };
  if (quantity <= 0) item.deleteOne();
  else item.quantity = quantity;
  await cart.save();
  return getCart(userId);
};

const removeCartItem = async (userId, itemId) => {
  const cart = await Cart.findOne({ customer: userId });
  const item = cart?.items.id(itemId);
  if (!item) throw { status: 404, message: 'Cart item not found' };
  item.deleteOne();
  await cart.save();
  return getCart(userId);
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
