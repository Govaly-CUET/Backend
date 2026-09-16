const Media = require('../models/mediaModel');

const listCustomerMedia = async () => {
  return Media.find({
    title: { $in: ['logo', 'top banner', 'thank you'] },
  })
    .select('title url altText')
    .sort({ updatedAt: -1 })
    .lean();
};

module.exports = { listCustomerMedia };