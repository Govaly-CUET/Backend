const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || process.env.MONGODB_URI;
    // যদি MONGO_URI না পাওয়া যায়
    if (!connStr) {
      console.error("ERROR: process.env.MONGO_URI is UNDEFINED. Check your .env file!");
      process.exit(1);
    }

    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;