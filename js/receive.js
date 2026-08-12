import {supabase} from './supabase.js';
import {reload} from './store.js';

const OCR_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js';
const STORAGE_BUCKET = 'receive-documents';

function esc(v=''){
  return String(v)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function money(n){
  return new Intl.NumberFormat('th-TH',{
    style:'currency',currency:'THB',maximumFractionDigits:0
  }).format(Number(n||0));
}

function uuid(){
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
      const r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16)
    });
}

function imei15(text=''){
  const m = String(text).replace(/\s+/g,' ').match(/(?<!\d)\d{15}(?!\d)/g);
  return m ? [...new Set(m)] : [];
}

function amountCandidates(text=''){
  const rows = String(text).split(/\r?\n/);
  const out = [];
  for(const row of rows){
    const ms = row.match(/(?:฿\s*)?(\d{1,3}(?:,\d{3})+|\d{4,6})(?:\.\d{1,2})?/g);
    if(!ms) continue;
    for(const raw of ms){
      const n = Number(raw.replace(/[฿,\s]/g,''));
      if(Number.isFinite(n) && n>=100 && n<=1000000) out.push({row:row.trim(), value:n});
    }
  }
  return out.slice(0,50);
}

async function loadOcr(){
  return import(OCR_CDN);
}

async function ocrFile(file, onProgress){
  const {createWorker} = await loadOcr();
  const worker = await createWorker('eng', 1, {
    logger: m => onProgress?.(m)
  });
  try{
    const {data:{text}} = await worker.recognize(file);
    return text || '';
  } finally {
    await worker.terminate();
  }
}

async function uploadFile(sb, file, folder){
  if(!file) return null;
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path = `${folder}/${Date.now()}-${uuid()}-${safe}`;
  const {error} = await sb.storage.from(STORAGE_BUCKET).upload(path,file,{
    upsert:false,contentType:file.type || 'image/jpeg'
  });
  if(error) throw error;
  return path;
}

function extractProductHints(text, products){
  const lower = String(text||'').toLowerCase();
  const hits = products.filter(p=>{
    const terms=[p.brand,p.model,p.capacity,p.color].filter(Boolean).map(x=>String(x).toLowerCase());
    const major=[p.brand,p.model].filter(Boolean).map(x=>String(x).toLowerCase());
    return major.length && major.every(t=>lower.includes(t));
  });
  return hits.slice(0,20);
}

export async function renderReceive(){
  const root = document.querySelector('#receive');
  if(!root) return;

  const sb = await supabase();
  if(!sb){
    root.innerHTML='<div class="notice">Supabase ยังไม่ได้เชื่อมต่อ</div>';
    return;
  }

  const state = {
    step:1,
    unlocked:1,
    docs:[],
    items:[],
    suppliers:[],
    branches:[],
    products:[],
    ocrText:'',
    expectedQty:0,
    expectedValue:0,
    receiveId:null,
    saving:false
  };

  root.innerHTML = `
    <style>
      .rv2-wrap{--rv-bg:#f5f5f7;--rv-card:#fff;--rv-text:#1d1d1f;--rv-muted:#6e6e73;--rv-line:rgba(0,0,0,.08);--rv-accent:#ff6a00;--rv-ok:#16783a;--rv-warn:#a64b00}
      .rv2-hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:22px}
      .rv2-hero h1{font-size:38px;letter-spacing:-1px;margin:0 0 6px}.rv2-hero p{color:var(--rv-muted);margin:0}
      .rv2-status{padding:9px 13px;border-radius:999px;background:#eef7f0;color:var(--rv-ok);font-weight:500}
      .rv2-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
      .rv2-step{background:none;border:0;text-align:left;padding:0;opacity:.35}.rv2-step.rv2-open{opacity:1}.rv2-step[disabled]{cursor:not-allowed}
      .rv2-bar{height:5px;border-radius:99px;background:#d8d8dc;margin-bottom:8px}.rv2-step.rv2-active .rv2-bar,.rv2-step.rv2-done .rv2-bar{background:var(--rv-accent)}
      .rv2-step small{color:var(--rv-muted)}.rv2-card{background:rgba(255,255,255,.95);border:1px solid var(--rv-line);border-radius:24px;padding:24px;box-shadow:0 18px 48px rgba(0,0,0,.06)}
      .rv2-head{display:flex;justify-content:space-between;gap:14px;margin-bottom:18px}.rv2-head h2{margin:0 0 4px;font-size:25px}.rv2-head p{margin:0;color:var(--rv-muted)}
      .rv2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.rv2-field label{display:block;font-size:13px;color:var(--rv-muted);margin-bottom:7px}
      .rv2-input{width:100%;min-height:50px;border:1px solid var(--rv-line);border-radius:15px;background:#fff;padding:0 14px;outline:none}
      .rv2-input:focus{border-color:rgba(255,106,0,.5);box-shadow:0 0 0 4px rgba(255,106,0,.08)}
      .rv2-btn{border:0;border-radius:999px;padding:11px 17px;font-weight:500}.rv2-primary{background:var(--rv-accent);color:#fff}.rv2-soft{background:#fff;border:1px solid var(--rv-line);color:var(--rv-text)}.rv2-dark{background:#1d1d1f;color:#fff}
      .rv2-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.rv2-drop{border:1.5px dashed rgba(0,0,0,.15);border-radius:20px;padding:22px;text-align:center;margin-top:16px;background:#fafafa}
      .rv2-doc{display:grid;grid-template-columns:1fr auto;gap:12px;padding:14px 0;border-bottom:1px solid var(--rv-line)}.rv2-doc:last-child{border-bottom:0}
      .rv2-chip{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef7f0;color:var(--rv-ok);font-size:12px}
      .rv2-product{border:1px solid var(--rv-line);border-radius:20px;padding:18px;margin-top:12px;background:#fff}.rv2-product-title{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}
      .rv2-product-grid{display:grid;grid-template-columns:1.1fr 1fr .8fr .75fr;gap:10px}.rv2-scan{display:grid;grid-template-columns:1fr auto;gap:8px}
      .rv2-review{display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--rv-line)}
      .rv2-check{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#eaf7ee;color:var(--rv-ok);font-weight:700}
      .rv2-bad{background:#fff0ed;color:#b42318}.rv2-summary{margin-top:14px;padding:14px 16px;border-radius:18px;background:#f8f8fa;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .rv2-summary b{font-size:19px}.rv2-hidden{display:none!important}.rv2-ocr{white-space:pre-wrap;max-height:220px;overflow:auto;background:#111;color:#eee;padding:12px;border-radius:14px;font:12px/1.5 monospace}
      @media(max-width:850px){.rv2-grid,.rv2-product-grid{grid-template-columns:1fr}.rv2-hero{flex-direction:column;align-items:flex-start}}
    </style>
    <div class="rv2-wrap">
      <div class="rv2-hero">
        <div><h1>รับสินค้า</h1><p>เอกสาร → สแกนสินค้า → Double Check → ยืนยันรับเข้า</p></div>
        <div class="rv2-status" id="rv2Status">Draft</div>
      </div>
      <div class="rv2-progress">
        ${['01 เอกสาร','02 รายการสินค้า','03 Double Check','04 ยืนยันรับ'].map((t,i)=>`
          <button class="rv2-step ${i===0?'rv2-active rv2-open':''}" data-rvstep="${i+1}" ${i?'disabled':''}>
            <div class="rv2-bar"></div><small>${t}</small>
          </button>`).join('')}
      </div>
      <div id="rv2Phase"></div>
    </div>`;

  const $ = s=>root.querySelector(s);
  const $$ = s=>[...root.querySelectorAll(s)];

  async function master(){
    const [s,b,p] = await Promise.all([
      sb.from('suppliers').select('*').order('name'),
      sb.from('branches').select('*').order('name'),
      sb.from('products').select('*').order('brand').order('model')
    ]);
    if(s.error) throw s.error;if(b.error) throw b.error;if(p.error) throw p.error;
    state.suppliers=s.data||[];state.branches=b.data||[];state.products=p.data||[];
  }

  function currentSummary(){
    const scanned = state.items.filter(x=>validItem(x)).length;
    const value = state.items.reduce((a,x)=>a+Number(x.unit_cost||0),0);
    return `<div class="rv2-summary">
      <div><small>ตามเอกสาร</small><br><b>${state.expectedQty||'-'} เครื่อง • ${money(state.expectedValue)}</b></div>
      <div><small>ตรวจของจริง</small><br><b>${scanned}/${state.items.length||state.expectedQty||0} เครื่อง • ${money(value)}</b></div>
    </div>`;
  }

  function setStep(step){
    if(step>state.unlocked) return;
    state.step=step;
    $$('[data-rvstep]').forEach(btn=>{
      const n=Number(btn.dataset.rvstep);
      btn.disabled=n>state.unlocked;
      btn.classList.toggle('rv2-open',n<=state.unlocked);
      btn.classList.toggle('rv2-active',n===step);
      btn.classList.toggle('rv2-done',n<step);
    });
    renderPhase();
  }
  function unlock(step){state.unlocked=Math.max(state.unlocked,step);setStep(step)}
  $$('[data-rvstep]').forEach(b=>b.onclick=()=>setStep(Number(b.dataset.rvstep)));

  function productOptions(selected=''){
    return `<option value="">-- เลือกสินค้า --</option>`+state.products.map(p=>{
      const label=[p.brand,p.model,p.capacity,p.color].filter(Boolean).join(' ');
      return `<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(label)}</option>`;
    }).join('');
  }

  function validItem(x){
    const p=state.products.find(p=>p.id===x.product_id)||{};
    const imeiOk=!p.track_imei || /^\d{15}$/.test(x.imei||'');
    const serialOk=!p.track_serial || !!String(x.serial||'').trim();
    const base=!!x.product_id && Number(x.unit_cost)>=0;
    return base && imeiOk && serialOk;
  }

  function itemCard(x,i){
    const p=state.products.find(p=>p.id===x.product_id)||{};
    const ok=validItem(x);
    return `<div class="rv2-product" data-item="${x.local_id}">
      <div class="rv2-product-title">
        <div><b>เครื่องที่ ${i+1}</b><div style="color:var(--rv-muted);font-size:13px">IMEI และ S/N อยู่ในรายการเดียวกัน</div></div>
        <span class="rv2-chip ${ok?'':'rv2-bad'}">${ok?'Complete':'Needs Attention'}</span>
      </div>
      <div class="rv2-product-grid">
        <div class="rv2-field"><label>สินค้า / รุ่น / ความจุ / สี</label><select class="rv2-input" data-f="product_id">${productOptions(x.product_id)}</select></div>
        <div class="rv2-field"><label>ราคาทุน / เครื่อง</label><input class="rv2-input" type="number" min="0" data-f="unit_cost" value="${esc(x.unit_cost)}"></div>
        <div class="rv2-field"><label>Brand</label><input class="rv2-input" value="${esc(p.brand||'')}" readonly></div>
        <div class="rv2-field"><label>สี</label><input class="rv2-input" value="${esc(p.color||'')}" readonly></div>
      </div>
      <div class="rv2-grid" style="margin-top:10px">
        <div class="rv2-field"><label>IMEI ${p.track_imei?'(บังคับ 15 หลัก)':''}</label><div class="rv2-scan"><input class="rv2-input" inputmode="numeric" maxlength="15" data-f="imei" value="${esc(x.imei)}"><button class="rv2-btn rv2-soft" data-scan="imei">⌁ Scan</button></div></div>
        <div class="rv2-field"><label>S/N ${p.track_serial?'(บังคับ)':''}</label><div class="rv2-scan"><input class="rv2-input" data-f="serial" value="${esc(x.serial)}"><button class="rv2-btn rv2-soft" data-scan="serial">⌁ Scan</button></div></div>
      </div>
      <input type="file" accept="image/*" capture="environment" data-camera hidden>
      <div class="rv2-actions"><button class="rv2-btn rv2-soft" data-remove>ลบรายการ</button></div>
    </div>`;
  }

  function renderPhase(){
    const host=$('#rv2Phase');
    if(state.step===1){
      host.innerHTML=`<section class="rv2-card">
        <div class="rv2-head"><div><h2>เอกสาร Supplier</h2><p>เพิ่มหลายหน้า + OCR อ่าน IMEI/ราคา/ข้อความเบื้องต้น</p></div><span class="rv2-chip">Step 1</span></div>
        <div class="rv2-grid">
          <div class="rv2-field"><label>Supplier</label><select id="rSupplier" class="rv2-input"><option value="">-- เลือก --</option>${state.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
          <div class="rv2-field"><label>ประเภท</label><select id="rType" class="rv2-input"><option>ขายเชื่อ</option><option>ขายสด</option><option>ฝากวาง</option></select></div>
          <div class="rv2-field"><label>สาขารับ</label><select id="rBranch" class="rv2-input"><option value="">-- เลือก --</option>${state.branches.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
          <div class="rv2-field"><label>เลขเอกสาร Supplier</label><input id="rDocNo" class="rv2-input" placeholder="เช่น INV-2026-001"></div>
        </div>
        <div class="rv2-drop">
          <b>เพิ่มรูปเอกสารได้หลายหน้า</b><div style="color:var(--rv-muted);margin:5px 0 12px">ถ่ายรูปหรือเลือกหลายไฟล์ จากนั้น OCR</div>
          <input id="rDocs" type="file" accept="image/*" capture="environment" multiple hidden>
          <button class="rv2-btn rv2-soft" id="rAddDocs">📷 เพิ่มหน้าเอกสาร</button>
        </div>
        <div id="rDocList">${state.docs.map((d,i)=>`<div class="rv2-doc"><div><b>หน้า ${i+1}: ${esc(d.file.name)}</b><div style="color:var(--rv-muted);font-size:13px">${d.ocr?'OCR แล้ว':'รอ OCR'}</div></div><span class="rv2-chip">${d.ocr?'Ready':'Added'}</span></div>`).join('')}</div>
        <div class="rv2-actions"><button class="rv2-btn rv2-dark" id="rOCR" ${state.docs.length?'':'disabled'}>⌁ OCR เอกสารทั้งหมด</button></div>
        <div id="rOCRProgress" style="margin-top:12px;color:var(--rv-muted)"></div>
        ${state.ocrText?`<details style="margin-top:12px"><summary>ดูข้อความ OCR</summary><div class="rv2-ocr">${esc(state.ocrText)}</div></details>`:''}
        <div class="rv2-grid" style="margin-top:14px">
          <div class="rv2-field"><label>จำนวนตามเอกสาร</label><input id="rExpectedQty" class="rv2-input" type="number" min="0" value="${state.expectedQty||''}"></div>
          <div class="rv2-field"><label>มูลค่าตามเอกสาร</label><input id="rExpectedValue" class="rv2-input" type="number" min="0" value="${state.expectedValue||''}"></div>
        </div>
        ${currentSummary()}
        <div class="rv2-actions"><button class="rv2-btn rv2-primary" id="rStep1Next">เอกสารตรวจแล้ว →</button></div>
      </section>`;
      $('#rAddDocs').onclick=()=>$('#rDocs').click();
      $('#rDocs').onchange=e=>{[...e.target.files].forEach(file=>state.docs.push({file,ocr:'',storage_path:null}));renderPhase()};
      $('#rOCR').onclick=async()=>{
        $('#rOCR').disabled=true;state.ocrText='';
        for(let i=0;i<state.docs.length;i++){
          $('#rOCRProgress').textContent=`กำลัง OCR หน้า ${i+1}/${state.docs.length}...`;
          const text=await ocrFile(state.docs[i].file,m=>{
            if(m.status==='recognizing text') $('#rOCRProgress').textContent=`OCR หน้า ${i+1}: ${Math.round((m.progress||0)*100)}%`;
          });
          state.docs[i].ocr=text;state.ocrText += `\n--- PAGE ${i+1} ---\n${text}`;
        }
        const imeis=imei15(state.ocrText);
        const amounts=amountCandidates(state.ocrText);
        if(!state.expectedQty && imeis.length) state.expectedQty=imeis.length;
        if(!state.expectedValue && amounts.length){
          const probable=amounts.map(x=>x.value).sort((a,b)=>b-a)[0];
          state.expectedValue=probable||0;
        }
        if(!state.items.length && imeis.length){
          state.items=imeis.map(n=>({local_id:uuid(),product_id:'',unit_cost:'',imei:n,serial:'',imei_photo:null,serial_photo:null}));
        }
        $('#rOCRProgress').textContent=`OCR สำเร็จ • พบ IMEI ${imeis.length} ค่า`;
        renderPhase();
      };
      $('#rStep1Next').onclick=()=>{
        const supplier=$('#rSupplier').value,branch=$('#rBranch').value,docNo=$('#rDocNo').value.trim();
        state.expectedQty=Number($('#rExpectedQty').value||0);state.expectedValue=Number($('#rExpectedValue').value||0);
        if(!supplier||!branch||!docNo||!state.docs.length){toast('กรุณากรอก Supplier / สาขา / เลขเอกสาร และแนบเอกสารอย่างน้อย 1 หน้า');return}
        state.supplier_id=supplier;state.branch_id=branch;state.supplier_document_no=docNo;state.purchase_type=$('#rType').value;
        unlock(2);
      };
    }

    if(state.step===2){
      host.innerHTML=`<section class="rv2-card">
        <div class="rv2-head"><div><h2>รายการสินค้า</h2><p>เพิ่มไม่จำกัด • สแกน IMEI/S/N จากกล้องได้</p></div><span class="rv2-chip">Step 2</span></div>
        <div id="rItems">${state.items.map(itemCard).join('')}</div>
        <div class="rv2-actions"><button class="rv2-btn rv2-dark" id="rAddItem">＋ เพิ่มเครื่อง</button><button class="rv2-btn rv2-soft" id="rBack1">← เอกสาร</button><button class="rv2-btn rv2-primary" id="rStep2Next">ตรวจครบแล้ว →</button></div>
        ${currentSummary()}
      </section>`;
      $('#rAddItem').onclick=()=>{state.items.push({local_id:uuid(),product_id:'',unit_cost:'',imei:'',serial:'',imei_photo:null,serial_photo:null});renderPhase()};
      $('#rBack1').onclick=()=>setStep(1);
      $$('[data-item]').forEach(card=>{
        const id=card.dataset.item;const item=state.items.find(x=>x.local_id===id);
        card.querySelectorAll('[data-f]').forEach(el=>el.onchange=el.oninput=()=>{item[el.dataset.f]=el.value});
        card.querySelector('[data-remove]').onclick=()=>{state.items=state.items.filter(x=>x.local_id!==id);renderPhase()};
        card.querySelectorAll('[data-scan]').forEach(btn=>btn.onclick=()=>{
          const kind=btn.dataset.scan,input=card.querySelector('[data-camera]');
          input.dataset.kind=kind;input.click();
        });
        const camera=card.querySelector('[data-camera]');
        camera.onchange=async()=>{
          const file=camera.files?.[0];if(!file)return;
          const kind=camera.dataset.kind;
          toast(`กำลัง OCR ${kind.toUpperCase()}...`);
          const text=await ocrFile(file);
          if(kind==='imei'){
            const found=imei15(text)[0]||'';
            if(!found){toast('ไม่พบ IMEI 15 หลักในภาพ');return}
            item.imei=found;item.imei_photo=file;
          }else{
            const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
            const candidate=lines.find(x=>/[A-Z0-9-]{6,}/i.test(x))||lines[0]||'';
            item.serial=candidate.replace(/\s/g,'');item.serial_photo=file;
          }
          renderPhase();
        };
      });
      $('#rStep2Next').onclick=()=>{
        if(!state.items.length){toast('กรุณาเพิ่มสินค้าอย่างน้อย 1 เครื่อง');return}
        const bad=state.items.filter(x=>!validItem(x));
        const imeis=state.items.map(x=>x.imei).filter(Boolean);
        const dup=imeis.filter((x,i)=>imeis.indexOf(x)!==i);
        if(dup.length){toast('พบ IMEI ซ้ำในรายการ');return}
        if(bad.length){toast(`ยังมี ${bad.length} เครื่องข้อมูลไม่ครบ`);return}
        renderPhase();unlock(3);
      };
    }

    if(state.step===3){
      const rows=state.items.map((x,i)=>{
        const p=state.products.find(p=>p.id===x.product_id)||{};
        return `<div class="rv2-review"><div class="rv2-check">✓</div><div><b>${esc([p.brand,p.model,p.capacity,p.color].filter(Boolean).join(' '))}</b><div style="color:var(--rv-muted);font-size:13px">IMEI ${esc(x.imei||'-')} • S/N ${esc(x.serial||'-')} • ${money(x.unit_cost)}</div></div><span class="rv2-chip">Complete</span></div>`
      }).join('');
      host.innerHTML=`<section class="rv2-card">
        <div class="rv2-head"><div><h2>Double Check</h2><p>ข้อมูลครบต่อ 1 เครื่อง ก่อนรับเข้าคลัง</p></div><span class="rv2-chip">Step 3</span></div>
        ${rows}${currentSummary()}
        <div class="rv2-actions"><button class="rv2-btn rv2-soft" id="rBack2">← แก้ไขสินค้า</button><button class="rv2-btn rv2-primary" id="rVerify">✓ ยืนยัน Double Check</button></div>
      </section>`;
      $('#rBack2').onclick=()=>setStep(2);
      $('#rVerify').onclick=async()=>{
        // check duplicates against existing inventory
        const imeis=state.items.map(x=>x.imei).filter(Boolean);
        if(imeis.length){
          const {data,error}=await sb.from('inventory_items').select('imei').in('imei',imeis);
          if(error) throw error;
          if(data?.length){toast(`พบ IMEI มีอยู่ใน Inventory แล้ว ${data.map(x=>x.imei).join(', ')}`);return}
        }
        state.items.forEach(x=>x.double_check_passed=true);
        unlock(4);
      };
    }

    if(state.step===4){
      host.innerHTML=`<section class="rv2-card">
        <div class="rv2-head"><div><h2>ยืนยันรับสินค้า</h2><p>บันทึก Supabase → Inventory → Dashboard → Telegram</p></div><span class="rv2-chip">Step 4</span></div>
        ${currentSummary()}
        <div class="rv2-actions"><button class="rv2-btn rv2-soft" id="rBack3">← Double Check</button><button class="rv2-btn rv2-primary" id="rConfirm" ${state.saving?'disabled':''}>${state.saving?'กำลังบันทึก...':'ยืนยันรับสินค้า'}</button></div>
      </section>`;
      $('#rBack3').onclick=()=>setStep(3);
      $('#rConfirm').onclick=confirmReceive;
    }
  }

  async function confirmReceive(){
    if(state.saving)return;
    state.saving=true;renderPhase();
    try{
      const session=(await sb.auth.getSession()).data.session;
      if(!session) throw new Error('Session หมดอายุ กรุณา Login ใหม่');

      const riNo=`RI-${new Date().toISOString().slice(2,10).replaceAll('-','')}-${String(Date.now()).slice(-6)}`;

      const {data:r,error:rErr}=await sb.from('receives').insert({
        ri_no:riNo,
        supplier_id:state.supplier_id,
        supplier_document_no:state.supplier_document_no,
        branch_id:state.branch_id,
        status:'PENDING_APPROVAL',
        note:`purchase_type=${state.purchase_type}`
      }).select().single();
      if(rErr) throw rErr;
      state.receiveId=r.id;

      // upload documents + OCR metadata
      for(let i=0;i<state.docs.length;i++){
        const d=state.docs[i];
        d.storage_path=await uploadFile(sb,d.file,`receives/${r.id}/documents`);
        const {error}=await sb.from('receive_documents').insert({
          receive_id:r.id,page_no:i+1,image_url:d.storage_path,ocr_text:d.ocr||null,
          ocr_data:{imeis:imei15(d.ocr||''),amount_candidates:amountCandidates(d.ocr||'')}
        });
        if(error) throw error;
      }

      const itemRows=[];
      for(const x of state.items){
        const imeiPath=x.imei_photo?await uploadFile(sb,x.imei_photo,`receives/${r.id}/imei`):null;
        const serialPath=x.serial_photo?await uploadFile(sb,x.serial_photo,`receives/${r.id}/serial`):null;
        itemRows.push({
          receive_id:r.id,product_id:x.product_id,unit_cost:Number(x.unit_cost||0),
          actual_imei:x.imei||null,actual_serial_no:x.serial||null,
          imei_photo_url:imeiPath,serial_photo_url:serialPath,
          imei_verified:true,serial_verified:true,double_check_passed:true
        });
      }
      const {error:iErr}=await sb.from('receive_items').insert(itemRows);
      if(iErr) throw iErr;

      const {error:rpcErr}=await sb.rpc('bb_finalize_receive',{p_receive_id:r.id});
      if(rpcErr) throw rpcErr;

      await reload();
      window.refreshAll?.();

      // Telegram: failure does not rollback receive
      try{
        await sb.functions.invoke('telegram-receive-notify',{body:{receive_id:r.id}});
      }catch(e){console.warn('Telegram notify failed',e)}

      $('#rv2Status').textContent='Received';
      toast(`✓ รับสินค้า ${state.items.length} เครื่องสำเร็จ`);
      state.saving=false;
      state.step=1;state.unlocked=1;state.docs=[];state.items=[];state.ocrText='';state.expectedQty=0;state.expectedValue=0;state.receiveId=null;
      renderPhase();
    }catch(e){
      console.error(e);toast(`บันทึกไม่สำเร็จ: ${e.message||e}`);
      state.saving=false;renderPhase();
    }
  }

  try{
    await master();
    renderPhase();
  }catch(e){
    console.error(e);
    root.innerHTML=`<div class="notice">โหลด Receive V2 ไม่สำเร็จ: ${esc(e.message||e)}</div>`;
  }
}
