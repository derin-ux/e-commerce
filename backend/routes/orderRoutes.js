const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

const {
  checkout,
  getMyOrders,
  getMyOrderById,
  getShopOrders,
  updateItemStatus,
  payOrder,
  cancelOrder
} = require("../controllers/orderController");

// Shop owner routes (fixed paths first)
router.get("/shop/incoming", protect, authorize("shopOwner"), getShopOrders);
router.patch(
  "/:orderId/items/:itemId/status",
  protect,
  authorize("shopOwner"),
  updateItemStatus
);

// Customer routes
router.post("/", protect, authorize("customer"), checkout);
router.get("/", protect, authorize("customer"), getMyOrders);
router.post("/:id/pay", protect, authorize("customer"), payOrder);
router.get("/:id", protect, authorize("customer"), getMyOrderById);
router.patch("/:id/cancel", protect, authorize("customer"), cancelOrder);

module.exports = router;