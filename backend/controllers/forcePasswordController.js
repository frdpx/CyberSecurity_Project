import { supabase } from "../config/supabase.js";
import { AuditActions } from "../constant/audit_action.js";

export const forcePasswordChange = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // verify old password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: oldPassword
    });
    if (verifyError) {
      return res.status(400).json({ success: false, message: "Old password incorrect" });
    }

    // update new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    // update profiles.password_changed_at
    await supabase
      .from("profiles")
      .update({ password_changed_at: new Date().toISOString() })
      .eq("user_id", userId);

    // บันทึก Audit Log
    await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action: AuditActions.PASSWORD_CHANGED_BY_USER,
        description: "User changed password successfully",
        created_at: new Date().toISOString()
      }
    ]);

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
