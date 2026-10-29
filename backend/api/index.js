const mongoose = require("mongoose");
const app = require("../app");

let connecting; 
async function connect() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) connecting = mongoose.connect(process.env.MONGO_URI); // use your real variable name
  await connecting;
}

module.exports = async (req, res) => {
  try {
    await connect();
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Database connection failed" }));
  }
};