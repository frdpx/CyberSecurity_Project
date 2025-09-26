import express from "express";

import {
  listOrders,
  updateStatus,
  userOrders,
  placeOrderCod,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.get("/list", listOrders);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/status", updateStatus);
orderRouter.post("/placecod", authMiddleware, placeOrderCod);

export default orderRouter;
