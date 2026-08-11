# BIGBEAR ONE — Production / Supabase Pilot

Branch target: `bigbearphone/bbear-it` → `production/supabase-v1`

เวอร์ชันนี้ยกระดับ Alpha เดิมให้พร้อมเชื่อม Supabase โดย **ไม่แตะ BearOS** และไม่ใส่ secret ลง repository

## สิ่งที่เพิ่มแล้ว
- Supabase Auth (`signInWithPassword`, session persistence, sign out)
- Runtime config แยกที่ `js/config.js`
- Data adapter: Supabase ก่อน และ Demo fallback เมื่อยังไม่ตั้งค่า
- โหลด `branches`, `customers`, `inventory_items`, `partners` จากฐานข้อมูลกลาง
- Customer lookup ผ่าน Supabase
- Audit hook สำหรับ action สำคัญ
- ป้ายสถานะ DATA: SUPABASE / DEMO เพื่อป้องกันสับสน
- SQL ตรวจ schema/RLS/policies ที่ `supabase/VERIFY_AND_SETUP.sql`
- เก็บ UI Alpha เดิม: Dashboard, Today, Sale, Inventory, Receive, Partner, Reports, Fraud Test

## ทำครั้งเดียวเพื่อเชื่อมฐานจริง
1. Supabase → Project Settings → API
2. คัดลอก **Project URL** และ **anon/public key** เท่านั้น
3. เปิด `js/config.js`
4. ใส่ค่าใน `SUPABASE_URL` และ `SUPABASE_ANON_KEY`
5. ห้ามใส่ `service_role`, database password หรือ JWT secret ใน GitHub
6. Commit ไปที่ branch `production/supabase-v1`
7. Deploy GitHub Pages จาก branch นี้เพื่อ Pilot

## ก่อนเปิดเขียนข้อมูล Production
รัน `supabase/VERIFY_AND_SETUP.sql` ใน SQL Editor และตรวจว่า RLS/policies ตรงกับสิทธิ์จริงของกรรมการ, PC, Partner และสาขา

> Sale/Receive write ถูกตั้งใจให้ fail-safe: UI จะไม่เดาชื่อ column แล้วเขียนลง Production จนกว่าจะ map schema จริงครบ เพื่อป้องกันข้อมูลขาย/สต็อกเสียหาย

## Demo fallback
ถ้า `js/config.js` ยังว่าง ระบบยังเปิดได้ด้วยข้อมูล Demo เดิมจาก LocalStorage เพื่อให้ UI ไม่ล่มระหว่างตั้งค่า
