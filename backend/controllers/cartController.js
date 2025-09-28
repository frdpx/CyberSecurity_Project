import cartModel from "../models/cartModel.js";

// Add to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    let cart = await cartModel.findOne({ userId });
    if (!cart) cart = new cartModel({ userId, items: {} });

    cart.items[itemId] = (cart.items[itemId] || 0) + 1;
    await cart.save();

    res.json({ success: true, message: "Added To Cart", cartData: cart.items });
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const cart = await cartModel.findOne({ userId });
    if (!cart) return res.json({ success: true, cartData: {} });

    if (cart.items[itemId] > 0) {
      cart.items[itemId] -= 1;
      if (cart.items[itemId] === 0) delete cart.items[itemId];
    }

    await cart.save();

    res.json({
      success: true,
      message: "Removed From Cart",
      cartData: cart.items,
    });
  } catch (err) {
    console.error("removeFromCart error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get cart
const getCart = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const cart = await cartModel.findOne({ userId });
    res.json({ success: true, cartData: cart?.items || {} });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { addToCart, removeFromCart, getCart };
