const express = require("express");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const config = require("./src/config/appConfig");
const serveStatic = require("./src/utils/static");

const routes = require("./src/routes/index.routes");

const app = express();

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(cookieParser());

if (!config.IS_DEV) app.use(helmet());

app.use(cors({
    origin: config.BASE_URL,
    credentials: true,
}));

app.use(compression({
    filter: (req, res) => {
        const type = res.getHeader('Content-Type') || '';
        return !type.includes('image') && compression.filter(req, res);
    },
}));

// ========== STATIC FILES ==========
serveStatic(app);

// ========== ROUTES ==========
app.use(routes);

// ========== TEMP IMAGE SERVE ==========
app.get("/api/images/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, "public/assets/database_imgs", filename);

    res.set("Content-Type", "image/jpeg");
    res.sendFile(imagePath, (err) => {
        if (err) res.status(404).json({ message: "Image not found" });
    });
});

// ========== 404 HANDLERS ==========
app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found" });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "public/pages/error/404.html"));
});

module.exports = app;