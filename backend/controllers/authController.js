import { supabase, supabaseAdmin } from "../config/supabase.js";

// ===== DATABASE HELPER FUNCTIONS =====

// Helper function สำหรับ get user profile
const getUserProfile = async (userId) => {
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
const updateUserProfile = async (userId, profileData) => {
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
const createUserProfile = async (user, additionalData = {}) => {
  try {
    // เอา display_name และ role ออกจาก additionalData เพื่อป้องกันการ override
    const { display_name, role } = additionalData;

    const profileData = {
      user_id: user.id,
      display_name: display_name,
      role: role || "user", // default role
      created_at: new Date().toISOString(),
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

// ===== LOGGING HELPER FUNCTIONS =====

// Helper function สำหรับ log การดำเนินการ
const createAuditLog = async (
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
      created_at: new Date().toISOString(),
    };

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
const createLoginAttempt = async (
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
      reason: reason,
      created_at: new Date().toISOString(),
    };

    console.log("⚡ createLoginAttempt called:", {
      userId,
      emailTried,
      success,
      reason,
    });

    const { data, error } = await supabase
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

// ===== SECURITY HELPER FUNCTIONS =====

// Helper function สำหรับเช็คการพยายาม login ที่ล้มเหลว
const checkFailedLoginAttempts = async (
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
      error: null,
    };
  } catch (error) {
    return {
      isBlocked: false,
      attemptCount: 0,
      maxAttempts,
      timeWindow: timeWindowMinutes,
      error: error.message,
    };
  }
};

// Helper function สำหรับอัพเดท failed attempts
const updateFailedAttempts = async (userId, increment = true) => {
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
const checkRateLimit = async (
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
      error: null,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return {
      isBlocked: false,
      attemptCount: 0,
      maxAttempts,
      timeWindow: timeWindowMinutes,
      error: error.message,
    };
  }
};

// ===== CONTROLLER FUNCTIONS =====

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { profile, error } = await getUserProfile(userId);

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
        error: error,
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: err.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.email;
    delete updateData.created_at;

    const { profile, error } = await updateUserProfile(userId, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to update profile",
        error: error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

// Get user session info
export const getSession = async (req, res) => {
  try {
    const token = req.token;

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Failed to get session",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        profile: req.profile,
        session: session,
      },
    });
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get session",
      error: err.message,
    });
  }
};

// Sign out user (invalidate token)
export const signOut = async (req, res) => {
  try {
    const token = req.token;

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut(token);

    if (error) {
      console.error("Supabase signout error:", error);
      // อาจจะไม่ return error เพราะ client ควร handle token removal อยู่แล้ว
    }

    res.status(200).json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (err) {
    console.error("Sign out error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to sign out",
      error: err.message,
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Failed to refresh token",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token",
      error: err.message,
    });
  }
};

// Admin: Get all user profiles (requires admin role)
export const getAllProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to get profiles",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("Get all profiles error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get profiles",
      error: err.message,
    });
  }
};

// Login with email/password (server-side login)
export const login = async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      await createLoginAttempt(null, email, false, "NOT_FOUND", ip);
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // Rate limit check
    const { isBlocked: ipBlocked } = await checkRateLimit(
      ip,
      "LOGIN_ATTEMPT",
      5,
      10
    );
    if (ipBlocked) {
      await createLoginAttempt(null, email, false, "LOCKED", ip);
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Try again later.",
        code: "RATE_LIMITED",
      });
    }

    // Failed attempts check
    const { isBlocked, attemptCount, timeWindow } =
      await checkFailedLoginAttempts(email);
    if (isBlocked) {
      await createLoginAttempt(null, email, false, "LOCKED", ip);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again after ${timeWindow} minutes.`,
        code: "EMAIL_BLOCKED",
      });
    }

    // Supabase login
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      await createLoginAttempt(null, email, false, "WRONG_PASSWORD", ip);
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
        code: "LOGIN_FAILED",
      });
    }

    if (!authData.user) {
      await createLoginAttempt(null, email, false, "NOT_FOUND", ip);
      return res.status(401).json({
        success: false,
        message: "Login failed",
      });
    }

    // Account locked?
    const { profile } = await getUserProfile(authData.user.id);
    if (profile?.lock_until && new Date(profile.lock_until) > new Date()) {
      await createLoginAttempt(authData.user.id, email, false, "LOCKED", ip);
      return res.status(403).json({
        success: false,
        message: "Account locked",
        code: "ACCOUNT_LOCKED",
        lock_until: profile.lock_until,
      });
    }

    // Success login
    await updateFailedAttempts(authData.user.id, false);
    await createLoginAttempt(authData.user.id, email, true, "MFA_REQUIRED", ip); // 👈 ใช้ MFA_REQUIRED เป็น placeholder สำหรับ success

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: authData.user,
        profile,
        session: authData.session,
        access_token: authData.session?.access_token || null,
        refresh_token: authData.session?.refresh_token || null,
        expires_at: authData.session?.expires_at || null,
      },
    });
  } catch (err) {
    await createLoginAttempt(null, email, false, "NOT_FOUND", ip);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
};
// Register new user
export const register = async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const { email, password, full_name, display_name, role = "user" } = req.body;

  try {
    if (!email || !password || !display_name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and display name are required",
      });
    }

    // ขั้นตอน 1: สร้าง user ใน Supabase Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: full_name || "",
          display_name: display_name || "",
        },
      },
    });

    if (authError) {
      console.error("Registration failed:", authError);
      await createAuditLog(
        null,
        "REGISTER_FAILED",
        "API",
        false,
        { email, reason: authError.message },
        ip,
        userAgent
      );

      return res.status(400).json({
        success: false,
        message: authError.message,
        code: "REGISTER_FAILED",
      });
    }

    if (!authData.user) {
      await createAuditLog(
        null,
        "REGISTER_FAILED",
        "API",
        false,
        { email, reason: "No user created" },
        ip,
        userAgent
      );

      return res.status(400).json({
        success: false,
        message: "Failed to create user account",
        code: "USER_CREATION_FAILED",
      });
    }

    // ขั้นตอน 2: สร้าง profile ในตาราง profiles
    const { profile, error: profileError } = await createUserProfile(
      authData.user,
      {
        role: role,
        display_name:
          display_name || full_name || authData.user.email?.split("@")[0] || "",
      }
    );

    if (profileError) {
      console.error("Profile creation failed:", profileError);
      // Log warning but don't fail the registration
      await createAuditLog(
        authData.user.id,
        "PROFILE_CREATION_FAILED",
        "API",
        false,
        { email, error: profileError },
        ip,
        userAgent
      );
    }

    // Log successful registration
    await createAuditLog(
      authData.user.id,
      "REGISTER_SUCCESS",
      "API",
      true,
      {
        email,
        has_profile: !!profile,
        profile_error: profileError,
      },
      ip,
      userAgent
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: authData.user,
        session: authData.session,
        profile: profile,
        profile_created: !!profile,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);

    await createAuditLog(
      null,
      "REGISTER_ERROR",
      "API",
      false,
      { email, error: err.message },
      ip,
      userAgent
    );

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: err.message,
    });
  }
};

// Get login attempts for user (admin only)
export const getLoginAttempts = async (req, res) => {
  try {
    const { email, user_id, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("login_attempts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (email) {
      query = query.eq("email_tried", email);
    }

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to get login attempts",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("Get login attempts error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get login attempts",
      error: err.message,
    });
  }
};

// Get audit logs (admin only)
export const getAuditLogs = async (req, res) => {
  try {
    const { user_id, action, resource, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    if (action) {
      query = query.eq("action", action);
    }

    if (resource) {
      query = query.eq("resource", resource);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to get audit logs",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get audit logs",
      error: err.message,
    });
  }
};

export default {
  getProfile,
  updateProfile,
  getSession,
  signOut,
  refreshToken,
  getAllProfiles,
  login,
  register,
  getLoginAttempts,
  getAuditLogs,
};
