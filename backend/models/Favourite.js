const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

// The same user can't favourite the same product twice
favouriteSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("Favourite", favouriteSchema);