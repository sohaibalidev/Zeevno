const express = require('express');
const router = express.Router();

const {
    register,
    sendMagicLink,
    verifyMagicLink,
    logout
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/send-link/:email', sendMagicLink);
router.get('/verify-link/:token', verifyMagicLink);
router.post('/logout', logout);

module.exports = router;
