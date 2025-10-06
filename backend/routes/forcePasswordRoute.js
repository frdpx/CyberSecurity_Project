import express from "express";
import { forcePasswordChange } from "../controllers/forcePasswordController.js";
import { supabaseAuthMiddleware } from "../middleware/auth.js";
import { forcePasswordCheck } from "../middleware/forcePasswordMiddleware.js";

const forcePasswordRoute = express.Router();

// ตรวจสอบก่อนให้เปลี่ยนรหัส
forcePasswordRoute.post(
  "/force-password-change",
  supabaseAuthMiddleware,
  forcePasswordCheck,   
  forcePasswordChange
);

export default forcePasswordRoute;
