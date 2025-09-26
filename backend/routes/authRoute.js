import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  getSession, 
  signOut, 
  refreshToken,
  getAllProfiles,
  login,
  register,
  getLoginAttempts,
  getAuditLogs
} from '../controllers/authController.js';
import { supabaseAuthMiddleware, requireRole } from '../middleware/auth.js';

const authRoute = express.Router();

// Public routes
authRoute.post('/login', login);
authRoute.post('/register', register);
authRoute.post('/refresh', refreshToken);

// Protected routes (require authentication)
authRoute.use(supabaseAuthMiddleware); // Apply auth middleware to all routes below

authRoute.get('/profile', getProfile);
authRoute.put('/profile', updateProfile);
authRoute.get('/session', getSession);
authRoute.post('/signout', signOut);

// Admin only routes
authRoute.get('/profiles', requireRole(['admin', 'super_admin']), getAllProfiles);
authRoute.get('/login-attempts', requireRole(['admin', 'super_admin']), getLoginAttempts);
authRoute.get('/audit-logs', requireRole(['admin', 'super_admin']), getAuditLogs);

export default authRoute;