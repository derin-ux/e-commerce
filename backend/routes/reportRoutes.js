const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createReport,
  getReports,
  dismissReport,
  suspendShopFromReport,
} = require("../controllers/reportController");

// Customers
router.post("/", protect, authorize("customer"), createReport);

// Admins
router.get("/", protect, authorize("admin", "superAdmin"), getReports);
router.patch("/:id/dismiss", protect, authorize("admin", "superAdmin"), dismissReport);
router.patch(
  "/:id/suspend-shop",
  protect,
  authorize("admin", "superAdmin"),
  suspendShopFromReport
);

module.exports = router;