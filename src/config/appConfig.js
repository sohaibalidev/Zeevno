require("dotenv").config();

const config = {
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || 'http://192.168.100.4',
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    MAILER_EMAIL: process.env.MAILER_EMAIL,
    MAILER_PASSWORD: process.env.MAILER_PASSWORD,
    MONGODB_URI: process.env.MONGODB_URI,
    DB_NAME: process.env.DB_NAME,
    APP_NAME: process.env.APP_NAME || 'Zeevno',
}

config.IS_DEV = config.NODE_ENV === 'development'
config.BASE_URL = config.IS_DEV
    ? `${config.HOST}:${config.PORT}`
    : config.HOST

module.exports = config;
