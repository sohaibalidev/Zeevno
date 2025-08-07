const path = require("path");
const express = require("express");

module.exports = function serveStatic(app) {
    app.use("/a", express.static(path.join(__dirname, "../../public/assets/auth")));
    app.use("/c", express.static(path.join(__dirname, "../../public/assets/common")));
    app.use("/g", express.static(path.join(__dirname, "../../public/assets/global")));
};
