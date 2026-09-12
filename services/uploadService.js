const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const streamUpload = (buffer, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const uploadToCloudinary = async (file, folder) => {
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
  const result = await streamUpload(file.buffer, folder, resourceType);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    fileType: file.mimetype,
    size: file.size,
  };
};

module.exports = { uploadToCloudinary };