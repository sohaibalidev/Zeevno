const express = require("express");
const router = express.Router();

const apiRouter = express.Router();
apiRouter.use("/auth", require("./auth.routes"));
apiRouter.use("/products", require("./product.routes"));
apiRouter.use("/categories", require("./categories.routes"));
apiRouter.use("/cart", require("./cart.routes"));

apiRouter.use('/banners', require('./banner.routes'));
apiRouter.use('/newsletter', require('./newsletter.routes'));

router.use("/api", apiRouter);
router.use("/", require("./pages.routes"));

module.exports = router;
