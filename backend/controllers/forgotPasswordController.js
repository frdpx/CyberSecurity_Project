// controllers/passwordController.js
// เวอร์ชัน no-login + บันทึก audit logs (import จาก audit_action.js) + fallback dev link เมื่ออีเมลส่งไม่ออก

import { supabase, supabaseAdmin } from "../config/supabase.js";
import { AuditActions } from "../constant/audit_action.js"; // ← ใช้ชุด action เดิมของคุณ

// เขียนแถว log ด้วย service role (ไม่ติด RLS)
async function insertAuditLog({
  userId = null,
  action,
  success,
  details = {},
  ip = null,
  userAgent = null,
}) {
  try {
    const payload = {
      user_id: userId,
      action,
      resource: "AUTH",
      success,
      details,
      ip,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    };
    await supabaseAdmin.from("audit_logs").insert([payload]);
  } catch (e) {
    console.error("[AUDIT LOG ERROR]", e?.message || e);
  }
}

const RESET_REDIRECT = "http://localhost:5173/reset-password";

/**
 * POST /api/password/forgot-password
 * Body: { user_email: string }
 * ให้ Supabase ส่งอีเมลรีเซ็ต; ถ้าส่งไม่ได้ คืน dev_action_link สำหรับทดสอบชั่วคราว
 */
export const forgotPassword = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const { user_email } = req.body || {};
    if (!user_email) {
      await insertAuditLog({
        action: AuditActions.PASSWORD_RESET_FAILED,
        success: false,
        details: { reason: "missing_email" },
        ip, userAgent,
      });
      return res.status(400).json({ error: "Email is required" });
    }

    // log: requested
    await insertAuditLog({
      action: AuditActions.PASSWORD_RESET_REQUESTED,
      success: true,
      details: { email: user_email },
      ip, userAgent,
    });

    // ให้ Supabase ส่งอีเมลรีเซ็ต
    const { error } = await supabase.auth.resetPasswordForEmail(user_email, {
      redirectTo: RESET_REDIRECT,
    });

    if (error) {
      console.error("[RESET EMAIL ERROR]", {
        name: error.name,
        status: error.status,
        message: error.message,
      });

      if (error.status === 429) {
        await insertAuditLog({
          action: AuditActions.PASSWORD_RESET_RATE_LIMITED,
          success: false,
          details: { email: user_email, message: error.message },
          ip, userAgent,
        });
      }

      // fallback: generate dev link สำหรับทดสอบ (DEV ONLY)
      try {
        const { data: linkData, error: linkErr } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email: user_email,
            options: { redirectTo: RESET_REDIRECT },
          });

        if (!linkErr && linkData?.properties?.action_link) {
          await insertAuditLog({
            action: AuditActions.PASSWORD_RESET_LINK_SENT,
            success: true,
            details: { email: user_email, via: "dev_link" },
            ip, userAgent,
          });

          return res.status(200).json({
            message: "Email service failed; dev link generated.",
            dev_action_link: linkData.properties.action_link,
            note: "เปิดลิงก์นี้ในเบราว์เซอร์เพื่อเข้าสู่หน้าตั้งรหัสผ่าน (เฉพาะ dev)",
          });
        }
      } catch (e) {
        console.error("[GENERATE DEV LINK ERROR]", e?.message || e);
      }

      await insertAuditLog({
        action: AuditActions.PASSWORD_RESET_FAILED,
        success: false,
        details: { email: user_email, error: error.message },
        ip, userAgent,
      });

      return res.status(500).json({ error: "Error sending reset email" });
    }

    await insertAuditLog({
      action: AuditActions.PASSWORD_RESET_LINK_SENT,
      success: true,
      details: { email: user_email, via: "supabase_email_service" },
      ip, userAgent,
    });

    return res.status(200).json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("[FORGOT ERROR]", err?.message || err);
    await insertAuditLog({
      action: AuditActions.PASSWORD_RESET_FAILED,
      success: false,
      details: { error: err?.message || String(err) },
      ip, userAgent,
    });
    return res.status(500).json({ error: "Error sending reset email" });
  }
};

/**
 * POST /api/password/reset-password-email
 * Body: { new_password: string, access_token: string }
 * ใช้เมื่อผู้ใช้เปิดลิงก์จากอีเมลแล้ว frontend ส่ง token + รหัสผ่านใหม่เข้ามา
 */
export const resetPassword_Email = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const { new_password, access_token } = req.body || {};
    if (!new_password || !access_token) {
      await insertAuditLog({
        action: AuditActions.PASSWORD_RESET_FAILED,
        success: false,
        details: { reason: "missing_token_or_password" },
        ip, userAgent,
      });
      return res.status(400).json({ error: "Access token and new password are required" });
    }

    // ตรวจสอบ token (ต้องใช้ client API)
    const { data, error: getUserErr } = await supabase.auth.getUser(access_token);
    if (getUserErr || !data?.user) {
      await insertAuditLog({
        action: AuditActions.PASSWORD_RESET_TOKEN_INVALID,
        success: false,
        details: { error: getUserErr?.message || "invalid_token" },
        ip, userAgent,
      });
      return res.status(400).json({ error: "Invalid access token" });
    }

    const userId = data.user.id;

    await insertAuditLog({
      userId,
      action: AuditActions.PASSWORD_RESET_TOKEN_VERIFIED,
      success: true,
      details: {},
      ip, userAgent,
    });

    // ตั้งรหัสผ่านใหม่ด้วย Service Role
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: new_password }
    );
    if (updErr) {
      await insertAuditLog({
        userId,
        action: AuditActions.PASSWORD_RESET_FAILED,
        success: false,
        details: { error: updErr?.message },
        ip, userAgent,
      });
      return res.status(500).json({ error: "Failed to update password" });
    }

    await insertAuditLog({
      userId,
      action: AuditActions.PASSWORD_RESET_SUCCEEDED,
      success: true,
      details: { method: "admin_api" },
      ip, userAgent,
    });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[RESET EMAIL FLOW ERROR]", err?.message || err);
    await insertAuditLog({
      action: AuditActions.PASSWORD_RESET_FAILED,
      success: false,
      details: { error: err?.message || String(err) },
      ip, userAgent,
    });
    return res.status(500).json({ error: "Error updating password" });
  }
};

/**
 * POST /api/password/reset-password
 * Body: { new_password: string, user_id: string }
 * ใช้กรณีแอดมินเปลี่ยนให้ โดยไม่ต้องมี access_token
 */
export const resetPassword = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const { new_password, user_id } = req.body || {};
    if (!new_password || !user_id) {
      return res.status(400).json({ error: "user_id and new password are required" });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: new_password,
    });
    if (error) {
      await insertAuditLog({
        userId: user_id,
        action: AuditActions.PASSWORD_CHANGE_FAILED,
        success: false,
        details: { error: error?.message },
        ip, userAgent,
      });
      return res.status(500).json({ error: "Failed to update password" });
    }

    await insertAuditLog({
      userId: user_id,
      action: AuditActions.PASSWORD_CHANGED_BY_USER,
      success: true,
      details: {},
      ip, userAgent,
    });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[RESET DIRECT ERROR]", err?.message || err);
    await insertAuditLog({
      action: AuditActions.PASSWORD_CHANGE_FAILED,
      success: false,
      details: { error: err?.message || String(err) },
      ip, userAgent,
    });
    return res.status(500).json({ error: "Error updating password" });
  }
};
