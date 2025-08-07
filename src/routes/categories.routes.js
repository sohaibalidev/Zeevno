const express = require('express');
const router = express.Router();

const {
    allCategories,
    relatedProducts,
    productsByCategory
} = require('../controllers/categories.controller');

router.get('/', allCategories);
router.get('/:category', productsByCategory);
router.get('/related/:id', relatedProducts);

module.exports = router;
