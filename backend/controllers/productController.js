const Product = require("../models/Product");
const Shop = require("../models/Shop");

const createProduct = async (req, res) => {
  try {
    // Find the logged-in owner's shop, and make sure it's approved
    const shop = await Shop.findOne({ owner: req.user._id, status: "approved" });

    if (!shop) {
      return res
        .status(403)
        .json({ message: "You need an approved shop before adding products" });
    }

    const { name, description, price, quantity, category, images } = req.body;

    const product = await Product.create({
      shop: shop._id, // taken from the owner's shop, NOT from the request body
      name,
      description,
      price,
      quantity,
      category,
      images,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all products from approved shops (optional ?category= and ?search=)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // Only products whose shop is approved
    const approvedShops = await Shop.find({ status: "approved" }).select("_id");
    const approvedShopIds = approvedShops.map((s) => s._id);

    const filter = { shop: { $in: approvedShopIds } };

    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    const products = await Product.find(filter)
      .populate("shop", "name") // show the shop's name, not just its ID
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get one product (only if its shop is approved)
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "shop",
      "name status"
    );

    if (!product || product.shop.status !== "approved") {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update own product
// @route   PUT /api/products/:id
// @access  Private (shopOwner)
const updateProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ownership check: does this product belong to the logged-in owner's shop?
    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own products" });
    }

    // Only allow these fields to change (never "shop")
    const allowed = ["name", "description", "price", "quantity", "category", "images"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    const updated = await product.save();
    res.status(200).json(updated);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete own product
// @route   DELETE /api/products/:id
// @access  Private (shopOwner)
const deleteProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own products" });
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};