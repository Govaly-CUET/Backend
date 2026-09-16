const { listCustomerMedia } = require('../services/customerMediaService');

const getMedia = async (req, res) => {
  try {
    const media = await listCustomerMedia();
    res.status(200).json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMedia };