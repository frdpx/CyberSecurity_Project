import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listOrders,
  updateStatus,
  userOrders,
  placeOrderCod,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.get("/list", listOrders);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/status", updateStatus);
orderRouter.post("/placecod", authMiddleware, placeOrderCod);

export default orderRouter;
