import cartModel from "../models/cartModel.js";

// Service: Add to cart
export const addItemToCart = async (userId, itemId) => {
  let cart = await cartModel.findOne({ userId });
  if (!cart) cart = new cartModel({ userId, items: {} });

  cart.items[itemId] = (cart.items[itemId] || 0) + 1;
  await cart.save();
  return cart.items;
};

// Service: Remove from cart
export const removeItemFromCart = async (userId, itemId) => {
  const cart = await cartModel.findOne({ userId });
  if (!cart) return {};

  if (cart.items[itemId] > 0) {
    cart.items[itemId] -= 1;
    if (cart.items[itemId] === 0) delete cart.items[itemId];
  }

  await cart.save();
  return cart.items;
};

// Service: Get cart
export const getUserCart = async (userId) => {
  const cart = await cartModel.findOne({ userId });
  return cart?.items || {};
};
