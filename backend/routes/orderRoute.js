import express from "express";
import authMiddleware from "../middleware/auth.js";
import { placeOrderCod, verifyOrder } from "../controllers/orderController.js";


const orderRouter = express.Router();

orderRouter.post("/place",authMiddleware,placeOrderCod);
orderRouter.post("/verify",verifyOrder);


export default orderRouter;