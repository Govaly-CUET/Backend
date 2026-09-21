require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/userModel');

const run = async () => {
  const connectionString = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!connectionString) {
    throw new Error('MONGO_URI or MONGODB_URI is required.');
  }

  await mongoose.connect(connectionString);

  await User.updateMany(
    { googleId: null },
    { $unset: { googleId: 1 } }
  );

  try {
    await User.collection.dropIndex('googleId_1');
  } catch (error) {
    if (error.codeName !== 'IndexNotFound') throw error;
  }

  await User.collection.createIndex(
    { googleId: 1 },
    {
      name: 'googleId_unique_string',
      unique: true,
      partialFilterExpression: { googleId: { $type: 'string' } },
    }
  );

  console.log('googleId index migration completed.');
};

run()
  .catch((error) => {
    console.error(`googleId index migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
