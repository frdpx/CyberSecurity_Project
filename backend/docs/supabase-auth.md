# Supabase Authentication Setup

## Project Structure

```
backend/
├── config/
│   └── supabase.js          # Supabase client configuration only
├── controllers/
│   └── authController.js    # All authentication logic & helper functions
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   └── authRoute.js        # Authentication routes
└── server.js               # Main server file
```

## การตั้งค่า Supabase

### 1. Environment Variables
เพิ่มตัวแปรเหล่านี้ในไฟล์ `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://skcaquhrqnfcypbvogec.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2FxdWhycW5mY3lwYnZvZ2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjY5NDQsImV4cCI6MjA3NDM0Mjk0NH0.hF1DkrY2ywmqNwiVLHB1NI3cyMjKaqE585tMz503Be4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
REQUIRE_EMAIL_CONFIRMATION=false
```

### 2. Database Schema
ระบบใช้ตารางที่มีอยู่แล้ว:
- `auth.users` (Supabase built-in) - User authentication
- `profiles` - ข้อมูล user profiles
- `audit_logs` - log การดำเนินการ
- `login_attempts` - log การพยายาม login

### 3. Install Dependencies
```bash
npm install @supabase/supabase-js
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Public Routes
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/refresh` - Refresh access token

#### Protected Routes (ต้องมี Authorization header)
- `GET /api/auth/profile` - ดึงข้อมูล profile ของ user ปัจจุบัน
- `PUT /api/auth/profile` - อัพเดท profile
- `POST /api/auth/profile` - สร้าง profile (หลังจาก signup)
- `GET /api/auth/session` - ดึงข้อมูล session ปัจจุบัน
- `POST /api/auth/signout` - Sign out

#### Admin Routes (ต้องมี role admin หรือ super_admin)
- `GET /api/auth/profiles` - ดึงข้อมูล profiles ทั้งหมด (พร้อม pagination)
- `GET /api/auth/login-attempts` - ดู login attempts logs
- `GET /api/auth/audit-logs` - ดู audit logs

## การใช้งาน Middleware

### 1. Supabase Auth Middleware
```javascript
import { supabaseAuthMiddleware } from '../middleware/auth.js';

// ใช้กับ routes ที่ต้องการ authentication
app.use('/api/protected', supabaseAuthMiddleware);
```

### 2. Role-based Access Control
```javascript
import { requireRole } from '../middleware/auth.js';

// เฉพาะ admin เท่านั้น
app.get('/api/admin', supabaseAuthMiddleware, requireRole(['admin']), handler);

// admin หรือ super_admin
app.get('/api/admin/users', supabaseAuthMiddleware, requireRole(['admin', 'super_admin']), handler);
```

### 3. Optional Authentication
```javascript
import { optionalAuth } from '../middleware/auth.js';

// routes ที่ไม่จำเป็นต้อง login แต่ถ้า login จะได้ข้อมูล user
app.get('/api/public', optionalAuth, handler);
```

## Client-side Usage

### 1. การส่ง Token
ส่ง token ใน Authorization header:
```javascript
const token = 'your_supabase_access_token';

fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. Error Handling
API จะส่ง error codes ที่เฉพาะเจาะจง:

```javascript
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

Error codes:
- `MISSING_TOKEN` - ไม่มี token
- `TOKEN_EXPIRED` - token หมดอายุ
- `INVALID_TOKEN` - token ไม่ถูกต้อง
- `AUTH_FAILED` - authentication ล้มเหลว
- `EMAIL_NOT_CONFIRMED` - email ยังไม่ได้ confirm
- `INSUFFICIENT_PERMISSIONS` - ไม่มีสิทธิ์เพียงพอ
- `SERVICE_UNAVAILABLE` - service ไม่พร้อมใช้งาน

## Database Schema

### Profiles Table
```sql
- user_id (uuid, references auth.users)
- created_at (timestamptz)
- display_name (text)
- role (text)
- password_changed_at (timestamptz)
- failed_attempts (int8)
- lock_until (timestamptz)
```

### Login Attempts Table
```sql
- id (uuid, primary key)
- created_at (timestamptz)
- user_id (uuid)
- email_tried (text)
- success (boolean)
- reason (text)
```

### Audit Logs Table
```sql
- id (uuid, primary key)
- created_at (timestamptz)
- user_id (uuid)
- action (text)
- resource (text)
- success (boolean)
- ip (text)
- user_agent (text)
- details (jsonb)
```

## Security Features

### 1. Login Attempt Limiting
- ระบบจะบล็อค login หลังจากพยายาม login ล้มเหลว 5 ครั้งใน 15 นาที
- Log ทุกการพยายาม login ใน `login_attempts` table

### 2. Audit Logging
- บันทึกทุกการดำเนินการสำคัญใน `audit_logs` table
- รวม IP address และ User Agent
- Track authentication, authorization, และการเข้าถึงข้อมูล

### 3. Account Locking
- Support การ lock account ชั่วคราวผ่าน `lock_until` field ใน profiles
- ป้องกันการเข้าถึงแม้จะมี valid token

### 4. Role-based Access Control
- Support multiple roles: user, admin, super_admin
- Fine-grained permission control

## Example Usage

### Login Request
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Using Protected Endpoint
```javascript
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Migration from JWT

หากต้องการใช้ทั้ง JWT และ Supabase พร้อมกัน สามารถใช้ middleware เดิม (`authMiddleware`) ร่วมกับ middleware ใหม่ได้

```javascript
// สำหรับ routes ที่ยังใช้ JWT
app.use('/api/legacy', authMiddleware);

// สำหรับ routes ใหม่ที่ใช้ Supabase
app.use('/api/auth', supabaseAuthMiddleware);
```