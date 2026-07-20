// ---------- NHÀ THẦU & TỔ ĐỘI ----------

function openContractorModal(id = null) {
  // Reset form
  document.getElementById("cm-id").value = id || "";
  document.getElementById("cm-name").value = "";
  document.getElementById("cm-rep").value = "";
  document.getElementById("cm-phone").value = "";
  document.getElementById("cm-type").value = "contractor";
  document.getElementById("cm-aliases").value = "";
  document.getElementById("cm-voice-keywords").value = "";
  document.getElementById("cm-status").value = "active";
  document.getElementById("cm-note").value = "";
  
  if(id) {
    document.getElementById("contractor-modal-title").innerText = "Cập nhật Thông tin";
    DataService.listContractors(CUR.project).then(list => {
      const c = list.find(x => x.id === id || x.name === id);
      if(c) {
        document.getElementById("cm-name").value = c.name || "";
        // Tương thích ngược kiểu cũ (nhathau -> contractor, todoi -> team)
        let type = c.type || "contractor";
        if (type === 'nhathau') type = 'contractor';
        if (type === 'todoi') type = 'team';
        
        document.getElementById("cm-type").value = type;
        document.getElementById("cm-rep").value = c.rep || "";
        document.getElementById("cm-phone").value = c.phone || "";
        document.getElementById("cm-aliases").value = Array.isArray(c.aliases) ? c.aliases.join(", ") : (c.aliases || "");
        document.getElementById("cm-voice-keywords").value = Array.isArray(c.voiceKeywords) ? c.voiceKeywords.join(", ") : (c.voiceKeywords || "");
        document.getElementById("cm-status").value = c.status || "active";
        document.getElementById("cm-note").value = c.note || "";
      }
    });
  } else {
    document.getElementById("contractor-modal-title").innerText = "Thêm Nhà thầu / Tổ đội";
  }
  
  document.getElementById("contractor-modal").classList.remove("hide");
}

function closeContractorModal() {
  document.getElementById("contractor-modal").classList.add("hide");
}

// Hàm tự sinh Alias thông minh từ tên chuẩn
function generateDefaultAliases(name, type) {
  const cleanName = name.trim();
  const lowercase = cleanName.toLowerCase();
  const aliases = [];
  
  // 1. Thêm tên không dấu
  const noDiacritics = cleanName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  if (noDiacritics.toLowerCase() !== lowercase) {
    aliases.push(noDiacritics);
  }
  
  // 2. Tách bớt tiền tố
  let coreName = cleanName;
  const prefixes = ["tổ đội", "nhà thầu phụ", "nhà thầu", "đội", "ban chỉ huy", "bch"];
  for (const p of prefixes) {
    if (lowercase.startsWith(p)) {
      coreName = cleanName.slice(p.length).trim();
      break;
    }
  }
  
  if (coreName && coreName !== cleanName) {
    aliases.push(coreName);
    const coreNoDiacritics = coreName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    if (coreNoDiacritics !== coreName) {
      aliases.push(coreNoDiacritics);
    }
    
    // Thêm các biến thể gọi tắt nếu là tổ đội
    if (type === 'team') {
      const words = coreName.split(/\s+/);
      const lastName = words[words.length - 1];
      if (lastName) {
        aliases.push(`đội ${lastName}`);
        aliases.push(`anh ${lastName}`);
        aliases.push(lastName);
      }
    }
  }
  
  // Loại bỏ trùng lặp và trả về mảng
  return Array.from(new Set(aliases.filter(Boolean)));
}

async function saveContractor() {
  const name = document.getElementById("cm-name").value.trim();
  if(!name) return alert("Vui lòng nhập tên nhà thầu/tổ đội!");
  const id = document.getElementById("cm-id").value;
  const type = document.getElementById("cm-type").value;
  const rep = document.getElementById("cm-rep").value.trim();
  const phone = document.getElementById("cm-phone").value.trim();
  const status = document.getElementById("cm-status").value;
  const note = document.getElementById("cm-note").value.trim();
  
  // Xử lý Aliases và voiceKeywords
  const rawAliases = document.getElementById("cm-aliases").value.trim();
  let aliases = rawAliases ? rawAliases.split(/[,.;|/\\\n]+/).map(a => a.trim()).filter(Boolean) : [];
  if (aliases.length === 0) {
    aliases = generateDefaultAliases(name, type);
  }
  
  const rawVoiceKeywords = document.getElementById("cm-voice-keywords").value.trim();
  const voiceKeywords = rawVoiceKeywords ? rawVoiceKeywords.split(/[,.;|/\\\n]+/).map(k => k.trim()).filter(Boolean) : [];

  let all = await metaGet("contractors", SEED.contractors);
  if(id) {
    // Edit
    const idx = all.findIndex(c => c.project_id === CUR.project && (c.id === id || c.name === id));
    if(idx >= 0) {
      all[idx].name = name;
      all[idx].type = type;
      all[idx].rep = rep;
      all[idx].phone = phone;
      all[idx].aliases = aliases;
      all[idx].voiceKeywords = voiceKeywords;
      all[idx].status = status;
      all[idx].note = note;
      all[idx].updated_at = new Date().toISOString();
    }
  } else {
    // Add
    if(all.some(c => c.project_id === CUR.project && c.name.toLowerCase() === name.toLowerCase())) {
      return alert("Tên này đã tồn tại trong dự án!");
    }
    const newId = "ctr_" + new Date().getTime() + "_" + Math.floor(Math.random()*1000);
    all.push({ 
      project_id: CUR.project, 
      id: newId, 
      name, 
      type, 
      rep, 
      phone, 
      aliases, 
      voiceKeywords, 
      status, 
      note, 
      added_at: new Date().toISOString() 
    });
  }

  await metaSet('contractors', all);
  
  // Đồng bộ vào KB Global để AI dùng sau này nếu cần
  let kb = await metaGet('kb_contractors', []);
  const matchedIdx = kb.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
  if (matchedIdx >= 0) {
    kb[matchedIdx].aliases = Array.from(new Set([].concat(kb[matchedIdx].aliases || [], aliases)));
  } else {
    let newKbId = 1;
    if (kb.length > 0) {
      newKbId = Math.max(...kb.map(x => parseInt(x.id) || 0)) + 1;
    }
    kb.push({ id: newKbId.toString(), name: name, aliases: aliases });
  }
  await metaSet('kb_contractors', kb);
  
  if(typeof syncKBToIframe === 'function') syncKBToIframe();

  closeContractorModal();
  audit(id ? "Cập nhật nhà thầu/tổ đội" : "Thêm nhà thầu/tổ đội", name);
  renderContractors();
}

async function deleteContractor(id) {
  if(!confirm("Xác nhận XÓA nhà thầu/tổ đội này khỏi dự án? Hành động này không thể hoàn tác.")) return;
  let all = await metaGet("contractors", SEED.contractors);
  const idx = all.findIndex(c => c.project_id === CUR.project && (c.id === id || c.name === id));
  if(idx >= 0) {
    const deletedName = all[idx].name;
    all.splice(idx, 1);
    await metaSet('contractors', all);
    audit("Xóa nhà thầu/tổ đội", deletedName);
    if(typeof syncKBToIframe === 'function') syncKBToIframe();
    renderContractors();
  }
}

async function toggleContractorStatus(id) {
  let all = await metaGet("contractors", SEED.contractors);
  const idx = all.findIndex(c => c.project_id === CUR.project && (c.id === id || c.name === id));
  if(idx >= 0) {
    const oldStatus = all[idx].status || 'active';
    const newStatus = oldStatus === 'active' ? 'inactive' : 'active';
    all[idx].status = newStatus;
    await metaSet('contractors', all);
    audit(newStatus === 'active' ? "Kích hoạt nhà thầu/tổ đội" : "Ngừng sử dụng nhà thầu/tổ đội", all[idx].name);
    if(typeof syncKBToIframe === 'function') syncKBToIframe();
    renderContractors();
  }
}

async function renderContractors() {
  const list = await DataService.listContractors(CUR.project);
  
  const searchEl = document.getElementById("contractor-search");
  const search = searchEl ? searchEl.value.toLowerCase() : "";
  
  const typeFilterEl = document.getElementById("contractor-type-filter");
  const typeFilter = typeFilterEl ? typeFilterEl.value : "";
  
  let filtered = list;
  if(search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search));
  if(typeFilter) {
    filtered = filtered.filter(c => {
      let type = c.type || "contractor";
      if (type === 'nhathau') type = 'contractor';
      if (type === 'todoi') type = 'team';
      return type === typeFilter;
    });
  }

  const tbody = document.getElementById("contractor-list-body");
  if(!tbody) return;
  
  if(!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6">${renderEmptyState('👷', 'Chưa có dữ liệu', 'Không có nhà thầu hoặc tổ đội nào khớp với bộ lọc tìm kiếm.')}</td></tr>`;
    return;
  }

  const editable = !CUR_USER || isAdminLikeRole(CUR_USER.role) || ["pm","site_manager","engineer"].includes(CUR_USER.role);

  tbody.innerHTML = filtered.map((c, idx) => {
    let type = c.type || "contractor";
    if (type === 'nhathau') type = 'contractor';
    if (type === 'todoi') type = 'team';
    
    let cTypeBadge = '';
    if (type === 'team') {
      cTypeBadge = '<span class="badge" style="background:#fef3c7;color:#b45309;">👷 Tổ đội</span>';
    } else if (type === 'internal') {
      cTypeBadge = '<span class="badge" style="background:#d1fae5;color:#065f46;">💼 Ban chỉ huy</span>';
    } else {
      cTypeBadge = '<span class="badge" style="background:#e0e7ff;color:#3730a3;">🏢 Nhà thầu phụ</span>';
    }
    
    const cId = c.id || c.name;
    const isInactive = c.status === 'inactive' || c.status === 'finished';
    const trStyle = isInactive ? 'opacity: 0.6; background: var(--surface-1);' : '';
    const nameStyle = isInactive ? 'text-decoration: line-through; color: var(--muted);' : '';
    
    const statusText = isInactive 
      ? '<span class="badge" style="background:#fee2e2;color:#991b1b;">🔴 Ngừng sử dụng</span>'
      : '<span class="badge" style="background:#d1fae5;color:#065f46;">🟢 Hoạt động</span>';
      
    const displayAliases = Array.isArray(c.aliases) ? c.aliases.join(", ") : (c.aliases || "-");
    
    let actions = `<span class="muted" style="font-size:12px;">Chỉ xem</span>`;
    if (editable) {
       const toggleText = isInactive ? '🟢 Hoạt động' : '🔴 Ngừng';
       actions = `
         <button class="btn btn-sm btn-mut" onclick="openContractorModal('${esc(cId)}')" title="Sửa">✏️ Sửa</button>
         <button class="btn btn-sm btn-mut" onclick="toggleContractorStatus('${esc(cId)}')" title="${isInactive ? 'Kích hoạt lại' : 'Ngừng sử dụng'}" style="${isInactive ? 'color:#15803d;' : 'color:#b91c1c;'}">${toggleText}</button>
         <button class="btn btn-sm btn-mut" onclick="deleteContractor('${esc(cId)}')" title="Xóa" style="color:var(--danger); margin-left:4px;">🗑️ Xóa</button>
       `;
    }
        
    return `
      <tr style="${trStyle}">
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-weight:600; ${nameStyle}">
          ${esc(c.name)}
        </td>
        <td>${cTypeBadge}</td>
        <td style="font-size:12.5px; color:#475569; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${esc(displayAliases)}">
          ${esc(displayAliases)}
        </td>
        <td>${statusText}</td>
        <td style="text-align:center; white-space:nowrap;">${actions}</td>
      </tr>
    `;
  }).join("");
}
