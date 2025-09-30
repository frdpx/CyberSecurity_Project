// routes/passwordRoute.js
import express from "express";
import {
  forgotPassword,
  resetPassword_Email,
  resetPassword,
} from "../controllers/forgotPasswordController.js";

const router = express.Router();

// route ขออีเมล reset
router.post("/forgot-password", forgotPassword);

// route ตั้งรหัสผ่านใหม่ (ใช้ access_token จากอีเมล)
router.post("/reset-password-email", resetPassword_Email);

// route แอดมินเปลี่ยนรหัส (ใช้ user_id โดยตรง)
router.post("/reset-password", resetPassword);

export default router;
