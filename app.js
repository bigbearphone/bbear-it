
const screens=[...document.querySelectorAll('.screen')];
function openScreen(id){
  screens.forEach(s=>s.classList.toggle('active',s.id===id));
  document.querySelectorAll('.bottom-nav [data-open]').forEach(b=>b.classList.toggle('active',b.dataset.open===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openScreen(b.dataset.open)));
document.querySelectorAll('.back').forEach(b=>b.addEventListener('click',()=>openScreen('home')));

function toast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}
document.getElementById('fakeScan').onclick=()=>toast('สแกน IMEI สำเร็จ: 358002000000006');
document.getElementById('saleScan').onclick=()=>toast('พบสินค้า iPhone 17 Pro Max');
document.getElementById('transferScan').onclick=()=>toast('เพิ่มสินค้าเข้ารายการโอนแล้ว');
document.getElementById('receiveConfirm').onclick=()=>toast('บันทึกรับเข้าและลายเซ็นเรียบร้อย');
document.getElementById('saleConfirm').onclick=()=>toast('ส่งมอบสินค้าและตัดสต๊อกแล้ว');
document.getElementById('transferConfirm').onclick=()=>toast('ส่งออกจากคลังแล้ว รอปลายทางเซ็นรับ');

document.querySelectorAll('#financeGrid button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#financeGrid button').forEach(x=>x.classList.remove('selected'));
  b.classList.add('selected'); toast('เลือก '+b.dataset.finance);
});

const telegramModal=document.getElementById('telegramModal');
const previewModal=document.getElementById('previewModal');
function openTelegram(){telegramModal.classList.add('open')}
document.getElementById('telegramBtn').onclick=openTelegram;
document.getElementById('bottomTelegram').onclick=openTelegram;
document.getElementById('closeModal').onclick=()=>telegramModal.classList.remove('open');
document.getElementById('closePreview').onclick=()=>previewModal.classList.remove('open');

const reports={
daily:`🐻 BIGBEAR DAILY REPORT
วันที่ 1 สิงหาคม 2569 เวลา 20:00 น.

ยอดขายวันนี้: 428,600 บาท
จำนวน: 13 เครื่อง

แยกตาม Finance
• PPLAN: 4 เครื่อง / 158,600 บาท
• Samsung Finance+: 5 เครื่อง / 142,500 บาท
• SG Finance: 2 เครื่อง / 76,000 บาท
• S Leasing: 1 เครื่อง / 31,500 บาท
• เงินสด: 1 เครื่อง / 20,000 บาท

แยกตามสาขา
• พรหมประกาย: 128,000 บาท
• ถนนทหาร: 156,600 บาท
• สามพร้าว: 84,000 บาท
• หนองวัวซอ: 60,000 บาท`,
month:`📅 BIGBEAR MONTHLY REPORT
เดือน สิงหาคม 2569

ยอดขายสะสม: 3,860,200 บาท
จำนวน: 126 เครื่อง
Partner: 28 เคส
สาขายอดขายสูงสุด: ถนนทหาร`,
mainstock:`📦 STOCK คลังหลักพรหมประกาย

พร้อมขาย: 43 เครื่อง
จองแล้ว: 4 เครื่อง
ระหว่างตรวจรับ: 2 เครื่อง

Apple: 14 เครื่อง
Samsung: 18 เครื่อง
Vivo: 5 เครื่อง
OPPO: 4 เครื่อง
Xiaomi/Infinix: 2 เครื่อง

มูลค่าทุนรวม: 1,248,500 บาท`,
allstock:`🏬 STOCK ทุกสาขา

พรหมประกาย: 43 เครื่อง
ถนนทหาร: 18 เครื่อง
สามพร้าว: 12 เครื่อง
หนองวัวซอ: 9 เครื่อง
ระหว่างโอน: 4 เครื่อง

รวมพร้อมขาย: 86 เครื่อง`,
full:`🐻 BIGBEAR FULL REPORT

ยอดขายวันนี้: 428,600 บาท / 13 เครื่อง
ยอดขายเดือนนี้: 3,860,200 บาท / 126 เครื่อง
สต๊อกพร้อมขาย: 86 เครื่อง
ระหว่างโอน: 4 เครื่อง
รอสาขาเซ็นรับ: 2 รายการ
Partner ปิดการขายวันนี้: 3 ราย
ผู้รับ Supplier วันนี้: อัศวิน ชานัย
ผู้ออกบิลล่าสุด: ฝ่ายบัญชี B`
};
document.querySelectorAll('.report-option').forEach(b=>b.onclick=()=>{
  telegramModal.classList.remove('open');
  document.getElementById('reportText').textContent=reports[b.dataset.report];
  previewModal.classList.add('open');
});
document.getElementById('sendReport').onclick=()=>{
  previewModal.classList.remove('open');toast('ส่งรายงานเข้า Telegram แล้ว');
};
