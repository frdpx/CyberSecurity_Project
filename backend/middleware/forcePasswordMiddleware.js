import { supabaseAdmin } from "../config/supabase.js";
import { AuditActions } from "../constant/audit_action.js";

export const forcePasswordCheck = async (req, res, next) => {
  const profile = req.user?.profile;
  if (!profile) return next();

  const lastChange = profile.password_changed_at ? new Date(profile.password_changed_at) : new Date(profile.created_at);
  const diffDays = Math.floor((new Date() - lastChange) / (1000 * 60 * 60 * 24));

  if (diffDays > 90) {
    // log ลง audit_logs ด้วย service role
    try {
      await supabaseAdmin.from("audit_logs").insert([{
        user_id: req.user.id,
        action: AuditActions.PASSWORD_EXPIRED,
        resource: "AUTH",
        success: false,
        details: { days_since_change: diffDays },
        created_at: new Date().toISOString(),
      }]);
    } catch (e) {
      console.error("[AUDIT LOG ERROR]", e?.message || e);
    }

    return res.status(403).json({
      success: false,
      message: "Password expired. Please change your password.",
      code: "PASSWORD_EXPIRED"
    });
  }

  next();
};
