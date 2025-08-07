const path = require("path");
const { checkAuth } = require("../middlewares/checkAuth");

const PAGES_PATH = path.join(__dirname, "../../public/pages");

module.exports = {
    showHome: async (req, res) => {
        const isAuth = await checkAuth(req, res);
        if (isAuth) {
            return res.sendFile(path.join(PAGES_PATH, "common", "index.html"));
        }
        res.redirect("/login");
    },

    showCart: (req, res) => {
        res.sendFile(path.join(PAGES_PATH, "common", "cart.html"));
    },

    showProduct: (req, res) => {
        res.sendFile(path.join(PAGES_PATH, "common", "product.html"));
    },

    showCategory: (req, res) => {
        res.sendFile(path.join(PAGES_PATH, "common", "category.html"));
    },

    showTrackOrder: (req, res) => {
        res.sendFile(path.join(PAGES_PATH, "common", "track-order.html"));
    },

    showLogin: (req, res) => {
        res.sendFile(path.join(PAGES_PATH, "auth", "login.html"));
    },

    showRegister: (req, res) => {
        res.sendFile(path.join(PAGES_PATH, "auth", "register.html"));
    },

    showVerify: (req, res) => {
        res.sendFile(path.join(PAGES_PATH, "auth", "verify.html"));
    },
};
