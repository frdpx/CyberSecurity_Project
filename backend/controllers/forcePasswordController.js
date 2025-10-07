import { supabase, supabaseAdmin } from "../config/supabase.js";
import { AuditActions } from "../constant/audit_action.js";

// helper สำหรับบันทึก audit log
async function insertAuditLog({ userId = null, action, success, details = {}, ip = null, userAgent = null }) {
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

// ตรวจสอบรหัสผ่านหมดอายุ
export const checkForcePassword = async (req, res) => {
  const userId = req.user.id;
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("created_at, password_changed_at")
      .eq("user_id", userId)
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });

    const lastChange = profile.password_changed_at || profile.created_at;
    const diffDays = Math.floor((new Date() - new Date(lastChange)) / (1000 * 60 * 60 * 24));

    if (diffDays >= 90) {
      await insertAuditLog({
        userId,
        action: AuditActions.PASSWORD_EXPIRED,
        success: false,
        details: { days_since_change: diffDays },
        ip,
        userAgent,
      });
      return res.json({ success: false, code: "PASSWORD_EXPIRED", message: "Password expired. Please change your password." });
    }

    return res.json({ success: true, message: "Password still valid" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// เปลี่ยนรหัสผ่านบังคับ
export const forcePasswordChange = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const userId = req.user.id;

  try {
    const { oldPassword, newPassword } = req.body;

    // verify old password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: oldPassword
    });
    if (verifyError) {
      await insertAuditLog({ userId, action: AuditActions.PASSWORD_CHANGE_FAILED, success: false, details: { reason: "old_password_incorrect" }, ip, userAgent });
      return res.status(400).json({ success: false, message: "Old password incorrect" });
    }

    // update new password
    const { error: updError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (updError) {
      await insertAuditLog({ userId, action: AuditActions.PASSWORD_CHANGE_FAILED, success: false, details: { error: updError.message }, ip, userAgent });
      return res.status(400).json({ success: false, message: updError.message });
    }

    // update profiles.password_changed_at
    await supabaseAdmin.from("profiles").update({ password_changed_at: new Date().toISOString() }).eq("user_id", userId);

    // เพิ่มรายละเอียดใน log
    const details = {
      changed_at: new Date().toISOString(),
      password_length: newPassword.length
    };

    await insertAuditLog({ userId, action: AuditActions.PASSWORD_CHANGED_BY_USER, success: true, details, ip, userAgent });
    return res.json({ success: true, message: "Password changed successfully" });

  } catch (err) {
    await insertAuditLog({ userId, action: AuditActions.PASSWORD_CHANGE_FAILED, success: false, details: { error: err.message }, ip, userAgent });
    return res.status(500).json({ success: false, message: err.message });
  }
};
