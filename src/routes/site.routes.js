const express = require('express');
const router = express.Router();
const { getSiteLayoutSettings } = require('../controllers/site.controller');

router.get('/layout', getSiteLayoutSettings);

module.exports = router;
