const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    // Who owns this shop. Links to a User document.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
      unique: true,
    },

    // URL-friendly version of the name, e.g. "Ade Fashion" -> "ade-fashion"
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    logo: { type: String }, // image URL, we'll handle uploads later

    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },

    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: "Nigeria" },
    },

    // Where the shop is in the approval flow
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },

    // Filled in only when an admin rejects (or suspends) the shop
    rejectionReason: { type: String, trim: true },

    // Audit trail: which admin made the decision, and when
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Auto-generate the slug from the name before validating
shopSchema.pre("validate", function () {
  if (this.name && this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});
// Speeds up the common queries: "all approved shops" and "this owner's shop"
shopSchema.index({ status: 1 });
shopSchema.index({ owner: 1 });

module.exports = mongoose.model("Shop", shopSchema);