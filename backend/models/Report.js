const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    reason: {
      type: String,
      enum: ["scam", "counterfeit", "prohibited_items", "misleading", "other"],
      required: [true, "A reason is required"],
    },
    details: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["open", "dismissed", "actioned"],
      default: "open",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

// One OPEN report per customer per shop. Once it's reviewed, they can
// report again if the problem comes back.
reportSchema.index(
  { reporter: 1, shop: 1 },
  { unique: true, partialFilterExpression: { status: "open" } }
);

module.exports = mongoose.model("Report", reportSchema);