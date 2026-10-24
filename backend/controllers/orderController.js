const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Shop = require("../models/Shop");


// A small error type so we can send a clear message to the customer
class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// @desc    Checkout: turn my cart into an order
// @route   POST /api/orders
// @access  Private (customer)
const checkout = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "shippingAddress is required" });
    }

    let order;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user._id }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new CheckoutError("Your cart is empty");
      }

      const orderItems = [];
      let total = 0;

      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.product)
          .populate("shop", "status")
          .session(session);

        if (!product || product.shop.status !== "approved") {
          throw new CheckoutError(
            "A product in your cart is no longer available. Please remove it and try again."
          );
        }

        // Reduce stock ONLY IF enough is left. This is one atomic step,
        // so two customers can't both buy the last item.
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, quantity: { $gte: cartItem.quantity } },
          { $inc: { quantity: -cartItem.quantity } },
          { session, new: true }
        );

        if (!updated) {
          throw new CheckoutError(
            `Not enough stock for "${product.name}". Only ${product.quantity} left.`
          );
        }

        // Snapshot the details so later changes don't alter this order
        orderItems.push({
          product: product._id,
          shop: product.shop._id,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
        });

        total += product.price * cartItem.quantity;
      }

      const created = await Order.create(
        [
          {
            customer: req.user._id,
            items: orderItems,
            total,
            shippingAddress,
          },
        ],
        { session }
      );
      order = created[0];

      // Empty the cart as part of the same transaction
      await Cart.updateOne({ user: req.user._id }, { items: [] }, { session });
    });

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get my orders
// @route   GET /api/orders
// @access  Private (customer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get one of my orders
// @route   GET /api/orders/:id
// @access  Private (customer)
const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id, // you can only see your own
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Shop owner: see only the items in orders that belong to my shop
// @route   GET /api/orders/shop/incoming
// @access  Private (shopOwner)
const getShopOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });

    if (!shop) {
      return res.status(404).json({ message: "You don't have a shop yet" });
    }

    const orders = await Order.find({
        "items.shop": shop._id,
        paymentStatus: "paid", // shops only see orders that have been paid for
    }).sort({ createdAt: -1 });

    // Strip out the items that belong to OTHER shops
    const result = orders.map((order) => ({
      orderId: order._id,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress, // the shop needs this to deliver
      items: order.items.filter((item) => item.shop.toString() === shop._id.toString()),
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// @desc    Shop owner: update the status of one of MY items in an order
// @route   PATCH /api/orders/:orderId/items/:itemId/status
// @access  Private (shopOwner)
const updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["processing", "shipped", "delivered"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowed.join(", ")}`,
      });
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "You don't have a shop yet" });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
    return res.status(400).json({ message: "This order has not been paid for yet" });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in this order" });
    }

    // The important check: is this item from MY shop?
    if (item.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "You can only update your own items" });
    }

    if (item.status === "cancelled" || item.status === "delivered") {
      return res.status(400).json({ message: `This item is already ${item.status}` });
    }

    item.status = status;
    await order.save();

    res.status(200).json(item);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Order or item not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Pay for an order (SIMULATED, no real money involved)
// @route   POST /api/orders/:id/pay
// @access  Private (customer)
const payOrder = async (req, res) => {
  try {
    const simulate = req.body.simulate || "success";

    if (!["success", "fail"].includes(simulate)) {
      return res.status(400).json({ message: 'simulate must be "success" or "fail"' });
    }

    // Is this my order?
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "This order is already paid" });
    }

    // ---- The "pretend payment provider" part. Replace this block with a
    // ---- real provider call (e.g. Paystack) when you go live.
    const paymentWorked = simulate === "success";
    // ------------------------------------------------------------------

    if (!paymentWorked) {
      order.paymentStatus = "failed";
      await order.save();
      return res
        .status(402)
        .json({ message: "Payment failed. You can try again.", order });
    }

    if (order.orderStatus === "cancelled") {
        return res.status(400).json({ message: "This order has been cancelled" });
    }

    // Only flip to "paid" if it ISN'T already paid. This guards against
    // the customer double-clicking and paying twice.
    const paid = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: "paid" } },
      {
        paymentStatus: "paid",
        paidAt: new Date(),
        paymentReference: crypto.randomUUID(),
      },
      { new: true }
    );

    if (!paid) {
      return res.status(400).json({ message: "This order is already paid" });
    }

    res.status(200).json(paid);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// @desc    Cancel my order and put the stock back
// @route   PATCH /api/orders/:id/cancel
// @access  Private (customer)
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let cancelled;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user._id, // you can only cancel your own
      }).session(session);

      if (!order) {
        throw new CheckoutError("Order not found", 404);
      }

      if (order.orderStatus === "cancelled") {
        throw new CheckoutError("This order is already cancelled");
      }

      // Once any shop has shipped its part, it's too late to cancel
      const alreadyShipped = order.items.some((item) =>
        ["shipped", "delivered"].includes(item.status)
      );
      if (alreadyShipped) {
        throw new CheckoutError(
          "Part of this order has already been shipped, so it can no longer be cancelled"
        );
      }

      // Put the stock back and mark each item cancelled
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { quantity: item.quantity } },
          { session }
        );
        item.status = "cancelled";
      }

      order.orderStatus = "cancelled";
      order.cancelledAt = new Date();
      if (order.paymentStatus === "paid") {
        order.refundRequired = true;
      }

      await order.save({ session });
      cancelled = order;
    });

    res.status(200).json({
      message: cancelled.refundRequired
        ? "Order cancelled. A refund will need to be processed."
        : "Order cancelled.",
      order: cancelled,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  getShopOrders,
  updateItemStatus,
  payOrder
};