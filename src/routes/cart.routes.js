const express = require('express');
const router = express.Router();
const { checkAuthMiddleware } = require('../middlewares/checkAuth')

const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/cart.controller');

router.get('/', checkAuthMiddleware, getCart);
router.post('/:productId', checkAuthMiddleware, addToCart);
router.patch('/:productId', checkAuthMiddleware, updateCartItem);
router.delete('/:productId', checkAuthMiddleware, removeFromCart);
router.delete('/', checkAuthMiddleware, clearCart);

module.exports = router;