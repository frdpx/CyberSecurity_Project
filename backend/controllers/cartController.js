import { addItemToCart, removeItemFromCart, getUserCart } from "../services/cartService.js";

// Add to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const cartItems = await addItemToCart(userId, itemId);

    res.json({ success: true, message: "Added To Cart", cartData: cartItems });
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

    const cartItems = await removeItemFromCart(userId, itemId);

    res.json({
      success: true,
      message: "Removed From Cart",
      cartData: cartItems,
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

    const cartItems = await getUserCart(userId);
    res.json({ success: true, cartData: cartItems });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { addToCart, removeFromCart, getCart };
