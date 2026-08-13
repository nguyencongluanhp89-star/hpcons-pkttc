// Thi công dashboard, goals and project management.
// === BỘ PHẬN THI CÔNG: RENDER DASHBOARD & MỤC TIÊU ===
async function renderTcDashboard() {
  const kpiEl = document.getElementById("tc-kpi");
  const alertsEl = document.getElementById("tc-alerts");
  const progressTableEl = document.getElementById("tc-progress-table");
  const logKpiEl = document.getElementById("tc-log-kpi");
  const logMissingEl = document.getElementById("tc-log-missing");

  if (!kpiEl) return;

  const projects = await accessibleProjects();
  const submissions = await DataService.listSubmissions();
  
  // Tính toán trạng thái dự án
  let total = projects.length;
  let active = 0;
  let finished = 0;
  let prepared = 0;
  let paused = 0;
  let risky = 0;

  const statsList = [];
  for (const p of projects) {
    let st = null;
    try {
      st = await projectStats(p.id);
    } catch (e) {
      console.warn("Lỗi stats cho dự án", p.id, e);
    }
    if (st) {
      statsList.push(st);
      if (st.health < 60) risky++;
    }

    if (p.status === "Đang thi công") active++;
    else if (p.status === "Đã bàn giao" || p.status === "Hoàn thành") finished++;
    else if (p.status === "Chuẩn bị") prepared++;
    else if (p.status === "Tạm dừng") paused++;
  }

  // Render thẻ KPI tổng hợp
  kpiEl.innerHTML = `
    <div class="kpi-card" style="border-top: 4px solid var(--primary); flex: 1; min-width: 120px;">
      <div class="kpi-icon">🏢</div>
      <div class="kpi-value" style="color: var(--primary); font-size: 36px;">${total}</div>
      <div class="kpi-label" style="color: var(--primary); font-size: 11px;">Tổng dự án</div>
    </div>
    <div class="kpi-card" style="border-top: 4px solid var(--accent); flex: 1; min-width: 120px;">
      <div class="kpi-icon">🚧</div>
      <div class="kpi-value" style="color: var(--accent); font-size: 36px;">${active}</div>
      <div class="kpi-label" style="color: var(--accent); font-size: 11px;">Đang thi công</div>
    </div>
    <div class="kpi-card" style="border-top: 4px solid var(--success); flex: 1; min-width: 120px;">
      <div class="kpi-icon">🔑</div>
      <div class="kpi-value" style="color: var(--success); font-size: 36px;">${finished}</div>
      <div class="kpi-label" style="color: var(--success); font-size: 11px;">Đã bàn giao</div>
    </div>
    <div class="kpi-card" style="border-top: 4px solid var(--danger); flex: 1; min-width: 120px;">
      <div class="kpi-icon">⚠️</div>
      <div class="kpi-value" style="color: var(--danger); font-size: 36px;">${risky}</div>
      <div class="kpi-label" style="color: var(--danger); font-size: 11px;">Cảnh báo rủi ro</div>
    </div>
  `;

  // Render bảng tiến độ độc lập
  if (progressTableEl) {
    if (statsList.length === 0) {
      progressTableEl.innerHTML = `<p class="muted" style="text-align:center; padding:20px;">Không có dữ liệu tiến độ.</p>`;
    } else {
      let tableHtml = `
        <table class="table table-sticky">
          <thead>
            <tr>
              <th>Dự án</th>
              <th style="width:70px;text-align:center">Sức khỏe</th>
              <th>Tiến độ kế hoạch</th>
              <th>Báo cáo hôm nay</th>
              <th style="text-align:right">Nhân sự hôm nay</th>
            </tr>
          </thead>
          <tbody>
      `;

      const todayStr = new Date().toISOString().split('T')[0];

      statsList.forEach(s => {
        const p = s.proj;
        const color = healthColor(s.health);
        const hasTodaySub = submissions.some(sub => sub.project_id === p.id && sub.log_date === todayStr);
        const subTodayBadge = hasTodaySub 
          ? `<span class="badge badge-ok">Đã báo cáo</span>` 
          : `<span class="badge badge-err">Chưa báo cáo</span>`;

        tableHtml += `
          <tr onclick="openProject('${p.id}')" style="cursor:pointer">
            <td>
              <div style="font-weight:bold; color:var(--primary-dark)">${esc(p.name)}</div>
              <div class="muted" style="font-size:11px">${esc(p.address || "---")}</div>
            </td>
            <td style="text-align:center">
              <span style="color:${color}; font-weight:bold; font-size:14px;">${s.health}%</span>
            </td>
            <td>
              <div style="font-size:12px"><b>KH:</b> ${esc(p.start_date || "?")} → ${esc(p.end_date || "?")}</div>
              <div style="font-size:11px" class="muted">Tiến độ đợt thanh toán: <b>${s.schedulePct}%</b></div>
            </td>
            <td>${subTodayBadge}</td>
            <td style="text-align:right; font-weight:bold; color:var(--primary)">${s.manpowerToday} người</td>
          </tr>
        `;
      });

      tableHtml += `
          </tbody>
        </table>
      `;
      progressTableEl.innerHTML = tableHtml;
    }
  }

  // Phân tích cảnh báo & báo cáo ngày
  const todayStr = new Date().toISOString().split('T')[0];
  const missingLogsProjects = [];
  const delayedProjects = [];
  const lowManpowerProjects = [];
  
  let totalManpowerToday = 0;
  let reportedTodayCount = 0;

  projects.forEach(p => {
    const pStats = statsList.find(s => s.proj.id === p.id);
    const hasTodaySub = submissions.some(sub => sub.project_id === p.id && sub.log_date === todayStr);

    if (p.status === "Đang thi công") {
      if (!hasTodaySub) {
        missingLogsProjects.push(p);
      } else {
        reportedTodayCount++;
      }

      if (pStats) {
        totalManpowerToday += pStats.manpowerToday;
        if (pStats.manpowerToday === 0) {
          lowManpowerProjects.push(p);
        }
      }

      if (p.end_date && p.end_date < todayStr) {
        delayedProjects.push(p);
      }
    }
  });

  if (logKpiEl) {
    logKpiEl.innerHTML = `
      <div class="kpi-card" style="border-top: 4px solid var(--primary-light); flex: 1; min-width: 110px;">
        <div class="kpi-icon">📝</div>
        <div class="kpi-value" style="color: var(--primary-dark); font-size: 28px;">${reportedTodayCount}/${active}</div>
        <div class="kpi-label" style="color: var(--primary-dark); font-size: 11px;">Nhật ký hôm nay</div>
      </div>
      <div class="kpi-card" style="border-top: 4px solid var(--success-light); flex: 1; min-width: 110px;">
        <div class="kpi-icon">👥</div>
        <div class="kpi-value" style="color: var(--success); font-size: 28px;">${totalManpowerToday}</div>
        <div class="kpi-label" style="color: var(--success); font-size: 11px;">Nhân công hôm nay</div>
      </div>
    `;
  }

  // Render danh sách dự án trễ nhật ký
  if (logMissingEl) {
    if (missingLogsProjects.length === 0) {
      logMissingEl.innerHTML = `<div class="sub-item" style="color:var(--success); font-weight:bold; padding:12px; text-align:center;">✅ 100% dự án đã nộp nhật ký!</div>`;
    } else {
      let missingHtml = `<div style="font-weight:bold; margin-bottom:8px; color:var(--danger); font-size:12px">Dự án chưa nộp nhật ký hôm nay (${missingLogsProjects.length}):</div>`;
      missingLogsProjects.forEach(p => {
        missingHtml += `
          <div class="sub-item" onclick="openProject('${p.id}'); switchTab('baocaongay-new');" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--border);" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='transparent'">
            <span style="font-weight:bold; color:var(--text-color); font-size:12px;">${esc(p.name)}</span>
            <span class="badge badge-err" style="font-size:10px;">Chưa nộp ➔</span>
          </div>
        `;
      });
      logMissingEl.innerHTML = missingHtml;
    }
  }

  // Render danh sách cảnh báo thi công
  if (alertsEl) {
    let alertsHtml = "";
    
    missingLogsProjects.forEach(p => {
      alertsHtml += `
        <div class="sub-item" style="border-left: 4px solid var(--danger); padding:8px 12px; margin-bottom:8px; background:var(--surface-2)">
          <div style="font-weight:bold; color:var(--danger); font-size:12px;">⚠️ Chậm báo cáo nhật ký</div>
          <div style="font-size:11px">${esc(p.name)} chưa nộp báo cáo hôm nay.</div>
        </div>
      `;
    });

    delayedProjects.forEach(p => {
      alertsHtml += `
        <div class="sub-item" style="border-left: 4px solid var(--warn); padding:8px 12px; margin-bottom:8px; background:var(--surface-2)">
          <div style="font-weight:bold; color:var(--warn); font-size:12px;">⏳ Trễ tiến độ thời gian</div>
          <div style="font-size:11px">${esc(p.name)} đã quá hạn kết thúc (${esc(p.end_date)}).</div>
        </div>
      `;
    });

    lowManpowerProjects.forEach(p => {
      alertsHtml += `
        <div class="sub-item" style="border-left: 4px solid var(--primary); padding:8px 12px; margin-bottom:8px; background:var(--surface-2)">
          <div style="font-weight:bold; color:var(--primary); font-size:12px;">👥 Thiếu nhân sự thi công</div>
          <div style="font-size:11px">${esc(p.name)} hôm nay ghi nhận 0 nhân công hiện trường.</div>
        </div>
      `;
    });

    if (alertsHtml === "") {
      alertsHtml = `<div style="color:var(--success); text-align:center; padding:20px; font-weight:bold; font-size:12px;">✅ Không có cảnh báo thi công!</div>`;
    }
    alertsEl.innerHTML = alertsHtml;
  }
}

// === QUẢN LÝ MỤC TIÊU / KPI THI CÔNG ===
async function renderTcGoals() {
  const listEl = document.getElementById("tc-goals-list");
  const projSelect = document.getElementById("goal-proj");
  if (!listEl) return;

  const projects = await accessibleProjects();
  if (projSelect) {
    projSelect.innerHTML = projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  }

  let goals = await metaGet("tc_goals", null);
  if (!goals) {
    goals = [
      { id: "g1", name: "Thi công ép cọc đại trà", proj_id: projects[0]?.id || "p3", target: 450, current: 380, unit: "cọc", deadline: "2026-07-15" },
      { id: "g2", name: "Thi công đổ bê tông dầm sàn L2", proj_id: projects[0]?.id || "p3", target: 1200, current: 600, unit: "m3", deadline: "2026-08-30" }
    ];
    await metaSet("tc_goals", goals);
  }

  if (goals.length === 0) {
    listEl.innerHTML = `<p class="muted" style="text-align:center; padding:40px 0;">Chưa thiết lập mục tiêu nào. Nhập form bên phải để tạo mới!</p>`;
    return;
  }

  let html = `<div style="display:grid; gap:16px;">`;
  goals.forEach(g => {
    const p = projects.find(x => x.id === g.proj_id);
    const projName = p ? p.name : "Dự án khác";
    const target = parseFloat(g.target) || 1;
    const current = parseFloat(g.current) || 0;
    const pct = Math.min(Math.round((current / target) * 100), 100);
    
    let barColor = "var(--danger)";
    if (pct >= 80) barColor = "var(--success)";
    else if (pct >= 50) barColor = "var(--primary)";
    else if (pct >= 25) barColor = "var(--warn)";

    const isOverdue = g.deadline && g.deadline < new Date().toISOString().split('T')[0];
    const dateLabel = g.deadline ? new Date(g.deadline).toLocaleDateString('vi-VN') : "---";

    html += `
      <div class="card" style="border:1px solid var(--border); border-top: 3px solid ${barColor}; margin-bottom:0; padding:16px; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <h3 style="margin:0 0 4px 0; font-size:15px; color:var(--primary-dark);">${esc(g.name)}</h3>
            <div class="muted" style="font-size:11px; margin-bottom:8px;">Dự án: <b>${esc(projName)}</b></div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-mut btn-sm" onclick="editTcGoal('${g.id}')">Sửa</button>
            <button class="btn btn-dan btn-sm" onclick="deleteTcGoal('${g.id}')">Xóa</button>
          </div>
        </div>
        
        <div style="margin:12px 0 8px 0;">
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:bold; margin-bottom:4px;">
            <span>Tiến độ: ${current}/${target} ${esc(g.unit)}</span>
            <span style="color:${barColor}">${pct}%</span>
          </div>
          <div style="width:100%; height:8px; background:var(--surface-2); border-radius:4px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:4px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-top:8px;" class="muted">
          <span>Thời hạn: <b style="${isOverdue ? 'color:var(--danger)' : ''}">${dateLabel}</b></span>
          ${isOverdue ? '<span class="badge badge-err" style="font-size:9px">Trễ hạn</span>' : ''}
        </div>
      </div>
    `;
  });
  html += `</div>`;
  listEl.innerHTML = html;
}

async function saveTcGoal() {
  const id = document.getElementById("goal-id").value;
  const name = document.getElementById("goal-name").value.trim();
  const proj_id = document.getElementById("goal-proj").value;
  const target = parseFloat(document.getElementById("goal-target").value) || 0;
  const current = parseFloat(document.getElementById("goal-current").value) || 0;
  const unit = document.getElementById("goal-unit").value.trim() || "đơn vị";
  const deadline = document.getElementById("goal-deadline").value;

  if (!name) {
    alert("Vui lòng nhập tên mục tiêu!");
    return;
  }
  if (target <= 0) {
    alert("Chỉ tiêu phải lớn hơn 0!");
    return;
  }

  let goals = await metaGet("tc_goals", []);
  if (id) {
    const idx = goals.findIndex(x => x.id === id);
    if (idx >= 0) {
      goals[idx] = { id, name, proj_id, target, current, unit, deadline };
      audit("Sửa mục tiêu thi công", name);
    }
  } else {
    goals.push({ id: uuid(), name, proj_id, target, current, unit, deadline });
    audit("Thêm mục tiêu thi công", name);
  }

  await metaSet("tc_goals", goals);
  resetGoalForm();
  await renderTcGoals();
}

async function editTcGoal(id) {
  const goals = await metaGet("tc_goals", []);
  const g = goals.find(x => x.id === id);
  if (!g) return;

  document.getElementById("goal-id").value = g.id;
  document.getElementById("goal-name").value = g.name;
  document.getElementById("goal-proj").value = g.proj_id;
  document.getElementById("goal-target").value = g.target;
  document.getElementById("goal-current").value = g.current;
  document.getElementById("goal-unit").value = g.unit;
  document.getElementById("goal-deadline").value = g.deadline || "";

  document.getElementById("goal-form-title").textContent = "Cập nhật Mục tiêu";
  document.getElementById("btn-cancel-goal").classList.remove("hide");
}

async function deleteTcGoal(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa mục tiêu này?")) return;
  let goals = await metaGet("tc_goals", []);
  goals = goals.filter(x => x.id !== id);
  await metaSet("tc_goals", goals);
  await renderTcGoals();
}

function resetGoalForm() {
  document.getElementById("goal-id").value = "";
  document.getElementById("goal-name").value = "";
  document.getElementById("goal-target").value = "";
  document.getElementById("goal-current").value = "";
  document.getElementById("goal-unit").value = "";
  document.getElementById("goal-deadline").value = "";
  
  document.getElementById("goal-form-title").textContent = "Thêm Mục tiêu mới";
  document.getElementById("btn-cancel-goal").classList.add("hide");
}

// Override renderProjectList để hỗ trợ bộ lọc và tìm kiếm động
window.renderProjectList = async function() {
  const pl = document.getElementById("tc-project-list");
  if (!pl) return;

  const list = await accessibleProjects();
  window._tcProjects = list;
  filterTcProjectList();
};

window.filterTcProjectList = function() {
  const pl = document.getElementById("tc-project-list");
  if (!pl || !window._tcProjects) return;

  const keyword = (document.getElementById("tc-proj-search")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("tc-proj-status-filter")?.value || "all";

  const filtered = window._tcProjects.filter(p => {
    const nameMatch = (p.name || "").toLowerCase().includes(keyword);
    const commMatch = (p.commander || "").toLowerCase().includes(keyword);
    const invMatch = (p.investor || "").toLowerCase().includes(keyword);
    const statusMatch = statusFilter === "all" || p.status === statusFilter;
    return (nameMatch || commMatch || invMatch) && statusMatch;
  });

  const editable = !CUR_USER || isAdminLikeRole(CUR_USER.role) || ["pm","site_manager"].includes(CUR_USER.role);
  const deletable = !CUR_USER || isAdminLikeRole(CUR_USER.role);

  if (filtered.length === 0) {
    pl.innerHTML = '<p class="muted" style="text-align:center; padding:40px 0;">Không tìm thấy dự án nào khớp với bộ lọc.</p>';
    return;
  }

  let html = '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">';
  filtered.forEach(p => {
    let stColor = "var(--text-color)";
    if(p.status === "Đang thi công") stColor = "var(--primary)";
    if(p.status === "Tạm dừng") stColor = "var(--warning)";
    if(p.status === "Đã bàn giao") stColor = "var(--success)";
    
    let editBtn = "";
    if (editable) {
       editBtn = `<button class="btn btn-mut btn-sm" onclick="event.stopPropagation(); editProject('${p.id}')" title="Sửa thông tin">Sửa</button>`;
    }
    let delBtn = "";
    if (deletable) {
       delBtn = `<button class="btn btn-sm" style="background:#dc2626;color:#fff;border:none" onclick="event.stopPropagation(); deleteProject('${p.id}')" title="Xóa dự án vĩnh viễn">Xóa</button>`;
    }

    html += `
    <div class="card kpi-card" style="border-top: 3px solid ${stColor}; margin-bottom:0; cursor:pointer; padding:20px; align-items: stretch; justify-content: space-between;" onclick="openProject('${p.id}')">
      <div>
        <div style="display:flex; justify-content:space-between; align-items: flex-start; gap: 8px;">
          <h3 style="margin-top:0; margin-bottom:8px; color:var(--primary-dark); font-size:16px">${esc(p.name)}</h3>
          <div style="display:flex; gap:6px; flex-shrink:0">${editBtn}${delBtn}</div>
        </div>
        <div style="font-size:13px; line-height:1.6; margin-bottom:12px;">
          <div><b>Trạng thái:</b> <span style="color:${stColor}; font-weight:bold">${esc(p.status)}</span></div>
          <div><b>Chủ đầu tư:</b> ${esc(p.investor || "---")}</div>
          <div><b>CH Trưởng:</b> ${esc(p.commander || "---")}</div>
          <div class="muted" style="font-size:12px; margin-top:4px;"><b>Tiến độ:</b> ${esc(p.start_date || "?")} đến ${esc(p.end_date || "?")}</div>
        </div>
      </div>
      <div style="text-align:right">
        <button class="btn btn-ok btn-sm" style="font-weight:bold">Vào dự án ➔</button>
      </div>
    </div>
    `;
  });
  html += '</div>';
  pl.innerHTML = html;
};

// ===== XÓA DỰ ÁN (chỉ admin/director) — xóa vĩnh viễn + đồng bộ đa máy =====
window.deleteProject = async function(pid){
  const projects = await metaGet('projects', []);
  const proj = (projects||[]).find(p=>p.id===pid);
  if(!proj){ return; }
  const name = (proj.name || pid).trim();

  const c = await Swal.fire({
    title: '⚠️ Xóa dự án?',
    html: `Sắp xóa <b>VĨNH VIỄN</b> dự án <b>${esc(name)}</b> cùng TOÀN BỘ dữ liệu liên quan:<br>`
        + `<span style="font-size:13px">báo cáo ngày, tiến độ, thanh toán (nhà thầu/chi phí/CĐT), tổ đội, dữ liệu thời tiết, phiếu liên phòng ban.</span>`
        + `<br><br><b style="color:#dc2626">KHÔNG thể hoàn tác</b> và sẽ xóa trên <b>tất cả các máy</b> (do đồng bộ).`,
    icon: 'warning',
    input: 'text',
    inputLabel: `Gõ đúng tên dự án để xác nhận: "${name}"`,
    inputValidator: (v)=> ((v||'').trim() !== name) ? 'Tên không khớp — nhập đúng tên dự án để xóa.' : undefined,
    showCancelButton: true,
    confirmButtonText: 'Xóa vĩnh viễn',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#dc2626'
  });
  if(!c.isConfirmed) return;

  try{
    // 1. Gỡ dự án khỏi danh sách
    await metaSet('projects', (projects||[]).filter(p=>p.id!==pid));
    // 2. Xóa báo cáo ngày & phiếu liên phòng ban của dự án
    const reps = await metaGet('daily_reports', []);
    await metaSet('daily_reports', (reps||[]).filter(r=>r.project_id!==pid));
    const lpb = await metaGet('lpb_requests', []);
    await metaSet('lpb_requests', (lpb||[]).filter(r=>r.project_id!==pid));
    // 3. Xóa các dữ liệu lưu theo từng dự án
    for(const k of ['progress:'+pid,'subcon_payments:'+pid,'expenses:'+pid,'cdt:'+pid,'team:'+pid,'weatherlogs:'+pid]){
      const cur = await metaGet(k, null);
      if(cur!==null) await metaSet(k, Array.isArray(cur) ? [] : {});
    }
    if(typeof audit==='function') audit('Xóa dự án', name);
    if(typeof SyncEngine!=='undefined' && SyncEngine.tryPush) SyncEngine.tryPush();
    if(typeof pushAiSnapshot==='function') pushAiSnapshot();

    // 4. Xóa dữ liệu trên Firebase (không chặn luồng nếu gặp lỗi)
    if (typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED && typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
      try {
        const db = window.fb.db;
        
        // a. Xóa các subcollection data của projects/{pid}
        const dataSnap = await db.collection('projects').doc(pid).collection('data').get();
        let subDocsCount = 0;
        for (const doc of dataSnap.docs) {
          await doc.ref.delete();
          subDocsCount++;
        }
        
        // b. Xóa tài liệu dự án chính
        await db.collection('projects').doc(pid).delete();
        
        // c. Xóa báo cáo ngày liên quan
        const drSnap = await db.collection('daily_reports').where('project_id', '==', pid).get();
        let drDocsCount = 0;
        for (const doc of drSnap.docs) {
          await doc.ref.delete();
          drDocsCount++;
        }
        
        // d. Xóa phiếu lpb_requests liên quan
        const lpbSnap = await db.collection('lpb_requests').where('project_id', '==', pid).get();
        let lpbDocsCount = 0;
        for (const doc of lpbSnap.docs) {
          await doc.ref.delete();
          lpbDocsCount++;
        }
        
        // e. Ảnh Storage reports/{pid}/... (TODO: Thực hiện xóa ảnh ở giai đoạn sau)

        console.log(`[FirebaseSync] Da xoa du an ${pid} tren Firebase: ${subDocsCount} sub-docs, 1 project doc, ${drDocsCount} daily_reports, ${lpbDocsCount} lpb_requests.`);
      } catch (fbErr) {
        console.warn("[FirebaseSync] Loi xoa du an tren Firebase (khong chan luong):", fbErr);
      }
    }

    await Swal.fire({icon:'success', title:'Đã xóa', text:`Đã xóa dự án "${name}".`, timer:2000, showConfirmButton:false});
  }catch(e){
    await Swal.fire({icon:'error', title:'Lỗi xóa dự án', text:String(e&&e.message||e)});
  }
  // Nếu đang chọn đúng dự án vừa xóa -> chuyển sang dự án còn lại; làm mới dropdown chọn dự án
  try{
    const remain = await metaGet('projects', []);
    if(typeof CUR!=='undefined' && CUR.project===pid){ CUR.project=(remain[0]&&remain[0].id)||''; await metaSet('cur_project', CUR.project); }
    if(typeof populateProjects==='function') await populateProjects();
  }catch(_){}
  if(typeof renderProjectList==='function') renderProjectList();
  if(typeof renderDashboard==='function') renderDashboard();
};
