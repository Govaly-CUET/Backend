require('dotenv').config();
const cloudinary = require('../config/cloudinary');

const test = async () => {
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY);
  console.log('API Secret set:', process.env.CLOUDINARY_API_SECRET ? 'yes' : 'NO — missing!');

  try {
    const result = await cloudinary.api.ping();
    console.log('\n✅ Cloudinary connection successful:', result);
  } catch (error) {
    console.error('\n❌ Cloudinary connection failed:', error.message);
  }
};

test();