// ---------- MODULE LIÊN PHÒNG BAN (LPB) ----------

// Helpers
function lpbPad(n) { n = String(n); return n.length < 2 ? "0" + n : n; }

function lpbFmtVN(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${lpbPad(d.getDate())}/${lpbPad(d.getMonth() + 1)}/${d.getFullYear()} ${lpbPad(d.getHours())}:${lpbPad(d.getMinutes())}`;
  } catch (e) {
    return dateStr;
  }
}

function lpbFmtDateOnly(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${lpbPad(d.getDate())}/${lpbPad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

// Giải thuật viết tắt tên dự án tự động (CamelCase không dấu)
function getAbbrevName(name) {
  if (!name) return "DA";
  let str = name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // bỏ dấu
  str = str.replace(/[^a-zA-Z0-9\s]/g, ""); // bỏ ký tự đặc biệt
  const commonPrefixes = ["nha may", "du an", "cong trinh", "van phong", "khu do thi", "nha pho", "biet thu", "chung cu"];
  let lowerStr = str.toLowerCase();
  for (const prefix of commonPrefixes) {
    if (lowerStr.startsWith(prefix + " ")) {
      str = str.substring(prefix.length + 1);
      break;
    }
  }
  const words = str.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return "DA";
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("").substring(0, 12);
}

// Kiểm tra quá hạn
function isRequestOverdue(req) {
  if (req.status === "completed") return false;
  if (!req.due) return false;
  return new Date() > new Date(req.due);
}

// Data store accessors (IndexedDB thông qua metaGet/metaSet)
async function listRequests() {
  return await metaGet("lpb_requests", []);
}

async function getRequest(id) {
  const all = await listRequests();
  return all.find(r => r.id === id);
}

async function saveRequest(req) {
  const all = await listRequests();
  const idx = all.findIndex(r => r.id === req.id);
  if (idx >= 0) {
    all[idx] = req;
  } else {
    all.push(req);
  }
  await metaSet("lpb_requests", all);
  return req;
}

// Tự động sinh mã phiếu
async function generateRequestId(proj, contractNo) {
  const all = await listRequests();
  const projRequests = all.filter(r => r.project_id === proj.id);
  let maxSeq = 0;
  projRequests.forEach(r => {
    const parts = r.id.split("-");
    if (parts.length >= 3) {
      const seqStr = parts[parts.length - 1];
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });
  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, "0");
  const abbrev = getAbbrevName(proj.name);
  const cleanContract = (contractNo || "HD").replace(/[^a-zA-Z0-9]/g, "");
  return `${cleanContract}-${abbrev}-${seqStr}`;
}

// Đọc file sang Base64 data URL
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      size: file.size,
      data: reader.result
    });
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Bộ lọc toàn cục cho giao diện
window.lpbFilters = {
  search: "",
  dept: "all",
  status: "all"
};

// --- GIAO DIỆN ---
async function renderLpb() {
  const el = document.getElementById("tab-lpb");
  if (!el) return;

  // Lấy dữ liệu công trình hiện hành
  const projs = await DataService.listProjects();
  const curProj = projs.find(p => p.id === CUR.project);
  if (!curProj) {
    el.innerHTML = `
      <div class="card" style="padding: 24px; text-align: center;">
        <p class="muted">Vui lòng chọn hoặc thêm một công trình để sử dụng tính năng Liên phòng ban.</p>
      </div>
    `;
    return;
  }

  // Load danh sách phiếu và lọc theo dự án hiện tại
  const allReqs = await listRequests();
  const projReqs = allReqs.filter(r => r.project_id === curProj.id);

  // Tính số liệu KPI Cards
  const totalCount = projReqs.length;
  const newCount = projReqs.filter(r => r.status === "new").length;
  const processingCount = projReqs.filter(r => r.status === "received" || r.status === "processing").length;
  const respondedCount = projReqs.filter(r => r.status === "responded").length;
  const overdueCount = projReqs.filter(isRequestOverdue).length;

  // Lọc theo bộ lọc
  let filtered = projReqs;
  if (window.lpbFilters.search.trim()) {
    const q = window.lpbFilters.search.toLowerCase().trim();
    filtered = filtered.filter(r => 
      r.id.toLowerCase().includes(q) || 
      (r.title || "").toLowerCase().includes(q) || 
      (r.content || "").toLowerCase().includes(q)
    );
  }
  if (window.lpbFilters.dept !== "all") {
    filtered = filtered.filter(r => r.dept === window.lpbFilters.dept);
  }
  if (window.lpbFilters.status !== "all") {
    if (window.lpbFilters.status === "overdue") {
      filtered = filtered.filter(isRequestOverdue);
    } else {
      filtered = filtered.filter(r => r.status === window.lpbFilters.status);
    }
  }

  // Sắp xếp phiếu mới nhất ở trên
  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Render HTML
  let html = `
    <!-- Header & Action -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px;">
      <div>
        <h2 style="margin:0; color:var(--primary-dark); display:flex; align-items:center; gap:8px;">
          <span>🤝</span> Liên Phòng Ban <span class="muted" style="font-size:14px; font-weight:normal;">(${curProj.name})</span>
        </h2>
      </div>
      <button class="btn btn-ok" onclick="openLpbCreateModal()" style="display:flex; align-items:center; gap:6px; font-weight:bold;">
        <span>＋</span> Tạo đề xuất
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="tc-grid-1-1-1" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:20px;">
      <div class="kpi-card" style="border-top:4px solid var(--primary); cursor:default; padding:16px; background:var(--surface); border-radius:var(--r); box-shadow:var(--shadow-sm)">
        <div style="font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase;">Tổng đề xuất</div>
        <div style="font-size:28px; font-weight:800; color:var(--text-strong); margin-top:4px;">${totalCount}</div>
      </div>
      <div class="kpi-card" style="border-top:4px solid #6b21a8; cursor:default; padding:16px; background:var(--surface); border-radius:var(--r); box-shadow:var(--shadow-sm)">
        <div style="font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase;">Mới gửi</div>
        <div style="font-size:28px; font-weight:800; color:#6b21a8; margin-top:4px;">${newCount}</div>
      </div>
      <div class="kpi-card" style="border-top:4px solid #b45309; cursor:default; padding:16px; background:var(--surface); border-radius:var(--r); box-shadow:var(--shadow-sm)">
        <div style="font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase;">Đang xử lý</div>
        <div style="font-size:28px; font-weight:800; color:#b45309; margin-top:4px;">${processingCount}</div>
      </div>
      <div class="kpi-card" style="border-top:4px solid var(--success); cursor:default; padding:16px; background:var(--surface); border-radius:var(--r); box-shadow:var(--shadow-sm)">
        <div style="font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase;">Đã phản hồi</div>
        <div style="font-size:28px; font-weight:800; color:var(--success); margin-top:4px;">${respondedCount}</div>
      </div>
      <div class="kpi-card" style="border-top:4px solid var(--danger); cursor:default; padding:16px; background:var(--surface); border-radius:var(--r); box-shadow:var(--shadow-sm)">
        <div style="font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase;">Quá hạn xử lý</div>
        <div style="font-size:28px; font-weight:800; color:var(--danger); margin-top:4px;">${overdueCount}</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card" style="padding:12px 16px; margin-bottom:16px; background:var(--surface); border-radius:var(--r); border:1px solid var(--border)">
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
        <div style="flex:1; min-width:200px;">
          <input type="text" id="lpb-search" class="input" placeholder="Tìm mã phiếu, tiêu đề, nội dung..." 
            value="${esc(window.lpbFilters.search)}" oninput="lpbHandleFilterChange()" style="width:100%; height:38px;">
        </div>
        <div style="width:180px;">
          <select id="lpb-filter-dept" class="input" onchange="lpbHandleFilterChange()" style="width:100%; height:38px;">
            <option value="all">Tất cả phòng ban nhận</option>
            <option value="Thiết kế" ${window.lpbFilters.dept === "Thiết kế" ? "selected" : ""}>Thiết kế</option>
            <option value="Pháp lý" ${window.lpbFilters.dept === "Pháp lý" ? "selected" : ""}>Pháp lý</option>
            <option value="Dự án" ${window.lpbFilters.dept === "Dự án" ? "selected" : ""}>Dự án</option>
            <option value="Thu mua-Cung ứng" ${window.lpbFilters.dept === "Thu mua-Cung ứng" ? "selected" : ""}>Thu mua-Cung ứng</option>
            <option value="Ban lãnh đạo" ${window.lpbFilters.dept === "Ban lãnh đạo" ? "selected" : ""}>Ban lãnh đạo</option>
          </select>
        </div>
        <div style="width:180px;">
          <select id="lpb-filter-status" class="input" onchange="lpbHandleFilterChange()" style="width:100%; height:38px;">
            <option value="all">Tất cả trạng thái</option>
            <option value="new" ${window.lpbFilters.status === "new" ? "selected" : ""}>🟣 Mới gửi</option>
            <option value="received" ${window.lpbFilters.status === "received" ? "selected" : ""}>🔵 Đã tiếp nhận</option>
            <option value="processing" ${window.lpbFilters.status === "processing" ? "selected" : ""}>🟠 Đang xử lý</option>
            <option value="responded" ${window.lpbFilters.status === "responded" ? "selected" : ""}>🟢 Đã phản hồi</option>
            <option value="completed" ${window.lpbFilters.status === "completed" ? "selected" : ""}>⚫ Hoàn thành</option>
            <option value="overdue" ${window.lpbFilters.status === "overdue" ? "selected" : ""}>🔴 Quá hạn</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table List -->
    <div class="card" style="padding:0; overflow:hidden; background:var(--surface); border-radius:var(--r); border:1px solid var(--border)">
      <div style="overflow-x:auto;">
        <table class="lpb-table" style="width:100%; border-collapse:collapse; text-align:left; font-size:var(--fs-base)">
          <thead>
            <tr style="background:var(--surface-2); border-bottom:1px solid var(--border)">
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong)">Mã đề xuất</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong)">Tiêu đề</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong)">Phòng ban nhận</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong)">Người gửi</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong)">Hạn xử lý</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong); text-align:center">Trạng thái</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong); text-align:center">Độ khân</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-strong); text-align:center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (filtered.length === 0) {
    html += `
      <tr>
        <td colspan="8" style="padding:32px; text-align:center; color:var(--muted)">Chưa có đề xuất nào được tạo.</td>
      </tr>
    `;
  } else {
    filtered.forEach(r => {
      const isOver = isRequestOverdue(r);
      let statusHtml = "";
      if (r.status === "new") {
        statusHtml = `<span class="lpb-badge badge-new">Mới gửi</span>`;
      } else if (r.status === "received") {
        statusHtml = `<span class="lpb-badge badge-received">Đã tiếp nhận</span>`;
      } else if (r.status === "processing") {
        statusHtml = `<span class="lpb-badge badge-processing">Đang xử lý</span>`;
      } else if (r.status === "responded") {
        statusHtml = `<span class="lpb-badge badge-responded">Đã phản hồi</span>`;
      } else if (r.status === "completed") {
        statusHtml = `<span class="lpb-badge badge-completed">Hoàn thành</span>`;
      }

      const overdueHtml = isOver ? `<span class="lpb-badge badge-overdue" style="margin-left:4px">🔴 Quá hạn</span>` : "";
      const urgentHtml = r.urgent ? `<span class="lpb-badge badge-urgent">🔥 Gấp</span>` : `<span class="lpb-badge badge-normal">Thường</span>`;

      html += `
        <tr style="border-bottom:1px solid var(--border); transition:background 0.2s;" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='transparent'">
          <td style="padding:12px 16px; font-weight:600; color:var(--primary-dark)">${esc(r.id)}</td>
          <td style="padding:12px 16px; font-weight:500; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(r.title)}">${esc(r.title)}</td>
          <td style="padding:12px 16px; color:var(--text-strong)">${esc(r.dept)}</td>
          <td style="padding:12px 16px; color:var(--ink)">
            <div>${esc(r.created_by)}</div>
            <div class="muted" style="font-size:11px;">${lpbFmtVN(r.created_at)}</div>
          </td>
          <td style="padding:12px 16px; color:var(--ink)">
            <span style="${isOver ? 'color:var(--danger); font-weight:bold' : ''}">${lpbFmtVN(r.due)}</span>
          </td>
          <td style="padding:12px 16px; text-align:center;">
            <div style="display:flex; justify-content:center; align-items:center; gap:4px; flex-wrap:wrap;">
              ${statusHtml} ${overdueHtml}
            </div>
          </td>
          <td style="padding:12px 16px; text-align:center;">${urgentHtml}</td>
          <td style="padding:12px 16px; text-align:center;">
            <button class="btn btn-mut btn-sm" onclick="openLpbDetailModal('${r.id}')" style="padding:4px 10px; font-weight:600">Xem chi tiết</button>
          </td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>

    <!-- CREATE MODAL -->
    <div id="lpb-create-modal" class="lpb-modal hide" style="display:flex; align-items:center; justify-content:center; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px);">
      <div class="card lpb-modal-content" style="width:90%; max-width:640px; max-height:90%; overflow-y:auto; padding:24px; border-radius:var(--r-md); box-shadow:var(--shadow-lg); background:var(--surface);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:16px;">
          <h3 style="margin:0; color:var(--primary-dark); font-size:18px;">🤝 Tạo Đề Xuất Liên Phòng Ban</h3>
          <button style="background:transparent; border:none; font-size:20px; cursor:pointer; color:var(--muted)" onclick="closeLpbCreateModal()">✕</button>
        </div>
        
        <form id="lpb-create-form" onsubmit="handleLpbCreateSubmit(event)">
          <div class="tc-grid-2-1-1" style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; margin-bottom:16px;">
            <div>
              <label style="display:block; font-weight:600; margin-bottom:6px; font-size:var(--fs-sm); color:var(--text-strong)">Phòng ban nhận <span style="color:var(--danger)">*</span></label>
              <select id="lpb-form-dept" class="input" required style="width:100%; height:38px;">
                <option value="" disabled selected>-- Chọn phòng ban nhận --</option>
                <option value="Thiết kế">Thiết kế</option>
                <option value="Pháp lý">Pháp lý</option>
                <option value="Dự án">Dự án</option>
                <option value="Thu mua-Cung ứng">Thu mua-Cung ứng</option>
                <option value="Ban lãnh đạo">Ban lãnh đạo</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-weight:600; margin-bottom:6px; font-size:var(--fs-sm); color:var(--text-strong)">Hạn xử lý <span style="color:var(--danger)">*</span></label>
              <input type="datetime-local" id="lpb-form-due" class="input" required style="width:100%; height:38px;">
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block; font-weight:600; margin-bottom:6px; font-size:var(--fs-sm); color:var(--text-strong)">Tiêu đề <span style="color:var(--danger)">*</span></label>
            <input type="text" id="lpb-form-title" class="input" required placeholder="Nội dung tóm tắt đề xuất (Ví dụ: Xin duyệt bản vẽ móng trục A-B)" style="width:100%; height:38px;">
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block; font-weight:600; margin-bottom:6px; font-size:var(--fs-sm); color:var(--text-strong)">Nội dung chi tiết</label>
            <textarea id="lpb-form-content" class="input" rows="5" placeholder="Mô tả cụ thể yêu cầu cần phòng ban hỗ trợ, làm rõ thông tin..." style="width:100%; padding:10px; font-family:inherit;"></textarea>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block; font-weight:600; margin-bottom:6px; font-size:var(--fs-sm); color:var(--text-strong)">File đính kèm</label>
            <input type="file" id="lpb-form-files" multiple class="input" style="width:100%; padding:6px;" onchange="handleLpbFormFilesChange()">
            <div id="lpb-form-files-list" style="margin-top:8px; display:flex; flex-direction:column; gap:4px;"></div>
          </div>

          <div style="margin-bottom:20px; display:flex; align-items:center; gap:8px; padding:10px; background:var(--surface-2); border-radius:var(--r); border:1px solid var(--border)">
            <input type="checkbox" id="lpb-form-urgent" style="width:18px; height:18px; cursor:pointer;">
            <label for="lpb-form-urgent" style="font-weight:700; cursor:pointer; color:var(--danger); display:flex; align-items:center; gap:4px;">
              🔥 CẦN HỖ TRỢ GẤP (Ban Giám đốc & Ban chỉ huy theo dõi trực tiếp)
            </label>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:16px;">
            <button type="button" class="btn btn-mut" onclick="closeLpbCreateModal()" style="font-weight:600; padding:10px 20px;">Hủy bỏ</button>
            <button type="submit" class="btn btn-ok" style="font-weight:bold; padding:10px 24px;">🚀 Gửi đề xuất</button>
          </div>
        </form>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <div id="lpb-detail-modal" class="lpb-modal hide" style="display:flex; align-items:center; justify-content:center; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px);">
      <div class="card lpb-modal-content" style="width:95%; max-width:800px; max-height:92%; overflow-y:auto; padding:24px; border-radius:var(--r-md); box-shadow:var(--shadow-lg); background:var(--surface);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:16px;">
          <h3 style="margin:0; color:var(--primary-dark); font-size:18px; display:flex; align-items:center; gap:8px;">
            <span>📋 Chi Tiết Phiếu:</span> <span id="lpb-det-id" style="font-weight:800; font-family:monospace; color:var(--primary)"></span>
          </h3>
          <button style="background:transparent; border:none; font-size:20px; cursor:pointer; color:var(--muted)" onclick="closeLpbDetailModal()">✕</button>
        </div>
        
        <div class="lpb-detail-grid" style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
          <!-- Left Panel: Info & Attachments -->
          <div>
            <div style="margin-bottom:16px;">
              <div id="lpb-det-urgency" style="margin-bottom:8px;"></div>
              <h2 id="lpb-det-title" style="margin:0 0 12px 0; font-size:20px; color:var(--text-strong); line-height:1.4;"></h2>
              <div style="display:flex; gap:12px; font-size:12px; color:var(--muted); flex-wrap:wrap; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:12px;">
                <div><b>Người gửi:</b> <span id="lpb-det-sender"></span></div>
                <div><b>Ngày gửi:</b> <span id="lpb-det-created-at"></span></div>
                <div><b>Dự án:</b> <span id="lpb-det-project"></span></div>
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <h4 style="margin:0 0 8px 0; font-size:var(--fs-md); color:var(--text-strong)">Nội dung đề xuất</h4>
              <div id="lpb-det-content" style="background:var(--surface-2); padding:16px; border-radius:var(--r); border:1px solid var(--border); line-height:1.6; white-space:pre-wrap; color:var(--ink)"></div>
            </div>

            <!-- File đính kèm -->
            <div style="margin-bottom:20px;">
              <h4 style="margin:0 0 8px 0; font-size:var(--fs-md); color:var(--text-strong)">File đính kèm</h4>
              <div id="lpb-det-files" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            </div>

            <!-- Phản hồi xử lý -->
            <div id="lpb-det-response-section" style="margin-bottom:20px; display:none;">
              <h4 style="margin:0 0 8px 0; font-size:var(--fs-md); color:var(--success)">Nội dung phản hồi (Phòng ban xử lý)</h4>
              <div style="background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.3); padding:16px; border-radius:var(--r); line-height:1.6;">
                <div id="lpb-det-response-text" style="white-space:pre-wrap; color:var(--ink); margin-bottom:8px;"></div>
                <div class="muted" style="font-size:11px; text-align:right;">
                  Phản hồi bởi <b id="lpb-det-responder"></b> lúc <span id="lpb-det-responded-at"></span>
                </div>
              </div>
            </div>

            <!-- Form xử lý (động) -->
            <div id="lpb-action-panel" style="padding:16px; background:var(--surface-2); border-radius:var(--r); border:1px solid var(--border); margin-top:20px;">
              <h4 style="margin:0 0 12px 0; font-size:var(--fs-md); color:var(--text-strong)">Thực hiện xử lý phiếu</h4>
              <div id="lpb-action-buttons" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
              
              <!-- Form phụ nhập text phản hồi -->
              <div id="lpb-response-form" class="hide" style="margin-top:16px; border-top:1px dashed var(--border); padding-top:12px;">
                <label style="display:block; font-weight:600; margin-bottom:6px; font-size:var(--fs-sm)">Nhập nội dung phản hồi xử lý <span style="color:var(--danger)">*</span></label>
                <textarea id="lpb-response-input" class="input" rows="4" placeholder="Nhập kết quả xử lý, câu trả lời hoặc hướng dẫn..." style="width:100%; padding:10px; font-family:inherit; margin-bottom:10px;"></textarea>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                  <button class="btn btn-mut btn-sm" onclick="cancelLpbResponseSubmit()">Hủy</button>
                  <button class="btn btn-ok btn-sm" onclick="submitLpbResponse()" style="font-weight:bold;">🚀 Gửi phản hồi</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Panel: Status & Timeline -->
          <div style="border-left:1px solid var(--border); padding-left:20px;">
            <div style="margin-bottom:20px;">
              <h4 style="margin:0 0 8px 0; font-size:var(--fs-md); color:var(--text-strong)">Trạng thái hiện tại</h4>
              <div id="lpb-det-status-badge" style="display:inline-block;"></div>
              <div id="lpb-det-overdue-badge" style="display:inline-block; margin-left:4px;"></div>
            </div>

            <div style="margin-bottom:20px;">
              <h4 style="margin:0 0 6px 0; font-size:var(--fs-sm); color:var(--text-strong)">Thông tin hạn chót</h4>
              <div style="font-size:14px; font-weight:700; color:var(--ink)" id="lpb-det-due-date"></div>
            </div>

            <!-- Timeline -->
            <div>
              <h4 style="margin:0 0 12px 0; font-size:var(--fs-md); color:var(--text-strong)">Nhật ký xử lý (KPI Timeline)</h4>
              <div class="lpb-timeline" id="lpb-det-timeline" style="display:flex; flex-direction:column; gap:16px; position:relative; padding-left:16px;">
                <!-- Timeline items rendered dynamically -->
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border); padding-top:16px; margin-top:20px;">
          <button class="btn btn-mut" onclick="closeLpbDetailModal()" style="font-weight:600; padding:10px 20px;">Đóng</button>
        </div>
      </div>
    </div>
  `;

  el.innerHTML = html;
  
  // Thiết lập hạn chót mặc định cho form tạo là +3 ngày kể từ hiện tại
  const now = new Date();
  now.setDate(now.getDate() + 3);
  const nowString = now.getFullYear() + "-" + lpbPad(now.getMonth() + 1) + "-" + lpbPad(now.getDate()) + "T" + lpbPad(now.getHours()) + ":" + lpbPad(now.getMinutes());
  const dueInput = document.getElementById("lpb-form-due");
  if (dueInput) dueInput.value = nowString;
}

// Lọc sự kiện
function lpbHandleFilterChange() {
  const searchInput = document.getElementById("lpb-search");
  const deptSelect = document.getElementById("lpb-filter-dept");
  const statusSelect = document.getElementById("lpb-filter-status");

  window.lpbFilters.search = searchInput ? searchInput.value : "";
  window.lpbFilters.dept = deptSelect ? deptSelect.value : "all";
  window.lpbFilters.status = statusSelect ? statusSelect.value : "all";

  renderLpb();
}
window.lpbHandleFilterChange = lpbHandleFilterChange;

// --- ĐIỀU KHIỂN FORM TẠO MỚI ---
let selectedFiles = [];

function openLpbCreateModal() {
  selectedFiles = [];
  const filesList = document.getElementById("lpb-form-files-list");
  if (filesList) filesList.innerHTML = "";
  const form = document.getElementById("lpb-create-form");
  if (form) form.reset();
  
  // Set default due date +3 days
  const now = new Date();
  now.setDate(now.getDate() + 3);
  const nowString = now.getFullYear() + "-" + lpbPad(now.getMonth() + 1) + "-" + lpbPad(now.getDate()) + "T" + lpbPad(now.getHours()) + ":" + lpbPad(now.getMinutes());
  const dueInput = document.getElementById("lpb-form-due");
  if (dueInput) dueInput.value = nowString;

  document.getElementById("lpb-create-modal").classList.remove("hide");
}
window.openLpbCreateModal = openLpbCreateModal;

function closeLpbCreateModal() {
  document.getElementById("lpb-create-modal").classList.add("hide");
}
window.closeLpbCreateModal = closeLpbCreateModal;

async function handleLpbFormFilesChange() {
  const fileInput = document.getElementById("lpb-form-files");
  const listEl = document.getElementById("lpb-form-files-list");
  if (!fileInput || !listEl) return;

  const files = Array.from(fileInput.files);
  for (const f of files) {
    // Đọc file thành base64 data URL
    try {
      const fileData = await readAsDataURL(f);
      selectedFiles.push(fileData);
    } catch (e) {
      console.error("Lỗi đọc file:", e);
    }
  }

  // Render danh sách file đã chọn
  listEl.innerHTML = selectedFiles.map((f, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r); font-size:12px;">
      <span style="color:var(--text-strong); font-weight:500;">📎 ${esc(f.name)} (${Math.round(f.size/1024)} KB)</span>
      <button type="button" onclick="removeSelectedFile(${i})" style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-weight:bold;">Xóa</button>
    </div>
  `).join("");

  // Clear input để có thể chọn lại file cũ
  fileInput.value = "";
}
window.handleLpbFormFilesChange = handleLpbFormFilesChange;

function removeSelectedFile(index) {
  selectedFiles.splice(index, 1);
  const listEl = document.getElementById("lpb-form-files-list");
  if (listEl) {
    listEl.innerHTML = selectedFiles.map((f, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r); font-size:12px;">
        <span style="color:var(--text-strong); font-weight:500;">📎 ${esc(f.name)} (${Math.round(f.size/1024)} KB)</span>
        <button type="button" onclick="removeSelectedFile(${i})" style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-weight:bold;">Xóa</button>
      </div>
    `).join("");
  }
}
window.removeSelectedFile = removeSelectedFile;

async function handleLpbCreateSubmit(event) {
  event.preventDefault();
  
  const dept = document.getElementById("lpb-form-dept").value;
  const due = document.getElementById("lpb-form-due").value;
  const title = document.getElementById("lpb-form-title").value.trim();
  const content = document.getElementById("lpb-form-content").value.trim();
  const urgent = document.getElementById("lpb-form-urgent").checked;

  if (!dept || !title) {
    alert("Vui lòng nhập đầy đủ các trường bắt buộc (*)");
    return;
  }

  // Lấy dự án hiện tại
  const projs = await DataService.listProjects();
  const curProj = projs.find(p => p.id === CUR.project);
  if (!curProj) return;

  const contractNo = curProj.contract_no ? curProj.contract_no.trim() : "HD";
  const nextId = await generateRequestId(curProj, contractNo);

  const currentUser = typeof CUR_USER !== 'undefined' ? CUR_USER : { full_name: "Ban chỉ huy" };
  const senderName = currentUser.full_name || "Ban chỉ huy";
  const nowISO = new Date().toISOString();

  const reqObj = {
    id: nextId,
    project_id: curProj.id,
    contract_no: contractNo,
    created_by: senderName,
    created_at: nowISO,
    dept: dept,
    title: title,
    content: content,
    attachments: selectedFiles,
    due: due,
    urgent: urgent,
    status: "new",
    received_at: null,
    responded_at: null,
    response: "",
    completed_at: null,
    timeline: [
      {
        at: nowISO,
        by: senderName,
        action: "Tạo phiếu đề xuất"
      }
    ]
  };

  await saveRequest(reqObj);
  
  if (typeof audit === 'function') {
    await audit(`Tạo đề xuất LPB: ${nextId}`, `Tiêu đề: "${title}" gửi phòng ${dept}`);
  }

  closeLpbCreateModal();
  renderLpb();
}
window.handleLpbCreateSubmit = handleLpbCreateSubmit;

// --- ĐIỀU KHIỂN CHI TIẾT MODAL & THAO TÁC XỬ LÝ ---
let currentDetailId = null;

async function openLpbDetailModal(id) {
  const req = await getRequest(id);
  if (!req) return;
  currentDetailId = id;

  // Lấy tên dự án
  const projs = await DataService.listProjects();
  const proj = projs.find(p => p.id === req.project_id);
  const projName = proj ? proj.name : "Dự án không rõ";

  // Điền thông tin
  document.getElementById("lpb-det-id").textContent = req.id;
  document.getElementById("lpb-det-title").textContent = req.title;
  document.getElementById("lpb-det-sender").textContent = req.created_by;
  document.getElementById("lpb-det-created-at").textContent = lpbFmtVN(req.created_at);
  document.getElementById("lpb-det-project").textContent = projName;
  document.getElementById("lpb-det-content").textContent = req.content || "(Không có nội dung chi tiết)";
  document.getElementById("lpb-det-due-date").textContent = lpbFmtVN(req.due);

  // Khẩn cấp & Trạng thái badge
  const urgEl = document.getElementById("lpb-det-urgency");
  if (req.urgent) {
    urgEl.innerHTML = `<span class="lpb-badge badge-urgent" style="font-size:13px; padding:6px 12px;">🔥 HỖ TRỢ GẤP - YÊU CẦU BAN LÃNH ĐẠO THEO DÕI</span>`;
  } else {
    urgEl.innerHTML = `<span class="lpb-badge badge-normal" style="font-size:12px;">Đề xuất thông thường</span>`;
  }

  // Pill trạng thái & Quá hạn
  const statusBadge = document.getElementById("lpb-det-status-badge");
  let statusBadgeHtml = "";
  if (req.status === "new") {
    statusBadgeHtml = `<span class="lpb-badge badge-new" style="font-size:13px; padding:6px 12px;">🟣 Mới gửi</span>`;
  } else if (req.status === "received") {
    statusBadgeHtml = `<span class="lpb-badge badge-received" style="font-size:13px; padding:6px 12px;">🔵 Đã tiếp nhận</span>`;
  } else if (req.status === "processing") {
    statusBadgeHtml = `<span class="lpb-badge badge-processing" style="font-size:13px; padding:6px 12px;">🟠 Đang xử lý</span>`;
  } else if (req.status === "responded") {
    statusBadgeHtml = `<span class="lpb-badge badge-responded" style="font-size:13px; padding:6px 12px;">🟢 Đã phản hồi</span>`;
  } else if (req.status === "completed") {
    statusBadgeHtml = `<span class="lpb-badge badge-completed" style="font-size:13px; padding:6px 12px;">⚫ Hoàn thành</span>`;
  }
  statusBadge.innerHTML = statusBadgeHtml;

  const overBadge = document.getElementById("lpb-det-overdue-badge");
  if (isRequestOverdue(req)) {
    overBadge.innerHTML = `<span class="lpb-badge badge-overdue" style="font-size:13px; padding:6px 12px;">🔴 Quá hạn xử lý</span>`;
  } else {
    overBadge.innerHTML = "";
  }

  // Files đính kèm
  const filesEl = document.getElementById("lpb-det-files");
  if (!req.attachments || req.attachments.length === 0) {
    filesEl.innerHTML = `<span class="muted" style="font-size:12px;">Không có file đính kèm</span>`;
  } else {
    filesEl.innerHTML = req.attachments.map(file => {
      const isImg = (file.type || "").startsWith("image/");
      const sizeKB = Math.round(file.size / 1024);
      if (isImg) {
        return `
          <div style="display:flex; flex-direction:column; align-items:center; border:1px solid var(--border); padding:6px; border-radius:var(--r); width:120px; background:var(--surface-2)">
            <img src="${file.data}" style="width:100%; height:80px; object-fit:cover; border-radius:var(--r-sm); margin-bottom:6px; cursor:pointer;" onclick="lpbPreviewImage('${file.data}', '${esc(file.name)}')" title="Click xem ảnh lớn">
            <a href="${file.data}" download="${esc(file.name)}" style="font-size:11px; text-decoration:none; color:var(--primary); text-align:center; overflow:hidden; text-overflow:ellipsis; width:100%; font-weight:600;" title="${esc(file.name)}">💾 Tải xuống (${sizeKB}KB)</a>
          </div>
        `;
      } else {
        return `
          <div style="display:flex; align-items:center; gap:8px; border:1px solid var(--border); padding:8px 12px; border-radius:var(--r); background:var(--surface-2); min-width:180px;">
            <div style="font-size:24px;">📄</div>
            <div style="overflow:hidden; text-overflow:ellipsis; max-width:140px;">
              <div style="font-size:11px; font-weight:700; color:var(--text-strong); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(file.name)}">${esc(file.name)}</div>
              <a href="${file.data}" download="${esc(file.name)}" style="font-size:11px; text-decoration:none; color:var(--primary); font-weight:600;">💾 Tải xuống (${sizeKB}KB)</a>
            </div>
          </div>
        `;
      }
    }).join("");
  }

  // Phản hồi xử lý
  const responseSection = document.getElementById("lpb-det-response-section");
  if (req.response) {
    responseSection.style.display = "block";
    document.getElementById("lpb-det-response-text").textContent = req.response;
    document.getElementById("lpb-det-responder").textContent = req.responded_by || "Phòng ban";
    document.getElementById("lpb-det-responded-at").textContent = lpbFmtVN(req.responded_at);
  } else {
    responseSection.style.display = "none";
  }

  // Timeline
  const timelineEl = document.getElementById("lpb-det-timeline");
  timelineEl.innerHTML = (req.timeline || []).map(t => `
    <div style="display:flex; gap:12px; position:relative; align-items:flex-start;">
      <!-- Node -->
      <div style="width:10px; height:10px; border-radius:50%; background:var(--primary); margin-top:5px; flex-shrink:0; z-index:10; border:2px solid var(--surface)"></div>
      <div>
        <div style="font-size:12px; font-weight:700; color:var(--text-strong);">${esc(t.action)}</div>
        <div style="font-size:11px; color:var(--muted); margin-top:2px;">
          <span>👤 ${esc(t.by)}</span> <span style="margin-left:6px;">⏱️ ${lpbFmtVN(t.at)}</span>
        </div>
        ${t.note ? `<div style="font-size:12px; margin-top:4px; padding:6px 10px; background:var(--surface-2); border-left:2px solid var(--primary); border-radius:0 var(--r-sm) var(--r-sm) 0; color:var(--ink);">${esc(t.note)}</div>` : ""}
      </div>
    </div>
  `).join("");

  // Nút thao tác xử lý
  renderActionPanel(req);

  // Mở modal
  document.getElementById("lpb-detail-modal").classList.remove("hide");
}
window.openLpbDetailModal = openLpbDetailModal;

function closeLpbDetailModal() {
  document.getElementById("lpb-detail-modal").classList.add("hide");
  currentDetailId = null;
  cancelLpbResponseSubmit();
}
window.closeLpbDetailModal = closeLpbDetailModal;

function lpbPreviewImage(src, name) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.zIndex = "100000";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.cursor = "pointer";
  overlay.onclick = () => document.body.removeChild(overlay);

  const img = document.createElement("img");
  img.src = src;
  img.style.maxWidth = "90%";
  img.style.maxHeight = "90%";
  img.style.borderRadius = "8px";
  img.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
  img.style.border = "3px solid #fff";

  overlay.appendChild(img);
  document.body.appendChild(overlay);
}
window.lpbPreviewImage = lpbPreviewImage;

// Vẽ form thao tác động dựa theo trạng thái
function renderActionPanel(req) {
  const btnEl = document.getElementById("lpb-action-buttons");
  const actionPanel = document.getElementById("lpb-action-panel");
  const responseForm = document.getElementById("lpb-response-form");
  
  if (!btnEl || !actionPanel) return;

  btnEl.innerHTML = "";
  responseForm.classList.add("hide");
  actionPanel.style.display = "block";

  const userRole = typeof CUR_USER !== 'undefined' ? CUR_USER.role : "admin";
  const currentUser = typeof CUR_USER !== 'undefined' ? CUR_USER : { full_name: "User" };
  const userFullName = currentUser.full_name || "User";

  // Trạng thái: Mới gửi -> Tiếp nhận
  if (req.status === "new") {
    btnEl.innerHTML = `
      <button class="btn btn-pri" onclick="handleLpbActionClick('receive')" style="font-weight:bold;">✓ Tiếp nhận đề xuất</button>
    `;
  }
  // Trạng thái: Đã tiếp nhận -> Đang xử lý hoặc Phản hồi
  else if (req.status === "received") {
    btnEl.innerHTML = `
      <button class="btn btn-pri" onclick="handleLpbActionClick('process')" style="font-weight:bold; background-color:#d97706; border-color:#d97706;">⚡ Bắt đầu xử lý</button>
      <button class="btn btn-ok" onclick="handleLpbActionClick('respond')" style="font-weight:bold;">✍ Phản hồi & Báo Đã xử lý</button>
    `;
  }
  // Trạng thái: Đang xử lý -> Phản hồi
  else if (req.status === "processing") {
    btnEl.innerHTML = `
      <button class="btn btn-ok" onclick="handleLpbActionClick('respond')" style="font-weight:bold;">✍ Phản hồi & Báo Đã xử lý</button>
    `;
  }
  // Trạng thái: Đã phản hồi -> BCH nghiệm thu/Hoàn thành
  else if (req.status === "responded") {
    btnEl.innerHTML = `
      <button class="btn btn-ok" onclick="handleLpbActionClick('complete')" style="font-weight:bold; background-color:#16a34a; border-color:#16a34a; padding:10px 20px;">🎉 Xác nhận hoàn thành (Đóng phiếu)</button>
    `;
  }
  // Đã hoàn thành: Khóa, không cho thao tác gì thêm
  else if (req.status === "completed") {
    actionPanel.style.display = "none";
  }
}

// Click các nút trạng thái
async function handleLpbActionClick(action) {
  const req = await getRequest(currentDetailId);
  if (!req) return;

  const currentUser = typeof CUR_USER !== 'undefined' ? CUR_USER : { full_name: "User" };
  const userFullName = currentUser.full_name || "User";
  const nowISO = new Date().toISOString();

  if (action === "receive") {
    req.status = "received";
    req.received_at = nowISO;
    req.timeline.push({
      at: nowISO,
      by: userFullName,
      action: "Đã tiếp nhận đề xuất",
      note: `Phòng ban ${req.dept} đã tiếp nhận phiếu.`
    });
    await saveRequest(req);
    if (typeof audit === 'function') {
      await audit(`Tiếp nhận đề xuất: ${req.id}`, `Bởi ${userFullName}`);
    }
    openLpbDetailModal(req.id);
    renderLpb();
  } 
  else if (action === "process") {
    req.status = "processing";
    req.timeline.push({
      at: nowISO,
      by: userFullName,
      action: "Đang xử lý đề xuất",
      note: "Phòng ban bắt đầu tiến hành xử lý yêu cầu."
    });
    await saveRequest(req);
    if (typeof audit === 'function') {
      await audit(`Xử lý đề xuất: ${req.id}`, `Bởi ${userFullName}`);
    }
    openLpbDetailModal(req.id);
    renderLpb();
  } 
  else if (action === "respond") {
    // Hiện form nhập phản hồi
    document.getElementById("lpb-response-form").classList.remove("hide");
    document.getElementById("lpb-response-input").focus();
  } 
  else if (action === "complete") {
    req.status = "completed";
    req.completed_at = nowISO;
    req.timeline.push({
      at: nowISO,
      by: userFullName,
      action: "Xác nhận hoàn thành",
      note: "Ban chỉ huy xác nhận kết quả xử lý đạt yêu cầu và đóng phiếu."
    });
    await saveRequest(req);
    if (typeof audit === 'function') {
      await audit(`Hoàn thành đề xuất: ${req.id}`, `Bởi ${userFullName}`);
    }
    openLpbDetailModal(req.id);
    renderLpb();
  }
}
window.handleLpbActionClick = handleLpbActionClick;

function cancelLpbResponseSubmit() {
  const form = document.getElementById("lpb-response-form");
  if (form) form.classList.add("hide");
  const input = document.getElementById("lpb-response-input");
  if (input) input.value = "";
}
window.cancelLpbResponseSubmit = cancelLpbResponseSubmit;

async function submitLpbResponse() {
  const text = document.getElementById("lpb-response-input").value.trim();
  if (!text) {
    alert("Vui lòng nhập nội dung phản hồi xử lý!");
    return;
  }

  const req = await getRequest(currentDetailId);
  if (!req) return;

  const currentUser = typeof CUR_USER !== 'undefined' ? CUR_USER : { full_name: "User" };
  const userFullName = currentUser.full_name || "User";
  const nowISO = new Date().toISOString();

  req.status = "responded";
  req.responded_at = nowISO;
  req.responded_by = userFullName;
  req.response = text;
  req.timeline.push({
    at: nowISO,
    by: userFullName,
    action: "Gửi phản hồi xử lý",
    note: text
  });

  await saveRequest(req);
  
  if (typeof audit === 'function') {
    await audit(`Phản hồi đề xuất: ${req.id}`, `Nội dung: "${text.substring(0, 50)}..."`);
  }

  cancelLpbResponseSubmit();
  openLpbDetailModal(req.id);
  renderLpb();
}
window.submitLpbResponse = submitLpbResponse;

// Xuất hàm chính
window.renderLpb = renderLpb;
