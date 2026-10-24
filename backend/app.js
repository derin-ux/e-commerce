const express = require('express');
const cors = require('cors');
const shopRoutes = require("./routes/shopRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

// Middleware: runs on every request before it reaches a route
app.use(cors());           // lets your future frontend (a different origin) call this API
app.use(express.json());   // turns incoming JSON bodies into req.body

// Health check: a quick way to confirm the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes will be plugged in here as you build them, e.g.:
app.use('/api/auth', require('./routes/authRoutes'));


app.use("/api/shops", shopRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

// Error handler: catches errors thrown anywhere in the app
// (Express recognises it by its 4 parameters)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// 404 handler: runs only if no route above matched
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;