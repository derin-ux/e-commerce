const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { getMyShop } = require("../controllers/shopController");

const {
  registerShop,
  getPendingShops,
  approveShop,
  rejectShop,
  getApprovedShops,
  getShopById
} = require("../controllers/shopController");

const router = express.Router();

// Shop owners
router.post("/", protect, authorize("shopOwner"), registerShop);

router.get("/my-shop", protect, authorize("shopOwner"), getMyShop);

router.get("/", getApprovedShops);
router.get("/:id", getShopById);

// Admins
router.get("/pending", protect, authorize("admin", "superAdmin"), getPendingShops);
router.patch("/:id/approve", protect, authorize("admin", "superAdmin"), approveShop);
router.patch("/:id/reject", protect, authorize("admin", "superAdmin"), rejectShop);

module.exports = router;