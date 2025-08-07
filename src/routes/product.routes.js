const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/checkAdmin')

const { getProducts, getProduct, addProduct, updateProduct, deleteProduct, getFeaturedProducts
} = require('../controllers/product.controller');

router.get('/featured', getFeaturedProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);

router.post('/', isAdmin, addProduct);
router.patch('/:id', isAdmin, updateProduct);
router.delete('/:id', isAdmin, deleteProduct);

module.exports = router;
