import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: String,
  password: String,
  role: { type: String, default: "user" },
  cartData: { type: Object, default: {} },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
