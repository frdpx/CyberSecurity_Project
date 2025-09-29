import orderModel from "../models/orderModel.js";
import cartModel from "../models/cartModel.js";

// Place Order COD
const placeOrderCod = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { items, amount, address } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!items?.length)
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    if (!address)
      return res
        .status(400)
        .json({ success: false, message: "No address provided" });

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      payment: true,
    });

    const saved = await newOrder.save();

    // clear cart after placing order
    await cartModel.findOneAndUpdate({ userId }, { items: {} });

    res.json({ success: true, message: "Order Placed", order: saved });
  } catch (err) {
    console.error("placeOrderCod error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Error placing order" });
  }
};

// Admin: list all orders
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("listOrders error:", err);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

// User: get own orders
const userOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const orders = await orderModel.find({ userId });
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("userOrders error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching user orders" });
  }
};

// Update order status (admin)
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    res.json({ success: true, message: "Status Updated" });
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

export { placeOrderCod, listOrders, userOrders, updateStatus };
