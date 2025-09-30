import express from "express";
import { forcePasswordChange } from "../controllers/forcePasswordController.js";
import { supabaseAuthMiddleware } from "../middleware/auth.js";

const forcePasswordRoute = express.Router();

// Protected route สำหรับเปลี่ยนรหัสเมื่อหมดอายุ
forcePasswordRoute.post(
  "/force-password-change",
  supabaseAuthMiddleware,
  forcePasswordChange
);

export default forcePasswordRoute;
