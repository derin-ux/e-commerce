const express = require("express");
const {
  registerShop,
  getPendingShops,
  approveShop,
  rejectShop,
} = require("../controllers/shopController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Shop owners
router.post("/", protect, authorize("shopOwner"), registerShop);

// Admins
router.get("/pending", protect, authorize("admin", "superAdmin"), getPendingShops);
router.patch("/:id/approve", protect, authorize("admin", "superAdmin"), approveShop);
router.patch("/:id/reject", protect, authorize("admin", "superAdmin"), rejectShop);

module.exports = router;