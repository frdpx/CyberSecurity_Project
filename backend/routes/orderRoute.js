import express from "express";
import authMiddleware from "../middleware/auth.js";
import { placeOrderCod } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place",authMiddleware,placeOrderCod);


export default orderRouter;