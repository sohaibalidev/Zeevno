const express = require("express");
const router = express.Router();
const {
    showHome, showCart, showProduct, showCategory, showTrackOrder,
    showLogin, showRegister, showVerify
} = require("../controllers/pages.controller");

const { checkAuthMiddleware, checkGuestMiddleware } = require("../middlewares/checkAuth");

// COMMON PAGES
router.get("/", showHome);
router.get("/cart", checkAuthMiddleware, showCart);
router.get("/product/:id", checkAuthMiddleware, showProduct);
router.get("/category*", checkAuthMiddleware, showCategory);
router.get("/order/track/:id", checkAuthMiddleware, showTrackOrder);

// AUTH PAGES
router.get("/login", checkGuestMiddleware, showLogin);
router.get("/register", checkGuestMiddleware, showRegister);
router.get("/verify/:token", checkGuestMiddleware, showVerify);

module.exports = router;
