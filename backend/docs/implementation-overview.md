# Supabase Authentication Implementation

## Project Structure

```
backend/
├── config/
│   └── supabase.js          # Supabase client configuration only
├── controllers/
│   └── authController.js    # All authentication logic
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   └── authRoute.js        # Authentication routes
├── utils/
│   └── authUtils.js        # Shared authentication utilities
└── docs/
    ├── supabase-auth.md    # API documentation
    └── frontend-integration.js # Frontend examples
```

## Implementation Overview

### 1. Configuration (`config/supabase.js`)
- Supabase client setup สำหรับ public operations
- Supabase admin client สำหรับ server-side operations  
- Token verification helper

### 2. Authentication Utilities (`utils/authUtils.js`)
- `getUserProfile()` - ดึงข้อมูล user profile จาก database
- `updateUserProfile()` - อัพเดท user profile
- `createUserProfile()` - สร้าง user profile ใหม่
- `createAuditLog()` - บันทึก audit logs
- `createLoginAttempt()` - บันทึกการพยายาม login
- `checkFailedLoginAttempts()` - เช็คการพยายาม login ที่ล้มเหลว
- `updateFailedAttempts()` - อัพเดท failed attempts counter
- `checkRateLimit()` - เช็ค rate limiting ตาม IP

### 3. Authentication Controller (`controllers/authController.js`)
#### Public Endpoints:
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก  
- `POST /api/auth/refresh` - Refresh token

#### Protected Endpoints:
- `GET /api/auth/profile` - ดูข้อมูล profile
- `PUT /api/auth/profile` - แก้ไขข้อมูล profile
- `POST /api/auth/profile` - สร้าง profile (ถ้ายังไม่มี)
- `GET /api/auth/session` - ดูข้อมูล session
- `POST /api/auth/signout` - ออกจากระบบ

#### Admin Endpoints:
- `GET /api/auth/profiles` - ดู profiles ทั้งหมด
- `GET /api/auth/login-attempts` - ดู login attempts logs
- `GET /api/auth/audit-logs` - ดู audit logs

### 4. Authentication Middleware (`middleware/auth.js`)
- `authMiddleware` - Legacy JWT authentication (backward compatibility)
- `supabaseAuthMiddleware` - Supabase token authentication
- `requireRole()` - Role-based access control
- `optionalAuth` - Optional authentication for public endpoints

## Security Features

### 1. Multi-layer Authentication
- Supabase built-in authentication
- Custom profile management
- JWT token verification

### 2. Brute Force Protection
- Email-based login attempt limiting (5 attempts in 15 minutes)
- IP-based rate limiting (10 attempts in 5 minutes)
- Account locking mechanism (30 minutes lock after 5 failed attempts)

### 3. Comprehensive Logging
- All authentication attempts logged in `login_attempts` table
- All system operations logged in `audit_logs` table
- IP address and User Agent tracking

### 4. Role-based Access Control
- User roles: `user`, `admin`, `super_admin`
- Route-level permission checking
- Fine-grained access control

## Database Schema Integration

The system uses existing Supabase tables:

### `auth.users` (Supabase built-in)
- User authentication data
- Email, password hashes
- User metadata

### `profiles`
- `user_id` (uuid) - References auth.users.id
- `display_name` (text) - User display name
- `role` (text) - User role
- `created_at` (timestamptz) - Profile creation time
- `password_changed_at` (timestamptz) - Last password change
- `failed_attempts` (int8) - Failed login attempts count
- `lock_until` (timestamptz) - Account lock expiration

### `login_attempts`
- `id` (uuid) - Primary key
- `user_id` (uuid) - User attempting login
- `email_tried` (text) - Email used in attempt
- `success` (boolean) - Whether attempt was successful
- `reason` (text) - Failure reason or success message
- `created_at` (timestamptz) - Attempt timestamp

### `audit_logs`
- `id` (uuid) - Primary key
- `user_id` (uuid) - User performing action
- `action` (text) - Action type (LOGIN_SUCCESS, PROFILE_UPDATE, etc.)
- `resource` (text) - Resource being accessed
- `success` (boolean) - Whether action succeeded
- `ip` (text) - Client IP address
- `user_agent` (text) - Client User Agent
- `details` (jsonb) - Additional action details
- `created_at` (timestamptz) - Action timestamp

## Usage Flow

### Registration Process:
1. User submits email/password to `/api/auth/register`
2. System creates user in Supabase Auth
3. System automatically creates profile in `profiles` table
4. System logs the registration in `audit_logs`
5. Returns user data, session, and profile information

### Login Process:
1. User submits email/password to `/api/auth/login`
2. System checks IP-based rate limiting
3. System checks email-based login attempt limiting
4. System verifies credentials with Supabase Auth
5. System checks if account is locked
6. System resets failed attempts on success
7. System logs attempt in `login_attempts` and `audit_logs`
8. Returns user data, session, and profile information

### Protected Route Access:
1. Client sends request with `Authorization: Bearer <token>` header
2. Middleware verifies token with Supabase
3. Middleware fetches user profile
4. Middleware checks account lock status
5. Middleware adds user data to request object
6. Route handler processes request with authenticated user context

This implementation provides enterprise-grade security with comprehensive logging, rate limiting, and role-based access control while leveraging Supabase's robust authentication infrastructure.