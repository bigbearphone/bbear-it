
const seed = {
  branches:[
    {id:"WH",name:"คลังสินค้ากลาง",province:"อุดรธานี",manager:"ทีมคลังกลาง",active:true},
    {id:"B01",name:"ถนนทหาร",province:"อุดรธานี",manager:"ผู้จัดการสาขา",active:true},
    {id:"B02",name:"พรหมประกาย",province:"อุดรธานี",manager:"ผู้จัดการสาขา",active:true},
    {id:"B03",name:"สามพร้าว",province:"อุดรธานี",manager:"ผู้จัดการสาขา",active:true},
    {id:"B04",name:"หนองวัวซอ",province:"อุดรธานี",manager:"ผู้จัดการสาขา",active:true}
  ],
  partners:[
    {code:"BBP0001",name:"ป๊ะปุ๊ โมบาย",contact:"คุณป๊ะปุ๊",province:"สกลนคร",sales:148500,commission:7425,status:"อนุมัติแล้ว"},
    {code:"BBP0002",name:"อีซี่ โมบาย",contact:"คุณอีซี่",province:"กาฬสินธุ์",sales:96200,commission:4810,status:"อนุมัติแล้ว"},
    {code:"BBP0003",name:"ตี๋ โมบาย",contact:"คุณตี๋",province:"อุดรธานี",sales:55900,commission:2795,status:"รอตรวจสอบ"}
  ],
  stock:[
    {imei:"357001000000001",brand:"Apple",model:"iPhone 17 Pro Max",color:"Cosmic Orange",capacity:"256GB",cost:47000,price:52900,location:"คลังสินค้ากลาง",status:"พร้อมขาย"},
    {imei:"357001000000002",brand:"Apple",model:"iPhone 17",color:"Black",capacity:"256GB",cost:28500,price:31900,location:"ถนนทหาร",status:"พร้อมขาย"},
    {imei:"358002000000003",brand:"Samsung",model:"Galaxy S26 Ultra",color:"Titanium Black",capacity:"256GB",cost:41900,price:46900,location:"พรหมประกาย",status:"พร้อมขาย"},
    {imei:"358002000000004",brand:"Samsung",model:"Galaxy S25 FE",color:"Blue",capacity:"256GB",cost:22900,price:25900,location:"สามพร้าว",status:"พร้อมขาย"},
    {imei:"359003000000005",brand:"Vivo",model:"V70",color:"Purple",capacity:"256GB",cost:16500,price:18900,location:"คลังสินค้ากลาง",status:"จองแล้ว"}
  ],
  sales:[
    {date:"2026-08-01 11:22",imei:"357001999000111",product:"iPhone 15 128GB",branch:"ถนนทหาร",channel:"สินเชื่อ",price:23900,customer:"ลูกค้าตัวอย่าง"},
    {date:"2026-07-31 16:40",imei:"358002999000222",product:"Galaxy A57 256GB",branch:"พรหมประกาย",channel:"หน้าร้าน",price:15900,customer:"ลูกค้าตัวอย่าง"}
  ],
  transfers:[
    {date:"2026-08-01 09:15",imei:"358002000000004",from:"คลังสินค้ากลาง",to:"สามพร้าว",operator:"Admin",no:"TR-2026-0007"}
  ],
  activities:[
    {time:"วันนี้ 11:22",text:"ขาย iPhone 15 ที่สาขาถนนทหาร"},
    {time:"วันนี้ 09:15",text:"โอน Galaxy S25 FE ไปสาขาสามพร้าว"},
    {time:"เมื่อวาน 16:40",text:"ขาย Galaxy A57 ที่สาขาพรหมประกาย"}
  ]
};
let db = JSON.parse(localStorage.getItem("bigbearDB")||"null") || seed;
const save=()=>localStorage.setItem("bigbearDB",JSON.stringify(db));
const money=n=>Number(n||0).toLocaleString("th-TH",{maximumFractionDigits:0});
const now=()=>new Date().toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"});
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
function toast(msg){const t=qs("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
const pageMeta={
 dashboard:["ภาพรวมระบบ","สรุปการเคลื่อนไหวสินค้าและยอดขายทุกสาขา"],
 warehouse:["คลังสินค้ากลาง","ติดตามสินค้าแบบรายเครื่องด้วย IMEI และ Serial Number"],
 branches:["ระบบสาขา","บริหารสต๊อกและยอดขายของแต่ละสาขา"],
 partners:["ระบบ Partner","จัดการพาร์ทเนอร์ คอมมิชชั่น และประวัติการขาย"],
 receive:["รับสินค้าเข้า","เพิ่มสินค้าเข้าสู่คลังกลางหรือสาขา"],
 sales:["ขายสินค้าออก","ขายและตัดสต๊อกแบบรายเครื่อง"],
 transfers:["โอนสินค้า","ย้ายสินค้าระหว่างคลังและสาขา"],
 reports:["รายงาน","สรุปยอดขาย สต๊อก และการเคลื่อนไหวสินค้า"]
};
function gotoPage(id){
 qsa(".page").forEach(x=>x.classList.remove("active")); qs("#"+id).classList.add("active");
 qsa(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
 qs("#pageTitle").textContent=pageMeta[id][0];qs("#pageSubtitle").textContent=pageMeta[id][1];
 qs("#sidebar").classList.remove("open");renderAll();
}
qsa("[data-page]").forEach(b=>b.onclick=()=>gotoPage(b.dataset.page));
qsa("[data-go]").forEach(b=>b.onclick=()=>gotoPage(b.dataset.go));
qs("#menuToggle").onclick=()=>qs("#sidebar").classList.toggle("open");

function statusClass(s){return s==="พร้อมขาย"||s==="อนุมัติแล้ว"?"green":s==="ขายแล้ว"?"gray":s==="รอตรวจสอบ"||s==="จองแล้ว"||s==="ระหว่างโอน"?"orange":"red"}
function renderDashboard(){
 const available=db.stock.filter(x=>x.status==="พร้อมขาย").length;
 const stockValue=db.stock.filter(x=>x.status!=="ขายแล้ว").reduce((a,b)=>a+b.cost,0);
 const salesTotal=db.sales.reduce((a,b)=>a+b.price,0);
 const activePartners=db.partners.filter(x=>x.status==="อนุมัติแล้ว").length;
 const stats=[
  ["▦","สินค้าพร้อมขาย",available+" เครื่อง","อัปเดตแบบเรียลไทม์"],
  ["฿","มูลค่าสต๊อก","฿"+money(stockValue),"ตามราคาทุน"],
  ["↗","ยอดขายสะสม","฿"+money(salesTotal),"จากข้อมูลในระบบ"],
  ["♙","Partner ใช้งาน",activePartners+" ราย","บัญชีที่อนุมัติแล้ว"]
 ];
 qs("#statsGrid").innerHTML=stats.map(s=>`<div class="stat-card"><div class="stat-top"><small>${s[1]}</small><div class="stat-icon">${s[0]}</div></div><h2>${s[2]}</h2><div class="trend">${s[3]}</div></div>`).join("");
 const grouped={};db.stock.filter(x=>x.status!=="ขายแล้ว").forEach(x=>grouped[x.location]=(grouped[x.location]||0)+1);
 const max=Math.max(1,...Object.values(grouped));qs("#locationStock").innerHTML=Object.entries(grouped).map(([k,v])=>`<div class="progress-row"><span>${k}</span><div class="progress-track"><div class="progress-fill" style="width:${v/max*100}%"></div></div><strong>${v} เครื่อง</strong></div>`).join("")||`<p class="muted">ยังไม่มีข้อมูล</p>`;
 qs("#recentActivity").innerHTML=db.activities.slice(0,6).map(a=>`<div class="activity"><div class="activity-dot"></div><div><strong>${a.text}</strong><span>${a.time}</span></div></div>`).join("");
 const counts={};db.stock.filter(x=>x.status==="พร้อมขาย").forEach(x=>{const k=[x.model,x.color,x.capacity,x.location].join("|");counts[k]=(counts[k]||0)+1});
 qs("#lowStockBody").innerHTML=Object.entries(counts).filter(([,v])=>v<3).map(([k,v])=>{const [m,c,cap,l]=k.split("|");return `<tr><td><strong>${m}</strong></td><td>${c} / ${cap}</td><td>${l}</td><td>${v}</td><td><span class="status orange">ใกล้หมด</span></td></tr>`}).join("")||`<tr><td colspan="5" class="muted">ไม่มีสินค้าใกล้หมด</td></tr>`;
}
function fillLocations(){
 const opts=db.branches.map(b=>`<option value="${b.name}">${b.name}</option>`).join("");
 ["#receiveLocation","#saleBranch","#transferDestination"].forEach(id=>qs(id).innerHTML=opts);
 qs("#stockLocationFilter").innerHTML=`<option value="">ทุกสถานที่</option>`+opts;
}
function renderStock(){
 const lf=qs("#stockLocationFilter").value,sf=qs("#stockStatusFilter").value,search=qs("#globalSearch").value.trim().toLowerCase();
 const rows=db.stock.filter(x=>(!lf||x.location===lf)&&(!sf||x.status===sf)&&(!search||Object.values(x).join(" ").toLowerCase().includes(search)));
 qs("#stockCountBadge").textContent=rows.length+" รายการ";
 qs("#stockTableBody").innerHTML=rows.map(x=>`<tr><td>${x.imei}</td><td><strong>${x.brand} ${x.model}</strong></td><td>${x.color} / ${x.capacity}</td><td>฿${money(x.cost)}</td><td>${x.location}</td><td><span class="status ${statusClass(x.status)}">${x.status}</span></td><td><button class="btn btn-soft" onclick="showItem('${x.imei}')">ดู</button></td></tr>`).join("")||`<tr><td colspan="7" class="muted">ไม่พบสินค้า</td></tr>`;
 const available=db.stock.filter(x=>x.status==="พร้อมขาย");
 const op=available.map(x=>`<option value="${x.imei}">${x.imei} — ${x.model} (${x.location})</option>`).join("");
 qs("#saleImei").innerHTML=`<option value="">เลือกสินค้า</option>`+op;qs("#transferImei").innerHTML=`<option value="">เลือกสินค้า</option>`+op;
}
window.showItem=imei=>{const x=db.stock.find(s=>s.imei===imei);alert(`${x.brand} ${x.model}\nIMEI: ${x.imei}\n${x.color} / ${x.capacity}\nสถานที่: ${x.location}\nสถานะ: ${x.status}`)}
function renderBranches(){
 qs("#branchGrid").innerHTML=db.branches.map(b=>{
  const stock=db.stock.filter(x=>x.location===b.name&&x.status!=="ขายแล้ว").length;
  const sales=db.sales.filter(x=>x.branch===b.name).reduce((a,c)=>a+c.price,0);
  return `<div class="branch-card"><div class="card-head"><div><h3>${b.name}</h3><div class="branch-meta">${b.province} • ${b.id}</div></div><span class="status green">เปิดใช้งาน</span></div><div class="branch-kpis"><div class="branch-kpi"><span>สต๊อก</span><strong>${stock} เครื่อง</strong></div><div class="branch-kpi"><span>ยอดขาย</span><strong>฿${money(sales)}</strong></div></div><p class="muted">ผู้ดูแล: ${b.manager}</p></div>`
 }).join("");
}
function renderPartners(){
 qs("#partnerTableBody").innerHTML=db.partners.map(p=>`<tr><td><strong>${p.code}</strong></td><td><strong>${p.name}</strong><span class="muted">${p.contact}</span></td><td>${p.province}</td><td>฿${money(p.sales)}</td><td>฿${money(p.commission)}</td><td><span class="status ${statusClass(p.status)}">${p.status}</span></td><td><button class="btn btn-soft" onclick="togglePartner('${p.code}')">${p.status==="อนุมัติแล้ว"?"พักใช้งาน":"อนุมัติ"}</button></td></tr>`).join("");
}
window.togglePartner=code=>{const p=db.partners.find(x=>x.code===code);p.status=p.status==="อนุมัติแล้ว"?"พักใช้งาน":"อนุมัติแล้ว";save();renderPartners();toast("อัปเดตสถานะ Partner แล้ว")}
function renderTransfers(){qs("#transferHistory").innerHTML=db.transfers.slice().reverse().slice(0,8).map(t=>`<div class="activity"><div class="activity-dot"></div><div><strong>${t.imei}</strong><span>${t.from} → ${t.to}<br>${t.date}</span></div></div>`).join("")||`<p class="muted">ยังไม่มีประวัติ</p>`}
function renderReports(){
 const revenue=db.sales.reduce((a,b)=>a+b.price,0),avg=db.sales.length?revenue/db.sales.length:0,profit=db.sales.reduce((a,s)=>{const st=db.stock.find(x=>x.imei===s.imei);return a+(s.price-(st?.cost||0))},0);
 const data=[["ยอดขายรวม","฿"+money(revenue)],["จำนวนรายการ",db.sales.length+" รายการ"],["ยอดเฉลี่ย/บิล","฿"+money(avg)],["กำไรประมาณการ","฿"+money(profit)]];
 qs("#reportStats").innerHTML=data.map((x,i)=>`<div class="stat-card"><small>${x[0]}</small><h2>${x[1]}</h2><div class="trend">ข้อมูลจากรายการขาย</div></div>`).join("");
 const byB={},byC={};db.sales.forEach(s=>{byB[s.branch]=(byB[s.branch]||0)+s.price;byC[s.channel]=(byC[s.channel]||0)+s.price});
 const renderProg=o=>{const m=Math.max(1,...Object.values(o));return Object.entries(o).map(([k,v])=>`<div class="progress-row"><span>${k}</span><div class="progress-track"><div class="progress-fill" style="width:${v/m*100}%"></div></div><strong>฿${money(v)}</strong></div>`).join("")||`<p class="muted">ยังไม่มีข้อมูล</p>`};
 qs("#salesByBranch").innerHTML=renderProg(byB);qs("#salesByChannel").innerHTML=renderProg(byC);
 qs("#salesReportBody").innerHTML=db.sales.slice().reverse().map(s=>`<tr><td>${s.date}</td><td>${s.product}</td><td>${s.imei}</td><td>${s.branch}</td><td>${s.channel}</td><td>฿${money(s.price)}</td></tr>`).join("")||`<tr><td colspan="6" class="muted">ยังไม่มีรายการขาย</td></tr>`;
}
function renderAll(){fillLocations();renderDashboard();renderStock();renderBranches();renderPartners();renderTransfers();renderReports()}
qs("#stockLocationFilter").onchange=renderStock;qs("#stockStatusFilter").onchange=renderStock;qs("#globalSearch").oninput=renderStock;
qs("#receiveForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(db.stock.some(x=>x.imei===f.imei)){toast("IMEI นี้มีอยู่ในระบบแล้ว");return}db.stock.push({imei:f.imei,brand:f.brand,model:f.model,color:f.color,capacity:f.capacity,cost:+f.cost,price:+f.price,location:f.location,status:"พร้อมขาย",supplier:f.supplier,docNo:f.docNo,note:f.note});db.activities.unshift({time:"เมื่อสักครู่",text:`รับเข้า ${f.brand} ${f.model} ที่ ${f.location}`});save();e.target.reset();renderAll();toast("บันทึกรับสินค้าเรียบร้อย")}
qs("#saleImei").onchange=e=>{const x=db.stock.find(s=>s.imei===e.target.value);const c=qs("#selectedProductCard");if(!x){c.innerHTML=`<h3>ข้อมูลสินค้าที่เลือก</h3><p class="muted">เลือก IMEI เพื่อดูรายละเอียดสินค้า</p>`;return}c.innerHTML=`<h3>${x.brand} ${x.model}</h3><p>${x.color} / ${x.capacity}</p><div class="branch-kpis"><div class="branch-kpi"><span>ราคาขายตั้งต้น</span><strong>฿${money(x.price)}</strong></div><div class="branch-kpi"><span>สถานที่</span><strong>${x.location}</strong></div></div>`;qs('#saleForm [name="salePrice"]').value=x.price;qs('#saleForm [name="branch"]').value=x.location}
qs("#saleForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const x=db.stock.find(s=>s.imei===f.imei);if(!x||x.status!=="พร้อมขาย"){toast("สินค้านี้ไม่พร้อมขาย");return}x.status="ขายแล้ว";x.location=f.branch;db.sales.push({date:now(),imei:x.imei,product:`${x.brand} ${x.model} ${x.capacity}`,branch:f.branch,channel:f.channel,price:+f.salePrice,customer:f.customer,seller:f.seller});db.activities.unshift({time:"เมื่อสักครู่",text:`ขาย ${x.model} ที่ ${f.branch}`});save();e.target.reset();renderAll();toast("ขายสินค้าและตัดสต๊อกเรียบร้อย")}
qs("#transferForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const x=db.stock.find(s=>s.imei===f.imei);if(!x){toast("ไม่พบสินค้า");return}if(x.location===f.destination){toast("ต้นทางและปลายทางต้องไม่ซ้ำกัน");return}const from=x.location;x.location=f.destination;x.status="พร้อมขาย";db.transfers.push({date:now(),imei:x.imei,from,to:f.destination,operator:f.operator,no:f.transferNo});db.activities.unshift({time:"เมื่อสักครู่",text:`โอน ${x.model} จาก ${from} ไป ${f.destination}`});save();e.target.reset();renderAll();toast("โอนสินค้าเรียบร้อย")}

const modal=qs("#modal"), modalForm=qs("#modalForm");
qs("#modalClose").onclick=()=>modal.classList.remove("open");
function openModal(type){
 modal.classList.add("open");
 if(type==="branch"){qs("#modalTitle").textContent="เพิ่มสาขา";modalForm.innerHTML=`<label>รหัสสาขา<input name="id" required></label><label>ชื่อสาขา<input name="name" required></label><label>จังหวัด<input name="province" required value="อุดรธานี"></label><label>ผู้จัดการ<input name="manager" required></label><div class="full form-actions"><button class="btn btn-primary">บันทึกสาขา</button></div>`}
 else{qs("#modalTitle").textContent="เพิ่ม Partner";modalForm.innerHTML=`<label>Partner Code<input name="code" required placeholder="BBP0004"></label><label>ชื่อร้าน<input name="name" required></label><label>ผู้ติดต่อ<input name="contact" required></label><label>จังหวัด<input name="province" required></label><div class="full form-actions"><button class="btn btn-primary">บันทึก Partner</button></div>`}
 modalForm.dataset.type=type;
}
qs("#addBranchBtn").onclick=()=>openModal("branch");qs("#addPartnerBtn").onclick=()=>openModal("partner");
modalForm.onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(e.target.dataset.type==="branch")db.branches.push({...f,active:true});else db.partners.push({...f,sales:0,commission:0,status:"รอตรวจสอบ"});save();modal.classList.remove("open");renderAll();toast("เพิ่มข้อมูลเรียบร้อย")}
qs("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bigbear-data.json";a.click();URL.revokeObjectURL(a.href)}
renderAll();
