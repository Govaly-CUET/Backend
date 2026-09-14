const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const streamUpload = (buffer, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    console.log('Upload debug: sending file to Cloudinary:', { folder, resourceType, bufferLength: buffer.length });

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (result) {
          console.log('Upload debug: Cloudinary upload success:', {
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
          });
          resolve(result);
        } else {
          console.log('Upload debug: Cloudinary upload error:', error);
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const uploadToCloudinary = async (file, folder) => {
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
  console.log('Upload debug: detected resourceType:', resourceType, 'for mimetype:', file.mimetype);

  const result = await streamUpload(file.buffer, folder, resourceType);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    fileType: file.mimetype,
    size: file.size,
    // Cloudinary only reports pixel dimensions for actual images —
    // absent (and null in the Media doc) for PDFs and other raw files.
    width: result.width || null,
    height: result.height || null,
  };
};

module.exports = { uploadToCloudinary };