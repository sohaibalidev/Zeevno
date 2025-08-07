const cloudinary = require('../config/cloudinaryConfig');

const uploadToCloudinary = async (buffer, mimetype, folder = 'Zeevno') => {
    const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return await cloudinary.uploader.upload(base64, { folder });
};

module.exports = uploadToCloudinary;
