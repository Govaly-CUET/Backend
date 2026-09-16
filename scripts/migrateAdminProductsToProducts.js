require('dotenv').config();

const mongoose = require('mongoose');
const Product = require('../models/productModel');

const makeSlug = (name, id) => {
  const base = String(name || 'product')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'product'}-${id}`;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const legacyProducts = await mongoose.connection.collection('adminproducts').find({}).toArray();
  let migrated = 0;
  let skipped = 0;

  for (const legacyProduct of legacyProducts) {
    const exists = await Product.exists({ _id: legacyProduct._id });
    if (exists) {
      skipped += 1;
      continue;
    }

    await Product.collection.insertOne({
      ...legacyProduct,
      slug: legacyProduct.slug || makeSlug(legacyProduct.name, legacyProduct._id),
    });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} admin products; skipped ${skipped} existing products.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});