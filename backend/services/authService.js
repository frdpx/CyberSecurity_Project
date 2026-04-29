import { supabase, supabaseAdmin } from "../config/supabase.js";

// ===== DATABASE HELPER FUNCTIONS =====

// Helper function สำหรับ get user profile
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error(error.message);
    }

    return { profile: data || null, error: null };
  } catch (error) {
    return { profile: null, error: error.message };
  }
};

// Helper function สำหรับ update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error: error.message };
  }
};

// Helper function สำหรับสร้าง user profile
export const createUserProfile = async (user, additionalData = {}) => {
  try {
    // เอา display_name และ role ออกจาก additionalData เพื่อป้องกันการ override
    const { display_name, role } = additionalData;

    const profileData = {
      user_id: user.id,
      display_name: display_name,
      role: role || "user", // default role
      created_at: new Date().toISOString()
    };
    // ใช้ supabaseAdmin เพื่อข้าม RLS policy
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error("Direct insert failed:", error);
      throw new Error(error.message);
    }
    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error: error.message };
  }
};

// ===== SECURITY HELPER FUNCTIONS =====

// Helper function สำหรับเช็คการพยายาม login ที่ล้มเหลว
export const checkFailedLoginAttempts = async (
  email,
  timeWindowMinutes = 15,
  maxAttempts = 5
) => {
  try {
    const timeThreshold = new Date(
      Date.now() - timeWindowMinutes * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("email_tried", email)
      .eq("success", false)
      .gte("created_at", timeThreshold)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      isBlocked: data.length >= maxAttempts,
      attemptCount: data.length,
      maxAttempts: maxAttempts,
      timeWindow: timeWindowMinutes,
      error: null
    };
  } catch (error) {
    return {
      isBlocked: false,
      attemptCount: 0,
      maxAttempts,
      timeWindow: timeWindowMinutes,
      error: error.message
    };
  }
};

// Helper function สำหรับอัพเดท failed attempts
export const updateFailedAttempts = async (userId, increment = true) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("failed_attempts")
      .eq("user_id", userId)
      .single();

    const currentAttempts = profile?.failed_attempts || 0;
    const newAttempts = increment ? currentAttempts + 1 : 0;

    // Lock account if too many attempts (5 attempts = 30 minutes lock)
    let updateData = { failed_attempts: newAttempts };

    if (newAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      updateData.lock_until = lockUntil.toISOString();
    } else if (!increment) {
      // Reset lock when successful login
      updateData.lock_until = null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update failed attempts:", error);
      return { profile: null, error: error.message };
    }

    return { profile: data, error: null };
  } catch (error) {
    console.error("Failed to update failed attempts:", error);
    return { profile: null, error: error.message };
  }
};

// Helper function สำหรับเช็ค rate limiting ตาม IP
export const checkRateLimit = async (
  ip,
  action,
  timeWindowMinutes = 5,
  maxAttempts = 10
) => {
  try {
    const timeThreshold = new Date(
      Date.now() - timeWindowMinutes * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("ip", ip)
      .eq("action", action)
      .gte("created_at", timeThreshold)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Rate limit check error:", error);
      return { isBlocked: false, attemptCount: 0, error: error.message };
    }

    return {
      isBlocked: data.length >= maxAttempts,
      attemptCount: data.length,
      maxAttempts: maxAttempts,
      timeWindow: timeWindowMinutes,
      error: null
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return {
      isBlocked: false,
      attemptCount: 0,
      maxAttempts,
      timeWindow: timeWindowMinutes,
      error: error.message
    };
  }
};
