const { getDB } = require('../config/dbConfig');
const config = require('../config/appConfig');
const jwt = require('jsonwebtoken');

exports.checkAuth = async (req, res) => {
    const token = req.cookies?.token;
    if (!token) return false;

    let decoded;
    try { decoded = jwt.verify(token, config.JWT_SECRET_KEY) }
    catch { return false }

    if (!decoded?.email) return false;

    const db = getDB();
    const user = await db.collection('users').findOne({ email: decoded.email });
    if (!user) return false;

    req.user = user;
    return true;
}

exports.checkAuthMiddleware = async (req, res, next) => {
    const isAuth = await this.checkAuth(req, res);
    if (!isAuth) return res.redirect('/login');
    next();
};

exports.checkGuestMiddleware = async (req, res, next) => {
    const isAuth = await this.checkAuth(req, res);
    if (isAuth) return res.redirect('/');
    next();
};
