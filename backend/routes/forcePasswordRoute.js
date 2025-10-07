import express from "express";
import { supabaseAuthMiddleware } from "../middleware/auth.js";
import { forcePasswordChange, checkForcePassword } from "../controllers/forcePasswordController.js";

const router = express.Router();

// ตรวจสอบรหัสผ่านหมดอายุ
router.get("/check-expiration", supabaseAuthMiddleware, checkForcePassword);

// เปลี่ยนรหัสผ่านบังคับ
router.post("/force-password-change", supabaseAuthMiddleware, forcePasswordChange);

export default router;
