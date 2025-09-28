// models/cartModel.js
import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Object, default: {} },
});

const cartModel = mongoose.models.cart || mongoose.model("cart", cartSchema);

export default cartModel;
