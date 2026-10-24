const Shop = require("../models/Shop");

const registerShop = async (req, res) => {
  try {
    // One shop per owner (for now). Keeps things simple and avoids duplicates.
    const existing = await Shop.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({
        message: "You already have a shop registered",
        status: existing.status,
      });
    }

    // Pick ONLY the fields we allow from the request body
    const { name, description, logo, contactEmail, contactPhone, address } =
      req.body;

    const shop = await Shop.create({
      name,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      owner: req.user._id, // taken from the logged-in user, never from the body
      // status is not set here, so it defaults to "pending"
    });

    res.status(201).json({
      message: "Shop submitted for approval",
      shop,
    });
  } catch (error) {
    // 11000 is MongoDB's "duplicate value" error (name or slug already taken)
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "A shop with that name already exists" });
    }

    // Mongoose validation errors (missing name, too long, etc.)
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Admin: see shops waiting for review, oldest first
const getPendingShops = async (req, res) => {
  try {
    const shops = await Shop.find({ status: "pending" })
      .populate("owner", "name email") // swap the owner ID for their name + email
      .sort({ createdAt: 1 });

    res.json({ count: shops.length, shops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: approve a pending shop
const approveShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (shop.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Only pending shops can be approved (this one is ${shop.status})` });
    }

    shop.status = "approved";
    shop.rejectionReason = undefined; // clear any old reason
    shop.reviewedBy = req.user._id;
    shop.reviewedAt = new Date();
    await shop.save();

    res.json({ message: "Shop approved", shop });
  } catch (error) {
    // A malformed ID (not 24 hex characters) makes Mongoose throw a CastError
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid shop ID" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: reject a pending shop (a reason is required)
const rejectShop = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res
        .status(400)
        .json({ message: "A rejection reason is required" });
    }

    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (shop.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Only pending shops can be rejected (this one is ${shop.status})` });
    }

    shop.status = "rejected";
    shop.rejectionReason = reason.trim();
    shop.reviewedBy = req.user._id;
    shop.reviewedAt = new Date();
    await shop.save();

    res.json({ message: "Shop rejected", shop });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid shop ID" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerShop, getPendingShops, approveShop, rejectShop };