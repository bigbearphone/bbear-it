
import {store,resetStore} from './store.js';
import {renderDashboard} from './dashboard.js';
import {renderSale} from './sale.js';
import {renderInventory} from './inventory.js';
import {renderReceive} from './receive.js';
import {renderPartners} from './partners.js';
import {renderReports} from './reports.js';
import {renderFraud} from './fraud.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
window.toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
let role='';
function loginView(){document.querySelector('#app').innerHTML=`<section class="login"><div class="login-card"><img src="assets/logo.png"><h1>BIGBEAR ONE</h1><p>Alpha 1.0 — เลือกบทบาททดลอง</p><div class="role-grid">${['กรรมการบริษัท','ผู้จัดการสาขา','PC ประจำสาขา','เจ้าหน้าที่คลัง','Partner ร้าน','ฝ่ายบัญชี'].map(r=>`<button data-role="${r}">${r}</button>`).join('')}</div><button id="loginBtn" class="primary full" disabled>เข้าสู่ระบบ</button></div></section>`;$$('[data-role]').forEach(b=>b.onclick=()=>{$$('[data-role]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');role=b.dataset.role;$('#loginBtn').disabled=false});$('#loginBtn').onclick=()=>shellView()}
function shellView(){document.querySelector('#app').innerHTML=`<div class="app"><aside class="sidebar" id="sidebar"><div class="brand"><img src="assets/logo.png"><div><strong>BIGBEAR ONE</strong><span>Alpha 1.0</span></div></div><nav>${[['dashboard','⌂ ภาพรวม'],['today','✓ งานวันนี้'],['sale','▣ ขายสินค้า'],['inventory','▦ Inventory'],['receive','⇩ รับสินค้า'],['partners','♙ Partner'],['reports','▥ รายงาน'],['fraud','⚠ Fraud Test']].map((x,i)=>`<button class="${i===0?'active':''}" data-page="${x[0]}">${x[1]}</button>`).join('')}</nav><div class="userbox">อัศวิน ชานัย<br><small>${role}</small><br><button id="logout" class="soft">ออกจากระบบ</button></div></aside><main class="main"><header class="topbar"><button class="iconbtn menuBtn" id="menuBtn">☰</button><div class="searchbox"><input id="globalSearch" placeholder="ค้นหา ลูกค้า / IMEI / Serial / Barcode / เอกสาร / Partner"></div><button class="iconbtn" id="notifBtn">🔔</button><button class="primary" data-page="sale">+ ขายสินค้า</button></header><div class="content"><section id="dashboard" class="page active"></section><section id="today" class="page"></section><section id="sale" class="page"></section><section id="inventory" class="page"></section><section id="receive" class="page"></section><section id="partners" class="page"></section><section id="reports" class="page"></section><section id="fraud" class="page"></section></div></main><nav class="bottomnav">${[['dashboard','⌂','หน้าแรก'],['today','✓','งานวันนี้'],['sale','▣','ขาย'],['inventory','▦','Stock'],['reports','▥','รายงาน']].map((x,i)=>`<button class="${i===0?'active':''} ${i===2?'scan':''}" data-page="${x[0]}">${x[1]}<span>${x[2]}</span></button>`).join('')}</nav></div><div class="modal" id="modal"><div class="panel"><div class="panelhead"><div><h2 id="modalTitle"></h2><p id="modalSub"></p></div><button class="close" id="modalClose">✕</button></div><div id="modalBody"></div></div></div><div id="toast"></div>`;
window.openModal=(title,sub,html)=>{$('#modalTitle').textContent=title;$('#modalSub').textContent=sub||'';$('#modalBody').innerHTML=html;$('#modal').classList.add('open')};
$('#modalClose').onclick=()=>$('#modal').classList.remove('open');$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').classList.remove('open')};
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');$('#logout').onclick=loginView;
$$('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$('#notifBtn').onclick=()=>openTasks();$('#globalSearch').oninput=e=>{if(e.target.value.length>=3)toast('พบข้อมูลตัวอย่าง 4 รายการ')};
renderAll();setTimeout(openTasks,400)
}
function showPage(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));$('#sidebar').classList.remove('open');scrollTo({top:0,behavior:'smooth'})}
function openTasks(){const tasks=store().tasks;openModal('รายการค้างทั้งหมด','Action Center',tasks.map(t=>`<div class="drillcard"><b>${t.title}</b><small>${t.detail}</small></div>`).join(''))}
function renderToday(){const tasks=store().tasks;$('#today').innerHTML=`<div class="pagehead"><div><small>Work Queue</small><h1>งานวันนี้</h1><p>รายการค้างจากข้อมูลจริงใน LocalStorage</p></div></div><div class="taskgrid">${[['delivery','ลูกค้านัดรับเครื่อง'],['pending','เคสรอผลอนุมัติ'],['receive','รับของ Supplier'],['transfer','รอเซ็นรับโอน']].map(x=>{const c=tasks.filter(t=>t.type===x[0]).length;return `<button class="task" data-task="${x[0]}"><span>${x[1]}</span><b>${c}</b><small>คลิกดูรายละเอียด</small></button>`}).join('')}</div>`;$$('[data-task]').forEach(b=>b.onclick=()=>{const rows=tasks.filter(t=>t.type===b.dataset.task);openModal(b.querySelector('span').textContent,'รายละเอียด',rows.map(r=>`<div class="drillcard"><b>${r.title}</b><small>${r.detail}</small></div>`).join(''))})}
function renderAll(){renderDashboard();renderToday();renderSale();renderInventory();renderReceive();renderPartners();renderReports();renderFraud()}
window.refreshAll=renderAll;loginView();
