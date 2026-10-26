const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, createAdmin } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                // 10 attempts per IP in that window
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

// Public
router.post("/register", register);
router.post("/login", loginLimiter, login);

// Logged in
router.get("/me", protect, (req, res) => {
  const { _id, name, email, role } = req.user;
  res.json({ id: _id, name, email, role });
});

// Super admin only
router.post("/admins", protect, authorize("superAdmin"), createAdmin);

// Temporary test route; delete once you've confirmed admin access works
router.get("/admin-only", protect, authorize("admin", "superAdmin"), (req, res) => {
  res.json({ message: "Welcome, admin" });
});

module.exports = router;