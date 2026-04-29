import { supabase, supabaseAdmin } from "../config/supabase.js";

// ===== LOGGING HELPER FUNCTIONS =====

// Helper function สำหรับ log การดำเนินการ
export const createAuditLog = async (
  userId,
  action,
  resource,
  success,
  details = {},
  ip = null,
  userAgent = null
) => {
  try {
    const logData = {
      user_id: userId,
      action: action,
      resource: resource,
      success: success,
      ip: ip,
      user_agent: userAgent,
      details: details,
      created_at: new Date().toISOString()
    };

    console.log("⚡ createAuditLog called:", logData);

    const { data, error } = await supabase
      .from("audit_logs")
      .insert([logData])
      .select()
      .single();

    if (error) {
      console.error("Audit log error:", error);
      return { log: null, error: error.message };
    }

    return { log: data, error: null };
  } catch (error) {
    console.error("Audit log error:", error);
    return { log: null, error: error.message };
  }
};

// Helper function สำหรับ log การพยายาม login
export const createLoginAttempt = async (
  userId,
  emailTried,
  success,
  reason,
  ip = null
) => {
  try {
    const attemptData = {
      user_id: userId,
      email_tried: emailTried,
      success: success,
      reason: reason
      // created_at: new Date().toISOString(),
    };

    console.log("⚡ createLoginAttempt called:", attemptData);

    const { data, error } = await supabaseAdmin
      .from("login_attempts")
      .insert([attemptData])
      .select()
      .single();

    if (error) {
      console.error("Login attempt log error:", error);
      return { attempt: null, error: error.message };
    }

    return { attempt: data, error: null };
  } catch (error) {
    console.error("Login attempt log error:", error);
    return { attempt: null, error: error.message };
  }
};
