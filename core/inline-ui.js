// Extracted inline script 1
// Deep-linking navigation helper
    async function selectAndOpenProject(projectId, targetTab) {
      const userProjects = Array.from(document.getElementById("cur-project").options).map(opt => opt.value);
      if (userProjects.includes(projectId)) {
        CUR.project = projectId;
        if (typeof metaSet === 'function') {
          await metaSet("cur_project", projectId);
        }
        const sel = document.getElementById("cur-project");
        if (sel) {
          sel.value = projectId;
          sel.dispatchEvent(new Event('change'));
        }
        
        // Navigation and rendering
        if (typeof switchTab === 'function') {
          switchTab(targetTab);
        }
        
        if (typeof renderMySubs === 'function') renderMySubs();
        if (typeof renderContractors === 'function') renderContractors();
        if (typeof renderTiendo === 'function') renderTiendo();
        if (typeof renderCdt === 'function') renderCdt();
      } else {
        alert("Dự án này bạn không được phân quyền truy cập!");
      }
    }

    // Bind event delegation
    (function() {
      const ids = ["exec-progress-table", "tc-progress-table"];
      ids.forEach(id => {
        const tableContainer = document.getElementById(id);
        if (tableContainer) {
          tableContainer.addEventListener("click", async (e) => {
            const tr = e.target.closest("tr");
            const td = e.target.closest("td");
            if (!tr || !td) return;
            
            const onclickAttr = tr.getAttribute("onclick") || "";
            const match = onclickAttr.match(/openProject\('([^']+)'\)/);
            if (!match) return;
            const projectId = match[1];
            
            const cells = Array.from(tr.cells);
            const colIndex = cells.indexOf(td);
            
            // Column index 2: Progress Schedule
            if (colIndex === 2) {
              e.stopPropagation();
              e.preventDefault();
              await selectAndOpenProject(projectId, "tiendo");
            } 
            // Column index 3: Today's Report Status
            else if (colIndex === 3) {
              e.stopPropagation();
              e.preventDefault();
              await selectAndOpenProject(projectId, "baocaongay-new");
            }
          });
        }
      });
    })();

;
// Extracted inline script 2
function getCurrentGPS(event) {
      if (!navigator.geolocation) {
        alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
        return;
      }
      const btn = event.currentTarget;
      const originalText = btn.innerHTML;
      btn.innerHTML = "⌛...";
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          document.getElementById("np-lat").value = position.coords.latitude.toFixed(6);
          document.getElementById("np-lon").value = position.coords.longitude.toFixed(6);
          btn.innerHTML = originalText;
          btn.disabled = false;
        },
        (error) => {
          alert("Lỗi định vị GPS: " + error.message);
          btn.innerHTML = originalText;
          btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

;
// Extracted inline script 3
function toggleSubNav(id) {
  const sub = document.getElementById('sub-' + id);
  const arrow = document.getElementById('arrow-' + id);
  if(sub.classList.contains('hide')) {
    sub.classList.remove('hide');
    arrow.textContent = '▾';
  } else {
    sub.classList.add('hide');
    arrow.textContent = '▸';
  }
}
function updateHeaderDate() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
  const el = document.getElementById('header-date');
  if(el) el.textContent = dateStr;
}
setInterval(updateHeaderDate, 60000);
updateHeaderDate();

;
// Extracted inline script 4
(function() {
    const select = document.getElementById("cur-project");
    if (!select) return;
    function adjust() {
      const temp = document.createElement("span");
      temp.style.visibility = "hidden";
      temp.style.position = "absolute";
      temp.style.whiteSpace = "pre";
      temp.style.font = window.getComputedStyle(select).font;
      temp.style.fontWeight = window.getComputedStyle(select).fontWeight;
      temp.style.fontSize = window.getComputedStyle(select).fontSize;
      temp.textContent = select.options[select.selectedIndex]?.text || "SHUN HING";
      document.body.appendChild(temp);
      select.style.width = (temp.getBoundingClientRect().width + 32) + "px";
      document.body.removeChild(temp);
    }
    select.addEventListener("change", adjust);
    const observer = new MutationObserver(adjust);
    observer.observe(select, { childList: true, attributes: true });
    window.addEventListener("load", adjust);
    setTimeout(adjust, 200);
    setTimeout(adjust, 800);
  })();

  // Wrap global renderExecutive to show real stats for Khối Chuyên môn & Cảnh báo khẩn cấp
  (function() {
    const localEsc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    if (typeof window.renderExecutive === 'function') {
      const originalRender = window.renderExecutive;
      window.renderExecutive = async function() {
        await originalRender();
        try {
          const subs = typeof DataService !== 'undefined' ? await DataService.listSubmissions() : [];
          const depts = typeof metaGet === 'function' ? await metaGet("departments", {}) : {};
          
          // 1. QA-QC and HSE Issues
          const hseIssues = [];
          const qaqcIssues = [];
          const urgentIssues = [];
          
          const projects = typeof DataService !== 'undefined' ? await DataService.listProjects() : [];

          subs.forEach(s => {
            const proj = projects.find(p => p.id === s.project_id);
            const projName = proj ? proj.name : "Dự án không rõ";

            (s.issues || []).forEach(issue => {
              // Collect urgent issues
              if (issue.severity === "high") {
                const isHse = /an toàn|tai nạn|bảo hộ|hse|chấn thương|sự cố|nguy hiểm|cháy nổ/i.test(issue.description || "");
                urgentIssues.push({
                  projId: s.project_id,
                  projName: projName,
                  desc: issue.description,
                  date: s.log_date,
                  reporter: s.submitted_by || "Kỹ sư hiện trường",
                  sectionId: isHse ? 'grp-07' : 'grp-06'
                });
              }

              const isHse = /an toàn|tai nạn|bảo hộ|hse|chấn thương|sự cố|nguy hiểm|cháy nổ/i.test(issue.description || "");
              if (isHse) {
                hseIssues.push(issue);
              } else {
                qaqcIssues.push(issue);
              }
            });
          });
          
          // Quét sự cố nghiêm trọng từ các trường báo cáo chi tiết trong daily_reports
          const dailyReports = typeof DataService !== 'undefined' ? await DataService.listDailyReports() : [];
          dailyReports.forEach(r => {
            const proj = projects.find(p => p.id === r.project_id);
            const projName = proj ? proj.name : "Dự án không rõ";
            
            const fieldsToCheck = [
              { name: "f_note", label: "Ghi chú", sectionId: "grp-06" },
              { name: "f_rec", label: "Kiến nghị", sectionId: "grp-06" },
              { name: "f_safe", label: "An toàn", sectionId: "grp-07" },
              { name: "f_qual", label: "Chất lượng", sectionId: "grp-07" },
              { name: "f_sched", label: "Tiến độ", sectionId: "grp-07" }
            ];
            
            fieldsToCheck.forEach(f => {
              const text = r[f.name];
              if (text && typeof text === 'string') {
                const lines = text.split('\n');
                lines.forEach(line => {
                  if (line.trim()) {
                    const hasSiren = line.includes("🚨");
                    const hasKeywords = /nghiêm trọng|sự cố|khẩn cấp|tai nạn|nguy hiểm/i.test(line);
                    const isNegative = /(không|ko |chưa|đảm bảo|an toàn|tuân thủ|bình thường|ổn định|đạt yêu cầu)/i.test(line);
                    if (hasSiren || (hasKeywords && !isNegative)) {
                      const isDup = urgentIssues.some(x => x.projId === r.project_id && x.date === r.date && x.desc === line.trim());
                      if (!isDup) {
                        urgentIssues.push({
                          projId: r.project_id,
                          projName: projName,
                          desc: line.trim(),
                          date: r.date,
                          reporter: "Báo cáo ngày",
                          sectionId: f.sectionId
                        });
                      }
                    }
                  }
                });
              }
            });
          });
          
          // 2. Shopdrawing
          const sdCount = (depts.shopdrawing || []).length;
          const sdTasks = subs.flatMap(s => s.completed || []).filter(c => /bản vẽ|shopdrawing|thiết kế|phê duyệt/i.test(c.description || "")).length;
          
          // 3. Bảo trì
          const mtCount = (depts.baotri || []).length;
          const mtTasks = subs.flatMap(s => s.completed || []).filter(c => /bảo trì|sửa chữa|bảo dưỡng|thiết bị|máy móc/i.test(c.description || "")).length;
          
          // Render Urgent alerts block
          const urgentAlertsDiv = document.getElementById("exec-urgent-alerts");
          const urgentListDiv = document.getElementById("exec-urgent-alerts-list");
          if (urgentAlertsDiv && urgentListDiv) {
            if (urgentIssues.length > 0) {
              urgentAlertsDiv.classList.remove("hide");
              urgentListDiv.innerHTML = urgentIssues.map(issue => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); border:1px solid rgba(239, 68, 68, 0.15); padding: 10px 14px; border-radius: 8px; font-size: 13px; cursor:pointer; transition: background 0.2s;" onclick="openUrgentAlert('${issue.projId}', '${issue.date}', '${issue.sectionId || ''}')" class="urgent-alert-item">
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
                    <span style="background:var(--danger); color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; text-transform:uppercase">${localEsc(issue.projName)}</span>
                    <span style="font-weight:600; color:var(--text-strong)">${localEsc(issue.desc)}</span>
                  </div>
                  <div style="font-size:11px; color:var(--muted); text-align:right">
                    <span>📅 ${localEsc(issue.date)}</span> · <span>👤 ${localEsc(issue.reporter)}</span>
                  </div>
                </div>
              `).join("");
            } else {
              urgentAlertsDiv.classList.add("hide");
            }
          }

          const hasReports = (subs && subs.length > 0) || (dailyReports && dailyReports.length > 0);
          
          const cm = [
            {
              n: "QA-QC",
              sub: "Kiểm soát chất lượng",
              i: window.getDashSvg ? window.getDashSvg('check-circle', 20, qaqcIssues.length > 0 ? 'var(--hp-warning)' : 'var(--hp-success)') : "✓",
              t: "qaqc",
              desc: !hasReports ? "Chưa có dữ liệu" : (qaqcIssues.length > 0 ? `${qaqcIssues.length} vấn đề chất lượng` : "0 vấn đề chất lượng"),
              statusBadge: !hasReports ? "⚪ Chưa có dữ liệu" : (qaqcIssues.length > 0 ? "🔴 Cần xử lý" : "🟢 Tốt"),
              color: !hasReports ? "var(--muted)" : (qaqcIssues.length > 0 ? "var(--hp-warning)" : "var(--hp-success)"),
              bg: !hasReports ? "rgba(148,163,184,0.12)" : (qaqcIssues.length > 0 ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)")
            },
            {
              n: "HSE",
              sub: "An toàn lao động",
              i: window.getDashSvg ? window.getDashSvg('shield', 20, hseIssues.length > 0 ? 'var(--hp-danger)' : 'var(--hp-primary)') : "🛡",
              t: "hse",
              desc: !hasReports ? "Chưa có dữ liệu" : (hseIssues.length > 0 ? `${hseIssues.length} cảnh báo an toàn` : "An toàn: Tốt (0 cảnh báo)"),
              statusBadge: !hasReports ? "⚪ Chưa có dữ liệu" : (hseIssues.length > 0 ? "🔴 Cảnh báo" : "🟢 An toàn"),
              color: !hasReports ? "var(--muted)" : (hseIssues.length > 0 ? "var(--hp-danger)" : "var(--hp-success)"),
              bg: !hasReports ? "rgba(148,163,184,0.12)" : (hseIssues.length > 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)")
            },
            {
              n: "Shopdrawing",
              sub: "Bản vẽ thi công",
              i: window.getDashSvg ? window.getDashSvg('pen-tool', 20, 'var(--hp-brand-accent)') : "✏",
              t: "shopdrawing",
              desc: (sdCount === 0 && sdTasks === 0) ? "Chưa có dữ liệu" : `${sdCount} nhân sự · ${sdTasks} bản vẽ`,
              statusBadge: (sdCount === 0 && sdTasks === 0) ? "⚪ Chưa có dữ liệu" : "🟢 Hoạt động",
              color: (sdCount === 0 && sdTasks === 0) ? "var(--muted)" : "var(--hp-brand-accent)",
              bg: (sdCount === 0 && sdTasks === 0) ? "rgba(148,163,184,0.12)" : "rgba(14,165,233,0.12)"
            },
            {
              n: "Bảo trì",
              sub: "Bảo trì & sửa chữa",
              i: window.getDashSvg ? window.getDashSvg('wrench', 20, 'var(--hp-warning)') : "🔧",
              t: "baotri",
              desc: (mtCount === 0 && mtTasks === 0) ? "Chưa có dữ liệu" : `${mtCount} nhân sự · ${mtTasks} lượt bảo trì`,
              statusBadge: (mtCount === 0 && mtTasks === 0) ? "⚪ Chưa có dữ liệu" : "🟢 Hoạt động",
              color: (mtCount === 0 && mtTasks === 0) ? "var(--muted)" : "var(--hp-warning)",
              bg: (mtCount === 0 && mtTasks === 0) ? "rgba(148,163,184,0.12)" : "rgba(245,158,11,0.12)"
            }
          ];
          
          if (document.getElementById("exec-chuyenmon")) {
            document.getElementById("exec-chuyenmon").innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">'
              + cm.map(c => `
                <div class="dept-card" onclick="switchTab('${c.t}')" style="cursor:pointer; padding:12px 14px; border:1px solid var(--border); border-radius:var(--r-md); background:var(--surface); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s, box-shadow 0.2s;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div style="width:32px; height:32px; border-radius:8px; background:var(--surface-2); display:flex; align-items:center; justify-content:center;">${c.i}</div>
                      <div>
                        <div style="font-weight:700; font-size:13px; color:var(--hp-text-primary); line-height:1.2;">${localEsc(c.n)}</div>
                        <div style="font-size:11px; color:var(--muted); margin-top:2px;">${localEsc(c.sub)}</div>
                      </div>
                    </div>
                    <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; background:${c.bg}; color:${c.color}; white-space:nowrap;">${c.statusBadge}</span>
                  </div>
                  <div style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                    <span style="color:var(--hp-text-primary); font-weight:600;">${localEsc(c.desc)}</span>
                    <span style="color:var(--primary); font-weight:700;">Xem ›</span>
                  </div>
                </div>
              `).join("")
              + '</div>';
          }
        } catch (e) {
          console.error("Lỗi khi cập nhật số liệu chuyên môn:", e);
        }
      };
    }

    // Deep-linking navigation to Daily Report sections
    async function openUrgentAlert(projId, date, sectionId) {
      window.PENDING_REPORT_NAV = {
        date: date,
        sectionId: sectionId || 'grp-06'
      };
      
      if (typeof selectAndOpenProject === 'function') {
        await selectAndOpenProject(projId, 'baocaongay-new');
      }
      
      const iframe = document.querySelector('#tab-baocaongay-new iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'NAVIGATE_TO_REPORT',
          date: date,
          sectionId: sectionId || 'grp-06'
        }, '*');
      }
    }
    window.openUrgentAlert = openUrgentAlert;

    // (Đã gỡ bộ gửi PROJECT_CHANGED trùng ở đây: bản này thiếu projInfo, gửi sau 200ms
    // nên GHI ĐÈ TRẮNG tên/ngày công trình mà bản đầy đủ trong app.js onchange vừa điền.
    // Nguồn gửi duy nhất giờ là $("cur-project").onchange trong app.js.)

  })();

;
// Extracted inline script 5
// Đăng ký Service Worker (PWA + chạy offline). SW dùng no-cache cho file cùng máy nên
// luôn lấy bản mới khi online, không còn cần gỡ SW hay bump version tay.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js')
      .then(function(reg) { console.log('SW registered:', reg.scope); })
      .catch(function(err) { console.warn('SW register failed:', err); });
  });
}
