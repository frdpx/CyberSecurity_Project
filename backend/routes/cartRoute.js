import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cartController.js";
import { authMiddleware, supabaseAuthMiddleware } from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/get", supabaseAuthMiddleware, getCart);

cartRouter.post("/add", supabaseAuthMiddleware, addToCart);

cartRouter.post("/remove", supabaseAuthMiddleware, removeFromCart);

export default cartRouter;
