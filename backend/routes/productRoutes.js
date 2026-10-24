const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Shop owner only
router.post("/", protect, authorize("shopOwner"), createProduct);
router.put("/:id", protect, authorize("shopOwner"), updateProduct);
router.delete("/:id", protect, authorize("shopOwner"), deleteProduct);

module.exports = router;