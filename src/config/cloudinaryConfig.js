const cloudinary = require('cloudinary').v2;
const appConfig = require('./appConfig');

cloudinary.config({
  cloud_name: appConfig.CLOUDINARY_CLOUD_NAME,
  api_key: appConfig.CLOUDINARY_API_KEY,
  api_secret: appConfig.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
