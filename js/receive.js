export function renderReceive() {
  const root = document.querySelector('#receive');

  const state = {
    currentStep: 1,
    maxUnlocked: 1,

    documentPhoto: null,
    imeiPhoto: null,
    serialPhoto: null,

    step1Done: false,
    step2Done: false,
    step3Done: false,
    doubleChecked: false
  };

  root.innerHTML = `
    <div class="pagehead">
      <div>
        <small>Receive Wizard</small>
        <h1>รับสินค้า</h1>
        <p>ตรวจรับสินค้าแบบทีละขั้นตอน • ไม่สามารถข้ามขั้นได้</p>
      </div>
    </div>

    <div class="wizard" id="receiveWizard">
      ${[1,2,3,4,5].map((step) => `
        <button
          type="button"
          data-step="${step}"
          class="${step === 1 ? 'active' : ''}"
          ${step > 1 ? 'disabled' : ''}
        >
          ${step}
        </button>
      `).join('')}
    </div>

    <!-- STEP 1 -->
    <section class="card receive-step active" id="rs1">
      <h2>1. ตรวจเอกสารรับสินค้า</h2>
      <p>กรอกข้อมูล Supplier และถ่ายภาพเอกสารก่อนดำเนินการต่อ</p>

      <div class="form">
        <label>
          Supplier
          <select id="receiveSupplier">
            <option value="">-- เลือก Supplier --</option>
            <option value="NIRACHACOMMUNICATION CO.,LTD">
              NIRACHACOMMUNICATION CO.,LTD
            </option>
            <option value="PPLAN">PPLAN</option>
            <option value="ADVICE">ADVICE</option>
          </select>
        </label>

        <label>
          เลขเอกสาร Supplier
          <input
            id="supplierDocumentNo"
            placeholder="กรอกเลขเอกสาร Supplier"
          >
        </label>

        <label>
          เลข BIGBEAR
          <input
            id="bigbearReceiveNo"
            value="RI-PK-2608-0011"
            readonly
          >
        </label>

        <input
          type="file"
          id="documentCamera"
          accept="image/*"
          capture="environment"
          hidden
        >

        <button type="button" class="soft" id="takeDocumentPhoto">
          📷 ถ่ายเอกสาร
        </button>

        <div id="documentPreview"></div>

        <button type="button" class="primary full" id="finishStep1">
          ยืนยันเอกสาร และไปขั้นตอนถัดไป →
        </button>
      </div>
    </section>

    <!-- STEP 2 -->
    <section class="card receive-step" id="rs2">
      <h2>2. ตรวจสอบ IMEI</h2>
      <p>IMEI จากเอกสารและตัวเครื่องต้องตรงกัน</p>

      <div class="form">
        <label>
          IMEI จากเอกสาร
          <input
            id="di"
            inputmode="numeric"
            placeholder="กรอก IMEI จากเอกสาร"
          >
        </label>

        <label>
          IMEI จากตัวสินค้า
          <input
            id="ii"
            inputmode="numeric"
            placeholder="กรอก / Scan IMEI จากเครื่อง"
          >
        </label>

        <input
          type="file"
          id="imeiCamera"
          accept="image/*"
          capture="environment"
          hidden
        >

        <button type="button" class="soft" id="takeImeiPhoto">
          📷 ถ่ายรูป IMEI
        </button>

        <div id="imeiPreview"></div>

        <div class="notice" id="imeiStatus">
          รอตรวจสอบ IMEI
        </div>

        <div class="cols2">
          <button type="button" class="soft" id="backStep2">
            ← ย้อนกลับ
          </button>

          <button type="button" class="primary" id="finishStep2">
            ตรวจสอบ IMEI →
          </button>
        </div>
      </div>
    </section>

    <!-- STEP 3 -->
    <section class="card receive-step" id="rs3">
      <h2>3. ตรวจสอบ Serial Number</h2>
      <p>S/N จากเอกสารและตัวเครื่องต้องตรงกัน</p>

      <div class="form">
        <label>
          S/N จากเอกสาร
          <input
            id="ds"
            placeholder="กรอก Serial Number จากเอกสาร"
          >
        </label>

        <label>
          S/N จากสินค้า
          <input
            id="is"
            placeholder="กรอก / Scan Serial Number จากสินค้า"
          >
        </label>

        <input
          type="file"
          id="serialCamera"
          accept="image/*"
          capture="environment"
          hidden
        >

        <button type="button" class="soft" id="takeSerialPhoto">
          📷 ถ่ายรูป S/N
        </button>

        <div id="serialPreview"></div>

        <div class="notice" id="serialStatus">
          รอตรวจสอบ Serial Number
        </div>

        <div class="cols2">
          <button type="button" class="soft" id="backStep3">
            ← ย้อนกลับ
          </button>

          <button type="button" class="primary" id="finishStep3">
            ตรวจสอบ S/N →
          </button>
        </div>
      </div>
    </section>

    <!-- STEP 4 -->
    <section class="card receive-step" id="rs4">
      <h2>4. Double Check</h2>
      <p>ตรวจสอบข้อมูลทั้งหมดก่อนอนุญาตให้รับสินค้าเข้าระบบ</p>

      <div id="receiveSummary"></div>

      <div id="check" class="notice">
        กรุณากด Double Check
      </div>

      <button type="button" class="primary full" id="dc">
        ✓ Double Check
      </button>

      <button
        type="button"
        class="soft full"
        id="backStep4"
        style="margin-top:10px"
      >
        ← ย้อนกลับแก้ไข
      </button>
    </section>

    <!-- STEP 5 -->
    <section class="card receive-step" id="rs5">
      <h2>5. ยืนยันรับสินค้า</h2>
      <p>ขั้นตอนสุดท้ายก่อนสินค้าเข้าสู่ Inventory</p>

      <div id="finalReceiveSummary"></div>

      <div class="cols2">
        <div class="signature">
          ผู้รับ
          <div>อัศวิน ชานัย</div>
        </div>

        <div class="signature">
          เจ้าหน้าที่คลัง
          <div>พนักงานคลัง A</div>
        </div>
      </div>

      <button type="button" class="primary full" id="confirmR">
        ยืนยันรับสินค้า
      </button>

      <button
        type="button"
        class="soft full"
        id="backStep5"
        style="margin-top:10px"
      >
        ← ย้อนกลับตรวจสอบ
      </button>
    </section>
  `;

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];

  function showStep(step) {
    if (step > state.maxUnlocked) {
      toast(`กรุณาทำขั้นตอน ${state.maxUnlocked} ให้เสร็จก่อน`);
      return;
    }

    state.currentStep = step;

    $$('.receive-step').forEach(section => {
      section.classList.remove('active');
    });

    $$('.wizard [data-step]').forEach(button => {
      const buttonStep = Number(button.dataset.step);

      button.classList.toggle('active', buttonStep === step);
      button.disabled = buttonStep > state.maxUnlocked;
    });

    $(`#rs${step}`).classList.add('active');
  }

  function unlock(step) {
    state.maxUnlocked = Math.max(state.maxUnlocked, step);

    $$('.wizard [data-step]').forEach(button => {
      button.disabled =
        Number(button.dataset.step) > state.maxUnlocked;
    });
  }

  $$('.wizard [data-step]').forEach(button => {
    button.addEventListener('click', () => {
      const target = Number(button.dataset.step);

      // อนุญาตเฉพาะขั้นที่ปลดล็อกแล้ว
      if (target <= state.maxUnlocked) {
        showStep(target);
      }
    });
  });

  function photoPreview(input, preview, stateKey, label) {
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('กรุณาเลือกไฟล์รูปภาพ');
      input.value = '';
      return;
    }

    state[stateKey] = file;

    const url = URL.createObjectURL(file);

    preview.innerHTML = `
      <div style="
        margin-top:12px;
        padding:12px;
        border:1px solid #ddd;
        border-radius:14px;
      ">
        <strong>✓ ${label}</strong>

        <div style="margin-top:10px">
          <img
            src="${url}"
            alt="${label}"
            style="
              width:100%;
              max-height:280px;
              object-fit:contain;
              border-radius:10px;
              background:#f5f5f5;
            "
          >
        </div>

        <small>${file.name}</small>
      </div>
    `;
  }

  /* =====================
     STEP 1
  ====================== */

  $('#takeDocumentPhoto').onclick = () => {
    $('#documentCamera').click();
  };

  $('#documentCamera').onchange = () => {
    photoPreview(
      $('#documentCamera'),
      $('#documentPreview'),
      'documentPhoto',
      'บันทึกภาพเอกสารแล้ว'
    );
  };

  $('#finishStep1').onclick = () => {
    const supplier = $('#receiveSupplier').value;
    const documentNo =
      $('#supplierDocumentNo').value.trim();

    if (!supplier) {
      toast('กรุณาเลือก Supplier');
      $('#receiveSupplier').focus();
      return;
    }

    if (!documentNo) {
      toast('กรุณากรอกเลขเอกสาร Supplier');
      $('#supplierDocumentNo').focus();
      return;
    }

    if (!state.documentPhoto) {
      toast('กรุณาถ่ายภาพเอกสารก่อน');
      return;
    }

    state.step1Done = true;

    unlock(2);
    showStep(2);

    toast('✓ ขั้นตอนเอกสารผ่านแล้ว');
  };

  /* =====================
     STEP 2
  ====================== */

  $('#takeImeiPhoto').onclick = () => {
    $('#imeiCamera').click();
  };

  $('#imeiCamera').onchange = () => {
    photoPreview(
      $('#imeiCamera'),
      $('#imeiPreview'),
      'imeiPhoto',
      'บันทึกภาพ IMEI แล้ว'
    );
  };

  $('#finishStep2').onclick = () => {
    const documentImei = $('#di').value.trim();
    const productImei = $('#ii').value.trim();

    if (!documentImei || !productImei) {
      $('#imeiStatus').textContent =
        '⚠ กรุณากรอก IMEI ทั้งสองช่อง';

      toast('กรุณากรอก IMEI ให้ครบ');
      return;
    }

    if (documentImei !== productImei) {
      $('#imeiStatus').textContent =
        '❌ IMEI ไม่ตรงกัน ไม่สามารถไปต่อได้';

      toast('IMEI ไม่ตรงกัน');
      return;
    }

    if (!state.imeiPhoto) {
      $('#imeiStatus').textContent =
        '⚠ กรุณาถ่ายรูป IMEI';

      toast('กรุณาถ่ายรูป IMEI');
      return;
    }

    $('#imeiStatus').textContent =
      '✓ IMEI ตรงกัน';

    state.step2Done = true;

    unlock(3);
    showStep(3);

    toast('✓ IMEI ผ่านการตรวจสอบ');
  };

  $('#backStep2').onclick = () => showStep(1);

  /* =====================
     STEP 3
  ====================== */

  $('#takeSerialPhoto').onclick = () => {
    $('#serialCamera').click();
  };

  $('#serialCamera').onchange = () => {
    photoPreview(
      $('#serialCamera'),
      $('#serialPreview'),
      'serialPhoto',
      'บันทึกภาพ S/N แล้ว'
    );
  };

  $('#finishStep3').onclick = () => {
    const documentSerial = $('#ds').value.trim();
    const productSerial = $('#is').value.trim();

    if (!documentSerial || !productSerial) {
      $('#serialStatus').textContent =
        '⚠ กรุณากรอก S/N ทั้งสองช่อง';

      toast('กรุณากรอก S/N ให้ครบ');
      return;
    }

    if (documentSerial !== productSerial) {
      $('#serialStatus').textContent =
        '❌ S/N ไม่ตรงกัน ไม่สามารถไปต่อได้';

      toast('S/N ไม่ตรงกัน');
      return;
    }

    if (!state.serialPhoto) {
      $('#serialStatus').textContent =
        '⚠ กรุณาถ่ายรูป S/N';

      toast('กรุณาถ่ายรูป S/N');
      return;
    }

    $('#serialStatus').textContent =
      '✓ Serial Number ตรงกัน';

    state.step3Done = true;

    unlock(4);

    renderSummary();

    showStep(4);

    toast('✓ Serial Number ผ่านการตรวจสอบ');
  };

  $('#backStep3').onclick = () => showStep(2);

  /* =====================
     SUMMARY
  ====================== */

  function renderSummary() {
    const html = `
      <div class="drillcard">
        <b>Supplier</b>
        <small>${$('#receiveSupplier').value}</small>
      </div>

      <div class="drillcard">
        <b>เลขเอกสาร Supplier</b>
        <small>${$('#supplierDocumentNo').value}</small>
      </div>

      <div class="drillcard">
        <b>เลข BIGBEAR</b>
        <small>${$('#bigbearReceiveNo').value}</small>
      </div>

      <div class="drillcard">
        <b>IMEI</b>
        <small>${$('#ii').value}</small>
      </div>

      <div class="drillcard">
        <b>Serial Number</b>
        <small>${$('#is').value}</small>
      </div>
    `;

    $('#receiveSummary').innerHTML = html;
    $('#finalReceiveSummary').innerHTML = html;
  }

  /* =====================
     STEP 4
  ====================== */

  $('#dc').onclick = () => {
    if (
      !state.step1Done ||
      !state.step2Done ||
      !state.step3Done
    ) {
      $('#check').textContent =
        '❌ ข้อมูลก่อนหน้ายังไม่สมบูรณ์';

      return;
    }

    const imeiOK =
      $('#di').value.trim() ===
      $('#ii').value.trim();

    const serialOK =
      $('#ds').value.trim() ===
      $('#is').value.trim();

    if (!imeiOK || !serialOK) {
      $('#check').textContent =
        '❌ พบข้อมูลไม่ตรงกัน กรุณาย้อนกลับแก้ไข';

      toast('Double Check ไม่ผ่าน');
      return;
    }

    state.doubleChecked = true;

    $('#check').textContent =
      '✓ Double Check ผ่าน ข้อมูลถูกต้องครบถ้วน';

    unlock(5);
    renderSummary();

    setTimeout(() => {
      showStep(5);
    }, 400);

    toast('✓ Double Check ผ่าน');
  };

  $('#backStep4').onclick = () => showStep(3);

  /* =====================
     STEP 5
  ====================== */

  $('#backStep5').onclick = () => showStep(4);

  $('#confirmR').onclick = () => {
    if (!state.doubleChecked) {
      toast('กรุณา Double Check ก่อนรับสินค้า');
      showStep(4);
      return;
    }

    $('#confirmR').disabled = true;
    $('#confirmR').textContent =
      'กำลังบันทึกการรับสินค้า...';

    /*
      ขั้นถัดไป:
      INSERT receives
      INSERT receive_items
      CALL bb_finalize_receive()
      reload()
      refreshAll()
    */

    setTimeout(() => {
      toast(
        '✓ Flow ตรวจรับผ่านครบ 5 ขั้นตอน — พร้อมเชื่อม Supabase'
      );

      $('#confirmR').disabled = false;
      $('#confirmR').textContent =
        'ยืนยันรับสินค้า';
    }, 600);
  };
}
