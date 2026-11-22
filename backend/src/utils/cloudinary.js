const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a memory buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder destination
 * @param {string} filename - Optional public_id
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadBuffer(buffer, folder = 'solekicks', filename = null) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
    };
    if (filename) {
      uploadOptions.public_id = filename;
    }

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });
}

module.exports = {
  cloudinary,
  uploadBuffer,
};

