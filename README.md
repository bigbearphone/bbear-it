# BIGBEAR ONE Alpha 1.0

เวอร์ชัน Deployable สำหรับ GitHub Pages

## มีแล้ว
- Login จำลองตาม Role
- Dashboard drill-down
- Notification/งานค้าง
- Sale และ Finance Matrix
- Customer lookup
- Inventory จาก LocalStorage
- Receive Wizard
- Partner Dashboard
- Reports + Print/PDF + Telegram simulation
- Fraud Test
- Responsive Mobile/Desktop

## วิธี Deploy GitHub Pages
1. อัปโหลดไฟล์และโฟลเดอร์ทั้งหมดขึ้น root ของ repository
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: main / (root)
5. เปิดผ่าน URL ของ GitHub Pages

## ข้อจำกัด
- เป็น Alpha แบบ LocalStorage บนอุปกรณ์เดียว
- Telegram, FlowAccount, กล้อง และ Backend ยังเป็น simulation
- ขั้น Production ต้องเชื่อมฐานข้อมูลกลาง, Auth, Permission และ Audit จริง
