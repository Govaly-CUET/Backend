require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find().select('_id cartItems wishlist').lean();
  let carts = 0;
  let wishlists = 0;

  for (const user of users) {
    if (user.cartItems?.length) {
      await Cart.findOneAndUpdate(
        { customer: user._id },
        { $setOnInsert: { customer: user._id }, $addToSet: { items: { $each: user.cartItems.map(({ product, quantity, size, color }) => ({ product, quantity, size, color })) } } },
        { upsert: true, new: true }
      );
      carts += 1;
    }
    if (user.wishlist?.length) {
      await Wishlist.findOneAndUpdate(
        { customer: user._id },
        { $setOnInsert: { customer: user._id }, $addToSet: { products: { $each: user.wishlist } } },
        { upsert: true, new: true }
      );
      wishlists += 1;
    }
  }

  console.log(`Migrated ${carts} carts and ${wishlists} wishlists.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
