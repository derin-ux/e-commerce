const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require("../controllers/productController");

// Shop owner's own products (must stay ABOVE "/:id")
router.get("/mine", protect, authorize("shopOwner"), getMyProducts);

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Shop owner only
router.post("/", protect, authorize("shopOwner"), createProduct);
router.put("/:id", protect, authorize("shopOwner"), updateProduct);
router.delete("/:id", protect, authorize("shopOwner"), deleteProduct);

module.exports = router;