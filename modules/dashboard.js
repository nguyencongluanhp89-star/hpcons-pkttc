// dashboard.js - Project-specific Dashboard
async function renderDashboard() {
  if(!CUR || !CUR.project) return;
  
  // 1. Fetch data
  const projects = await DataService.listProjects();
  const proj = projects.find(p => p.id === CUR.project);
  if(!proj) return;
  
  const allSubs = await DataService.listSubmissions();
  const subs = allSubs.filter(s => s.project_id === CUR.project);
  
  // Update Hero
  const dashHero = document.getElementById("dash-hero");
  if(dashHero) {
    const d = new Date();
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dateStr = `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

    let endDateInfo = '';
    if(proj.endDate) {
      const endD = new Date(proj.endDate);
      const dLeft = Math.ceil((endD - new Date()) / (1000*60*60*24));
      const endFmt = endD.getDate().toString().padStart(2,'0') + '/' + (endD.getMonth()+1).toString().padStart(2,'0') + '/' + endD.getFullYear();
      const dColor = dLeft < 0 ? '#ff9090' : dLeft <= 30 ? '#ffd700' : 'rgba(255,255,255,0.75)';
      const dLabel = dLeft < 0 ? `Trễ ${Math.abs(dLeft)} ngày` : `Còn ${dLeft} ngày`;
      endDateInfo = `<div style="font-size:13px;color:${dColor};display:flex;align-items:center;gap:4px"><span>📅</span><span>HT: ${endFmt} · ${dLabel}</span></div>`;
    }

    dashHero.innerHTML = `
      <div class="score">
        <div class="ring"><b id="dash-health">--</b><span>SỨC KHỎE</span></div>
      </div>
      <div class="hsep"></div>
      <div class="htext" style="flex:1;min-width:200px">
        <div class="hv" style="text-transform:uppercase;">${esc(proj.name)}</div>
        <div style="display:flex;align-items:center;gap:14px;margin-top:6px;flex-wrap:wrap">
          <div class="hl">${dateStr}</div>
          ${endDateInfo}
          <div id="dash-hero-weather" style="font-size:13px;color:rgba(255,255,255,0.75);display:flex;align-items:center;gap:4px">
            <span>⏳</span><span>Đang tải thời tiết...</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // 2. Calculate Progress & Health
  let progressPct = 0;
  let healthScore = "--";
  let healthColor = "var(--text-strong)";
  let delayedTasks = [];
  let doneTasksCount = 0;
  let workTasksCount = 0;
  try {
    const tasks = await metaGet("progress:" + CUR.project, []);
    if(tasks && tasks.length > 0) {
      let active = 0;
      let lateOrDelayed = 0;
      let doneTasks = 0;

      // Filter tasks to exclude section headers (Level 1)
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
          lateOrDelayed++;
          delayedTasks.push(it);
        }
        if (stObj.label !== "Sắp tới") active++;
      });

      // 2.1 Điểm trừ Báo cáo ngày (phạt tối đa 50đ)
      let reportRate = 100;
      const projects = await DataService.listProjects();
      const proj = projects.find(p => p.id === CUR.project);
      const subs = (await DataService.listSubmissions()).filter(s => s.project_id === CUR.project);
      if (proj) {
        const start = proj.start_date ? new Date(proj.start_date) : null;
        const end = proj.end_date ? new Date(proj.end_date) : null;
        const off = new Set(proj.off_weekdays || [0]);
        const days = [...new Set(subs.map(s => s.log_date))];
        let workDays = 0, reported = 0;
        if (start && end) {
          // Tạo bản sao đối tượng ngày bắt đầu để duyệt tránh làm sai lệch ngày gốc
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (off.has(d.getDay())) continue;
            workDays++;
            const isoStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
            if (days.includes(isoStr)) reported++;
          }
        }
        if (workDays > 0) reportRate = Math.round(reported / workDays * 100);
      }
      const penReport = Math.round((100 - reportRate) * 0.5);

      // 2.2 Điểm trừ Trễ tiến độ thi công (phạt tối đa 50đ)
      const penProgress = active > 0 ? Math.round((lateOrDelayed / active) * 50) : 0;

      // 2.3 Điểm trừ Sự cố kỹ thuật (mỗi sự cố nghiêm trọng trừ 5đ, phạt tối đa 25đ)
      const highIssues = subs.flatMap(s => s.issues || []).filter(i => i.severity === "high").length;
      const penIssues = Math.min(25, highIssues * 5);

      // Tổng điểm sức khỏe dự án
      healthScore = Math.max(0, 100 - penReport - penProgress - penIssues);

      if (healthScore >= 80) healthColor = "var(--success)";
      else if (healthScore >= 50) healthColor = "var(--warning)";
      else healthColor = "var(--danger)";

      // Weighted progress calculation: sum of (completedPct * duration) / sum of duration
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
        progressPct = Math.round(doneTasks / workTasks.length * 100);
      }
    }
  } catch(e) {
    console.error("Lỗi tính tiến độ & sức khỏe:", e);
  }
  
  const elProgress = document.getElementById("dash-kpi-progress");
  if(elProgress) elProgress.textContent = progressPct + "%";
  const elProgressDesc = document.getElementById("dash-kpi-progress-desc");
  if(elProgressDesc) {
    elProgressDesc.textContent = workTasksCount > 0 ? `Đã xong ${doneTasksCount}/${workTasksCount} việc` : "Chưa có hạng mục";
  }

  const elLate = document.getElementById("dash-kpi-late");
  if(elLate) {
    elLate.textContent = delayedTasks.length;
    elLate.style.color = delayedTasks.length > 0 ? "var(--danger)" : "var(--success)";
    elLate.style.fontSize = "36px";
  }
  const elLateDesc = document.getElementById("dash-kpi-late-desc");
  if(elLateDesc) {
    elLateDesc.textContent = delayedTasks.length > 0 ? "Cần xử lý gấp" : "Tiến độ an toàn";
  }
  
  const elHealth = document.getElementById("dash-health");
  if(elHealth) {
    elHealth.textContent = healthScore;
    elHealth.style.color = healthColor;
    if (healthScore !== "--") elHealth.textContent += "đ"; // đ = điểm
  }
  
  // 3. Calculate Finance
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
  
  // Hàm format tiền linh động: tỷ nếu >= 1 tỷ, tr nếu nhỏ hơn
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
    const textVal = fmtAuto(balanceValue);
    elBalance.textContent = textVal;
    elBalance.style.whiteSpace = "nowrap";
    // Co giãn cỡ chữ theo độ dài
    elBalance.style.fontSize = textVal.length > 12 ? "20px" : textVal.length > 8 ? "24px" : "32px";
    elBalance.style.color = balanceValue < 0 ? "var(--danger)" : "var(--success)";
  }
  const elBalanceDesc = document.getElementById("dash-kpi-balance-desc");
  if(elBalanceDesc) {
    elBalanceDesc.textContent = `Thu: ${fmtAuto(totalThuCDT)} · Chi: ${fmtAuto(totalChi)}`;
  }
  
  // Render Finance Chart (Đã thu vs Đã chi) — đơn vị linh động
  const canvasFin = document.getElementById("dash-chart-finance");
  if(canvasFin) {
    if(window._dashFinChart) { try { window._dashFinChart.destroy(); } catch(e) {} window._dashFinChart = null; }
    const finWrap = canvasFin.parentElement;
    const finOld = finWrap.querySelector('.chart-empty'); if(finOld) finOld.remove();
    if(totalThuCDT === 0 && totalChi === 0) {
      canvasFin.style.display = 'none';
      const finEm = document.createElement('div'); finEm.className = 'chart-empty';
      finEm.innerHTML = renderEmptyState('📊', 'Chưa có dữ liệu tài chính', 'Hệ thống chưa ghi nhận các khoản thu chi cho dự án này.');
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
    } // end else: có dữ liệu tài chính
  }

  // Top 3 Nhà thầu chi nhiều nhất
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
      elFinTop.innerHTML = renderEmptyState('💳', 'Chưa có thanh toán', 'Không có nhà thầu nào phát sinh chi phí thanh toán.');
    } else {
      elFinTop.innerHTML = sorted.map((x, idx) => {
        return `<div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border);">
          <span><b>${idx + 1}. ${esc(x.name)}</b></span>
          <span style="color:var(--danger); font-weight:700; white-space:nowrap;">${fmtAuto(x.val)}</span>
        </div>`;
      }).join("");
    }
  }
  
  // 4. Calculate Manpower & Rain (Last 7 Days - Mon to Sun)
  // We need the last 7 days strings.
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
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
    const dIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // Giờ local thay vì UTC
    const dayName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
    labels.push(dayName);
    
    // Find submissions for this day
    const daySubs = subs.filter(s => s.log_date === dIso);
    let dayManpower = 0;
    
    daySubs.forEach(s => {
      // Sum manpower
      if(s.manpower && Array.isArray(s.manpower)) {
        dayManpower += s.manpower.reduce((acc, m) => acc + (Number(m.headcount) || 0), 0);
      }
      // Sum rain
      if(s.totalRainHours && !isNaN(Number(s.totalRainHours))) {
        totalRain += Number(s.totalRainHours);
      }
    });
    
    manpowerData.push(dayManpower);
  }
  
  // Update Manpower Today KPI card
  let todayManpower = 0;
  const todayStr = todayISO();
  const todaySubs = subs.filter(s => s.log_date === todayStr);
  todaySubs.forEach(s => {
    if(s.manpower && Array.isArray(s.manpower)) {
      todayManpower += s.manpower.reduce((acc, m) => acc + (Number(m.headcount) || 0), 0);
    }
  });
  
  const elManpower = document.getElementById("dash-kpi-manpower");
  if(elManpower) {
    elManpower.textContent = todayManpower.toLocaleString('vi-VN');
  }
  const elManpowerDesc = document.getElementById("dash-kpi-manpower-desc");
  if(elManpowerDesc) {
    elManpowerDesc.textContent = `Tuần này: ${manpowerData.reduce((a,b) => a+b, 0).toLocaleString('vi-VN')} công`;
  }

  // Update Weather — hiển thị trong Hero card
  const elWeather = document.getElementById("dash-hero-weather");
  if(elWeather) {
    if(proj.latitude == null || proj.longitude == null) {
      elWeather.innerHTML = `<span>📍</span><span>Chưa cấu hình tọa độ</span>`;
    } else if(!navigator.onLine) {
      let offlineWeather = "";
      const todaySub = subs.find(s => s.log_date === todayStr);
      if(todaySub) {
        if(todaySub.weather_m && todaySub.weather_a) {
          offlineWeather = `Sáng: ${todaySub.weather_m === 'rainy' ? '🌧️' : '☀️'} / Chiều: ${todaySub.weather_a === 'rainy' ? '🌧️' : '☀️'}`;
        } else if(todaySub.weather) {
          offlineWeather = todaySub.weather;
        }
      }
      elWeather.innerHTML = offlineWeather
        ? `<span>${offlineWeather}</span>`
        : `<span>📡</span><span>Offline</span>`;
    } else {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${proj.latitude}&longitude=${proj.longitude}&current=temperature_2m,weather_code&timezone=auto`;
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if(data && data.current) {
              const code = data.current.weather_code;
              const temp = Math.round(data.current.temperature_2m);
              const wMap = {
                0:{label:"Nắng ráo",icon:"☀️"}, 1:{label:"Ít mây",icon:"🌤️"},
                2:{label:"Nhiều mây",icon:"⛅"}, 3:{label:"Âm u",icon:"☁️"},
                45:{label:"Sương mù",icon:"🌫️"}, 48:{label:"Sương mù",icon:"🌫️"},
                51:{label:"Mưa phùn nhẹ",icon:"🌧️"}, 53:{label:"Mưa phùn",icon:"🌧️"},
                55:{label:"Mưa phùn to",icon:"🌧️"}, 61:{label:"Mưa nhẹ",icon:"🌧️"},
                63:{label:"Mưa vừa",icon:"🌧️"}, 65:{label:"Mưa to",icon:"🌧️"},
                80:{label:"Mưa rào nhẹ",icon:"🌦️"}, 81:{label:"Mưa rào vừa",icon:"🌦️"},
                82:{label:"Mưa rào to",icon:"⛈️"}, 95:{label:"Giông bão",icon:"⛈️"}
              };
              const info = wMap[code] || {label:"Bình thường",icon:"🌤️"};
              elWeather.innerHTML = `<span>${info.icon}</span><span>${temp}°C · ${info.label}</span>`;
            }
          })
          .catch(() => { elWeather.innerHTML = `<span>🌡️</span><span>Không tải được</span>`; });
      } catch(e) {
        elWeather.innerHTML = `<span>🌡️</span><span>Không tải được</span>`;
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
      const mpEm = document.createElement('div'); mpEm.className = 'chart-empty';
      mpEm.innerHTML = renderEmptyState('👷', 'Chưa có báo cáo nhân lực', 'Vui lòng cập nhật báo cáo ngày để hiển thị biểu đồ.');
      mpWrap.appendChild(mpEm);
    } else { canvas.style.display = '';
    const css = getComputedStyle(document.documentElement);
    const C = (n) => css.getPropertyValue(n).trim();
    const brandAccent = C('--hp-brand-accent') || '#0969A7';
    const textSecondary = C('--hp-text-secondary') || '#B8C0C8';
    const borderCol = C('--hp-border') || 'rgba(255,255,255,0.08)';

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
            ticks: { color: textSecondary, font: {size: 9} },
            grid: { color: borderCol }
          },
          y: { 
            display: true, 
            min: 0, 
            ticks: { color: textSecondary, font: {size: 9}, stepSize: 5 }, 
            grid: { color: borderCol } 
          }
        },
        layout: {
          padding: 0
        }
      }
    });
    } // end else: có dữ liệu nhân lực
  }

  // 5. Render Alerts / Warnings
  const elDelays = document.getElementById("dash-alerts-delays");
  if(elDelays) {
    if(delayedTasks.length === 0) {
      elDelays.innerHTML = `<div class="subitem" style="color:var(--muted); font-style:italic;">Không có công việc trễ hạn</div>`;
    } else {
      elDelays.innerHTML = delayedTasks.slice(0, 5).map(it => {
        const effectiveEnd = (typeof getEffectiveEnd === 'function' ? getEffectiveEnd(it) : null) || it.end;
        return `<div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer;" onclick="switchTab('tiendo')">
          <span>⚠️ <b>${esc(it.task)}</b></span>
          <span style="color:var(--danger); font-weight:700; font-size:11px;">Hạn chót: ${fmtVN(effectiveEnd)}</span>
        </div>`;
      }).join("");
    }
  }
  
  const elIssues = document.getElementById("dash-alerts-issues");
  if(elIssues) {
    // Gather issues from latest reports
    let recentIssues = [];
    // Sort subs descending
    const sortedSubs = [...subs].sort((a,b) => b.log_date.localeCompare(a.log_date));
    for(const s of sortedSubs) {
      if(s.issues && s.issues.length > 0) {
        s.issues.forEach(iss => recentIssues.push({date: s.log_date, desc: iss.description, sev: iss.severity}));
      }
      if(recentIssues.length >= 5) break; // Get top 5 recent issues
    }
    
    if(recentIssues.length === 0) {
      elIssues.innerHTML = `<div class="subitem" style="color:var(--muted); font-style:italic;">Không có vướng mắc</div>`;
    } else {
      elIssues.innerHTML = recentIssues.map(iss => {
        const icon = iss.sev === 'high' ? '🔥' : (iss.sev === 'medium' ? '⚠️' : 'ℹ️');
        const color = iss.sev === 'high' ? 'var(--danger)' : (iss.sev === 'medium' ? 'var(--warning)' : 'var(--ink)');
        return `<div class="subitem" style="padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer;" onclick="switchTab('baocaongay-new')">
          <span style="color:${color}">${icon} <b>${iss.date.substring(5).replace('-','/')}</b>: ${esc(iss.desc)}</span>
        </div>`;
      }).join("");
    }
  }
  
  const elPayments = document.getElementById("dash-alerts-payments");
  if(elPayments) {
    const pendingPayments = [];
    (sc || []).forEach(x => {
      if(x.status === 'pending') {
        pendingPayments.push({
          type: 'Thanh toán NT',
          name: x.contractor || 'Nhà thầu',
          amount: Number(x.amount) || 0,
          date: x.date || ''
        });
      }
    });
    (ex || []).forEach(x => {
      if(x.status === 'pending') {
        pendingPayments.push({
          type: 'Chi phí lẻ',
          name: x.desc || 'Chi phí',
          amount: Number(x.total) || 0,
          date: x.date_scanned || ''
        });
      }
    });

    if(pendingPayments.length === 0) {
      elPayments.innerHTML = `<div class="subitem" style="color:var(--muted); font-style:italic;">Không có yêu cầu duyệt chi</div>`;
    } else {
      elPayments.innerHTML = pendingPayments.slice(0, 5).map(p => {
        return `<div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer;" onclick="switchTab('thanhtoan')">
          <span>⏳ <b>[${p.type}]</b> ${esc(p.name)}</span>
          <span style="color:var(--warning); font-weight:700;">${fmtAuto(p.amount)}</span>
        </div>`;
      }).join("");
    }
  }

  // 6. Render LPB Summary (Tóm tắt đề xuất Liên phòng ban)
  const elLpb = document.getElementById("dash-alerts-lpb");
  if (elLpb) {
    try {
      const lpbReqs = await metaGet("lpb_requests", []);
      const projReqs = lpbReqs.filter(r => r.project_id === CUR.project && r.status !== "completed");
      
      const totalPending = projReqs.length;
      const totalUrgent = projReqs.filter(r => r.urgent === true).length;
      const totalOverdue = projReqs.filter(r => r.due && new Date() > new Date(r.due)).length;
      
      if (totalPending === 0) {
        elLpb.innerHTML = `<div class="subitem" style="color:var(--muted); font-style:italic; cursor:pointer;" onclick="switchTab('lpb')">Không có đề xuất chờ xử lý</div>`;
      } else {
        elLpb.innerHTML = `
          <div class="subitem" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); cursor:pointer;" onclick="switchTab('lpb')">
            <span>🤝 <b>Chờ xử lý:</b> ${totalPending} đề xuất</span>
            <span style="font-size:11px; display:flex; gap:6px;">
              ${totalUrgent > 0 ? `<span class="badge" style="background:rgba(239, 68, 68, 0.08); color:var(--danger); font-weight:700; padding:2px 6px; border-radius:4px; margin:0;">🔥 ${totalUrgent} khẩn</span>` : ""}
              ${totalOverdue > 0 ? `<span class="badge" style="background:rgba(239, 68, 68, 0.08); color:var(--danger); font-weight:700; padding:2px 6px; border-radius:4px; margin:0;">🔴 ${totalOverdue} trễ</span>` : ""}
            </span>
          </div>
        `;
      }
    } catch (err) {
      console.error("Lỗi render tóm tắt LPB trên Dashboard:", err);
    }
  }

  // 7. Render Daily Report waiting for approval (Chỉ hiển thị cho người duyệt)
  const elWaitingApprove = document.getElementById("dash-alerts-waiting-approve");
  const listWaitingApprove = document.getElementById("dash-waiting-approve-list");
  if (elWaitingApprove && listWaitingApprove) {
    try {
      const isApprover = typeof CUR_USER !== 'undefined' && CUR_USER && ["admin", "director", "pm", "site_manager"].includes(CUR_USER.role);
      if (!isApprover) {
        elWaitingApprove.classList.add("hide");
      } else {
        const allDaily = await metaGet("daily_reports", []);
        const pendingReports = allDaily.filter(r => r.project_id === CUR.project && (r.approval === "pending" || r.status === "pending"));
        
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
                style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid var(--border); border-radius:var(--r-sm); transition:background 0.2s;" 
                onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='transparent'">
                <span>⏳ Báo cáo ngày <b>${fmtDate(r.date)}</b> · Người nộp: <b>${esc(r.created_name || r.created_by || "Kỹ sư")}</b></span>
                <span style="color:var(--primary); font-size:12px; font-weight:600;">Xem & Duyệt ➔</span>
              </div>
            `;
          }).join("");
        }
      }
    } catch (err) {
      console.error("Lỗi render danh sách chờ duyệt báo cáo ngày:", err);
    }
  }
}

async function selectAndApproveDailyReport(date) {
  switchTab("baocaongay-new");
  
  // Chờ iframe load và gửi message
  setTimeout(() => {
    const iframe = document.querySelector("#tab-baocaongay-new iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'NAVIGATE_TO_REPORT',
        date: date
      }, '*');
    }
  }, 300);
}
window.selectAndApproveDailyReport = selectAndApproveDailyReport;