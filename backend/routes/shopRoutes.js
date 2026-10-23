const express = require("express");
const { registerShop } = require("../controllers/shopController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// protect = "who are you?", authorize = "are you allowed here?"
router.post("/", protect, authorize("shopOwner"), registerShop);

module.exports = router;