const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper: load the cart with product details and work out the total
const buildCartResponse = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price quantity images shop",
    populate: { path: "shop", select: "name status" },
  });

  if (!cart) {
    return { items: [], total: 0 };
  }

  // Drop items whose product was deleted or whose shop is no longer approved
  const items = cart.items
    .filter((i) => i.product && i.product.shop && i.product.shop.status === "approved")
    .map((i) => ({
      product: i.product,
      quantity: i.quantity,
      subtotal: i.product.price * i.quantity,
    }));

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  return { items, total };
};

// @desc    Get my cart
// @route   GET /api/cart
// @access  Private (customer)
const getCart = async (req, res) => {
  try {
    const result = await buildCartResponse(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add a product to my cart
// @route   POST /api/cart
// @access  Private (customer)
const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity) || 1;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be a whole number of at least 1" });
    }

    const product = await Product.findById(productId).populate("shop", "status");

    if (!product || product.shop.status !== "approved") {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existing = cart.items.find((i) => i.product.toString() === productId);
    const newQuantity = (existing ? existing.quantity : 0) + quantity;

    // Stock check
    if (newQuantity > product.quantity) {
      return res.status(400).json({
        message: `Only ${product.quantity} in stock`,
      });
    }

    if (existing) {
      existing.quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    const result = await buildCartResponse(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Change the quantity of an item in my cart
// @route   PUT /api/cart/:productId
// @access  Private (customer)
const updateCartItem = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be a whole number of at least 1 (use DELETE to remove an item)",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart is empty" });
    }

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) {
      return res.status(404).json({ message: "Item not in your cart" });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product no longer exists" });
    }
    if (quantity > product.quantity) {
      return res.status(400).json({ message: `Only ${product.quantity} in stock` });
    }

    item.quantity = quantity;
    await cart.save();

    const result = await buildCartResponse(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Item not in your cart" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove one item from my cart
// @route   DELETE /api/cart/:productId
// @access  Private (customer)
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart is empty" });
    }

    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);

    if (cart.items.length === before) {
      return res.status(404).json({ message: "Item not in your cart" });
    }

    await cart.save();

    const result = await buildCartResponse(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Empty my cart
// @route   DELETE /api/cart
// @access  Private (customer)
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(200).json({ items: [], total: 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};