const express = require("express");
const { protect, authorize } = require("../middleware/auth");

const {
  registerShop,
  getMyShop,
  getPendingShops,
  approveShop,
  rejectShop,
  getApprovedShops,
  getShopById,
} = require("../controllers/shopController");

const router = express.Router();

// Shop owners
router.post("/", protect, authorize("shopOwner"), registerShop);
router.get("/my-shop", protect, authorize("shopOwner"), getMyShop);

// Admins (fixed paths must stay ABOVE "/:id")
router.get("/pending", protect, authorize("admin", "superAdmin"), getPendingShops);
router.patch("/:id/approve", protect, authorize("admin", "superAdmin"), approveShop);
router.patch("/:id/reject", protect, authorize("admin", "superAdmin"), rejectShop);

// Public
router.get("/", getApprovedShops);
router.get("/:id", getShopById);

module.exports = router;