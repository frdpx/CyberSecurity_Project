# 🔐 Food Delivery - Cyber Security Project

โปรเจกต์เว็บแอปพลิเคชันสั่งอาหารที่เน้นความปลอดภัย (Cyber Security) และการเขียนโค้ดที่สะอาด (Clean Code) 

## 👩‍💻 สมาชิกทีม
1. 🧑‍💻 **6530300163** — นางสาวณัฐฐา นามเมือง  
2. 💻 **6530300368** — นางสาวพิมลนาฎ หัตถกอง  
3. 🧑‍💻 **6530300686** — นางสาวอิสราภรณ์ นิลประดับ  
4. 💻 **6530300783** — นางสาวญานิศา คงหาญ  
5. 🧑‍💻 **6530300953** — นางสาวฟาริดา ภักดีชาติ  
6. 💻 **6530300996** — นางสาววชิราภรณ์ เบิกบาน

---

## ✨ ฟีเจอร์เด่นด้านความปลอดภัย
*   **Authentication & Authorization**: ระบบ Login/Register ด้วย JWT (JSON Web Token)
*   **Password Security**: แฮชรหัสผ่านด้วย bcrypt และมีระบบบังคับเปลี่ยนรหัสผ่านเมื่อหมดอายุ (Force Password Change)
*   **Brute-Force Protection**: ระบบ Lock Account ชั่วคราวเมื่อกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด
*   **Session Management**: ระบบ Refresh Token เพื่อความปลอดภัยของ Session
*   **Input Validation**: ตรวจสอบข้อมูลนำเข้าทุกจุดทั้ง Frontend และ Backend
*   **Audit Logging**: บันทึกเหตุการณ์สำคัญที่เกิดขึ้นในระบบเพื่อการตรวจสอบ

## 🛠️ เทคโนโลยีที่ใช้
*   **Frontend**: React.js, Vite, Axios (Centralized Instance)
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose)
*   **Security**: JWT, bcrypt, Validator, Rate-limiting
*   **Design**: Vanilla CSS (Custom Design System with Variables)

## 📁 โครงสร้างโปรเจกต์ (Clean Architecture)
*   `backend/services/`: แยก Business Logic และการจัดการ Database ออกจาก Controller
*   `frontend/src/utils/axiosInstance.js`: ศูนย์กลางการเรียก API พร้อมแนบ Token อัตโนมัติ
*   `frontend/src/context/`: จัดการ Global State และ Session Refresh
*   `frontend/src/pages/`: แยกหน้าต่างๆ ออกเป็นโมดูลชัดเจน

## 🚀 วิธีการติดตั้งและรันโปรเจกต์

### 1. เตรียมความพร้อม
ตรวจสอบว่าคุณได้ติดตั้ง Node.js ในเครื่องแล้ว

### 2. ติดตั้ง Dependencies
รันคำสั่งนี้ในทั้งโฟลเดอร์ `frontend` และ `backend`:
```bash
npm install
```

### 3. การรัน Backend
เข้าไปที่โฟลเดอร์ `backend`:
```bash
npm run server
```

### 4. การรัน Frontend
เข้าไปที่โฟลเดอร์ `frontend`:
```bash
npm run dev
```

---
*หมายเหตุ: โปรเจกต์นี้ได้รับการ Refactored เพื่อความสะอาดของโค้ดและประสิทธิภาพในการพัฒนาต่อยอด*
