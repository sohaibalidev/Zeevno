const express = require('express');
const router = express.Router();

const {
    subscribe, unsubscribe,
    getAllSubscribers, sendNewsletterToAll
} = require('../controllers/newsletter.controller');

const { isAdmin } = require('../middlewares/checkAdmin');

// Public
router.post('/subscribe/', subscribe);
router.get('/unsubscribe/:token', unsubscribe);

// Admin
router.get('/all', isAdmin, getAllSubscribers);
router.post('/send', isAdmin, sendNewsletterToAll);

module.exports = router;
