const express = require('express');
const cors = require('cors');
const shopRoutes = require("./routes/shopRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const favouriteRoutes = require("./routes/favouriteRoutes");
const reportRoutes = require("./routes/reportRoutes");



const app = express();

// Middleware: runs on every request before it reaches a route
app.use(cors());           // lets your future frontend (a different origin) call this API
app.use(express.json());   // turns incoming JSON bodies into req.body

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/reports", reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;