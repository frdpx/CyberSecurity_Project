# Quick Start Guide - Supabase Authentication

## 📁 Project Structure
```
backend/
├── config/supabase.js      # Supabase setup
├── controllers/authController.js  # All auth logic
├── middleware/auth.js      # Auth middleware  
├── routes/authRoute.js     # Auth endpoints
└── server.js              # Express server
```

## 🔧 Setup Steps

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables
Add to `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://skcaquhrqnfcypbvogec.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2FxdWhycW5mY3lwYnZvZ2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjY5NDQsImV4cCI6MjA3NDM0Mjk0NH0.hF1DkrY2ywmqNwiVLHB1NI3cyMjKaqE585tMz503Be4
```

### 3. Database Tables (Already exist in Supabase)
- ✅ `auth.users` - Supabase built-in
- ✅ `profiles` - User profiles  
- ✅ `audit_logs` - System logs
- ✅ `login_attempts` - Login tracking

## 🚀 API Endpoints

### Public Routes
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
POST /api/auth/refresh     # Refresh token
```

### Protected Routes (require Bearer token)
```
GET    /api/auth/profile   # Get user profile
PUT    /api/auth/profile   # Update profile
POST   /api/auth/profile   # Create profile
GET    /api/auth/session   # Get session info
POST   /api/auth/signout   # Sign out
```

### Admin Routes (require admin role)
```
GET /api/auth/profiles       # Get all profiles
GET /api/auth/login-attempts # Get login attempts
GET /api/auth/audit-logs     # Get audit logs
```

## 🔐 Security Features

- ✅ **Rate Limiting**: 10 attempts per 5 minutes per IP
- ✅ **Brute Force Protection**: 5 failed attempts = 15 min block
- ✅ **Account Locking**: 5 failed attempts = 30 min lock
- ✅ **Audit Logging**: All actions tracked
- ✅ **Role-based Access**: user/admin/super_admin
- ✅ **JWT Token Verification**: Supabase Auth integration

## 📝 Usage Examples

### Register User
```javascript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

### Login User
```javascript
// POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}
```

### Access Protected Route
```javascript
// Headers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛡️ Middleware Usage

### Apply to specific routes
```javascript
import { supabaseAuthMiddleware, requireRole } from './middleware/auth.js';

// Require authentication
app.use('/api/protected', supabaseAuthMiddleware);

// Require specific role
app.get('/admin', supabaseAuthMiddleware, requireRole(['admin']), handler);

// Optional auth
app.get('/public', optionalAuth, handler);
```

## 📊 Database Integration

The system automatically:
- ✅ Creates user in Supabase Auth
- ✅ Creates profile in `profiles` table
- ✅ Logs all attempts in `login_attempts`
- ✅ Tracks actions in `audit_logs`
- ✅ Manages failed attempts and locks

## 🔄 Authentication Flow

1. **Registration**: Supabase Auth → Create Profile → Log Action
2. **Login**: Check Rate Limit → Verify Credentials → Check Lock → Log Attempt
3. **Protected Access**: Verify Token → Get Profile → Check Lock → Allow/Deny

This implementation provides enterprise-grade security with minimal configuration!