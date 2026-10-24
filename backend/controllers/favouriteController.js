const Favourite = require("../models/Favourite");
const Product = require("../models/Product");

// @desc    Add or remove a favourite (toggle)
// @route   POST /api/favourites/:productId
// @access  Private (customer)
const toggleFavourite = async (req, res) => {
  try {
    const { productId } = req.params;

    // Already a favourite? Then this click means "remove it".
    // (We check this first so you can always un-favourite, even if the
    // product has since been deleted.)
    const existing = await Favourite.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ favourited: false });
    }

    // Otherwise add it, but only if the product is real and its shop is approved
    const product = await Product.findById(productId).populate("shop", "status");

    if (!product || product.shop.status !== "approved") {
      return res.status(404).json({ message: "Product not found" });
    }

    await Favourite.create({ user: req.user._id, product: productId });

    res.status(201).json({ favourited: true });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    // Duplicate key: a double-click made two requests at once.
    // The favourite already exists, so the end result is what they wanted.
    if (error.code === 11000) {
      return res.status(200).json({ favourited: true });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get my favourite products
// @route   GET /api/favourites
// @access  Private (customer)
const getFavourites = async (req, res) => {
  try {
    const favourites = await Favourite.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "product",
        select: "name price quantity images category shop",
        populate: { path: "shop", select: "name status" },
      });

    // Hide products that were deleted or whose shop is no longer approved
    const products = favourites
      .filter((f) => f.product && f.product.shop && f.product.shop.status === "approved")
      .map((f) => f.product);

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { toggleFavourite, getFavourites };