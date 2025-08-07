const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');
const sendEmail = require('../utils/emailService');

const { getDB } = require('../config/dbConfig');
const { magicLinkTemplate } = require('../utils/emailTemplates')
const { validateEmail, validatePhone } = require('../utils/validators')

exports.register = async (req, res) => {
    console.log('ran')
    try {
        const { fullName, email, phone, address } = req.body;

        if (!fullName || !email || !phone || !address)
            return res.status(400).json({ success: false, error: 'All fields are required' });

        if (!validateEmail(email))
            return res.status(400).json({ success: false, error: 'Invalid email format' });

        if (!validatePhone(phone))
            return res.status(400).json({ success: false, error: 'Invalid phone format' });

        const db = getDB();
        const usersCollection = db.collection('users');

        let user = await usersCollection.findOne({ $or: [{ email }, { phone }] });

        if (user)
            return res.status(409).json({ success: false, error: 'Email or phone already exists' });

        const newUser = {
            email: email.toLowerCase(),
            fullName,
            phone,
            address,
            role: 'customer',
        };

        const verificationCollection = db.collection('verifications');
        await verificationCollection.insertOne({
            email,
            userData: newUser,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const token = crypto.randomBytes(32).toString('hex');
        const magicLink = `${config.BASE_URL}/verify/${token}`;

        const magicLinksCollection = db.collection('magicLinks');
        await magicLinksCollection.deleteMany({ email });

        await magicLinksCollection.insertOne({
            token,
            email,
            purpose: 'register',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await sendEmail({
            to: email,
            subject: 'Verify your account',
            text: `Click this link to verify your account: ${magicLink}`,
            html: magicLinkTemplate(magicLink, email)
        });

        return res.status(200).json({
            success: true,
            message: 'Magic link sent to your email for verification'
        });

    } catch (error) {
        console.log(error.error || error)
        return res.status(500).json({
            success: false,
            error: 'Registration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.sendMagicLink = async (req, res) => {
    try {
        const email = req.params.email;
        const db = getDB();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).json({
            success: false,
            error: 'User is not verified or doesnt exists'
        });

        const token = crypto.randomBytes(32).toString('hex');
        const magicLink = `${config.BASE_URL}/verify/${token}`;

        const magicLinksCollection = db.collection('magicLinks');
        await magicLinksCollection.deleteMany({ email });

        await magicLinksCollection.insertOne({
            token,
            email: user.email,
            purpose: 'login',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await sendEmail({
            to: email,
            subject: 'Your magic login link',
            text: `Click here to login: ${magicLink}`,
            html: magicLinkTemplate(magicLink, email)
        });

        res.status(200).json({ message: 'Magic link sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send magic link', error: error.message });
    }
}

exports.verifyMagicLink = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Token is missing or invalid format'
            });
        }

        const db = getDB();
        const magicLinksCollection = db.collection('magicLinks');
        const usersCollection = db.collection('users');
        const verificationsCollection = db.collection('verifications');

        const magicLink = await magicLinksCollection.findOne({
            token,
            expiresAt: { $gt: new Date() }
        });

        if (!magicLink) {
            return res.status(400).json({
                success: false,
                message: 'Magic link is invalid or has expired'
            });
        }

        let user;

        if (magicLink.purpose === 'register') {
            const unverifiedUser = await verificationsCollection.findOne({
                email: magicLink.email
            });

            if (!unverifiedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Unverified user not found'
                });
            }

            const { _id, ...userData } = unverifiedUser;

            await usersCollection.insertOne({
                ...userData,
                createdAt: new Date(),
                lastLoginAt: new Date()
            });

            await verificationsCollection.deleteOne({ _id });

            user = userData;

        } else if (magicLink.purpose === 'login') {
            user = await usersCollection.findOne({ email: magicLink.email });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User associated with this magic link not found'
                });
            }

            await usersCollection.updateOne(
                { email: user.email },
                { $set: { lastLoginAt: new Date() } }
            );

        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid magic link purpose'
            });
        }

        const loginToken = jwt.sign(
            { email: user.email },
            config.JWT_SECRET_KEY,
            {
                issuer: config.APP_NAME,
                algorithm: 'HS256',
                expiresIn: '30d'
            }
        );

        res.cookie('token', loginToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        await magicLinksCollection.deleteMany({ email: user.email });

        return res.status(200).json({
            success: true,
            message: 'Magic link verified',
            data: {
                user: {
                    fullName: user.fullName,
                    email: user.email
                }
            }
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

exports.logout = async (req, res) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Logout failed',
        });
    }
}
