import { supabase } from "../config/supabase.js";
import { AuditActions } from "../constant/audit_action.js";

export const forcePasswordCheck = async (req, res, next) => {
  const profile = req.user?.profile;
  if (!profile) return next();

  // ถ้าไม่เคยเปลี่ยนรหัส ใช้ created_at แทน
  const lastChange = profile.password_changed_at 
    ? new Date(profile.password_changed_at) 
    : new Date(profile.created_at);

  const now = new Date();
  const diffDays = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));

  if (diffDays > 90) {
    // log ลง audit_logs
    await supabase.from("audit_logs").insert({
      user_id: req.user.id,
      action: AuditActions.PASSWORD_EXPIRED,
      created_at: new Date().toISOString(),
      metadata: { days_since_change: diffDays }
    });

    return res.status(403).json({
      success: false,
      message: "Password expired. Please change your password.",
      code: "PASSWORD_EXPIRED"
    });
  }

  next();
};
