const app = require("./app");
const { connectDB } = require("./src/config/dbConfig");
const config = require("./src/config/appConfig");

connectDB()
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`Server running at ${config.BASE_URL}`);
    });
  })
  .catch((err) => {
    console.error(`MongoDB connection failed: ${err.message || err}`);
    process.exit(1);
  });