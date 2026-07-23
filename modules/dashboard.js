/** modules/dashboard.js v1.8 — Căn đều lề 2 bên (wrap-dashboard) cho màn Tổng quan dự án */

function getSvg(name, size = 18, color = "currentColor") {
  if (typeof window.getDashSvg === 'function') {
    return window.getDashSvg(name, size, color);
  }
  const paths = {
    'building': '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="6" x2="9.01" y2="6"></line><line x1="15" y1="6" x2="15.01" y2="6"></line><line x1="9" y1="10" x2="9.01" y2="10"></line><line x1="15" y1="10" x2="15.01" y2="10"></line><line x1="9" y1="14" x2="9.01" y2="14"></line><line x1="15" y1="14" x2="15.01" y2="14"></line><line x1="9" y1="18" x2="15" y2="18"></line>',
    'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
    'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    'wallet': '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
    'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>'
  };
  const path = paths[name] || '<circle cx="12" cy="12" r="10"></circle>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0;">${path}</svg>`;
}

function getWeatherSvgIcon(code, size = 16, color = "rgba(255,255,255,0.85)") {
  const wMap = {
    0: { label: "Nắng ráo", p: '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' },
    1: { label: "Ít mây", p: '<path d="M17.5 19a4.5 4.5 0 0 0 2.09-8.5 6 6 0 0 0-11.18-1.5 3.5 3.5 0 0 0 .59 7"></path>' },
    2: { label: "Nhiều mây", p: '<path d="M17.5 19a4.5 4.5 0 0 0 2.09-8.5 6 6 0 0 0-11.18-1.5 3.5 3.5 0 0 0 .59 7"></path>' },
    3: { label: "Âm u", p: '<path d="M17.5 19a4.5 4.5 0 0 0 2.09-8.5 6 6 0 0 0-11.18-1.5 3.5 3.5 0 0 0 .59 7"></path>' },
    45: { label: "Sương mù", p: '<line x1="3" y1="10" x2="21" y2="10"></line><line x1="3" y1="14" x2="21" y2="14"></line><line x1="5" y1="18" x2="19" y2="18"></line>' },
    48: { label: "Sương mù", p: '<line x1="3" y1="10" x2="21" y2="10"></line><line x1="3" y1="14" x2="21" y2="14"></line><line x1="5" y1="18" x2="19" y2="18"></line>' },
    51: { label: "Mưa phùn nhẹ", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    53: { label: "Mưa phùn", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    55: { label: "Mưa phùn to", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    61: { label: "Mưa nhẹ", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    63: { label: "Mưa vừa", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    65: { label: "Mưa to", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    80: { label: "Mưa rào nhẹ", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    81: { label: "Mưa rào vừa", p: '<path d="M16 13v8M8 13v8M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    82: { label: "Mưa rào to", p: '<path d="m19 15-3 5h4l-3 5"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' },
    95: { label: "Giông bão", p: '<path d="m19 15-3 5h4l-3 5"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>' }
  };
  const item = wMap[code] || { label: "Bình thường", p: '<circle cx="12" cy="12" r="5"></circle>' };
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0;">${item.p}</svg>`;
  return { label: item.label, icon };
}

// dashboard.js - Project-specific Dashboard
async function renderDashboard() {
  if(!CUR || !CUR.project) return;
  
  // 1. Fetch data
  const projects = await DataService.listProjects();
  const proj = projects.find(p => p.id === CUR.project);
  if(!proj) return;
  
  const allSubs = await DataService.listSubmissions();
  const subs = allSubs.filter(s => s.project_id === CUR.project);
  
  // Compute Project Health V3
  let H = null;
  try {
    if (typeof computeProjectHealth === 'function') {
      H = await computeProjectHealth(proj);
    }
  } catch(e) {
    console.error("Lỗi computeProjectHealth:", e);
  }

  const healthScore = H ? H.healthScore : "--";
  const healthStatus = H ? H.healthStatus : "Đang cập nhật";
  const healthColor = H ? ("var(" + H.healthColorToken + ")") : "var(--hp-text-primary)";
  const schedText = (H && H.scheduleScore != null) ? fmtHealth(H.scheduleScore) + "đ" : "N/A";
  const repText = (H && H.reportScore != null) ? fmtHealth(H.reportScore) + "đ" : "N/A";
  const extText = (H && H.extensionScore != null) ? fmtHealth(H.extensionScore) + "đ" : "N/A";

  // Update Hero Banner
  const dashHero = document.getElementById("dash-hero");
  if(dashHero) {
    const d = new Date();
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dateStr = `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

    let endDateInfo = '';
    const endDateStr = proj.end_date || proj.endDate; // Dùng chuẩn proj.end_date
    if(endDateStr) {
      const endD = new Date(endDateStr);
      if (!isNaN(endD.getTime())) {
        const dLeft = Math.ceil((endD - new Date()) / (1000*60*60*24));
        const endFmt = endD.getDate().toString().padStart(2,'0') + '/' + (endD.getMonth()+1).toString().padStart(2,'0') + '/' + endD.getFullYear();
        const dColor = dLeft < 0 ? 'var(--hp-danger)' : dLeft <= 30 ? 'var(--hp-warning)' : 'rgba(255,255,255,0.85)';
        const dLabel = dLeft < 0 ? `Trễ ${Math.abs(dLeft)} ngày` : `Còn ${dLeft} ngày`;
        const calSvg = getSvg('calendar', 14, dColor);
        endDateInfo = `<div style="font-size:13px;color:${dColor};display:flex;align-items:center;gap:4px">${calSvg}<span>HT: ${endFmt} · ${dLabel}</span></div>`;
      }
    }

    let commanderInfo = '';
    if (proj.commander) {
      const userSvg = getSvg('user-check', 14, 'rgba(255,255,255,0.85)');
      commanderInfo = `<div style="font-size:13px;color:rgba(255,255,255,0.85);display:flex;align-items:center;gap:4px">${userSvg}<span>CHT: <b>${esc(proj.commander)}</b></span></div>`;
    }

    dashHero.innerHTML = `
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px 24px; margin-bottom:24px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:20px; box-shadow:var(--shadow-sm);">
        <div style="flex:1; min-width:280px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h1 style="margin:0; font-size:22px; font-weight:800; color:var(--hp-text-primary); text-transform:uppercase; letter-spacing:-0.3px;">${esc(proj.name)}</h1>
            <span style="font-size:11px; font-weight:700; padding:3px 10px; border-radius:12px; background:rgba(34,197,94,0.12); color:var(--hp-success); white-space:nowrap;">🟢 ${esc(proj.status || "Đang thi công")}</span>
          </div>
          
          <div style="display:flex; align-items:center; gap:16px; margin-top:10px; flex-wrap:wrap; font-size:13px; color:var(--hp-text-secondary);">
            <div style="display:flex; align-items:center; gap:5px;">
              ${getSvg('calendar', 14, 'var(--hp-primary)')}
              <span>${dateStr}</span>
            </div>
            ${endDateInfo}
            ${commanderInfo}
            <div id="dash-hero-weather" style="display:flex; align-items:center; gap:5px;">
              ${getSvg('clock', 14, 'var(--muted)')}
              <span>Đang tải thời tiết...</span>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:16px; background:var(--surface-2); padding:12px 18px; border-radius:12px; border:1px solid var(--border);">
          <div style="text-align:center; padding-right:16px; border-right:1px solid var(--border);">
            <div style="font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px;">Điểm Sức Khỏe</div>
            <div style="font-size:32px; font-weight:800; color:${healthColor}; line-height:1.1; margin:2px 0;">${fmtHealth(healthScore)}<span style="font-size:14px; font-weight:600; color:var(--muted);">/100</span></div>
            <span style="font-size:11px; font-weight:700; color:${healthColor}; white-space:nowrap;">${healthStatus}</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px; font-size:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <span style="color:var(--muted); display:flex; align-items:center; gap:4px;">${getSvg('trending-up', 13, 'var(--hp-primary)')} Tiến độ</span>
              <span style="font-weight:700; color:var(--hp-text-primary);">${schedText}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <span style="color:var(--muted); display:flex; align-items:center; gap:4px;">${getSvg('file-text', 13, 'var(--hp-brand-accent)')} Báo cáo</span>
              <span style="font-weight:700; color:var(--hp-text-primary);">${repText}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <span style="color:var(--muted); display:flex; align-items:center; gap:4px;">${getSvg('clock', 13, 'var(--hp-warning)')} Gia hạn</span>
              <span style="font-weight:700; color:var(--hp-text-primary);">${extText}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 2. Calculate Progress & Tasks
  let progressPct = 0;
  let delayedTasks = [];
  let doneTasksCount = 0;
  let workTasksCount = 0;
  try {
    const tasks = await metaGet("progress:" + CUR.project, []);
    if(tasks && tasks.length > 0) {
      const workTasks = tasks.filter(it => {
        if (typeof levelOf === 'function') {
          return levelOf(it.task) > 1;
        }
        return true;
      });
      workTasksCount = workTasks.length;

      workTasks.forEach(it => {
        if(it.status === "done") doneTasksCount++;
        let stObj = {label: "Đang làm"};
        if (typeof statusOf === 'function') {
          stObj = statusOf(it.start, it.end, it);
        }
        if (stObj.label === "Trễ hạn / Đã qua") {
          delayedTasks.push(it);
        }
      });

      let totalDuration = 0;
      let completedDuration = 0;
      workTasks.forEach(it => {
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
        progressPct = Math.round(doneTasksCount / workTasks.length * 100);
      }
    }
  } catch(e) {
    console.error("Lỗi tính tiến độ:", e);
  }
  
  // Render 5 KPI Cards với Inline SVG & Phân biệt dữ liệu
  const elProgress = document.getElementById("dash-kpi-progress");
  if(elProgress) elProgress.textContent = progressPct + "%";
  const elProgressDesc = document.getElementById("dash-kpi-progress-desc");
  if(elProgressDesc) {
    elProgressDesc.textContent = workTasksCount > 0 ? `Đã xong ${doneTasksCount}/${workTasksCount} việc` : "Chưa lập kế hoạch";
  }
  const elProgressIcon = document.getElementById("dash-kpi-progress-icon");
  if(elProgressIcon) elProgressIcon.innerHTML = getSvg('trending-up', 22, 'var(--hp-primary)');

  const elLate = document.getElementById("dash-kpi-late");
  const activeOverdue = H ? (H.activeOverdueTasks || 0) : delayedTasks.length;
  if(elLate) {
    elLate.textContent = activeOverdue;
    elLate.style.color = activeOverdue > 0 ? "var(--hp-danger)" : "var(--hp-success)";
    elLate.style.fontSize = "32px";
  }
  const elLateDesc = document.getElementById("dash-kpi-late-desc");
  if(elLateDesc) {
    elLateDesc.textContent = activeOverdue > 0 ? "Cần xử lý gấp" : "Tiến độ an toàn";
  }
  const elLateIcon = document.getElementById("dash-kpi-late-icon");
  if(elLateIcon) elLateIcon.innerHTML = getSvg('alert-triangle', 22, activeOverdue > 0 ? 'var(--hp-danger)' : 'var(--hp-success)');

  // Báo cáo hôm nay KPI
  const todayStr = todayISO();
  const todaySubs = subs.filter(s => s.log_date === todayStr);
  const elReport = document.getElementById("dash-kpi-report");
  if(elReport) {
    elReport.textContent = todaySubs.length > 0 ? "Đã nộp" : "Chưa nộp";
    elReport.style.color = todaySubs.length > 0 ? "var(--hp-success)" : "var(--hp-warning)";
    elReport.style.fontSize = "24px";
  }
  const elReportDesc = document.getElementById("dash-kpi-report-desc");
  if(elReportDesc) {
    elReportDesc.textContent = todaySubs.length > 0
      ? `Nộp bởi ${esc(todaySubs[0].created_name || todaySubs[0].created_by || "Kỹ sư")}`
      : "Chưa gửi báo cáo ngày";
  }
  const elReportIcon = document.getElementById("dash-kpi-report-icon");
  if(elReportIcon) elReportIcon.innerHTML = getSvg('file-text', 22, todaySubs.length > 0 ? 'var(--hp-success)' : 'var(--hp-warning)');

  // Calculate Finance
  const sc = await metaGet("subcon_payments:" + CUR.project, []);
  const ex = await metaGet("expenses:" + CUR.project, []);
  const cd = await metaGet("cdt:" + CUR.project, []);
  
  let totalChiSubcon = 0;
  (sc || []).forEach(x => { if(!x.status || x.status === 'approved') totalChiSubcon += Number(x.amount) || 0; });
  
  let totalChiExp = 0;
  (ex || []).forEach(x => { if(!x.status || x.status === 'approved') totalChiExp += Number(x.total) || 0; });
  
  let totalThuCDT = 0;
  let contractValue = 0;
  (cd || []).forEach(x => {
    totalThuCDT += Number(x.paid) || 0;
    contractValue += Number(x.val) || 0;
  });
  
  const totalChi = totalChiSubcon + totalChiExp;
  const balanceValue = totalThuCDT - totalChi;
  const hasFinanceData = (totalThuCDT > 0 || totalChi > 0);
  
  const fmtAuto = (val) => {
    const abs = Math.abs(Number(val) || 0);
    if (abs >= 1e9) {
      const n = (Number(val) / 1e9);
      return n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) + ' tỷ';
    }
    return Math.round((Number(val) || 0) / 1e6).toLocaleString('vi-VN') + ' tr';
  };

  const elBalance = document.getElementById("dash-kpi-balance");
  if(elBalance) {
    if (!hasFinanceData) {
      elBalance.textContent = "Chưa có dữ liệu";
      elBalance.style.fontSize = "20px";
      elBalance.style.color = "var(--muted)";
    } else {
      const textVal = fmtAuto(balanceValue);
      elBalance.textContent = textVal;
      elBalance.style.whiteSpace = "nowrap";
      elBalance.style.fontSize = textVal.length > 12 ? "20px" : textVal.length > 8 ? "24px" : "32px";
      elBalance.style.color = balanceValue < 0 ? "var(--hp-danger)" : "var(--hp-success)";
    }
  }
  const elBalanceDesc = document.getElementById("dash-kpi-balance-desc");
  if(elBalanceDesc) {
    elBalanceDesc.textContent = hasFinanceData
      ? `Thu: ${fmtAuto(totalThuCDT)} · Chi: ${fmtAuto(totalChi)}`
      : "⚪ Chưa phát sinh thu chi";
  }
  const elBalanceIcon = document.getElementById("dash-kpi-balance-icon");
  if(elBalanceIcon) elBalanceIcon.innerHTML = getSvg('wallet', 22, balanceValue < 0 ? 'var(--hp-danger)' : 'var(--hp-success)');

  // Calculate Manpower Today & 7 Days
  let todayManpower = 0;
  todaySubs.forEach(s => {
    if(s.manpower && Array.isArray(s.manpower)) {
      todayManpower += s.manpower.reduce((acc, m) => acc + (Number(m.headcount) || 0), 0);
    }
  });

  const elManpower = document.getElementById("dash-kpi-manpower");
  if(elManpower) {
    if (todaySubs.length === 0) {
      elManpower.textContent = "—";
      elManpower.style.color = "var(--muted)";
    } else if (todayManpower === 0) {
      elManpower.textContent = "0 người";
      elManpower.style.color = "var(--hp-brand-accent)";
    } else {
      elManpower.textContent = todayManpower.toLocaleString('vi-VN') + " người";
      elManpower.style.color = "var(--hp-brand-accent)";
    }
  }
  const elManpowerDesc = document.getElementById("dash-kpi-manpower-desc");
  if(elManpowerDesc) {
    if (todaySubs.length === 0) {
      elManpowerDesc.textContent = "⚪ Chưa có báo cáo ngày";
    } else {
      elManpowerDesc.textContent = todayManpower === 0 ? "🟢 Báo cáo ghi nhận 0 công" : "🟢 Đã cập nhật hôm nay";
    }
  }
  const elManpowerIcon = document.getElementById("dash-kpi-manpower-icon");
  if(elManpowerIcon) elManpowerIcon.innerHTML = getSvg('users', 22, 'var(--hp-brand-accent)');
  
  // Render Finance Chart (Đã thu vs Đã chi) — đơn vị linh động
  const canvasFin = document.getElementById("dash-chart-finance");
  if(canvasFin) {
    if(window._dashFinChart) { try { window._dashFinChart.destroy(); } catch(e) {} window._dashFinChart = null; }
    const finWrap = canvasFin.parentElement;
    const finOld = finWrap.querySelector('.chart-empty'); if(finOld) finOld.remove();
    if(totalThuCDT === 0 && totalChi === 0) {
      canvasFin.style.display = 'none';
      const finEm = document.createElement('div'); finEm.className = 'chart-empty';
      finEm.innerHTML = renderEmptyState((typeof getDashSvg === 'function' ? getDashSvg('activity', 40, 'var(--hp-text-secondary)') : ''), 'Chưa có dữ liệu tài chính', 'Hệ thống chưa ghi nhận các khoản thu chi cho dự án này.');
      finWrap.appendChild(finEm);
    } else { canvasFin.style.display = '';
    const maxFinVal = Math.max(totalThuCDT, totalChi);
    const useTy = maxFinVal >= 1e9;
    const divisor = useTy ? 1e9 : 1e6;
    const unit = useTy ? 'tỷ' : 'tr';
    const fmtTick = (v) => v.toLocaleString('vi-VN', {minimumFractionDigits:0, maximumFractionDigits:3}) + ' ' + unit;
    const css = getComputedStyle(document.documentElement);
    const C = (n) => css.getPropertyValue(n).trim();
    const brandPrimary = C('--hp-brand-primary') || '#096AA7';
    const warningColor = C('--hp-warning') || '#FFA726';
    const textSecondary = C('--hp-text-secondary') || '#B8C0C8';
    const borderCol = C('--hp-border') || 'rgba(255,255,255,0.08)';

    const ctxFin = canvasFin.getContext('2d');
    window._dashFinChart = new Chart(ctxFin, {
      type: 'bar',
      data: {
        labels: ['Đã thu (CĐT)', 'Đã chi (Công trình)'],
        datasets: [{
          data: [+(totalThuCDT / divisor).toFixed(3), +(totalChi / divisor).toFixed(3)],
          backgroundColor: [brandPrimary, warningColor],
          borderRadius: 6,
          maxBarThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => fmtTick(c.raw) } }
        },
        scales: {
          x: { 
            grid: { display: false }, 
            ticks: { color: textSecondary, font: { size: 11, weight: 'bold' } } 
          },
          y: { 
            beginAtZero: true, 
            ticks: { color: textSecondary, callback: (v) => v + ' ' + unit, font: { size: 10 } }, 
            grid: { color: borderCol } 
          }
        }
      }
    });
    }
  }
  const elFinTop = document.getElementById("dash-finance-top");
  if(elFinTop) {
    const grouped = {};
    (sc || []).forEach(x => {
      if(!x.status || x.status === 'approved') {
        const name = x.contractor || "Nhà thầu khác";
        grouped[name] = (grouped[name] || 0) + (Number(x.amount) || 0);
      }
    });
    const sorted = Object.entries(grouped)
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);
    if(sorted.length === 0) {
      elFinTop.innerHTML = `<div style="padding:10px 0; color:var(--muted); font-size:12px; font-style:italic;">Chưa có nhà thầu phát sinh chi phí thanh toán.</div>`;
    } else {
      elFinTop.innerHTML = sorted.map((x, idx) => {
        return `<div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border);">
          <span style="color:var(--hp-text-primary);"><b>${idx + 1}. ${esc(x.name)}</b></span>
          <span style="color:var(--hp-danger); font-weight:700; white-space:nowrap;">${fmtAuto(x.val)}</span>
        </div>`;
      }).join("");
    }
  }
  
  // 4. Calculate Manpower & Rain (Last 7 Days - Mon to Sun)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToLastMonday);
  
  let labels = [];
  let manpowerData = [];
  let totalRain = 0;
  
  for(let i = 0; i < 7; i++) {
    const d = new Date(lastMonday);
    d.setDate(lastMonday.getDate() + i);
    const pad = (n) => String(n).padStart(2, "0");
    const dIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dayName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
    labels.push(dayName);
    
    const daySubs = subs.filter(s => s.log_date === dIso);
    let dayManpower = 0;
    
    daySubs.forEach(s => {
      if(s.manpower && Array.isArray(s.manpower)) {
        dayManpower += s.manpower.reduce((acc, m) => acc + (Number(m.headcount) || 0), 0);
      }
      if(s.totalRainHours && !isNaN(Number(s.totalRainHours))) {
        totalRain += Number(s.totalRainHours);
      }
    });
    
    manpowerData.push(dayManpower);
  }

  // Update Weather — hiển thị trong Hero card với 100% Inline SVG
  const elWeather = document.getElementById("dash-hero-weather");
  if(elWeather) {
    if(proj.latitude == null || proj.longitude == null) {
      elWeather.innerHTML = `${getSvg('building', 14, 'var(--hp-text-secondary)')}<span>Chưa cấu hình tọa độ</span>`;
    } else if(!navigator.onLine) {
      let offlineWeather = "";
      const todaySub = subs.find(s => s.log_date === todayStr);
      if(todaySub) {
        if(todaySub.weather_m && todaySub.weather_a) {
          const wm = todaySub.weather_m === 'rainy' ? getWeatherSvgIcon(61) : getWeatherSvgIcon(0);
          const wa = todaySub.weather_a === 'rainy' ? getWeatherSvgIcon(61) : getWeatherSvgIcon(0);
          offlineWeather = `Sáng: ${wm.label} / Chiều: ${wa.label}`;
        } else if(todaySub.weather) {
          offlineWeather = todaySub.weather;
        }
      }
      elWeather.innerHTML = offlineWeather
        ? `${getSvg('clock', 14, 'var(--hp-text-secondary)')}<span>${offlineWeather}</span>`
        : `${getSvg('clock', 14, 'var(--hp-text-secondary)')}<span>Offline</span>`;
    } else {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${proj.latitude}&longitude=${proj.longitude}&current=temperature_2m,weather_code&timezone=auto`;
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if(data && data.current) {
              const code = data.current.weather_code;
              const temp = Math.round(data.current.temperature_2m);
              const info = getWeatherSvgIcon(code, 15, 'rgba(255,255,255,0.85)');
              elWeather.innerHTML = `${info.icon}<span>${temp}°C · ${info.label}</span>`;
            }
          })
          .catch(() => { elWeather.innerHTML = `${getSvg('clock', 14, 'var(--hp-text-secondary)')}<span>Không tải được</span>`; });
      } catch(e) {
        elWeather.innerHTML = `${getSvg('clock', 14, 'var(--hp-text-secondary)')}<span>Không tải được</span>`;
      }
    }
  }

  // Render Manpower Chart
  const canvas = document.getElementById("chart-manpower");
  if(canvas) {
    if(window._dashMpChart) { window._dashMpChart.destroy(); window._dashMpChart = null; }
    const mpWrap = canvas.parentElement;
    const mpOld = mpWrap.querySelector('.chart-empty'); if(mpOld) mpOld.remove();
    const totalMp = manpowerData.reduce((a,b) => a+b, 0);
    if(totalMp === 0) {
      canvas.style.display = 'none';
      const mpEm = document.createElement('div');
      mpEm.className = 'chart-empty';
      mpEm.style.height = '140px';
      mpEm.style.display = 'flex';
      mpEm.style.flexDirection = 'column';
      mpEm.style.alignItems = 'center';
      mpEm.style.justifyContent = 'center';
      mpEm.style.color = 'var(--muted)';
      mpEm.style.fontSize = '12px';
      mpEm.innerHTML = `${getSvg('users', 32, 'var(--hp-text-secondary)')}
        <div style="margin-top:6px; font-weight:600; color:var(--hp-text-primary);">Chưa có báo cáo nhân lực</div>
        <div style="font-size:11px; margin-top:2px;">Vui lòng cập nhật báo cáo ngày để hiển thị biểu đồ.</div>`;
      mpWrap.appendChild(mpEm);
    } else { canvas.style.display = '';
    const css = getComputedStyle(document.documentElement);
    const C = (n) => css.getPropertyValue(n).trim();
    const brandAccent = C('--hp-brand-accent') || '#0969A7';
    const textSecondary = '#CBD5E1';
    const borderCol = 'rgba(255,255,255,0.08)';

    const ctx = canvas.getContext('2d');
    window._dashMpChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nhân lực',
          data: manpowerData,
          borderColor: brandAccent,
          backgroundColor: `color-mix(in srgb, ${brandAccent} 20%, transparent)`,
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { 
            display: true, 
            ticks: { color: textSecondary, font: {size: 11, weight: '600'} },
            grid: { color: borderCol }
          },
          y: { 
            display: true, 
            min: 0, 
            ticks: { color: textSecondary, font: {size: 10}, stepSize: 5 }, 
            grid: { color: borderCol } 
          }
        },
        layout: { padding: 0 }
      }
    });
    }
  }

  // 5. Render Alerts & Overdue Tasks kèm SỐ NGÀY TRỄ
  const overdueItems = [];
  const tToday = todayISO();
  (delayedTasks || []).forEach(it => {
    const effEnd = (typeof getEffectiveEnd === 'function' ? getEffectiveEnd(it) : null) || it.end;
    if (effEnd && effEnd < tToday && it.status !== 'done') {
      const dDiff = Math.ceil((new Date(tToday) - new Date(effEnd)) / (1000 * 60 * 60 * 24));
      overdueItems.push({
        task: it.task,
        effEnd: effEnd,
        delayDays: dDiff > 0 ? dDiff : 1
      });
    }
  });

  overdueItems.sort((a, b) => b.delayDays - a.delayDays);

  const elDelaysGroup = document.getElementById("dash-alerts-delays-group");
  const elDelays = document.getElementById("dash-alerts-delays");
  if(elDelays) {
    if(overdueItems.length === 0) {
      if (elDelaysGroup) elDelaysGroup.style.display = "none";
    } else {
      if (elDelaysGroup) elDelaysGroup.style.display = "block";
      const top5 = overdueItems.slice(0, 5);
      let html = top5.map(it => {
        return `<div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer;" onclick="switchTab('tiendo')">
          <span style="color:var(--hp-text-primary); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:65%;" title="${esc(it.task)}">${esc(it.task)}</span>
          <span style="color:var(--hp-danger); font-weight:700; font-size:11px; white-space:nowrap;">Trễ ${it.delayDays} ngày · Hạn ${fmtVN(it.effEnd)}</span>
        </div>`;
      }).join("");

      if (overdueItems.length > 5) {
        html += `<div style="margin-top:8px; text-align:right;">
          <button onclick="switchTab('tiendo')" style="font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; background:rgba(239,68,68,0.1); color:var(--hp-danger); border:1px solid rgba(239,68,68,0.25); cursor:pointer;">Xem tất cả ${overdueItems.length} công tác trễ ›</button>
        </div>`;
      }
      elDelays.innerHTML = html;
    }
  }
  
  // Gather Vướng mắc
  let recentIssues = [];
  const sortedSubs = [...subs].sort((a,b) => b.log_date.localeCompare(a.log_date));
  for(const s of sortedSubs) {
    if(s.issues && s.issues.length > 0) {
      s.issues.forEach(iss => recentIssues.push({date: s.log_date, desc: iss.description, sev: iss.severity}));
    }
    if(recentIssues.length >= 5) break;
  }
  
  const elIssuesGroup = document.getElementById("dash-alerts-issues-group");
  const elIssues = document.getElementById("dash-alerts-issues");
  if(elIssues) {
    if(recentIssues.length === 0) {
      if (elIssuesGroup) elIssuesGroup.style.display = "none";
    } else {
      if (elIssuesGroup) elIssuesGroup.style.display = "block";
      elIssues.innerHTML = recentIssues.map(iss => {
        const iconColor = iss.sev === 'high' ? 'var(--hp-danger)' : (iss.sev === 'medium' ? 'var(--hp-warning)' : 'var(--hp-text-secondary)');
        const iconSvg = getSvg(iss.sev === 'high' ? 'alert-triangle' : (iss.sev === 'medium' ? 'alert-triangle' : 'clock'), 14, iconColor);
        return `<div class="subitem" style="padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer; display:flex; align-items:center; gap:6px;" onclick="switchTab('baocaongay-new')">
          ${iconSvg} <span style="color:var(--hp-text-primary);"><b>${iss.date.substring(5).replace('-','/')}</b>: ${esc(iss.desc)}</span>
        </div>`;
      }).join("");
    }
  }
  
  // Gather Duyệt chi
  const pendingPayments = [];
  (sc || []).forEach(x => {
    if(x.status === 'pending') {
      pendingPayments.push({ type: 'Thanh toán NT', name: x.contractor || 'Nhà thầu', amount: Number(x.amount) || 0 });
    }
  });
  (ex || []).forEach(x => {
    if(x.status === 'pending') {
      pendingPayments.push({ type: 'Chi phí lẻ', name: x.desc || 'Chi phí', amount: Number(x.total) || 0 });
    }
  });

  const elPaymentsGroup = document.getElementById("dash-alerts-payments-group");
  const elPayments = document.getElementById("dash-alerts-payments");
  if(elPayments) {
    if(pendingPayments.length === 0) {
      if (elPaymentsGroup) elPaymentsGroup.style.display = "none";
    } else {
      if (elPaymentsGroup) elPaymentsGroup.style.display = "block";
      elPayments.innerHTML = pendingPayments.slice(0, 5).map(p => {
        return `<div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer;" onclick="switchTab('thanhtoan')">
          <span style="color:var(--hp-text-primary);">${getSvg('clock', 14, 'var(--hp-warning)')} <b>[${p.type}]</b> ${esc(p.name)}</span>
          <span style="color:var(--hp-warning); font-weight:700;">${fmtAuto(p.amount)}</span>
        </div>`;
      }).join("");
    }
  }

  // Gather LPB Requests
  let projLpbReqs = [];
  try {
    const lpbReqs = await metaGet("lpb_requests", []);
    projLpbReqs = lpbReqs.filter(r => r.project_id === CUR.project && r.status !== "completed");
  } catch (err) {}

  const elLpbGroup = document.getElementById("dash-alerts-lpb-group");
  const elLpb = document.getElementById("dash-alerts-lpb");
  if (elLpb) {
    if (projLpbReqs.length === 0) {
      if (elLpbGroup) elLpbGroup.style.display = "none";
    } else {
      if (elLpbGroup) elLpbGroup.style.display = "block";
      const totalPending = projLpbReqs.length;
      const totalUrgent = projLpbReqs.filter(r => r.urgent === true).length;
      const totalOverdue = projLpbReqs.filter(r => r.due && new Date() > new Date(r.due)).length;

      elLpb.innerHTML = `
        <div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer;" onclick="switchTab('lpb')">
          <span style="color:var(--hp-text-primary); display:flex; align-items:center; gap:6px;">${getSvg('users', 14, 'var(--hp-brand-accent)')} <b>Chờ xử lý:</b> ${totalPending} đề xuất</span>
          <span style="font-size:11px; display:flex; gap:6px;">
            ${totalUrgent > 0 ? `<span class="badge" style="background:rgba(239, 68, 68, 0.12); color:var(--hp-danger); font-weight:700; padding:2px 6px; border-radius:4px; margin:0;">${totalUrgent} khẩn</span>` : ""}
            ${totalOverdue > 0 ? `<span class="badge" style="background:rgba(239, 68, 68, 0.12); color:var(--hp-danger); font-weight:700; padding:2px 6px; border-radius:4px; margin:0;">${totalOverdue} trễ</span>` : ""}
          </span>
        </div>
      `;
    }
  }

  // Thu gọn Khối Cảnh báo & Rủi ro khi 0 phát sinh
  let pendingReports = [];
  try {
    const isApprover = typeof CUR_USER !== 'undefined' && CUR_USER && (isAdminLikeRole(CUR_USER.role) || ["pm", "site_manager"].includes(CUR_USER.role));
    if (isApprover) {
      const allDaily = await metaGet("daily_reports", []);
      pendingReports = allDaily.filter(r => r.project_id === CUR.project && (r.approval === "pending" || r.status === "pending"));
    }
  } catch (err) {}

  const elWaitingApprove = document.getElementById("dash-alerts-waiting-approve");
  const listWaitingApprove = document.getElementById("dash-waiting-approve-list");
  if (elWaitingApprove && listWaitingApprove) {
    if (pendingReports.length === 0) {
      elWaitingApprove.classList.add("hide");
    } else {
      elWaitingApprove.classList.remove("hide");
      listWaitingApprove.innerHTML = pendingReports.map(r => {
        const fmtDate = (dStr) => {
          if (!dStr) return "";
          const parts = dStr.split("-");
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        };
        return `
          <div class="subitem" onclick="selectAndApproveDailyReport('${r.date}')" 
            style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border); border-radius:var(--r-sm); transition:background 0.2s;">
            <span style="color:var(--hp-text-primary);">${getSvg('clock', 14, 'var(--hp-warning)')} Báo cáo ngày <b>${fmtDate(r.date)}</b> · Người nộp: <b>${esc(r.created_name || r.created_by || "Kỹ sư")}</b></span>
            <span style="color:var(--hp-primary); font-size:12px; font-weight:600;">Xem & Duyệt ➔</span>
          </div>
        `;
      }).join("");
    }
  }

  const elSummaryWrapper = document.getElementById("dash-alerts-summary-wrapper");
  if (overdueItems.length === 0 && recentIssues.length === 0 && pendingPayments.length === 0 && projLpbReqs.length === 0 && pendingReports.length === 0) {
    if (elSummaryWrapper) {
      elSummaryWrapper.innerHTML = `<div style="padding:14px 16px; background:var(--surface-2); border-radius:8px; color:var(--hp-text-secondary); font-size:12px; display:flex; align-items:center; gap:8px;">
        ${getSvg('check-circle', 16, 'var(--hp-success)')}
        <span>Chưa ghi nhận vướng mắc, yêu cầu duyệt chi hoặc đề xuất liên phòng ban.</span>
      </div>`;
    }
  }
}

async function selectAndApproveDailyReport(date) {
  switchTab("baocaongay-new");
  setTimeout(() => {
    const iframe = document.querySelector("#tab-baocaongay-new iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'NAVIGATE_TO_REPORT', date: date }, '*');
    }
  }, 300);
}
window.selectAndApproveDailyReport = selectAndApproveDailyReport;