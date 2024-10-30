import express from 'express';
import { addTocart, getCart, removeFromCart } from '../controllers/cartController.js';
import authMiddleware from '../middleware/auth.js';

const cartRouter = express.Router();

cartRouter.post("/get",authMiddleware,getCart);
cartRouter.post("/add",authMiddleware,addTocart);
cartRouter.post("/remove",authMiddleware,removeFromCart);

export default cartRouter;