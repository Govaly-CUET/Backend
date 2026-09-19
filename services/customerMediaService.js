const Media = require('../models/mediaModel');

const listCustomerMedia = async () => {
  return Media.find({
    title: { $in: ['logo', 'top banner', 'thank you', 'cash on delivery', 'delivery within 48hrs', 'instant return', 'best price deal'] },
  })
    .select('title url altText')
    .sort({ updatedAt: -1 })
    .lean();
};

module.exports = { listCustomerMedia };