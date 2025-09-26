import express from "express";
import {
  loginUser,
  registerUser,
  registerAdmin,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.post(
  "/register-admin",
  authMiddleware,
  requireRole("admin"),
  registerAdmin
);

export default userRouter;
