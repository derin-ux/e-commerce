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

module.exports = { registerShop };