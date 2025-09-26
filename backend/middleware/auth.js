import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { 
  verifySupabaseToken, 
  supabase
} from "../config/supabase.js";

// Helper functions สำหรับ middleware
const createAuditLog = async (userId, action, resource, success, details = {}, ip = null, userAgent = null) => {
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
    }
    
    await supabase
      .from('audit_logs')
      .insert([logData])
  } catch (error) {
    console.error('Audit log error:', error)
  }
}

const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }
    
    return { profile: data || null, error: null }
  } catch (error) {
    return { profile: null, error: error.message }
  }
}

// Legacy JWT middleware (สำหรับ backward compatibility)
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    req.user = user;
    // console.log("Authenticated user:", req.user);

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Supabase authentication middleware
export const supabaseAuthMiddleware = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];
  
  try {
    // รับ token จาก Authorization header (Bearer token format)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // Log failed attempt
      await createAuditLog(null, 'AUTH_ATTEMPT', 'API', false, { reason: 'missing_token' }, ip, userAgent);
      
      return res.status(401).json({ 
        success: false, 
        message: "Access token required",
        code: "MISSING_TOKEN"
      });
    }

    // Verify token ด้วย Supabase
    const { user, error } = await verifySupabaseToken(token);
    
    if (error || !user) {
      // Log failed authentication attempt
      await createAuditLog(null, 'AUTH_FAILED', 'API', false, { reason: error }, ip, userAgent);
      
      // Handle Supabase specific errors
      if (error && error.includes('JWT expired')) {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          code: "TOKEN_EXPIRED"
        });
      }
      
      if (error && error.includes('Invalid JWT')) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
          code: "INVALID_TOKEN"
        });
      }
      
      return res.status(403).json({
        success: false,
        message: "Authentication failed",
        code: "AUTH_FAILED",
        error: error
      });
    }

    // เช็คว่า user ยังคง active หรือไม่
    if (!user.email_confirmed_at && process.env.REQUIRE_EMAIL_CONFIRMATION === 'true') {
      await createAuditLog(user.id, 'AUTH_FAILED', 'API', false, { reason: 'email_not_confirmed' }, ip, userAgent);
      
      return res.status(403).json({
        success: false,
        message: "Email not confirmed",
        code: "EMAIL_NOT_CONFIRMED"
      });
    }

    // ดึง user profile จาก Supabase (ถ้ามี)
    const { profile, error: profileError } = await getUserProfile(user.id);
    
    // เช็คว่า profile ถูก lock หรือไม่
    if (profile && profile.lock_until && new Date(profile.lock_until) > new Date()) {
      await createAuditLog(user.id, 'AUTH_BLOCKED', 'API', false, { reason: 'account_locked', lock_until: profile.lock_until }, ip, userAgent);
      
      return res.status(403).json({
        success: false,
        message: "Account temporarily locked",
        code: "ACCOUNT_LOCKED",
        lock_until: profile.lock_until
      });
    }
    
    // Log successful authentication
    await createAuditLog(user.id, 'AUTH_SUCCESS', 'API', true, { profile_exists: !!profile }, ip, userAgent);
    
    // เพิ่ม user และ profile ข้อมูลใน request
    req.user = user;
    req.profile = profile;
    req.token = token;
    req.clientIp = ip;
    req.userAgent = userAgent;

    next();
  } catch (err) {
    console.error('Supabase auth middleware error:', err);
    
    // Log internal error
    await createAuditLog(null, 'AUTH_ERROR', 'API', false, { error: err.message }, ip, userAgent);
    
    // Handle different types of errors
    if (err.message.includes('Network')) {
      return res.status(503).json({
        success: false,
        message: "Authentication service unavailable",
        code: "SERVICE_UNAVAILABLE"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal authentication error",
      code: "INTERNAL_ERROR"
    });
  }
};

// Middleware สำหรับเช็ค role/permissions
export const requireRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const userRole = req.profile?.role || req.user.user_metadata?.role || 'user';
      
      if (roles.length > 0 && !roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS",
          required_role: roles,
          user_role: userRole
        });
      }

      next();
    } catch (err) {
      console.error('Role check error:', err);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
        code: "PERMISSION_ERROR"
      });
    }
  };
};

// Optional middleware สำหรับ routes ที่ไม่จำเป็นต้อง login
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { user, error } = await verifySupabaseToken(token);
      if (user && !error) {
        req.user = user;
        const { profile } = await getUserProfile(user.id);
        req.profile = profile;
      }
    }
    
    next();
  } catch (err) {
    // ไม่ return error เพราะเป็น optional
    next();
  }
};
