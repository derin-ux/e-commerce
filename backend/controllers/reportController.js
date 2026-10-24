const mongoose = require("mongoose");
const Report = require("../models/Report");
const Shop = require("../models/Shop");

// @desc    Report a shop
// @route   POST /api/reports
// @access  Private (customer)
const createReport = async (req, res) => {
  try {
    const { shopId, reason, details } = req.body;

    if (!shopId) {
      return res.status(400).json({ message: "shopId is required" });
    }

    const shop = await Shop.findOne({ _id: shopId, status: "approved" });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (shop.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't report your own shop" });
    }

    const report = await Report.create({
      reporter: req.user._id,
      shop: shop._id,
      reason,
      details,
    });

    res.status(201).json(report);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You already have an open report on this shop" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Shop not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    List reports (default: open ones)
// @route   GET /api/reports?status=open
// @access  Private (admin)
const getReports = async (req, res) => {
  try {
    const status = req.query.status || "open";

    const reports = await Report.find({ status })
      .sort({ createdAt: -1 })
      .populate("shop", "name status")
      .populate("reporter", "name email");

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Dismiss a report (it was not valid)
// @route   PATCH /api/reports/:id/dismiss
// @access  Private (admin)
const dismissReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.status !== "open") {
      return res.status(400).json({ message: `This report is already ${report.status}` });
    }

    report.status = "dismissed";
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.adminNote = req.body.adminNote;
    await report.save();

    res.status(200).json(report);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Suspend the reported shop (the report was valid)
// @route   PATCH /api/reports/:id/suspend-shop
// @access  Private (admin)
const suspendShopFromReport = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const report = await Report.findById(req.params.id).session(session);

      if (!report) {
        const err = new Error("Report not found");
        err.status = 404;
        throw err;
      }
      if (report.status !== "open") {
        const err = new Error(`This report is already ${report.status}`);
        err.status = 400;
        throw err;
      }

      const note = req.body.adminNote;

      // 1. Suspend the shop
      const shop = await Shop.findByIdAndUpdate(
        report.shop,
        { status: "suspended", suspensionReason: note || "Suspended after a customer report" },
        { session, new: true }
      );

      // 2. Close EVERY open report on that shop
      await Report.updateMany(
        { shop: report.shop, status: "open" },
        {
          status: "actioned",
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          adminNote: note,
        },
        { session }
      );

      result = shop;
    });

    res.status(200).json({ message: "Shop suspended", shop: result });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createReport,
  getReports,
  dismissReport,
  suspendShopFromReport,
};