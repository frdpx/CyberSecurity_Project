import express from "express";

import {
  listOrders,
  updateStatus,
  userOrders,
  placeOrderCod
} from "../controllers/orderController.js";
import {
  supabaseAuthMiddleware,
  authMiddleware,
  requireRole
} from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.use(supabaseAuthMiddleware);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/status", requireRole("admin"), updateStatus);
orderRouter.get("/list", requireRole("admin"), listOrders);
orderRouter.post("/placecod", requireRole("admin"), placeOrderCod);

export default orderRouter;
