// ---------- PHÂN QUYỀN THANH TOÁN ----------
async function getPaymentAssignees() { return await metaGet("payment_assignees:" + CUR.project, []); }
async function setPaymentAssignees(arr) { return await metaSet("payment_assignees:" + CUR.project, arr); }

async function getPaymentRoles() {
  const isManager = CUR_USER && (isAdminLikeRole(CUR_USER.role) || ["pm", "site_manager"].includes(CUR_USER.role));
  const assignees = await getPaymentAssignees();
  const isAssignee = CUR_USER && assignees.includes(CUR_USER.id);
  const canEdit = isManager || isAssignee;
  return { isManager, isAssignee, canEdit, assignees };
}

async function renderPaymentAssigneesBlock() {
  const { isManager, assignees } = await getPaymentRoles();
  const btnAssign = document.getElementById("btn-assign-payment");
  const listEl = document.getElementById("payment-assignees-list");
  if(!listEl) return;
  
  if(isManager) {
    if(btnAssign) btnAssign.classList.remove("hide");
  } else {
    if(btnAssign) btnAssign.classList.add("hide");
  }
  
  const team = await metaGet("team:" + CUR.project, []);
  if(!assignees.length) {
    listEl.innerHTML = '<span class="muted">Chưa có ai được giao quyền. Chỉ Manager mới có quyền thao tác.</span>';
    return;
  }
  
  listEl.innerHTML = assignees.map(userId => {
    const mem = team.find(m => m.id === userId);
    const name = mem ? mem.name : userId;
    return '<span class="badge" style="background:var(--primary-light); color:var(--primary); font-size:12px;">' + esc(name) + '</span>';
  }).join("");
}

async function openPaymentAssignModal() {
  const team = await metaGet("team:" + CUR.project, []);
  const assignees = await getPaymentAssignees();
  const container = document.getElementById("payment-assign-checkboxes");
  
  // Lọc lấy các kỹ sư thi công, kế toán (hoặc lấy tất cả team)
  const candidates = team.filter(m => m.status !== "finished" && !(isAdminLikeRole(m.role) || ["pm", "site_manager"].includes(m.role)));
  
  if(!candidates.length) {
    container.innerHTML = '<p class="muted">Không có nhân sự nào để giao quyền (trừ các Manager).</p>';
  } else {
    container.innerHTML = candidates.map(m => {
      const checked = assignees.includes(m.id) ? "checked" : "";
      return '<label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="checkbox" class="payment-assignee-cb" value="' + m.id + '" ' + checked + '> ' + esc(m.name) + ' <span class="muted">(' + (ROLES[m.role]?ROLES[m.role].label:m.role) + ')</span></label>';
    }).join("");
  }
  document.getElementById("payment-assign-modal").classList.remove("hide");
}

function closePaymentAssignModal() {
  document.getElementById("payment-assign-modal").classList.add("hide");
}

async function savePaymentAssignees() {
  const checkboxes = document.querySelectorAll(".payment-assignee-cb");
  const selected = [];
  checkboxes.forEach(cb => { if(cb.checked) selected.push(cb.value); });
  await setPaymentAssignees(selected);
  closePaymentAssignModal();
  renderPaymentAssigneesBlock();
  
  // Tự động reload lại tab nếu đang mở
  renderCdt();
  renderSubconPayments();
  if(typeof renderExpenses === 'function') renderExpenses();
}

function renderStatusBadge(status) {
  if (status === 'pending') return '<span class="badge" style="background:var(--warn);color:#000;">⏳ Chờ duyệt</span>';
  if (status === 'rejected') return '<span class="badge" style="background:var(--danger);color:#fff;">❌ Từ chối</span>';
  return '<span class="badge" style="background:var(--success);color:#fff;">✅ Đã duyệt</span>';
}


// ---------- THANH TOÁN CDT ----------
function cdtKey(){ return "cdt:"+CUR.project; }
async function getCdt(){ return await metaGet(cdtKey(), []); }
async function setCdt(arr){ return metaSet(cdtKey(), arr); }
async function renderCdt(){
  const ed=$("cdt-editor"); if(ed) ed.classList.add("hide");
  const dots=await getCdt(); const w=$("cdt-list"); const t=todayISO();
  if(!dots.length){ w.innerHTML = renderEmptyState('💵', 'Chưa có đợt thanh toán', 'Dự án này chưa được thiết lập kế hoạch thanh toán từ CĐT.'); return; }
  w.innerHTML=dots.map(dot=>{
    const allDone=dot.conditions.length>0 && dot.conditions.every(c=>c.done);
    const badge=allDone?'<span class="pill pill-ok">Đủ điều kiện thanh toán</span>':'<span class="pill pill-off">Chưa đủ điều kiện</span>';
    const conds=dot.conditions.map(c=>{
      if(c.done) return '<li>'+esc(c.desc)+' — <span class="pill pill-ok">Đã hoàn thành</span></li>';
      if(c.due && t>c.due) return '<li>'+esc(c.desc)+' <span class="pill pill-overdue">quá hạn ('+fmtVN(c.due)+')</span></li>';
      if(c.due) return '<li>'+esc(c.desc)+' — dự kiến '+fmtVN(c.due)+' (còn '+Math.max(0,daysBetween(t,c.due))+' ngày)</li>';
      return '<li>'+esc(c.desc)+'</li>';
    }).join("");
    const val=Number(dot.val)||0, paid=Number(dot.paid)||0, remain=val-paid;
    const money=(val||paid)?'<div class="muted" style="margin:6px 0;font-size:13px">Giá trị đợt: <b>'+val.toLocaleString('vi-VN')+'</b> đ · Đã thu: <b style="color:var(--success)">'+paid.toLocaleString('vi-VN')+'</b> đ · Còn lại: <b style="color:var(--warning)">'+remain.toLocaleString('vi-VN')+'</b> đ</div>':'';
    return '<div class="cdt-card"><div class="hd"><b>'+esc(dot.name)+'</b><span>'+badge
      +' <button class="btn btn-mut btn-sm" onclick="cdtEdit(\''+dot.id+'\')">Sửa</button>'
      +' <button class="btn btn-dan btn-sm" onclick="cdtDelete(\''+dot.id+'\')">Xóa</button></span></div>'
      +money+'<ul>'+conds+'</ul></div>';
  }).join("");
}
let CDT_EDIT=null;
function cdtAddCond(c){
  const done=c&&c.done;
  const row=el("div","cond-row");
  row.innerHTML='<input type="text" class="cd-desc" placeholder="Mô tả công việc cần hoàn thành (VD: Hoàn thành móng xưởng 1)" value="'+esc(c?c.desc:"")+'">'
    +'<label class="cd-chk"><input type="checkbox" class="cd-done" '+(done?"checked":"")+' onchange="cdtToggle(this)"> Đã HT</label>'
    +'<input type="date" class="cd-due" title="Ngày dự kiến hoàn thành" value="'+(c&&c.due?c.due:"")+'" '+(done?"disabled":"")+'>'
    +'<button class="btn btn-dan btn-sm" onclick="this.closest(\'.cond-row\').remove()">✕</button>';
  $("cdt-conds").appendChild(row);
}
function cdtToggle(cb){ const due=cb.closest(".cond-row").querySelector(".cd-due"); due.disabled=cb.checked; if(cb.checked) due.value=""; }
function showCdtEditor(){ const e=$("cdt-editor"); e.classList.remove("hide"); e.scrollIntoView({behavior:"smooth",block:"start"}); }
function openCdtModal(){ CDT_EDIT=null; $("cdt-modal-title").textContent="Thêm đợt thanh toán"; $("cdt-name").value=""; if($("cdt-val"))$("cdt-val").value=""; if($("cdt-paid"))$("cdt-paid").value=""; $("cdt-conds").innerHTML=""; cdtAddCond(); showCdtEditor(); }
function closeCdtModal(){ $("cdt-editor").classList.add("hide"); }
async function cdtEdit(id){
  const dot=(await getCdt()).find(d=>d.id===id); if(!dot) return;
  CDT_EDIT=id; $("cdt-modal-title").textContent="Sửa đợt thanh toán"; $("cdt-name").value=dot.name;
  if($("cdt-val"))$("cdt-val").value=dot.val||""; if($("cdt-paid"))$("cdt-paid").value=dot.paid||"";
  $("cdt-conds").innerHTML=""; dot.conditions.forEach(cdtAddCond); showCdtEditor();
}
async function cdtSave(){
  const name=$("cdt-name").value.trim(); if(!name){ alert("Nhập tên đợt"); return; }
  const val=Number($("cdt-val") && $("cdt-val").value)||0;
  const paid=Number($("cdt-paid") && $("cdt-paid").value)||0;
  const conditions=[].slice.call($("cdt-conds").children).map(r=>({
    desc:r.querySelector(".cd-desc").value.trim(),
    done:r.querySelector(".cd-done").checked,
    due:r.querySelector(".cd-due").value||null,
  })).filter(c=>c.desc);
  const dots=await getCdt();
  if(CDT_EDIT){ const d=dots.find(x=>x.id===CDT_EDIT); d.name=name; d.val=val; d.paid=paid; d.conditions=conditions; }
  else dots.push({id:uuid(), name, val, paid, conditions});
  await setCdt(dots); await audit(CDT_EDIT?"Sửa đợt thanh toán":"Tạo đợt thanh toán", name); closeCdtModal(); renderCdt();
}
async function cdtDelete(id){ if(confirm("Xóa đợt thanh toán này?")){ await setCdt((await getCdt()).filter(d=>d.id!==id)); await audit("Xóa đợt thanh toán",""); renderCdt(); } }


// ---------- THANH TOÁN NHÀ THẦU (MOCK AI) ----------
function subconKey(){ return "subcon_payments:"+CUR.project; }
async function getSubcon(){ return await metaGet(subconKey(), []); }
async function setSubcon(arr){ return metaSet(subconKey(), arr); }

async function renderSubconPayments() {
  const list = await getSubcon();
  const tbody = document.getElementById("subcon-list");
  const totalEl = document.getElementById("subcon-total-amount");
  if (!tbody || !totalEl) return;
  
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5">' + renderEmptyState('📋', 'Chưa có đề nghị', 'Chưa có đề nghị thanh toán nhà thầu nào. Kéo thả file phía trên để thêm mới.') + '</td></tr>';
    totalEl.textContent = "0";
    return;
  }
  
  let total = 0;
  tbody.innerHTML = list.map((item, index) => {
    total += Number(item.amount) || 0;
    return `<tr>
      <td style="text-align:center; color:var(--muted);">${index + 1}</td>
      <td style="font-weight:600; color:var(--text-strong);">${esc(item.contractNo || "Công nhật / Không số")}</td>
      <td style="font-weight:700; color:var(--primary);">${esc(item.contractor)}</td>
      <td style="text-align:right; font-weight:bold; color:var(--danger);">${Number(item.amount).toLocaleString('vi-VN')}</td>
      <td style="text-align:center;"><button class="btn btn-dan btn-sm" onclick="deleteSubconPayment('${item.id}')">Xóa</button></td>
    </tr>`;
  }).join("");
  
  totalEl.textContent = total.toLocaleString('vi-VN');
  
  if(typeof updateTcKpis === 'function') updateTcKpis();
}

// Override renderCdt to also render subcon payments & expenses
const _oldRenderCdt = renderCdt;
renderCdt = async function() {
  await renderPaymentAssigneesBlock();
  await _oldRenderCdt();
  await renderSubconPayments();
  if(typeof renderExpenses === 'function') await renderExpenses();
  if(typeof updateTcKpis === 'function') await updateTcKpis();
}

function processSubconDrop(e) {
  let files = [];
  if (e.dataTransfer && e.dataTransfer.files) files = Array.from(e.dataTransfer.files);
  else if (e.target && e.target.files) files = Array.from(e.target.files);
  
  if (!files.length) return;
  
  // Reset file input so user can drop same file again if needed
  const fileInput = document.getElementById("subcon-file");
  if(fileInput) fileInput.value = "";
  
  // Show loading
  document.getElementById("subcon-drop").classList.add("hide");
  document.getElementById("ai-loading").classList.remove("hide");
  
  // Mock AI Processing (1.5 seconds)
  setTimeout(async () => {
    document.getElementById("ai-loading").classList.add("hide");
    document.getElementById("subcon-drop").classList.remove("hide");
    
    if (files.length === 1) {
      openAiModal();
    } else {
      const mocks = [
        { contractor: "Công Ty TNHH MTV TM - DV Hoàng Ngân Phát", contractNo: "1909/2025/HĐGK/TH", amount: 381355474, note: "Tổng giá trị thanh toán đợt 2" },
        { contractor: "Lương công nhân (BCH)", contractNo: "Đợt 13", amount: 38238125, note: "Từ 28/03 đến 12/04" },
        { contractor: "Tổ đội Trần Văn Cảnh", contractNo: "2501/2026/HĐGK/TSWEN HOEI", amount: 40461953, note: "Thanh toán đợt 3 (95%)" }
      ];
      const list = await getSubcon();
      let total = 0;
      const { isManager } = await getPaymentRoles();
      const status = isManager ? 'approved' : 'pending';
      files.forEach(f => {
        const data = mocks[Math.floor(Math.random() * mocks.length)];
        list.push({ id: uuid(), contractor: data.contractor, contractNo: data.contractNo, amount: data.amount, note: data.note, date: todayISO(), status });
        total += data.amount;
      });
      await setSubcon(list);
      await audit("Duyệt thanh toán hàng loạt", `Thêm ${files.length} hồ sơ - Tổng: ${total.toLocaleString('vi-VN')} đ`);
      renderSubconPayments();
      alert(`Đã bóc tách tự động và thêm ${files.length} hồ sơ thanh toán thành công!`);
    }
  }, 1500);
}

function openAiModal() {
  // Randomly select 1 of 3 mocked datasets based on user's images
  const mocks = [
    { contractor: "Công Ty TNHH MTV TM - DV Hoàng Ngân Phát", contractNo: "1909/2025/HĐGK/TH", amount: 381355474, note: "Tổng giá trị thanh toán đợt 2" },
    { contractor: "Lương công nhân (BCH)", contractNo: "Đợt 13", amount: 38238125, note: "Từ 28/03 đến 12/04" },
    { contractor: "Tổ đội Trần Văn Cảnh", contractNo: "2501/2026/HĐGK/TSWEN HOEI", amount: 40461953, note: "Thanh toán đợt 3 (95%)" }
  ];
  const data = mocks[Math.floor(Math.random() * mocks.length)];
  
  document.getElementById("ai-contractor").value = data.contractor;
  document.getElementById("ai-contract-no").value = data.contractNo;
  document.getElementById("ai-amount").value = data.amount;
  document.getElementById("ai-note").value = data.note;
  
  const modal = document.getElementById("ai-modal");
  modal.classList.remove("hide");
  modal.scrollIntoView({behavior: "smooth", block: "start"});
}

function closeAiModal() {
  document.getElementById("ai-modal").classList.add("hide");
}

async function saveSubconPayment() {
  const contractor = document.getElementById("ai-contractor").value.trim();
  const contractNo = document.getElementById("ai-contract-no").value.trim();
  const amount = Number(document.getElementById("ai-amount").value) || 0;
  const note = document.getElementById("ai-note").value.trim();
  
  if (!contractor || amount <= 0) {
    alert("Vui lòng nhập tên nhà thầu và số tiền đề nghị > 0.");
    return;
  }
  
  const { isManager } = await getPaymentRoles();
  const status = isManager ? 'approved' : 'pending';
  
  const list = await getSubcon();
  list.push({ id: uuid(), contractor, contractNo, amount, note, date: todayISO(), status });
  await setSubcon(list);
  
  await audit("Khai báo thanh toán Nhà thầu", contractor + " - " + amount.toLocaleString('vi-VN'));
  
  closeAiModal();
  renderSubconPayments();
  updateTcKpis();
}

async function deleteSubconPayment(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa bản ghi thanh toán này?")) return;
  const list = await getSubcon();
  await setSubcon(list.filter(x => x.id !== id));
  await audit("Xóa thanh toán Nhà thầu", "");
  renderSubconPayments();
}

async function clearSubconData() {
  if (!confirm("Xóa toàn bộ dữ liệu thanh toán Nhà thầu của dự án này?")) return;
  await setSubcon([]);
  renderSubconPayments();
}

// ==================== PHẦN 3: BẢNG KÊ CHI PHÍ ====================
async function getExpenses() { return await metaGet("expenses:" + CUR.project, []); }
async function setExpenses(data) { await metaSet("expenses:" + CUR.project, data); }

function readMoneyVN(number) {
    if (number === 0) return "Không đồng";
    const defaultNumbers = " hai ba bốn năm sáu bảy tám chín";
    const units = ("1 một" + defaultNumbers).split(" ");
    const tens = ("lẻ mười" + defaultNumbers).split(" ");
    const hundreds = ("không một" + defaultNumbers).split(" ");
    
    function convertBlock(n) {
        let str = "";
        let h = Math.floor(n / 100);
        let t = Math.floor((n % 100) / 10);
        let u = n % 10;
        
        if (h > 0) str += hundreds[h] + " trăm ";
        if (t > 0) {
            str += tens[t] + " ";
        } else if (h > 0 && u > 0) {
            str += "lẻ ";
        }
        
        if (u > 0) {
            if (t > 1 && u === 1) str += "mốt ";
            else if (t > 0 && u === 5) str += "lăm ";
            else str += units[u] + " ";
        }
        return str.trim();
    }
    
    let str = "";
    let billions = Math.floor(number / 1e9);
    number = number % 1e9;
    let millions = Math.floor(number / 1e6);
    number = number % 1e6;
    let thousands = Math.floor(number / 1e3);
    number = number % 1e3;
    let unitsBlock = Math.floor(number);
    
    if (billions > 0) str += convertBlock(billions) + " tỷ ";
    if (millions > 0) str += convertBlock(millions) + " triệu ";
    if (thousands > 0) str += convertBlock(thousands) + " nghìn ";
    if (unitsBlock > 0) str += convertBlock(unitsBlock) + " ";
    
    str = str.trim() + " đồng";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

let currentExpenseAiFiles = []; // Tạm lưu các file dạng Base64

function processExpenseDrop(e) {
  let files = [];
  if (e.dataTransfer && e.dataTransfer.files) files = Array.from(e.dataTransfer.files);
  else if (e.target && e.target.files) files = Array.from(e.target.files);
  if (!files.length) return;
  
  const fileInput = document.getElementById("expense-file");
  if(fileInput) fileInput.value = "";
  
  document.getElementById("expense-drop").classList.add("hide");
  document.getElementById("expense-loading").classList.remove("hide");
  
  currentExpenseAiFiles = [];
  let readPromises = files.map(file => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
              currentExpenseAiFiles.push({
                  name: file.name,
                  type: file.type,
                  data: event.target.result,
                  blobUrl: URL.createObjectURL(file),
                  date_scanned: todayISO(),
                  timestamp: new Date().getTime()
              });
              resolve();
          };
          reader.readAsDataURL(file);
      });
  });
  
  Promise.all(readPromises).then(() => {
      setTimeout(() => {
        document.getElementById("expense-loading").classList.add("hide");
        document.getElementById("expense-drop").classList.remove("hide");
        
        const mockItems = [
          { desc: "Lơ 90", unit: "Cái", qty: 5, price: 15000, purpose: "Thi công công tác tạm" },
          { desc: "Ống 90", unit: "Cây", qty: 1, price: 80000, purpose: "Thi công công tác tạm" },
          { desc: "Băng keo điện", unit: "Cuộn", qty: 4, price: 8000, purpose: "Thi công công tác tạm" },
          { desc: "Dây hơi 10li", unit: "m", qty: 1, price: 10000, purpose: "Thi công cổng công trình" },
          { desc: "Bản lề lá", unit: "Cái", qty: 4, price: 15000, purpose: "Vật tư phụ" },
          { desc: "Đá cắt 1T", unit: "Cái", qty: 2, price: 25000, purpose: "Gia công cơ khí" },
          { desc: "Cáp mạng CAT6", unit: "m", qty: 50, price: 6000, purpose: "Sửa mạng cho CĐT" },
          { desc: "Bulong - Tán", unit: "Kg", qty: 2, price: 30000, purpose: "Gia công bệ máy" }
        ];
        
        let selected = [];
        files.forEach(f => {
            // Đọc TOÀN BỘ file: bóc tách 8 đến 15 dòng mỗi file
            const numItems = Math.floor(Math.random() * 8) + 8; 
            for(let i=0; i<numItems; i++) {
                selected.push({...mockItems[Math.floor(Math.random() * mockItems.length)]});
            }
        });
        
        openExpenseAiModal(selected);
      }, 1500);
  });
}

let currentExpenseAiItems = [];

function openExpenseAiModal(items) {
    currentExpenseAiItems = items.map(it => ({
        id: uuid(),
        desc: it.desc,
        unit: it.unit,
        qty: it.qty,
        price: it.price,
        purpose: it.purpose || ""
    }));
    
    // Render images to the left pane
    const previewContainer = document.getElementById("expense-ai-preview");
    if(previewContainer) {
        let html = '<div style="position:relative; width:100%; min-height:100%;">';
        html += '<div id="expense-ai-bbox" class="bounding-box hide"></div>';
        if(currentExpenseAiFiles && currentExpenseAiFiles.length > 0) {
            html += currentExpenseAiFiles.map(f => {
                const src = f.blobUrl || f.data;
                if(f.type && f.type.startsWith('image/')) return `<img src="${src}" style="width:100%; height:auto; margin-bottom:10px; border-radius:4px;">`;
                if(f.type === 'application/pdf') return `<iframe src="${src}#toolbar=0" style="width:100%; height:80vh; border:none; margin-bottom:10px;"></iframe>`;
                return `<div style="padding:20px; background:#eee; text-align:center;">File không hiển thị được: ${f.name}</div>`;
            }).join('');
        }
        html += '</div>';
        previewContainer.innerHTML = html;
    }
    
    renderExpenseAiRows();
    const modal = document.getElementById("expense-ai-modal");
    modal.classList.remove("hide");
    modal.scrollIntoView({behavior: "smooth", block: "start"});
}

function closeExpenseAiModal() { document.getElementById("expense-ai-modal").classList.add("hide"); }

function renderExpenseAiRows() {
    const tbody = document.getElementById("expense-ai-tbody");
    if(!currentExpenseAiItems.length) {
        tbody.innerHTML = `<tr><td colspan="7">${renderEmptyState('🤖', 'Không tìm thấy dữ liệu', 'Trình AI chưa trích xuất được dòng hóa đơn nào từ hình ảnh/PDF.')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = currentExpenseAiItems.map((item, i) => `
      <tr>
        <td><input type="text" class="input" value="${item.desc}" onfocus="focusAiItem(${i})" onchange="updateExpenseAiItem(${i}, 'desc', this.value)"></td>
        <td><input type="text" class="input" value="${item.unit}" onfocus="focusAiItem(${i})" onchange="updateExpenseAiItem(${i}, 'unit', this.value)"></td>
        <td><input type="number" class="input" value="${item.qty}" onfocus="focusAiItem(${i})" onchange="updateExpenseAiItem(${i}, 'qty', this.value)"></td>
        <td><input type="number" class="input" value="${item.price}" onfocus="focusAiItem(${i})" onchange="updateExpenseAiItem(${i}, 'price', this.value)"></td>
        <td style="text-align:right; font-weight:bold; color:var(--primary)">${(item.qty * item.price).toLocaleString('vi-VN')}</td>
        <td><input type="text" class="input" value="${item.purpose}" onfocus="focusAiItem(${i})" onchange="updateExpenseAiItem(${i}, 'purpose', this.value)"></td>
        <td style="text-align:center"><button class="btn btn-dan btn-sm" onclick="removeExpenseAiRow(${i})">X</button></td>
      </tr>
    `).join("");
}

// Bounding Box Simulation
function focusAiItem(index) {
    const bbox = document.getElementById("expense-ai-bbox");
    if(!bbox || !currentExpenseAiFiles.length) return;
    
    // Simulate finding the bounding box sequentially across the documents
    const numItems = currentExpenseAiItems.length;
    const progress = numItems > 1 ? (index / (numItems - 1)) : 0;
    
    // Base position goes from 5% to 95% of the total height
    const baseTop = 5 + (progress * 90); 
    
    // Add slight deterministic noise based on index so it doesn't look perfectly rigid
    const noise = ((index * 37) % 5) - 2.5; 
    const topPercent = baseTop + noise;
    
    // X position randomly distributed but biased towards left-center
    const leftPercent = 10 + ((index * 97) % 40); 
    
    // Box dimensions
    const widthPercent = 20 + ((index * 13) % 15);
    const heightPercent = 2 + ((index * 7) % 3);
    
    bbox.style.top = topPercent + '%';
    bbox.style.left = leftPercent + '%';
    bbox.style.width = widthPercent + '%';
    bbox.style.height = heightPercent + '%';
    
    bbox.classList.remove("hide");
    
    // Scroll the preview pane to the box
    const scrollPane = document.getElementById("expense-ai-preview");
    if(scrollPane) {
        // approximate scroll position (center the box vertically in the viewport)
        const scrollTarget = (scrollPane.scrollHeight * (topPercent / 100)) - (scrollPane.clientHeight / 2);
        scrollPane.scrollTo({ top: scrollTarget > 0 ? scrollTarget : 0, behavior: 'smooth' });
    }
}

function updateExpenseAiItem(index, field, value) {
    if(field === 'qty' || field === 'price') value = Number(value) || 0;
    currentExpenseAiItems[index][field] = value;
    renderExpenseAiRows();
}

function addExpenseAiRow() {
    currentExpenseAiItems.push({ id: uuid(), desc: "", unit: "Cái", qty: 1, price: 0, purpose: "" });
    renderExpenseAiRows();
}

function removeExpenseAiRow(index) {
    currentExpenseAiItems.splice(index, 1);
    renderExpenseAiRows();
}

async function getExpenseDocs() { return await metaGet("expense_docs:" + CUR.project, []); }
async function setExpenseDocs(data) { await metaSet("expense_docs:" + CUR.project, data); }

async function saveExpenseAi() {
    if(currentExpenseAiItems.length === 0) return;
    
    const { isManager } = await getPaymentRoles();
    const status = isManager ? 'approved' : 'pending';
    
    const list = await getExpenses();
    const docs = await getExpenseDocs();
    const curMonth = document.getElementById("expense-month").value || todayISO().substring(0,7);
    
    currentExpenseAiItems.forEach(it => {
        if(it.desc.trim()) {
            list.push({
                id: uuid(),
                desc: it.desc.trim(),
                unit: it.unit.trim(),
                qty: it.qty,
                price: it.price,
                total: it.qty * it.price,
                purpose: it.purpose.trim(),
                place: "",
                note: "",
                date_scanned: todayISO(),
                month: curMonth,
                status: status
            });
        }
    });
    
    currentExpenseAiFiles.forEach(f => {
        docs.push({ ...f, id: uuid(), month: curMonth });
    });
    
    await setExpenses(list);
    await setExpenseDocs(docs);
    await audit("Khai báo chi phí lẻ", "Thêm " + currentExpenseAiItems.length + " chi phí");
    closeExpenseAiModal();
    currentExpenseAiFiles = []; // clear
    renderExpenses();
    updateTcKpis();
}
async function renderExpenses() {
    const list = await getExpenses();
    const curMonth = document.getElementById("expense-month").value;
    
    let filtered = list;
    if(curMonth) {
        filtered = list.filter(x => x.month === curMonth);
    }
    
    const tbody = document.getElementById("expense-tbody");
    if(!tbody) return;
    let html = "";
    let total = 0;
    
    filtered.forEach((x, index) => {
        total += x.total;
        html += `
            <tr>
                <td style="text-align:center">${index + 1}</td>
                <td><input type="text" class="input expense-edit" value="${x.desc}" onchange="updateExpenseData('${x.id}', 'desc', this.value)" style="border:none;background:transparent;width:100%;padding:0"></td>
                <td><input type="text" class="input expense-edit" value="${x.unit}" onchange="updateExpenseData('${x.id}', 'unit', this.value)" style="border:none;background:transparent;width:100%;padding:0"></td>
                <td><input type="number" class="input expense-edit" value="${x.qty}" onchange="updateExpenseData('${x.id}', 'qty', this.value)" style="border:none;background:transparent;width:100%;padding:0;text-align:right"></td>
                <td><input type="number" class="input expense-edit" value="${x.price}" onchange="updateExpenseData('${x.id}', 'price', this.value)" style="border:none;background:transparent;width:100%;padding:0;text-align:right"></td>
                <td style="text-align:right; font-weight:bold">${(x.total).toLocaleString('vi-VN')}</td>
                <td><input type="text" class="input expense-edit" value="${x.purpose}" onchange="updateExpenseData('${x.id}', 'purpose', this.value)" style="border:none;background:transparent;width:100%;padding:0"></td>
                <td><input type="text" class="input expense-edit" value="${x.place||''}" onchange="updateExpenseData('${x.id}', 'place', this.value)" style="border:none;background:transparent;width:100%;padding:0"></td>
                <td><input type="text" class="input expense-edit" value="${x.note||''}" onchange="updateExpenseData('${x.id}', 'note', this.value)" style="border:none;background:transparent;width:100%;padding:0"></td>
                <td class="no-print" style="text-align:center"><button class="btn btn-dan btn-sm" onclick="delExpense('${x.id}')">Xóa</button></td>
            </tr>
        `;
    });
    
    if(!filtered.length) {
        html = `<tr><td colspan="10" style="text-align:center" class="muted">Không có chi phí nào trong tháng này.</td></tr>`;
    }
    
    tbody.innerHTML = html;
    document.getElementById("expense-total").innerText = total.toLocaleString('vi-VN');
    document.getElementById("expense-total-words").innerText = readMoneyVN(total);
    
    if(typeof updateTcKpis === 'function') updateTcKpis();
}

async function updateExpenseData(id, field, value) {
    const list = await getExpenses();
    const item = list.find(x => x.id === id);
    if(item) {
        if(field === 'qty' || field === 'price') value = Number(value)||0;
        item[field] = value;
        if(field === 'qty' || field === 'price') item.total = item.qty * item.price;
        await setExpenses(list);
        renderExpenses();
    }
}

async function delExpense(id) {
    if(!confirm("Xóa dòng chi phí này?")) return;
    const list = await getExpenses();
    await setExpenses(list.filter(x => x.id !== id));
    renderExpenses();
}

async function clearExpenseData() {
    if(!confirm("XÓA TOÀN BỘ dữ liệu chi phí của dự án này? Thao tác không thể phục hồi!")) return;
    await setExpenses([]);
    renderExpenses();
}

function printExpenseReport() {
    const backupTitle = document.title;
    document.title = "Bang_ke_chi_phi_" + todayISO();
    
    const style = document.createElement('style');
    style.id = 'print-style';
    style.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            #expense-print-area, #expense-print-area * { visibility: visible; }
            #expense-print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
            .print-only { display: flex !important; }
            .expense-edit { border: none !important; appearance: none; -moz-appearance: none; -webkit-appearance: none; }
            @page { size: A4 landscape; margin: 1cm; }
        }
    `;
    document.head.appendChild(style);
    
    document.getElementById("expense-signatures").classList.remove("hide");
    window.print();
    document.getElementById("expense-signatures").classList.add("hide");
    
    document.getElementById('print-style').remove();
    document.title = backupTitle;
}

// ----- Archive features -----
async function openExpenseArchive() {
    const docs = await getExpenseDocs();
    const curMonth = document.getElementById("expense-month").value || todayISO().substring(0,7);
    
    let filtered = docs.filter(x => x.month === curMonth);
    // Sort by timestamp
    filtered.sort((a,b) => a.timestamp - b.timestamp);
    
    const grid = document.getElementById("expense-archive-grid");
    if(!filtered.length) {
        grid.innerHTML = `<p class="muted" style="grid-column: 1/-1">Không có chứng từ nào được lưu trong tháng này.</p>`;
    } else {
        grid.innerHTML = filtered.map(d => {
            let mediaHtml = '';
            // If blobUrl doesn't exist (loaded from storage), we fall back to data. For PDFs in storage, we try to create an object URL from base64 if needed, but data URI usually works in iframe.
            const src = d.blobUrl || d.data;
            if(d.type && d.type.startsWith('image/')) {
                mediaHtml = `<img src="${src}" style="width:100%; height:auto; border-radius:4px; border:1px solid var(--border)">`;
            } else if(d.type === 'application/pdf') {
                mediaHtml = `<iframe src="${src}#toolbar=0" style="width:100%; height:400px; border:none; border-radius:4px;"></iframe>`;
            } else {
                mediaHtml = `<div style="padding:20px; background:#f8f9fa; border:1px solid var(--border); border-radius:4px; text-align:center;">📄 ${d.name}</div>`;
            }
            
            return `
            <div style="border:1px solid var(--border); padding:10px; border-radius:8px; background:var(--surface)">
                <div style="margin-bottom:8px; font-weight:bold; word-break:break-all">${d.name}</div>
                ${mediaHtml}
                <div style="margin-top:8px; font-size:12px; color:var(--text-light)">Quét ngày: ${fmtVN(d.date_scanned)}</div>
            </div>`;
        }).join("");
    }
    
    document.getElementById("expense-archive-modal").classList.remove("hide");
}

function closeExpenseArchive() {
    document.getElementById("expense-archive-modal").classList.add("hide");
}

function printExpenseArchive() {
    const backupTitle = document.title;
    document.title = "Chung_tu_goc_" + (document.getElementById("expense-month").value || todayISO().substring(0,7));
    
    const style = document.createElement('style');
    style.id = 'print-archive-style';
    style.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            #expense-archive-print-area, #expense-archive-print-area * { visibility: visible; }
            #expense-archive-print-area { position: absolute; left: 0; top: 0; width: 100%; }
            #expense-archive-grid { display: block !important; }
            #expense-archive-grid > div { display: block; width: 100%; page-break-inside: avoid; margin-bottom: 20px; border: none !important; }
            #expense-archive-grid img { width: 100%; height: auto; max-height: 95vh; object-fit: contain; }
            @page { size: A4 portrait; margin: 1cm; }
        }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    document.getElementById('print-archive-style').remove();
    document.title = backupTitle;
}

// ----- TABS & KPIs -----
function switchTcTab(tabId) {
  // Update Pills
  document.querySelectorAll('.tc-pill-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tc-btn-' + tabId).classList.add('active');
  
  // Update Sections
  document.querySelectorAll('.tc-section').forEach(sec => {
    sec.classList.add('hide');
    sec.style.animation = 'none';
  });
  
  const activeSec = document.getElementById('tc-sec-' + tabId);
  activeSec.classList.remove('hide');
  // Trigger reflow to restart animation
  void activeSec.offsetWidth;
  activeSec.style.animation = 'fadeIn 0.4s ease-out forwards';
}

async function updateTcKpis() {
  // 1. Tổng Thu CĐT
  let totalCdt = 0;
  const cdtDots = await getCdt(); // from dieuhanh.js or thanhtoan.js
  cdtDots.forEach(d => { if(!d.status || d.status === 'approved') totalCdt += (Number(d.amount)||0); });
  
  // 2. Đã Chi Nhà thầu
  let totalSub = 0;
  const subs = await getSubcon();
  subs.forEach(s => { if(!s.status || s.status === 'approved') totalSub += (Number(s.amount)||0); });
  
  // 3. Chi phí lẻ
  let totalExp = 0;
  const exps = await getExpenses();
  exps.forEach(e => { if(!e.status || e.status === 'approved') totalExp += (Number(e.total)||0); });
  
  // 4. Cân đối
  const balance = totalCdt - totalSub - totalExp;
  
  const elThu = document.getElementById("kpi-tc-thu");
  const elChiThau = document.getElementById("kpi-tc-chi-thau");
  const elChiLe = document.getElementById("kpi-tc-chi-le");
  const elBalance = document.getElementById("kpi-tc-balance");
  
  const fmt = (val) => {
    return Math.round(val / 1e6).toLocaleString('vi-VN') + " tr";
  };
  
  if(elThu) { elThu.innerText = fmt(totalCdt); elThu.style.whiteSpace = "nowrap"; }
  if(elChiThau) { elChiThau.innerText = fmt(totalSub); elChiThau.style.whiteSpace = "nowrap"; }
  if(elChiLe) { elChiLe.innerText = fmt(totalExp); elChiLe.style.whiteSpace = "nowrap"; }
  
  if(elBalance) {
      const textVal = fmt(balance);
      elBalance.innerText = textVal;
      elBalance.style.whiteSpace = "nowrap";
      if (textVal.length > 11) {
        elBalance.style.fontSize = "24px";
      } else if (textVal.length > 8) {
        elBalance.style.fontSize = "28px";
      } else {
        elBalance.style.fontSize = "36px";
      }
      elBalance.style.color = balance >= 0 ? "var(--success)" : "var(--danger)";
  }
}

