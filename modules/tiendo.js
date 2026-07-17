// ---------- TIẾN ĐỘ TỔNG ----------
function pad(n){ n=String(n); return n.length<2?"0"+n:n; }
function isoFromDate(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function isoWeek(date){
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  const dayNum=(d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-dayNum+3);
  const firstThursday=d.valueOf(); d.setUTCMonth(0,1);
  if(d.getUTCDay()!==4){ d.setUTCMonth(0,1+((4-d.getUTCDay())+7)%7); }
  return 1+Math.ceil((firstThursday-d)/(7*86400000));
}
function daysBetween(aISO,bISO){ return Math.round((new Date(bISO)-new Date(aISO))/86400000); }
function parseVNDate(v){
  if(v==null||v==="") return null;
  if(v instanceof Date) return isoFromDate(v);
  if(typeof v==="number"){ return isoFromDate(new Date(Math.round((v-25569)*86400000))); }
  const s=String(v).trim();
  let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/); if(m) return m[3]+"-"+pad(m[2])+"-"+pad(m[1]);
  m=s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/); if(m) return m[1]+"-"+pad(m[2])+"-"+pad(m[3]);
  const d=new Date(s); if(!isNaN(d.getTime())) return isoFromDate(d);
  return null;
}
function levelOf(task){
  const s=(task||"").trim();
  if(/^[IVXLC]+[\.\)]/.test(s)) return 1;
  if(/^\d+[\.\)]/.test(s)) return 2;
  return 3;
}
function getEffectiveEnd(it) {
  if (!it) return null;
  if (it.extensions && it.extensions.length > 0) {
    const last = it.extensions[it.extensions.length - 1];
    if (last && last.toEnd) return last.toEnd;
  }
  return it.end;
}
function statusOf(startISO, endISO, it) {
  let item = null;
  if (startISO && typeof startISO === 'object') {
    item = startISO;
  } else if (it && typeof it === 'object') {
    item = it;
  }
  
  let start = item ? item.start : startISO;
  let end = item ? getEffectiveEnd(item) : endISO;
  let isDone = item ? (item.status === "done") : false;
  
  const t = todayISO();
  
  if (isDone) {
    return { label: "Hoàn thành", cls: "pill-task-done" };
  }
  
  if (start && t < start) {
    return { label: "Sắp tới", cls: "pill-sync" };
  }
  
  if (end && t > end) {
    return { label: "Trễ hạn / Đã qua", cls: "pill-overdue" };
  }
  
  if (end) {
    const diff = daysBetween(t, end);
    if (diff >= 0 && diff <= 7) {
      return { label: "Sắp hết hạn", cls: "pill-task-expiring" };
    }
  }
  
  return { label: "Đang làm", cls: "pill-ok" };
}
function conLai(startISO, endISO, it) {
  let item = null;
  if (startISO && typeof startISO === 'object') {
    item = startISO;
  } else if (it && typeof it === 'object') {
    item = it;
  }
  if (item && item.status === "done") return "Đã xong";
  const t = todayISO();
  const end = item ? getEffectiveEnd(item) : endISO;
  const start = item ? item.start : startISO;
  if (end && t > end) return "Quá hạn " + daysBetween(end, t) + " ngày";
  if (start && t < start) return daysBetween(t, start) + " ngày (chờ)";
  if (end) return Math.max(0, daysBetween(t, end)) + " ngày";
  return "—";
}
function progressKey(){ return "progress:"+CUR.project; }
async function getProgress(){ return await metaGet(progressKey(), []); }
async function setProgress(arr){ return metaSet(progressKey(), arr); }
let tiendoLimit = 30;
function loadMoreTiendo() {
  tiendoLimit += 50;
  renderTiendo();
}
window.loadMoreTiendo = loadMoreTiendo;

async function renderTiendo(){
  const searchVal = document.getElementById("td-filter-search") ? document.getElementById("td-filter-search").value.trim().toLowerCase() : "";
  const statusVal = document.getElementById("td-filter-status") ? document.getElementById("td-filter-status").value : "all";

  const items=await getProgress();
  const t = todayISO(); 
  const tDate = new Date();
  const dayOfWeek = tDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startWDate = new Date(tDate);
  startWDate.setDate(tDate.getDate() - daysToMonday);
  const startW = isoFromDate(startWDate);
  const endWDate = new Date(startWDate);
  endWDate.setDate(startWDate.getDate() + 20);
  const endW = isoFromDate(endWDate);
  
  if (window.lastTiendoProj !== CUR.project) {
    window.lastTiendoProj = CUR.project;
    tiendoLimit = 30;
  }
  
  let activeCount = 0;
  let lateCount = 0;
  let expiringCount = 0;
  items.forEach(it => {
    const effectiveEnd = getEffectiveEnd(it) || it.end;
    const st = statusOf(it.start, effectiveEnd, it);
    if(it.status !== "done") {
      if(st.label === "Đang làm" || st.label === "Sắp hết hạn") activeCount++;
      if(st.label === "Trễ hạn / Đã qua") lateCount++;
      if(effectiveEnd) {
        const diff = daysBetween(t, effectiveEnd);
        if(diff >= 0 && diff <= 7) expiringCount++;
      }
    }
  });
  if(document.getElementById("pg-kpi-total")) document.getElementById("pg-kpi-total").textContent = items.length;
  const elTotalDesc = document.getElementById("pg-kpi-total-desc");
  if(elTotalDesc) elTotalDesc.textContent = "Tất cả hạng mục của dự án";

  if(document.getElementById("pg-kpi-active")) document.getElementById("pg-kpi-active").textContent = activeCount;
  const elActiveDesc = document.getElementById("pg-kpi-active-desc");
  if(elActiveDesc) elActiveDesc.textContent = "Đang triển khai thực tế";

  if(document.getElementById("pg-kpi-late")) document.getElementById("pg-kpi-late").textContent = lateCount;
  const elLateDesc = document.getElementById("pg-kpi-late-desc");
  if(elLateDesc) elLateDesc.textContent = lateCount > 0 ? "Cần xử lý gấp" : "Tiến độ đạt yêu cầu";

  // Lấy thông tin dự án hiện tại để lấy ngày bắt đầu và kết thúc
  let proj = null;
  let progressPct = 0;
  try {
    const projects = await DataService.listProjects();
    proj = projects.find(p => p.id === CUR.project);
    
    // Tính tiến độ chung của toàn bộ dự án
    let doneTasks = 0;
    const workTasks = items.filter(it => levelOf(it.task) > 1);
    let totalDuration = 0;
    let completedDuration = 0;
    workTasks.forEach(it => {
      if(it.status === "done") doneTasks++;
      const dur = Number(it.duration) || 0;
      const pct = it.status === "done" ? 100 : (Number(it.completedPct) || 0);
      if (dur > 0) {
        totalDuration += dur;
        completedDuration += (pct / 100) * dur;
      }
    });
    if (totalDuration > 0) {
      progressPct = Math.round((completedDuration / totalDuration) * 100);
    } else if (workTasks.length > 0) {
      progressPct = Math.round(doneTasks / workTasks.length * 100);
    }
  } catch (err) {
    console.error("Lỗi lấy thông tin dự án để tính timeline:", err);
  }

  // Render Timeline
  const timelineDiv = document.getElementById("tiendo-project-timeline");
  if (timelineDiv && proj) {
    timelineDiv.innerHTML = renderTimeline(proj.start_date, proj.end_date, progressPct, proj.status === "Đã bàn giao");
  }

  // Render Warning Banner
  const banner = document.getElementById("td-warning-banner");
  if (banner) {
    if (expiringCount > 0) {
      banner.style.display = "block";
      banner.innerHTML = `⚠️ <b>${expiringCount}</b> công tác sắp hết hạn trong 7 ngày — cần xem xét gia hạn.`;
    } else {
      banner.style.display = "none";
    }
  }

  if(document.getElementById("td-range")) document.getElementById("td-range").innerHTML="<b>Khoảng 3 tuần:</b> " + fmtVN(startW) + " → " + fmtVN(endW) + ". <i>Biểu đồ thể hiện % thời gian thi công tính tới hiện tại.</i>";
  
  const win = [];
  const added = new Set();
  let curLvl1 = null;
  let curLvl2 = null;

  items.forEach(it => {
    const lvl = levelOf(it.task);
    if (lvl === 1) { curLvl1 = it; curLvl2 = null; }
    else if (lvl === 2) { curLvl2 = it; }
    
    const effectiveEnd = getEffectiveEnd(it) || it.end;
    const inWindow = (!it.start||it.start<=endW) && (!effectiveEnd||effectiveEnd>=startW) && (it.start||effectiveEnd);
    
    if (inWindow) {
      if (lvl >= 2 && curLvl1 && !added.has(curLvl1.id)) {
        win.push(curLvl1);
        added.add(curLvl1.id);
      }
      if (lvl === 3 && curLvl2 && !added.has(curLvl2.id)) {
        win.push(curLvl2);
        added.add(curLvl2.id);
      }
      if (!added.has(it.id)) {
        win.push(it);
        added.add(it.id);
      }
    }
  });
    
  if(document.getElementById("td-window")) document.getElementById("td-window").innerHTML = win.length? win.map((it,i)=>{ 
    const effectiveEnd = getEffectiveEnd(it) || it.end;
    const st=statusOf(it.start,effectiveEnd,it);
    const rowStyle = (st.label === "Trễ hạn / Đã qua") ? "color:var(--danger);" : "";
    
    let percent = 0;
    let hasGantt = false;
    if (it.status === "done") {
      percent = 100;
      hasGantt = true;
    } else if (it.start && effectiveEnd) {
      const totalDays = daysBetween(it.start, effectiveEnd) + 1; 
      const passedDays = daysBetween(it.start, t) + 1;
      if (passedDays <= 0) percent = 0;
      else if (passedDays >= totalDays) percent = 100;
      else percent = Math.round((passedDays / totalDays) * 100);
      hasGantt = true;
    } else if (it.start) {
      percent = (t >= it.start) ? 100 : 0;
      hasGantt = true;
    } else if (effectiveEnd) {
      percent = (t >= effectiveEnd) ? 100 : 0;
      hasGantt = true;
    }

    let ganttHtml = "—";
    if (hasGantt) {
      let remainPct = 100 - percent;
      let barColorElapsed = "#22c55e";
      if (it.status === "done") {
        barColorElapsed = "#10b981";
      } else if (st.label === "Trễ hạn / Đã qua") {
        barColorElapsed = "#ef4444";
      } else if (st.label === "Sắp tới") {
        barColorElapsed = "var(--muted)";
      } else if (st.label === "Sắp hết hạn") {
        barColorElapsed = "#d9822b";
      }
      
      let barColorRemain = st.label === "Sắp tới" ? "#3b82f6" : "#ef4444";
      if(st.label === "Trễ hạn / Đã qua") barColorRemain = "#fee2e2";
      
      let textElapsed = percent > 0 ? percent + "% Đã qua" : "";
      let textRemain = remainPct > 0 ? remainPct + "% Còn lại" : "";
      if(st.label === "Sắp tới") { textElapsed = ""; textRemain = "100% Sắp triển khai"; }
      if(it.status === "done") { textElapsed = "Hoàn thành"; textRemain = ""; }

      ganttHtml = `<div style="display:flex; flex-direction:column; gap:4px; width:100%; min-width:180px;" title="Bắt đầu: ${fmtVN(it.start)} - Kết thúc: ${fmtVN(effectiveEnd)}">
                    <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; text-transform:uppercase;">
                      <span style="color:${barColorElapsed}">${textElapsed}</span>
                      <span style="color:${barColorRemain}">${textRemain}</span>
                    </div>
                    <div style="display:flex; height:12px; border-radius:6px; overflow:hidden; box-shadow:inset 0 1px 2px rgba(0,0,0,0.1); background:var(--surface-2); border:1px solid var(--border);">
                      <div style="width:${percent}%; background:${barColorElapsed}; transition:width 0.5s;"></div>
                      <div style="width:${remainPct}%; background:${barColorRemain}; transition:width 0.5s; opacity:0.9;"></div>
                    </div>
                   </div>`;
    }
                     
    return '<tr class="lvl'+levelOf(it.task)+'" style="'+rowStyle+'"><td style="text-align:center;">'+(i+1)+'</td><td >'+esc(it.task)+'</td><td>'+fmtVN(it.start)+'</td><td>'+fmtVN(effectiveEnd)+'</td><td>'+(hasGantt?'<span class="pill '+st.cls+'">'+st.label+'</span>':"—")+'</td><td style="min-width:150px; vertical-align:middle;">'+ganttHtml+'</td></tr>';
  }).join("") : '<tr><td colspan="6" class="muted" style="text-align:center; padding:20px;">Không có hạng mục trong 3 tuần tới.</td></tr>';
  
  let cLvl1 = "", cLvl2 = "";
  const flatWin = [];
  items.forEach(it => {
    const lvl = levelOf(it.task);
    let rawTask = it.task.replace(/^[IVX]+\.\s*/i, '').replace(/^[0-9]+\.\s*/, '');
    if (lvl === 1) { cLvl1 = rawTask; cLvl2 = ""; }
    else if (lvl === 2) { cLvl2 = rawTask; }
    
    const effectiveEnd = getEffectiveEnd(it) || it.end;
    const inWindow = (!it.start||it.start<=endW) && (!effectiveEnd||effectiveEnd>=startW) && (it.start||effectiveEnd);
    if (inWindow && (it.start || effectiveEnd)) {
      let area = "";
      if (lvl === 1) area = "TỔNG THỂ";
      else if (lvl === 2) area = cLvl1 || "CHUNG";
      else area = [cLvl1, cLvl2].filter(Boolean).join(" - ");
      
      const st = statusOf(it.start,effectiveEnd,it);
      
      // Lọc theo tìm kiếm văn bản (tên khu vực hoặc tên công tác)
      if (searchVal) {
        const matchSearch = (area && area.toLowerCase().includes(searchVal)) || (rawTask && rawTask.toLowerCase().includes(searchVal));
        if (!matchSearch) return; // Bỏ qua nếu không khớp
      }
      
      // Lọc theo trạng thái lựa chọn
      if (statusVal !== "all") {
        let matchStatus = false;
        if (statusVal === "dang-thi-cong" && (st.label === "Đang làm" || st.label === "Đang thi công")) matchStatus = true;
        else if (statusVal === "tre-han" && st.label === "Trễ hạn / Đã qua") matchStatus = true;
        else if (statusVal === "sap-toi" && st.label === "Sắp tới") matchStatus = true;
        else if (statusVal === "sap-het-han" && st.label === "Sắp hết hạn") matchStatus = true;
        else if (statusVal === "hoan-thanh" && (it.status === "done" || st.label === "Hoàn thành")) matchStatus = true;
        
        if (!matchStatus) return; // Bỏ qua nếu không khớp
      }

      let percent = 0;
      if (it.status === "done") {
        percent = 100;
      } else if (it.start && effectiveEnd) {
        const totalDays = daysBetween(it.start, effectiveEnd) + 1; 
        const passedDays = daysBetween(it.start, t) + 1;
        if (passedDays <= 0) percent = 0;
        else if (passedDays >= totalDays) percent = 100;
        else percent = Math.round((passedDays / totalDays) * 100);
      } else if (it.start) { percent = (t >= it.start) ? 100 : 0; }
      else if (effectiveEnd) { percent = (t >= effectiveEnd) ? 100 : 0; }
      
      let remainPct = 100 - percent;

      flatWin.push({ it: it, area: area, taskName: rawTask, remainPct: remainPct, st: st });
    }
  });



  if(document.getElementById("td-all")) {
    const totalCount = flatWin.length;
    const itemsToRender = flatWin.slice(0, tiendoLimit);
    let html = itemsToRender.length ? itemsToRender.map((obj,i)=>{ 
      const it = obj.it;
      const st = obj.st;
      const effectiveEnd = getEffectiveEnd(it) || it.end;
      
      // Extension Info
      const hasExtension = it.extensions && it.extensions.length > 0;
      let extensionHtml = "";
      if (hasExtension) {
        extensionHtml = `<span style="color:var(--warning); font-weight:700;">${fmtVN(effectiveEnd)}</span>`;
      } else {
        extensionHtml = `<span style="color:var(--muted);">—</span>`;
      }
      if (it.status !== "done") {
        extensionHtml += ` <button class="btn-ext" onclick="openExtensionModal('${it.id}')" style="margin-left:4px;">+ Gia hạn</button>`;
      }

      // Display status
      let displayLabel = st.label;
      if (displayLabel === "Đang làm") displayLabel = "Đang thi công";
      else if (displayLabel === "Trễ hạn / Đã qua") displayLabel = "Trễ hạn";
      
      const statusPill = `<span class="pill ${st.cls}">${displayLabel}</span>`;
      
      // Actions
      let actionsHtml = "";
      if (it.status !== "done") {
        actionsHtml += `<button class="btn btn-ok btn-sm" onclick="openCompleteModal('${it.id}')" style="margin-right:6px; box-shadow: 0 1px 2px rgba(34,197,94,0.2);">✓ Hoàn thành</button>`;
      }
      actionsHtml += `<button class="btn btn-mut btn-sm" onclick="progEdit('${it.id}')">Sửa</button> `;
      actionsHtml += `<button class="btn btn-dan btn-sm" onclick="progDelete('${it.id}')">✕</button>`;

      return `<tr style="border-bottom:1px solid var(--border); transition:background 0.2s;">
                <td style="text-align:center; color:var(--muted);">${i+1}</td>
                <td style="font-weight:700; color:var(--text-strong); font-size:12px; text-transform:uppercase;">${esc(obj.area)}</td>
                <td style="font-weight:600; color:var(--text-strong);">${esc(obj.taskName)}</td>
                <td>${fmtVN(it.start)}</td>
                <td>${fmtVN(it.end)}</td>
                <td style="text-align:center;">${extensionHtml}</td>
                <td style="text-align:center;">${statusPill}</td>
                <td style="white-space:nowrap; text-align:center;">${actionsHtml}</td>
              </tr>`;
    }).join("") : '<tr><td colspan="8">' + renderEmptyState('📅', 'Không có công tác', 'Không ghi nhận hạng mục thi công nào trong khoảng thời gian này.') + '</td></tr>';
    
    if (totalCount > tiendoLimit) {
      html += `<tr><td colspan="8" style="text-align:center; padding:16px; background:rgba(255,255,255,0.02);"><button class="btn btn-mut" onclick="loadMoreTiendo()">🔄 Xem thêm (${totalCount - tiendoLimit} công tác khác)</button></td></tr>`;
    }
    document.getElementById("td-all").innerHTML = html;
  }
  
  renderTdFileInfo();
}

// Modal extension operations
window.openExtensionModal = async function(id) {
  const items = await getProgress();
  const it = items.find(x => x.id === id);
  if (!it) return;
  
  window.extTaskId = id;
  document.getElementById("ext-task-name").textContent = it.task;
  document.getElementById("ext-orig-end").textContent = fmtVN(it.end);
  
  const effEnd = getEffectiveEnd(it);
  document.getElementById("ext-cur-end").textContent = effEnd ? fmtVN(effEnd) : "—";
  
  const extCount = it.extensions ? it.extensions.length : 0;
  document.getElementById("ext-count").textContent = extCount;
  
  document.getElementById("ext-new-end").value = "";
  document.getElementById("ext-pct").value = "";
  document.getElementById("ext-reason").value = "";
  document.getElementById("ext-msg").textContent = "";
  
  const histDiv = document.getElementById("ext-history");
  if (histDiv) {
    if (it.extensions && it.extensions.length > 0) {
      let histHtml = `<div style="font-weight:700; font-size:12px; margin-bottom:8px; color:var(--text-strong); text-transform:uppercase;">Lịch sử gia hạn:</div>`;
      histHtml += it.extensions.map((ext, idx) => {
        return `<div class="ext-log-item">
                  <b>Lần ${idx + 1}:</b> Từ ngày <b>${fmtVN(ext.fromEnd)}</b> đến ngày <b>${fmtVN(ext.toEnd)}</b><br>
                  Thực hiện bởi: <b>${ext.by || 'Không rõ'}</b> lúc <i>${new Date(ext.at).toLocaleString('vi-VN')}</i><br>
                  % Hoàn thành: <b>${ext.pct}%</b><br>
                  Lý do: <i>${esc(ext.reason)}</i>
                </div>`;
      }).join("");
      histDiv.innerHTML = histHtml;
    } else {
      histDiv.innerHTML = renderEmptyState('⏳', 'Chưa có lịch sử gia hạn', 'Hạng mục này chưa từng thực hiện xin gia hạn tiến độ.');
    }
  }
  
  document.getElementById("modal-extension").classList.remove("hide");
};

window.closeExtensionModal = function() {
  document.getElementById("modal-extension").classList.add("hide");
  window.extTaskId = null;
};

window.saveExtension = async function() {
  const id = window.extTaskId;
  if (!id) return;
  
  const newEnd = document.getElementById("ext-new-end").value;
  const pctVal = document.getElementById("ext-pct").value;
  const reason = document.getElementById("ext-reason").value.trim();
  const msgEl = document.getElementById("ext-msg");
  
  if (!newEnd) { msgEl.textContent = "Vui lòng chọn ngày gia hạn."; return; }
  if (pctVal === "" || isNaN(pctVal) || pctVal < 0 || pctVal > 99) { msgEl.textContent = "Vui lòng nhập % hoàn thành hợp lệ (0-99)."; return; }
  if (!reason) { msgEl.textContent = "Vui lòng nhập lý do gia hạn."; return; }
  
  const items = await getProgress();
  const it = items.find(x => x.id === id);
  if (!it) return;
  
  const fromEnd = getEffectiveEnd(it) || it.end;
  
  if (it.start && newEnd < it.start) {
    msgEl.textContent = "Ngày gia hạn không thể trước ngày bắt đầu công tác.";
    return;
  }
  if (newEnd <= fromEnd) {
    msgEl.textContent = "Ngày gia hạn mới phải sau ngày kết thúc hiện tại.";
    return;
  }
  
  if (!it.extensions) it.extensions = [];
  
  const extObj = {
    id: uuid(),
    at: new Date().toISOString(),
    by: CUR.user || "Chỉ huy trưởng",
    fromEnd: fromEnd,
    toEnd: newEnd,
    pct: parseInt(pctVal, 10),
    reason: reason
  };
  
  it.extensions.push(extObj);
  
  if (typeof audit === 'function') {
    await audit(`Gia hạn công tác: "${it.task}"`, `Từ ngày ${fmtVN(fromEnd)} đến ngày ${fmtVN(newEnd)}. Lý do: ${reason}`);
  }
  
  await setProgress(items);
  closeExtensionModal();
  renderTiendo();
  
  if (typeof renderDashboard === 'function') {
    renderDashboard();
  }
};

// Modal complete operations
window.openCompleteModal = async function(id) {
  const items = await getProgress();
  const it = items.find(x => x.id === id);
  if (!it) return;
  
  window.cmpTaskId = id;
  document.getElementById("cmp-task-name").textContent = it.task;
  
  const now = new Date();
  document.getElementById("cmp-timestamp").textContent = now.toLocaleString("vi-VN");
  
  const effEnd = getEffectiveEnd(it) || it.end;
  const nowISO = isoFromDate(now);
  
  const kpiInfoEl = document.getElementById("cmp-kpi-info");
  if (kpiInfoEl) {
    if (!effEnd) {
      kpiInfoEl.style.background = "rgba(107,114,128,0.12)";
      kpiInfoEl.style.border = "1px solid rgba(107,114,128,0.4)";
      kpiInfoEl.style.color = "#4b5563";
      kpiInfoEl.innerHTML = `ℹ️ <b>Không xác định:</b> Công tác không có ngày kết thúc kế hoạch. Không đánh giá đúng/trễ hạn.`;
    } else if (nowISO <= effEnd) {
      kpiInfoEl.style.background = "rgba(34,197,94,0.12)";
      kpiInfoEl.style.border = "1px solid rgba(34,197,94,0.4)";
      kpiInfoEl.style.color = "#065f46";
      kpiInfoEl.innerHTML = `✅ <b>Đúng hạn:</b> Hoàn thành trước hoặc đúng hạn kế hoạch (${fmtVN(effEnd)}). Đạt tiêu chí đánh giá KPI tiến độ.`;
    } else {
      kpiInfoEl.style.background = "rgba(239,68,68,0.12)";
      kpiInfoEl.style.border = "1px solid rgba(239,68,68,0.4)";
      kpiInfoEl.style.color = "#991b1b";
      kpiInfoEl.innerHTML = `⚠️ <b>Trễ hạn:</b> Ngày hoàn thành hiện tại trễ hơn kế hoạch (${fmtVN(effEnd)}). Sẽ ảnh hưởng đến điểm đánh giá KPI tiến độ.`;
    }
  }
  
  document.getElementById("cmp-msg").textContent = "";
  document.getElementById("modal-complete").classList.remove("hide");
};

window.closeCompleteModal = function() {
  document.getElementById("modal-complete").classList.add("hide");
  window.cmpTaskId = null;
};

window.confirmComplete = async function() {
  const id = window.cmpTaskId;
  if (!id) return;
  
  const items = await getProgress();
  const it = items.find(x => x.id === id);
  if (!it) return;
  
  const now = new Date();
  it.status = "done";
  it.completedAt = now.toISOString();
  it.completedPct = 100;
  
  const effEnd = getEffectiveEnd(it) || it.end;
  const nowISO = isoFromDate(now);
  
  let statusStr = "không xác định";
  let auditDetail = `Hoàn thành lúc ${now.toLocaleString("vi-VN")} (Không có hạn định)`;
  if (effEnd) {
    const isLate = nowISO > effEnd;
    statusStr = isLate ? "trễ hạn" : "đúng hạn";
    auditDetail = `Hoàn thành ${statusStr} lúc ${now.toLocaleString("vi-VN")} (Hạn chót: ${fmtVN(effEnd)})`;
  }
  
  if (typeof audit === 'function') {
    await audit(`Hoàn thành công tác: "${it.task}"`, auditDetail);
  }
  
  await setProgress(items);
  closeCompleteModal();
  renderTiendo();
  
  if (typeof renderDashboard === 'function') {
    renderDashboard();
  }
};
function csvToRows(text){
  return text.split(/\r?\n/).filter(l=>l.trim()!=="").map(line=>{
    const out=[]; let cur="",q=false;
    for(let i=0;i<line.length;i++){ const ch=line[i];
      if(q){ if(ch==='"'){ if(line[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=ch; }
      else { if(ch===','){out.push(cur);cur="";} else if(ch==='"'){q=true;} else cur+=ch; } }
    out.push(cur); return out;
  });
}
function rowsToProgress(rows){
  const items=[];
  let cTask=0, cStart=1, cEnd=2, cDur=3;
  if(rows.length > 0) {
    const head = rows[0].map(x => String(x||"").toLowerCase());
    let i = head.findIndex(x => x.includes("task") || x.includes("công tác") || x.includes("hạng mục") || x.includes("name"));
    if(i>=0) cTask = i;
    i = head.findIndex(x => x.includes("start") || x.includes("bắt đầu"));
    if(i>=0) cStart = i;
    i = head.findIndex(x => x.includes("end") || x.includes("finish") || x.includes("kết thúc"));
    if(i>=0) cEnd = i;
    i = head.findIndex(x => x.includes("duration") || x.includes("thời lượng") || x.includes("ngày"));
    if(i>=0) cDur = i;
  }

  rows.forEach((r,idx)=>{
    if(idx===0) return; // bỏ dòng tiêu đề
    const task=(r[cTask]==null?"":String(r[cTask])).trim();
    if(!task) return;
    const start=parseVNDate(r[cStart]), end=parseVNDate(r[cEnd]);
    let durationStr = r[cDur] ? String(r[cDur]).replace(/[^\d.-]/g, '') : ""; // Ví dụ "15 days" -> "15"
    let duration = durationStr !== "" ? Number(durationStr) : null;
    if((duration==null || isNaN(duration)) && start && end) duration=daysBetween(start,end)+1;
    items.push({id:uuid(), task, start, end, duration:(duration && !isNaN(duration))?duration:null});
  });
  return items;
}
function fmtSize(b){ b=b||0; return b<1024? b+" B" : (b<1048576? (b/1024).toFixed(1)+" KB" : (b/1048576).toFixed(1)+" MB"); }
function fileInfoKey(){ return "progress_file:"+CUR.project; }
async function renderTdFileInfo(){
  const i=await metaGet(fileInfoKey(), null);
  const n=(await getProgress()).length;
  const box=$("td-fileinfo"); if(!box) return;
  box.innerHTML = (i && i.name) ? '📄 <b>'+esc(i.name)+'</b> · '+fmtSize(i.size)+' · nạp lúc '+new Date(i.at).toLocaleString("vi-VN")+' · <b>'+n+'</b> hạng mục'
                    : 'Chưa nạp file. Hiện có <b>'+n+'</b> hạng mục.';
}
// Dynamic loading of PDF.js
async function ensurePdfJsLoaded() {
  if (window.pdfjsLib) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = () => reject(new Error("Không thể tải thư viện PDF.js."));
    document.head.appendChild(script);
  });
}

// Direct Gemini API call for PDF
async function callGeminiPdfDirect(b64, filename) {
  const key = (localStorage.getItem('sys_gemini_key') || "").trim();
  if (!key) throw new Error("Chưa cấu hình API Key trong Tab Hệ thống -> Cấu hình AI.");
  
  const prompt =
    "Đây là file tiến độ thi công (PDF) tên \"" + (filename || "") + "\".\n" +
    "CHỈ trích xuất danh sách CÔNG TÁC với 3 thông tin: Công tác | Ngày bắt đầu | Ngày kết thúc.\n" +
    "TUYỆT ĐỐI KHÔNG đọc/diễn giải phần BIỂU ĐỒ GANTT (các thanh ngang tiến độ, lưới ngày) — chỉ lấy bảng/danh sách chữ.\n" +
    "LỌC BỎ mọi ký tự tiếng Trung, Nhật, Hàn (CJK) lẫn trong câu; chỉ giữ tiếng Việt, số và ngày.\n" +
    "Trình bày dạng bảng gọn, mỗi dòng theo đúng định dạng: Công tác | DD/MM/YYYY | DD/MM/YYYY.\n" +
    "Sau bảng, nêu ngắn gọn các hạng mục đang/sắp tới hạn và cảnh báo (nếu có).\n" +
    "Chỉ dựa trên nội dung file, không bịa.";

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let errors = [];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const payload = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: b64
              }
            },
            {
              text: prompt
            }
          ]
        }]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Lỗi từ model ${model}`);
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error(`Phản hồi từ ${model} không có nội dung`);
    } catch (e) {
      console.warn(`Model ${model} thất bại:`, e.message);
      errors.push(`${model}: ${e.message}`);
    }
  }
  throw new Error("Tất cả các model Gemini đều lỗi:\n" + errors.join('\n'));
}

// Parse text list to structured items
function parseTasksFromText(text) {
  const lines = text.split('\n');
  const items = [];
  for (const line of lines) {
    const parts = line.split('|').map(x => x.trim());
    if (parts.length >= 3) {
      let task = parts[0];
      // Strip headers
      const headerWords = [
        "id", "task name", "taskname", "duration", "start", "finish",
        "tên công tác", "công tác", "thời gian", "thời lượng", "bắt đầu", "kết thúc"
      ];
      headerWords.forEach(word => {
        const regex = new RegExp("\\b" + word + "\\b", "gi");
        task = task.replace(regex, "");
      });
      task = task.replace(/\d+\s*days?/gi, "").replace(/\d+\s*ngày/gi, "").trim();
      task = task.replace(/^[\|\s\-\d\.\:\,\;]+/, '').replace(/[\|\s\-\d\.\:\,\;]+$/, '').trim();
      const startStr = parts[1];
      const endStr = parts[2];
      
      const parseDate = (s) => {
        const match = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
        if (match) {
          const d = match[1].padStart(2, '0');
          const m = match[2].padStart(2, '0');
          const y = match[3];
          return `${y}-${m}-${d}`;
        }
        return null;
      };
      
      const start = parseDate(startStr);
      const end = parseDate(endStr);
      if (task && start && end) {
        const duration = daysBetween(start, end) + 1;
        items.push({
          id: uuid(),
          task: task,
          start: start,
          end: end,
          duration: (duration && !isNaN(duration)) ? duration : null
        });
      }
    }
  }
  return items;
}

// Confirm and handle merge/replace for progress tasks
async function handleImportTasks(items) {
  const currentItems = await getProgress();
  let finalItems = [];
  if (currentItems.length > 0) {
    let action = null; // 'replace', 'merge', or null (cancel)
    if (typeof Swal !== "undefined") {
      const res = await Swal.fire({
        title: 'Cập nhật Tiến độ',
        text: `Hệ thống đang có ${currentItems.length} hạng mục tiến độ hiện tại. Bạn muốn thay thế hoàn toàn hay gộp thêm?`,
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: 'var(--red)',
        denyButtonColor: 'var(--primary)',
        cancelButtonColor: 'var(--muted)',
        confirmButtonText: 'Thay thế hoàn toàn',
        denyButtonText: 'Gộp thêm mới',
        cancelButtonText: 'Hủy bỏ'
      });
      if (res.isConfirmed) action = 'replace';
      else if (res.isDenied) action = 'merge';
    } else {
      const isReplace = confirm("Hệ thống đang có " + currentItems.length + " hạng mục tiến độ hiện tại.\n\n- Nhấn OK để THAY THẾ hoàn toàn dữ liệu cũ.\n- Nhấn Cancel để GỘP THÊM.");
      action = isReplace ? 'replace' : 'merge';
    }

    if (!action) return;

    if (action === 'replace') {
      finalItems = items;
    } else {
      finalItems = [...currentItems];
      for (const newItem of items) {
        const existing = finalItems.find(x => x.task.trim().toLowerCase() === newItem.task.trim().toLowerCase());
        if (existing) {
          existing.start = newItem.start;
          existing.end = newItem.end;
          existing.duration = newItem.duration;
        } else {
          finalItems.push(newItem);
        }
      }
    }
  } else {
    finalItems = items;
  }
  
  await setProgress(finalItems);
  renderTiendo();
  alert("Đã nạp thành công " + finalItems.length + " hạng mục.");
}

function importProgress(ev){ const f=ev.target.files[0]; if(f) importProgressFile(f); ev.target.value=""; }
// Local PDF text extraction helper
async function extractTextFromPdf(file) {
  await ensurePdfJsLoaded();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
        let txt = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const c = await pg.getTextContent();
          
          // Reconstruct lines using Y coordinate transform[5]
          let lastY = null;
          let pageText = "";
          for (const item of c.items) {
            if (item.str === undefined) continue;
            const y = item.transform ? item.transform[5] : null;
            
            if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
              pageText += "\n";
            } else if (lastY !== null && item.str.trim()) {
              pageText += " ";
            }
            
            pageText += item.str;
            if (y !== null) lastY = y;
          }
          txt += pageText + "\n";
        }
        resolve(txt);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file PDF."));
    reader.readAsArrayBuffer(file);
  });
}

// Call Gemini directly with extracted text
async function callGeminiPdfDirectText(text, filename) {
  const key = (localStorage.getItem('sys_gemini_key') || "").trim();
  if (!key) throw new Error("Chưa cấu hình API Key trong Tab Hệ thống -> Cấu hình AI.");
  
  const prompt = `Đây là nội dung văn bản trích xuất từ file PDF tiến độ thi công "${filename}":
---
${text}
---
Hãy trích xuất danh sách các công tác thi công.
Yêu cầu bắt buộc:
1. Chỉ trả về danh sách các dòng theo định dạng chuẩn xác: Tên công tác | Ngày bắt đầu (DD/MM/YYYY) | Ngày kết thúc (DD/MM/YYYY)
Ví dụ:
Thi công móng xưởng 1 | 05/04/2026 | 25/04/2026
Lắp đặt kết cấu thép | 26/04/2026 | 15/05/2026

2. Lọc bỏ các thông tin thừa, nhãn biểu đồ Gantt, hoặc ghi chú.
3. Không trả về bất cứ văn bản giải thích nào khác ngoài các dòng định dạng trên.`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let errors = [];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const payload = {
        contents: [{
          parts: [
            {
              text: prompt
            }
          ]
        }]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Lỗi từ model ${model}`);
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error(`Phản hồi từ ${model} không có nội dung`);
    } catch (e) {
      console.warn(`Model ${model} thất bại:`, e.message);
      errors.push(`${model}: ${e.message}`);
    }
  }
  throw new Error("Tất cả các model Gemini đều lỗi:\n" + errors.join('\n'));
}

// Local offline regex parser helper
function parseTasksLocally(text) {
  const lines = text.split('\n');
  const items = [];
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g;
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    const dates = [];
    let match;
    const regex = new RegExp(dateRegex);
    while ((match = regex.exec(line)) !== null) {
      const d = match[1].padStart(2, '0');
      const m = match[2].padStart(2, '0');
      const y = match[3];
      dates.push(`${y}-${m}-${d}`);
    }
    
    if (dates.length >= 2) {
      const dateStrings = line.match(dateRegex);
      if (dateStrings && dateStrings.length >= 2) {
        const idx = line.indexOf(dateStrings[0]);
        let task = line.substring(0, idx).trim();
        // Strip headers
        const headerWords = [
          "id", "task name", "taskname", "duration", "start", "finish",
          "tên công tác", "công tác", "thời gian", "thời lượng", "bắt đầu", "kết thúc"
        ];
        headerWords.forEach(word => {
          const regex = new RegExp("\\b" + word + "\\b", "gi");
          task = task.replace(regex, "");
        });
        task = task.replace(/\d+\s*days?/gi, "").replace(/\d+\s*ngày/gi, "").trim();
        task = task.replace(/^[\|\s\-\d\.\:\,\;]+/, '').replace(/[\|\s\-\d\.\:\,\;]+$/, '').trim();
        
        const start = dates[0];
        const end = dates[1];
        if (task && task.length > 2) {
          const duration = daysBetween(start, end) + 1;
          items.push({
            id: uuid(),
            task: task,
            start: start,
            end: end,
            duration: (duration && !isNaN(duration)) ? duration : null
          });
        }
      }
    }
  }
  return items;
}

async function importProgressFile(file){
  const name=file.name.toLowerCase();
  await metaSet(fileInfoKey(), {name:file.name, size:file.size, at:new Date().toISOString()});
  if(name.endsWith(".pdf")){
    await renderTdFileInfo();
    const box=$("td-ai"); box.classList.remove("hide");
    box.innerHTML="⏳ Đang tải thư viện và trích xuất văn bản PDF...";
    try{
      let extractedText = "";
      try {
        extractedText = await extractTextFromPdf(file);
      } catch (pdfError) {
        console.error("Local PDF extraction failed:", pdfError);
        throw new Error("Không thể trích xuất văn bản từ PDF (tệp có thể bị mã hóa hoặc định dạng quét ảnh không hỗ trợ).");
      }
      
      let guidanceText = "";
      let parsedItems = [];
      let parsedByAI = false;
      
      // 1. Thử gọi trực tiếp qua API Gemini (nếu có key cài đặt cục bộ)
      const localKey = (localStorage.getItem('sys_gemini_key') || "").trim();
      if (localKey) {
        box.innerHTML = "⏳ Đang phân tích nội dung PDF bằng Gemini (Trực tiếp từ trình duyệt)...";
        try {
          guidanceText = await callGeminiPdfDirectText(extractedText, file.name);
          parsedByAI = true;
        } catch (geminiError) {
          console.warn("Direct Gemini call failed:", geminiError);
        }
      }
      
      // 2. Nếu thất bại hoặc không có key cục bộ, thử gọi qua Edge Function của Supabase (dùng base64)
      if (!guidanceText && SUPABASE_CONFIG.functionUrl) {
        box.innerHTML = "⏳ Đang gửi tệp PDF lên Edge Function để phân tích...";
        try {
          const b64 = await fileToBase64(file);
          const url = SUPABASE_CONFIG.functionUrl.replace(/consolidate\/?$/,"analyze-file");
          const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ filename: file.name, pdf_base64: b64 })
          });
          if (res.ok) {
            const d = await res.json();
            guidanceText = d.guidance || d.error || JSON.stringify(d);
            parsedByAI = true;
          }
        } catch (edgeError) {
          console.warn("Supabase Edge Function failed:", edgeError);
        }
      }
      
      // 3. Hiển thị kết quả AI hoặc Fallback offline
      if (guidanceText) {
        const cleanedText = stripCJK(guidanceText);
        box.innerHTML = `<div style="white-space:pre-wrap; font-family:monospace; font-size:13px; line-height:1.6; background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:6px; margin-bottom:12px; max-height:300px; overflow-y:auto;">📄 AI phân tích file:\n${cleanedText}</div>`;
        parsedItems = parseTasksFromText(cleanedText);
      } else {
        // Fallback hoàn toàn offline: sử dụng bộ regex cục bộ để bóc tách từ văn bản PDF trích xuất
        box.innerHTML = "⏳ Chưa cấu hình AI hoặc lỗi mạng. Đang tự động quét mốc ngày cục bộ...";
        parsedItems = parseTasksLocally(extractedText);
        
        let offlineResultText = `Đã trích xuất ${parsedItems.length} hạng mục thi công cục bộ offline.\n\n`;
        if (parsedItems.length > 0) {
          offlineResultText += parsedItems.map(x => `- ${x.task}: từ ${x.start} đến ${x.end}`).join('\n');
        } else {
          offlineResultText += "Không tìm thấy hạng mục nào có đủ thông tin ngày bắt đầu/kết thúc trong văn bản PDF.";
        }
        
        box.innerHTML = `
          <div style="white-space:pre-wrap; font-family:monospace; font-size:13px; line-height:1.6; background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:6px; margin-bottom:12px; max-height:200px; overflow-y:auto;">📄 Bộ lọc cục bộ (Offline):\n${offlineResultText}</div>
          <div style="background:#fffbeb; border:1px solid #fef3c7; padding:12px; border-radius:6px; margin-bottom:12px; color:#92400e; font-size:13px; line-height:1.5;">
            💡 <b>Gợi ý:</b> Hãy cấu hình <b>API Key Gemini</b> tại <b>Tab Hệ thống -> Cấu hình AI</b> (hoàn toàn miễn phí tại <a href="https://aistudio.google.com" target="_blank" style="color:var(--primary); font-weight:bold; text-decoration:underline;">aistudio.google.com</a>) để AI tự động nhận diện và phân tích bảng biểu PDF chính xác hơn 100%!
          </div>
        `;
      }
      
      // 4. Hiển thị nút nạp hạng mục nếu phát hiện dữ liệu hợp lệ
      if (parsedItems.length > 0) {
        const importBtnId = "btn-import-pdf-" + new Date().getTime();
        box.innerHTML += `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:6px; display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
            <span style="color:#166534; font-weight:600; font-size:13px;">💡 Phát hiện ${parsedItems.length} hạng mục tiến độ trong file PDF!</span>
            <button class="btn btn-ok btn-sm" id="${importBtnId}" style="margin:0;">📥 Nạp vào Tiến độ</button>
          </div>
        `;
        setTimeout(() => {
          const btn = document.getElementById(importBtnId);
          if (btn) {
            btn.onclick = async () => {
              await handleImportTasks(parsedItems);
            };
          }
        }, 100);
      } else if (!parsedByAI) {
        throw new Error("Không thể kết nối dịch vụ AI và bộ lọc cục bộ không tìm thấy hạng mục nào. Vui lòng nhập API Key trong Tab Hệ Thống để trợ lý AI hỗ trợ đọc file.");
      }
      
    } catch(e) {
      box.innerHTML = `<span style="color:var(--red)">❌ Lỗi phân tích PDF: ${e.message || e}</span>
        <div style="background:#fffbeb; border:1px solid #fef3c7; padding:12px; border-radius:6px; margin-top:12px; color:#92400e; font-size:13px; line-height:1.5;">
          💡 <b>Hướng dẫn xử lý:</b> Vào <b>Tab Hệ thống -> Cấu hình AI</b> để nhập <b>API Key Gemini</b> (nhận key miễn phí tại <a href="https://aistudio.google.com" target="_blank" style="color:var(--primary); font-weight:bold; text-decoration:underline;">aistudio.google.com</a>). Việc này giúp tệp PDF được phân tích trực tiếp ngay tại trình duyệt của bạn mà không cần máy chủ trung gian.
        </div>`;
    }
    return;
  }if(!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")){ alert("Định dạng không hỗ trợ. Dùng .csv, .xlsx hoặc .pdf."); return; }
  const reader=new FileReader();
  reader.onload=async ()=>{
    let rows=[];
    if(name.endsWith(".csv")) rows=csvToRows(reader.result);
    else if(typeof XLSX!=="undefined"){ const wb=XLSX.read(reader.result,{type:"binary"}); rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1}); }
    else { alert("Đọc .xlsx cần có mạng (tải thư viện). Khi offline hãy dùng file .csv."); return; }
    const items=rowsToProgress(rows);
    if(!items.length){ alert("Không đọc được hạng mục. Cần các cột: Công tác | Bắt đầu | Kết thúc."); return; }
    
    const currentItems = await getProgress();
    let finalItems = [];
    if (currentItems.length > 0) {
      const isReplace = confirm("Hệ thống đang có " + currentItems.length + " hạng mục tiến độ hiện tại.\n\n- Nhấn OK để THAY THẾ hoàn toàn dữ liệu cũ (Mất dữ liệu gia hạn/hoàn thành đã nhập tay).\n- Nhấn Cancel để GỘP THÊM (Giữ lại các hạng mục hiện có cùng thông tin đã nhập).");
      if (isReplace) {
        finalItems = items;
      } else {
        const isMerge = confirm("Bạn đã chọn GỘP THÊM.\n\n- Nhấn OK để tiến hành gộp dữ liệu (Giữ nguyên các hạng mục cũ cùng thông tin đã nhập, cập nhật thời gian từ file mới cho các hạng mục trùng tên).\n- Nhấn Cancel để HỦY BỎ việc nạp file.");
        if (!isMerge) return;
        
        finalItems = [...currentItems];
        for (const newItem of items) {
          const existing = finalItems.find(x => x.task.trim().toLowerCase() === newItem.task.trim().toLowerCase());
          if (existing) {
            existing.start = newItem.start;
            existing.end = newItem.end;
            existing.duration = newItem.duration;
          } else {
            finalItems.push(newItem);
          }
        }
      }
    } else {
      finalItems = items;
    }
    
    await setProgress(finalItems); renderTiendo();
    alert("Đã nạp thành công " + finalItems.length + " hạng mục.");
  };
  if(name.endsWith(".csv")) reader.readAsText(file,"UTF-8"); else reader.readAsBinaryString(file);
}
async function loadSampleProgress(){
  const t=new Date(todayISO()); const d=off=>isoFromDate(new Date(t.getTime()+off*86400000));
  await setProgress([
    {id:uuid(),task:"I. PHẦN MÓNG",start:d(-30),end:d(15),status:"doing",extensions:[]},
    {id:uuid(),task:"1. Đào đất hố móng",start:d(-30),end:d(-20),status:"done",completedAt:new Date(t.getTime()-20*86400000).toISOString(),completedPct:100,extensions:[]},
    {id:uuid(),task:"Đổ bê tông lót móng",start:d(-18),end:d(-10),status:"done",completedAt:new Date(t.getTime()-10*86400000).toISOString(),completedPct:100,extensions:[]},
    {id:uuid(),task:"Đổ bê tông móng xưởng 3",start:d(-8),end:d(-2),status:"doing",extensions:[
      {
        id: uuid(),
        at: new Date(t.getTime()-3*86400000).toISOString(),
        by: "Nguyễn Văn A (CHT)",
        fromEnd: d(-5),
        toEnd: d(-2),
        pct: 80,
        reason: "Gặp mưa lớn kéo dài không thể đổ bê tông móng"
      }
    ]},
    {id:uuid(),task:"II. PHẦN THÂN",start:d(7),end:d(60),status:"doing",extensions:[]},
    {id:uuid(),task:"Lắp dựng kết cấu thép",start:d(10),end:d(30),status:"doing",extensions:[]},
  ]);
  await metaSet(fileInfoKey(), {});
  renderTiendo(); alert("Đã nạp 6 hạng mục mẫu.");
}
async function clearProgress(){
  if (typeof Swal !== "undefined") {
    const res = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Toàn bộ hạng mục tiến độ hiện tại sẽ bị xóa sạch khỏi dự án.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red)',
      cancelButtonColor: 'var(--muted)',
      confirmButtonText: 'Xóa hoàn toàn',
      cancelButtonText: 'Hủy'
    });
    if (!res.isConfirmed) return;
  } else {
    if (!confirm("Xóa toàn bộ hạng mục tiến độ?")) return;
  }
  await setProgress([]);
  await metaSet(fileInfoKey(), {});
  renderTiendo();
}

// ========== TỪ ĐIỂN AI (kb): công tác + nhà thầu + liên kết nhà thầu↔công tác ==========
async function getKB(){ const k=await metaGet("kb", null)||{}; return {tasks:k.tasks||[], contractors:k.contractors||[], links:k.links||{}, areas:k.areas||[]}; }
async function saveKB(kb){ await metaSet("kb", kb); }
function kbAddTask(kb,t){ t=(t||"").trim(); if(t && t.length>1 && kb.tasks.indexOf(t)<0) kb.tasks.push(t); }
function kbAddContractor(kb,c){ c=(c||"").trim(); if(c && kb.contractors.indexOf(c)<0) kb.contractors.push(c); }
function kbAddArea(kb,a){ a=(a||"").trim(); if(a && a.length>1 && (kb.areas||(kb.areas=[])).indexOf(a)<0) kb.areas.push(a); }
function kbLink(kb,contractor,task){ contractor=(contractor||"").trim(); task=(task||"").trim(); if(!contractor||!task) return; const k=vNorm(contractor); if(!kb.links[k]) kb.links[k]={name:contractor,tasks:[]}; if(kb.links[k].tasks.indexOf(task)<0) kb.links[k].tasks.push(task); }
// độ tương đồng công tác: độ phủ tên công tác + Levenshtein (cho lỗi chính tả)
function taskSim(a,b){ const na=vNorm(a),nb=vNorm(b); if(!na||!nb) return 0; const ta=na.split(" ").filter(w=>w.length>1),tb=nb.split(" ").filter(w=>w.length>1); const sa=new Set(ta); let inter=0; tb.forEach(w=>{if(sa.has(w))inter++;}); const cov=inter/(tb.length||1); const lv=1-_lev(na,nb)/Math.max(na.length,nb.length); return Math.max(cov, lv*0.95); }
function bestTaskMatch(work, tasks, linkedSet){ let best=null,bs=0; (tasks||[]).forEach(t=>{ let s=taskSim(work,t); if(linkedSet&&linkedSet.has(t)) s=Math.min(1,s+0.12); if(s>bs){bs=s;best=t;} }); return {task:best,score:bs}; }
function _kbHeaderMap(rows){ for(let i=0;i<Math.min(3,rows.length);i++){ const hdr=(rows[i]||[]).map(x=>vNorm(String(x==null?"":x))); const ti=hdr.findIndex(h=>/cong tac|cong viec|hang muc|noi dung|task/.test(h)); const ci=hdr.findIndex(h=>/nha thau|don vi|to doi|nhom|contractor/.test(h)); if(ti>=0) return {headerRow:i,taskCol:ti,contractorCol:ci}; } return {headerRow:-1,taskCol:0,contractorCol:-1}; }
function _readSheetFile(file){ return new Promise((res,rej)=>{ const name=file.name.toLowerCase(); const rd=new FileReader();
  rd.onload=()=>{ try{ let rows; if(name.endsWith(".csv")) rows=csvToRows(String(rd.result)); else if(typeof XLSX!=="undefined"){ const wb=XLSX.read(rd.result,{type:"binary"}); rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1}); } else { rej(new Error("Đọc .xlsx cần có mạng; offline hãy dùng .csv")); return; } res(rows||[]); }catch(e){ rej(e); } };
  rd.onerror=()=>rej(rd.error);
  if(name.endsWith(".csv")) rd.readAsText(file,"UTF-8"); else rd.readAsBinaryString(file);
}); }
async function importKBSchedule(ev){
  const files=[].slice.call(ev.target.files||[]); ev.target.value=""; if(!files.length) return;
  const kb=await getKB(); let nt=0,nc=0,nl=0;
  for(const f of files){ let rows; try{ rows=await _readSheetFile(f); }catch(e){ alert("Lỗi đọc "+f.name+": "+e.message); continue; }
    const hm=_kbHeaderMap(rows);
    rows.forEach((r,idx)=>{ if(idx<=hm.headerRow) return; const task=String(r[hm.taskCol]!=null?r[hm.taskCol]:"").trim(); if(!task) return;
      const b1=kb.tasks.length; kbAddTask(kb,task); if(kb.tasks.length>b1) nt++;
      if(hm.contractorCol>=0){ const ct=String(r[hm.contractorCol]!=null?r[hm.contractorCol]:"").trim(); if(ct){ const b2=kb.contractors.length; kbAddContractor(kb,ct); if(kb.contractors.length>b2) nc++; const lk=vNorm(ct); const lb=(kb.links[lk]&&kb.links[lk].tasks.length)||0; kbLink(kb,ct,task); if(((kb.links[lk]&&kb.links[lk].tasks.length)||0)>lb) nl++; } }
    });
  }
  kb.tasks=kb.tasks.slice(-2000); kb.contractors=kb.contractors.slice(-500); await saveKB(kb); await renderKB();
  alert("Đã nạp từ bảng tiến độ: +"+nt+" công tác, +"+nc+" nhà thầu, +"+nl+" liên kết.");
}
async function importKBContractors(ev){
  const files=[].slice.call(ev.target.files||[]); ev.target.value=""; if(!files.length) return;
  const kb=await getKB(); let nc=0;
  for(const f of files){ let rows; try{ rows=await _readSheetFile(f); }catch(e){ alert("Lỗi đọc "+f.name+": "+e.message); continue; }
    const hm=_kbHeaderMap(rows); const col=hm.contractorCol>=0?hm.contractorCol:(hm.taskCol>=0?hm.taskCol:0);
    rows.forEach((r,idx)=>{ if(hm.headerRow>=0 && idx<=hm.headerRow) return; const ct=String(r[col]!=null?r[col]:"").trim(); if(!ct) return; if(/^(nha thau|don vi|to doi|stt|ten|tt)$/.test(vNorm(ct))) return; const b=kb.contractors.length; kbAddContractor(kb,ct); if(kb.contractors.length>b) nc++; });
  }
  kb.contractors=kb.contractors.slice(-500); await saveKB(kb); await renderKB(); alert("Đã nạp +"+nc+" nhà thầu vào từ điển.");
}
function _kbAreaCol(rows){ const isHdr=h=>/^(hang muc|hang muc cong trinh|ten hang muc|khu vuc|khu vuc thi cong|danh muc|nha xuong|zone|area|noi dung)$/.test(h); for(let i=0;i<Math.min(2,rows.length);i++){ const hdr=(rows[i]||[]).map(x=>vNorm(String(x==null?"":x))); const ci=hdr.findIndex(isHdr); if(ci>=0) return {headerRow:i, col:ci}; } return {headerRow:-1, col:0}; }
async function importKBAreas(ev){
  const files=[].slice.call(ev.target.files||[]); ev.target.value=""; if(!files.length) return;
  const kb=await getKB(); let na=0;
  for(const f of files){ let rows; try{ rows=await _readSheetFile(f); }catch(e){ alert("Lỗi đọc "+f.name+": "+e.message); continue; }
    const hm=_kbAreaCol(rows);
    rows.forEach((r,idx)=>{ if(hm.headerRow>=0 && idx<=hm.headerRow) return; const a=String(r[hm.col]!=null?r[hm.col]:"").trim(); if(!a) return; if(/^(hang muc|khu vuc|nha xuong|stt|ten|tt|area|zone)$/.test(vNorm(a))) return; const b=kb.areas.length; kbAddArea(kb,a); if(kb.areas.length>b) na++; });
  }
  kb.areas=kb.areas.slice(-500); await saveKB(kb); await renderKB(); alert("Đã nạp +"+na+" hạng mục công trình.");
}
async function importKBAreasText(){
  const el=$("kb-area-text"); if(!el) return; const lines=el.value.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length){ alert("Nhập danh sách hạng mục (mỗi dòng hoặc cách nhau bằng dấu phẩy)."); return; }
  const kb=await getKB(); let na=0; lines.forEach(a=>{ const b=kb.areas.length; kbAddArea(kb,a); if(kb.areas.length>b) na++; });
  kb.areas=kb.areas.slice(-500); await saveKB(kb); el.value=""; await renderKB(); alert("Đã nạp +"+na+" hạng mục công trình.");
}
async function clearKB(){
  if (typeof Swal !== "undefined") {
    const res = await Swal.fire({
      title: 'Xác nhận xóa từ điển?',
      text: 'Toàn bộ từ điển AI (công tác, nhà thầu, hạng mục, liên kết) sẽ bị xóa sạch.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red)',
      cancelButtonColor: 'var(--muted)',
      confirmButtonText: 'Xóa hoàn toàn',
      cancelButtonText: 'Hủy'
    });
    if (!res.isConfirmed) return;
  } else {
    if (!confirm("Xóa toàn bộ Từ điển AI (công tác + nhà thầu + hạng mục + liên kết)?")) return;
  }
  await saveKB({tasks:[],contractors:[],links:{},areas:[]});
  await renderKB();
}
async function renderKB(){ const kb=await getKB(); const el=$("kb-info"); if(el) el.innerHTML="📚 Kho hiện có: <b>"+kb.tasks.length+"</b> công tác · <b>"+kb.contractors.length+"</b> nhà thầu · <b>"+(kb.areas?kb.areas.length:0)+"</b> hạng mục · <b>"+Object.keys(kb.links||{}).length+"</b> nhà thầu có liên kết."; await populateAreaDatalist(); }
async function populateAreaDatalist(){ const dl=$("dl-areas"); if(!dl) return; const kb=await getKB(); dl.innerHTML=(kb.areas||[]).map(a=>'<option value="'+esc(a)+'"></option>').join(""); }
// gom danh sách nhà thầu (danh mục dự án + kho) và công tác (tiến độ tổng + kho)
async function kbAllContractors(){ const decl=(await DataService.listContractors(CUR.project)).filter(c=>c.status!=='finished').map(c=>c.name); const kb=await getKB(); return Array.from(new Set([].concat(decl, kb.contractors||[]))); }
async function kbAllTasks(){ const prog=(await getProgress()).map(t=>t.task).filter(Boolean); const kb=await getKB(); return Array.from(new Set([].concat(prog, kb.tasks||[]))); }
let PROG_EDIT=null;
function progReset(){ PROG_EDIT=null; $("pg-task").value=""; $("pg-start").value=""; $("pg-end").value=""; $("pg-msg").textContent=""; }
async function progSave(){
  const task=$("pg-task").value.trim(); if(!task){ $("pg-msg").textContent="Nhập tên công tác."; return; }
  const start=$("pg-start").value||null, end=$("pg-end").value||null;
  let dur=(start&&end)?daysBetween(start,end)+1:null; if(dur!=null && (isNaN(dur)||dur<0)) dur=null;
  const items=await getProgress();
  if(PROG_EDIT){ const it=items.find(x=>x.id===PROG_EDIT); if(it){ it.task=task; it.start=start; it.end=end; it.duration=dur; } }
  else { items.push({id:uuid(), task, start, end, duration:dur}); }
  await setProgress(items); progReset(); renderTiendo();
}
async function progEdit(id){ const it=(await getProgress()).find(x=>x.id===id); if(!it) return; PROG_EDIT=id; $("pg-task").value=it.task; $("pg-start").value=it.start||""; $("pg-end").value=it.end||""; $("pg-msg").textContent="Đang sửa: "+it.task; }
async function progDelete(id){
  if (typeof Swal !== "undefined") {
    const res = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Hạng mục này sẽ bị xóa khỏi tiến độ.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red)',
      cancelButtonColor: 'var(--muted)',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });
    if (!res.isConfirmed) return;
  } else {
    if (!confirm("Xóa hạng mục này?")) return;
  }
  await setProgress((await getProgress()).filter(x=>x.id!==id));
  renderTiendo();
}

window.filterTiendo = function() {
  renderTiendo();
};






