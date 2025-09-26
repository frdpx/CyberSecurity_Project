import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

// const currency = "THB";
// const deliveryCharge = 20;
// const frontend_URL = "http://localhost:5173";

const placeOrderCod = async (req, res) => {
  try {
    const userId = req.user._id;
    // console.log("Incoming order:", req.body);

    if (
      !req.body.items ||
      !Array.isArray(req.body.items) ||
      req.body.items.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }
    if (!req.body.address) {
      return res
        .status(400)
        .json({ success: false, message: "No address provided" });
    }

    const newOrder = new orderModel({
      userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
      payment: true,
    });

    const saved = await newOrder.save();
    // console.log("Order saved:", saved);

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    // console.log(" Error placing order:", error);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});

    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.user._id });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
  //   console.log("Fetching orders for user:", req.user._id);
  const orders = await orderModel.find({ userId: req.user._id });
  //   console.log("Orders found:", orders);
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const updated = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    // console.log(" Updated order:", updated);
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    // console.error("updateStatus error:", error);
    res.json({ success: false, message: "Error updating status" });
  }
};

export { listOrders, userOrders, updateStatus, placeOrderCod };
