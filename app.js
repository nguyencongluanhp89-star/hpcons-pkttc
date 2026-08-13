// SUPABASE ĐÃ GỠ BỎ HOÀN TOÀN 28/07/2026 (Sếp chốt) — hệ thống chạy 100% Firebase từ 15/07.
// Trước đó chỉ TẮT bằng cờ SUPABASE_ENABLED=false, code + khóa anon vẫn nằm trong mã nguồn.
// Nay xóa: SUPABASE_CONFIG (kèm khóa anon), SUPABASE_ENABLED, object SupabaseSync (~249 dòng),
// thư viện supabase-js trong index.html. Cần lùi thì lấy lại từ git history (trước commit này).

// CÔNG TẮC ĐĂNG NHẬP: để false = TẮT đăng nhập (tự vào quyền Admin, thấy mọi tab).
// Khi hoàn thiện xong, đổi thành true để bật lại màn đăng nhập + phân quyền.
const LOGIN_ENABLED = true; // TẮT đăng nhập giai đoạn test (Antigravity + Sếp vào thẳng quyền Admin, dùng mọi tab). Bật lại = true khi vận hành thật.

// LOGO HP CONS — placeholder dạng chữ (SVG). THAY BẰNG LOGO THẬT bằng cách
// đổi HPCONS_LOGO = "data:image/png;base64,<chuỗi base64 logo của công ty>".
var HPCONS_LOGO = (window.HPCONS_LOGO) || ("data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="110" viewBox="0 0 900 110">'
  + '<rect width="900" height="110" fill="#ffffff"/>'
  + '<rect x="0" y="0" width="150" height="110" fill="#096AA7"/>'
  + '<text x="75" y="70" font-family="Arial" font-size="36" font-weight="700" fill="#ffffff" text-anchor="middle">P.KTTC</text>'
  + '<text x="180" y="52" font-family="Arial" font-size="34" font-weight="700" fill="#075687">P.KTTC</text>'
  + '<text x="180" y="84" font-family="Arial" font-size="15" fill="#075687">HE THONG QUAN LY PHONG KY THUAT THI CONG - HPCONS</text>'
  + '</svg>'));

// Hàm đệm: renderMySubs thuộc module nhật ký cũ đã gỡ, nhưng còn 4 nơi gọi
// (đổi/mở dự án, sau pull) — thiếu nó là ReferenceError làm đứt cả chuỗi đổi dự án.
function renderMySubs(){}

// ---------- SEED ----------
const SEED = {
  // KHÔNG seed dự án demo nữa (vận hành thật): mỗi browser mới mở app với IndexedDB trống mà seed
  // SHUN HING/HOWELL (id cứng p3/p4) sẽ tự đẩy chúng lên Firebase làm demo "sống lại". Để rỗng —
  // máy mới sẽ tự kéo dự án thật từ Firebase về.
  projects: [],
  users: [
    {id:"u1", full_name:"KS. Nguyễn Văn A"},
    {id:"u2", full_name:"KS. Trần Thị B"},
    {id:"u3", full_name:"CHT. Lê Văn C"},
  ],
  contractors: [
    {project_id:"p1", name:"Bảo vệ"},
    {project_id:"p1", name:"Tổ bê tông"},
    {project_id:"p1", name:"Tổ cốt thép"},
    {project_id:"p1", name:"Nhà thầu kết cấu thép"},
    {project_id:"p2", name:"Bảo vệ"},
    {project_id:"p2", name:"Tổ nền móng"},
  ],
};

// ---------- THỜI TIẾT (Open-Meteo, miễn phí, không cần key) ----------
// Tách dữ liệu mưa theo giờ -> map {date:{rainDayHours,rainNightHours,totalRainHours}}
// Ca đêm của 1 ngày = giờ 18-24 của ngày đó + giờ 00-06 của ngày kế tiếp.
function rainFromHourly(times, prec){
  const dayC={}, nightLate={}, earlyNext={};
  for(let i=0;i<times.length;i++){
    if(!((prec[i]||0)>0)) continue;
    const t=times[i], d=t.slice(0,10), hh=parseInt(t.slice(11,13),10);
    if(hh>=6 && hh<18) dayC[d]=(dayC[d]||0)+1;
    else if(hh>=18) nightLate[d]=(nightLate[d]||0)+1;
    else { const prev=isoFromDate(new Date(new Date(d).getTime()-86400000)); earlyNext[prev]=(earlyNext[prev]||0)+1; }
  }
  const out={}; const dates=new Set([].concat(Object.keys(dayC),Object.keys(nightLate),Object.keys(earlyNext)));
  dates.forEach(d=>{ const day=dayC[d]||0, night=(nightLate[d]||0)+(earlyNext[d]||0); out[d]={rainDayHours:day, rainNightHours:night, totalRainHours:day+night}; });
  return out;
}
async function fetchRainRange(lat, lon, fromISO, toISO){
  if(lat==null||lon==null||isNaN(lat)||isNaN(lon)) return {};
  const url="https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+"&hourly=precipitation&start_date="+fromISO+"&end_date="+toISO+"&timezone=auto";
  const res=await fetch(url); if(!res.ok) throw new Error("HTTP "+res.status);
  const d=await res.json();
  return rainFromHourly((d.hourly&&d.hourly.time)||[], (d.hourly&&d.hourly.precipitation)||[]);
}
async function fetchRainArchive(lat, lon, fromISO, toISO){
  if(lat==null||lon==null||isNaN(lat)||isNaN(lon)) return {};
  const url="https://archive-api.open-meteo.com/v1/archive?latitude="+lat+"&longitude="+lon+"&hourly=precipitation&start_date="+fromISO+"&end_date="+toISO+"&timezone=auto";
  const res=await fetch(url); if(!res.ok) throw new Error("HTTP "+res.status);
  const d=await res.json();
  return rainFromHourly((d.hourly&&d.hourly.time)||[], (d.hourly&&d.hourly.precipitation)||[]);
}
function wlKey(pid){ return "weatherlogs:"+pid; }
async function getWeatherLogs(pid){ return await metaGet(wlKey(pid), {}); }
let CUR_RAIN=null;
function setRainDisplay(r){ const x=id=>$(id); if(!x("w-day"))return; x("w-day").textContent=r?r.rainDayHours+"h":"–"; x("w-night").textContent=r?r.rainNightHours+"h":"–"; x("w-total").textContent=r?r.totalRainHours+"h":"–"; }
async function autoWeather(){
  const date=$("f-date").value; const st=$("w-status"); if(!date){ return; }
  const proj=(await DataService.listProjects()).find(p=>p.id===CUR.project);
  if(!proj || proj.latitude==null || proj.longitude==null){ if(st)st.textContent="⚠ Công trình chưa có tọa độ — tọa độ được khai báo lúc tạo dự án (trang Điều hành)."; CUR_RAIN=null; setRainDisplay(null); return; }
  const logs=await getWeatherLogs(CUR.project);
  if(logs[date]){ CUR_RAIN=logs[date]; setRainDisplay(CUR_RAIN); if(st)st.textContent="Đã có dữ liệu (đã lưu)."; }
  if(!navigator.onLine){ if(st && !logs[date]) st.textContent="Đang offline — sẽ tự lấy thời tiết khi có mạng."; if(!logs[date]){CUR_RAIN=null;setRainDisplay(null);} return; }
  if(st) st.textContent="Đang lấy thời tiết…";
  try{
    const next=isoFromDate(new Date(new Date(date).getTime()+86400000));
    const map=await fetchRainRange(proj.latitude, proj.longitude, date, next);
    Object.assign(logs, map); await metaSet(wlKey(CUR.project), logs);
    CUR_RAIN=logs[date]||{rainDayHours:0,rainNightHours:0,totalRainHours:0}; setRainDisplay(CUR_RAIN);
    if(st)st.textContent="Cập nhật từ Open‑Meteo lúc "+new Date().toLocaleTimeString("vi-VN")+".";
  }catch(e){ if(st) st.textContent="Lỗi lấy thời tiết: "+e.message; }
}
let CUR = { user:"u1", project:"p1", editing:null, editingCreated:null, photoIds:[] };

// Expose lên window để iframe "Báo cáo ngày" (TAB BAO CAO NGAY) truy cập được qua window.parent.
// CUR + DataService khai bằng let/const (KHÔNG tự lên window) — thiếu 2 dòng này thì
// window.parent.DataService/CUR = undefined -> iframe không nạp được báo cáo (form kẹt ở mẫu mặc định).
window.CUR = CUR;

// ===== NHẮC ĐĂNG NHẬP LẠI KHI THIẾU PHIÊN FIREBASE (Sếp gặp lỗi 30/07) =====
// Bối cảnh: app tự vào bằng session_user (không gõ mật khẩu) -> firebaseAuthSync không chạy ->
// thiếu phiên Firebase Auth -> Firestore chặn TẤT CẢ: badge "Offline (local)", tab Báo cáo ngày
// (iframe BCA dùng chung phiên, ẩn màn login) báo "Missing or insufficient permissions".
// KHÔNG thể tự đăng nhập lại vì app KHÔNG lưu mật khẩu (đúng nguyên tắc bảo mật) -> phải nhắc.
function checkFirebaseSessionAfterAutoLogin(){
  try{
    if (typeof FIREBASE_ENABLED === "undefined" || !FIREBASE_ENABLED) return;
    const u = (window.fb && window.fb.auth) ? window.fb.auth.currentUser : null;
    if (u) return;                       // đã có phiên -> bình thường
    if (document.getElementById("relogin-banner")) return;   // đã hiện rồi
    const b = document.createElement("div");
    b.id = "relogin-banner";
    b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#B3402F;"
      + "color:#fff;padding:12px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;"
      + "justify-content:center;font-size:14px;font-weight:600;box-shadow:0 -4px 16px rgba(0,0,0,.25)";
    b.innerHTML = '<span>⚠️ Chưa kết nối máy chủ — dữ liệu đang chỉ đọc trên máy này. '
      + 'Cần đăng nhập lại (nhập mật khẩu) để đồng bộ và dùng được tab Báo cáo ngày.</span>'
      + '<button id="relogin-btn" style="background:#fff;color:#B3402F;border:none;border-radius:6px;'
      + 'padding:8px 14px;font-weight:800;cursor:pointer">Đăng nhập lại</button>'
      + '<button id="relogin-close" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6);'
      + 'border-radius:6px;padding:8px 12px;font-weight:600;cursor:pointer">Để sau</button>';
    document.body.appendChild(b);
    const btn = document.getElementById("relogin-btn");
    if (btn) btn.onclick = async function(){
      try { await metaSet("session_user", null); } catch(e){}
      location.reload();
    };
    const cl = document.getElementById("relogin-close");
    if (cl) cl.onclick = function(){ b.remove(); };
  }catch(e){ console.warn("checkFirebaseSessionAfterAutoLogin lỗi:", e && e.message); }
}
window.checkFirebaseSessionAfterAutoLogin = checkFirebaseSessionAfterAutoLogin;



// viewReport: Tính toán thống kê
async function viewReport() {
  const period = $('r-period').value;
  const dateStr = $('r-date').value;
  if(!dateStr) { alert("Vui lòng chọn ngày mốc."); return; }
  
  const mDate = new Date(dateStr);
  let dStart, dEnd;
  if(period === "day") {
    dStart = dateStr;
    dEnd = dateStr;
  } else if (period === "week") {
    const day = mDate.getDay(); // 0 is Sunday
    const diffToMon = mDate.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(mDate.setDate(diffToMon));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // yyyy-mm-dd
    const pad = (n) => n.toString().padStart(2, '0');
    dStart = `${startOfWeek.getFullYear()}-${pad(startOfWeek.getMonth()+1)}-${pad(startOfWeek.getDate())}`;
    dEnd = `${endOfWeek.getFullYear()}-${pad(endOfWeek.getMonth()+1)}-${pad(endOfWeek.getDate())}`;
  } else if (period === "month") {
    const pad = (n) => n.toString().padStart(2, '0');
    dStart = `${mDate.getFullYear()}-${pad(mDate.getMonth()+1)}-01`;
    const lastDay = new Date(mDate.getFullYear(), mDate.getMonth()+1, 0);
    dEnd = `${mDate.getFullYear()}-${pad(mDate.getMonth()+1)}-${pad(lastDay.getDate())}`;
  }

  const allReports = await DataService.listDailyReports();
  // Filter by project and date range (chỉ tính báo cáo đã duyệt)
  const matched = allReports.filter(r => {
    if(r.project_id !== CUR.project) return false;
    const approval = r.approval || r.status || 'approved'; // Báo cáo cũ mặc định coi là approved
    if(approval !== 'approved') return false;
    return r.date >= dStart && r.date <= dEnd;
  });

  const emptyEl = $('report-empty');
  const dashEl = $('report-dashboard');

  if(matched.length === 0) {
    emptyEl.style.display = "block";
    dashEl.style.display = "none";
    return;
  }

  emptyEl.style.display = "none";
  dashEl.style.display = "flex";

  let totalRain = 0;
  let totalManpower = 0;
  let worksSet = new Set();

  matched.forEach(r => {
    totalRain += (r.rain_hours || 0);
    totalManpower += (r.total_manpower || 0);
    if(r.works && Array.isArray(r.works)) {
      r.works.forEach(w => worksSet.add(w));
    }
  });

  const avgManpower = Math.round(totalManpower / matched.length);

  $('stat-rain').innerText = totalRain.toString() + "h";
  $('stat-manpower').innerText = avgManpower.toString();
  $('stat-days').innerText = matched.length.toString();



  // BẢNG NHÂN LỰC THEO NGÀY
  const dates = [...new Set(matched.map(r => r.date))].sort();
  const mpMap = {}; // { 'name': { 'date': val, total: 0 } }
  const dateTotals = {};
  dates.forEach(d => dateTotals[d] = 0);

  matched.forEach(r => {
    const d = r.date;
    // Công nhật BCH
    if (r.bch) {
      if(!mpMap['Công nhật BCH']) mpMap['Công nhật BCH'] = { total: 0 };
      mpMap['Công nhật BCH'][d] = (mpMap['Công nhật BCH'][d] || 0) + parseInt(r.bch);
      mpMap['Công nhật BCH'].total += parseInt(r.bch);
      dateTotals[d] += parseInt(r.bch);
    }
    // Các tổ đội — cấu trúc units = [{name, n}] (name: tên tổ đội, n: số người)
    if (r.units && Array.isArray(r.units)) {
      r.units.forEach(u => {
         const name = (u.name || '').trim();
         const val = parseInt(u.n) || 0;
         if(!name) return;
         if(!mpMap[name]) mpMap[name] = { total: 0 };
         mpMap[name][d] = (mpMap[name][d] || 0) + val;
         mpMap[name].total += val;
         dateTotals[d] += val;
      });
    }
  });

  let grandTotal = 0;
  let thHtml = "<tr><th>TÊN NHÀ THẦU PHỤ</th>";
  dates.forEach(d => {
    const dd = d.split('-');
    const fmt = `${dd[2]}/${dd[1]}`;
    thHtml += `<th>${fmt}</th>`;
  });
  thHtml += "<th>TỔNG CỘNG</th></tr>";
  $('stat-mp-head').innerHTML = thHtml;

  let tbHtml = "";
  for (const [name, row] of Object.entries(mpMap)) {
    tbHtml += `<tr><td>${name}</td>`;
    dates.forEach(d => {
      tbHtml += `<td>${row[d] ? row[d] : '-'}</td>`;
    });
    tbHtml += `<td><b>${row.total}</b></td></tr>`;
    grandTotal += row.total;
  }

  // Hàng TỔNG CỘNG
  tbHtml += "<tr style='background-color: var(--success); color: white;'><td><b>TỔNG CỘNG</b></td>";
  dates.forEach(d => {
    tbHtml += `<td><b>${dateTotals[d]}</b></td>`;
  });
  tbHtml += `<td><b>${grandTotal}</b></td></tr>`;
  $('stat-mp-body').innerHTML = tbHtml;

  // TỔNG HỢP NHANH (KPI) — thay cho "Sổ tay vấn đề & kiến nghị"
  let topDay = {d:'', v:-1};
  dates.forEach(d=>{ if(dateTotals[d] > topDay.v) topDay = {d, v:dateTotals[d]}; });
  let topUnit = {name:'', v:-1};
  for(const [nm, row] of Object.entries(mpMap)){ if(row.total > topUnit.v) topUnit = {name:nm, v:row.total}; }
  const kpiFmtDay = topDay.d ? topDay.d.split('-').reverse().join('/') : '—';
  const kpiList = [
    {val: grandTotal, label:'Tổng lượt nhân công', sub:'trong kỳ'},
    {val: Object.keys(mpMap).length, label:'Số tổ đội / nhà thầu', sub:'huy động'},
    {val: (topDay.v>=0?topDay.v:'—'), label:'Ngày đông nhất', sub: kpiFmtDay},
    {val: (topUnit.v>=0?topUnit.v:'—'), label:'Tổ đội đông nhất', sub: topUnit.name||'—'},
    {val: worksSet.size, label:'Đầu mục công tác', sub:'hạng mục'}
  ];
  if($('stat-kpi')) $('stat-kpi').innerHTML = kpiList.map(k=>
    `<div style="flex:1; min-width:130px; background:var(--bg,#f8fafc); border:1px solid var(--border,#e2e8f0); border-radius:10px; padding:12px 14px; text-align:center">
       <div style="font-size:22px; font-weight:800; color:var(--primary,#1e40af)">${k.val}</div>
       <div style="font-size:12px; font-weight:600; color:#334155; margin-top:2px">${k.label}</div>
       <div style="font-size:11px; color:#94a3b8">${k.sub}</div>
     </div>`).join('');

  // EXTRACT PHOTOS
  let photosHtml = "";

  matched.forEach(r => {
    const fmtDate = r.date.split('-').reverse().join('/');
    // Photos — cấu trúc photos = [{tm, vi, cn, img, auto}] (ảnh base64 nằm ở .img)
    if(r.photos && Array.isArray(r.photos)) {
      r.photos.forEach(p => {
        if(p.img) {
          photosHtml += `<div class="gallery-item">
            <img src="${p.img}" class="gallery-img">
            <div class="gallery-caption">
               <b>${fmtDate}</b> ${p.vi || 'Không có chú thích'}
            </div>
          </div>`;
        }
      });
    }
  });

  $('stat-photos').innerHTML = photosHtml ? `<div class="gallery-container">${photosHtml}</div>` : `<div class="muted" style="text-align:center; padding:20px;"><i>(Không có hình ảnh nào trong kỳ)</i></div>`;

  // DRAW CHARTS
  if(window.myLineChart) window.myLineChart.destroy();
  if(window.myPieChart) window.myPieChart.destroy();

  const lineLabels = dates.map(d => { const x=d.split('-'); return `${x[2]}/${x[1]}`; });
  const lineData = dates.map(d => dateTotals[d]);

  const css = getComputedStyle(document.documentElement);
  const C = (n) => css.getPropertyValue(n).trim();
  const brandAccent = C('--hp-brand-accent') || '#0969A7';
  const textSecondary = C('--hp-text-secondary') || '#B8C0C8';
  const borderCol = C('--hp-border') || 'rgba(255,255,255,0.08)';

  if (document.getElementById('chart-manpower-line')) {
    window.myLineChart = new Chart(document.getElementById('chart-manpower-line'), {
      type: 'line',
      data: {
        labels: lineLabels,
        datasets: [{
          label: 'Tổng nhân lực',
          data: lineData,
          borderColor: brandAccent,
          backgroundColor: `color-mix(in srgb, ${brandAccent} 10%, transparent)`,
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textSecondary } }
        },
        scales: {
          x: { ticks: { color: textSecondary }, grid: { color: borderCol } },
          y: { ticks: { color: textSecondary }, grid: { color: borderCol } }
        }
      }
    });
  }

  const pieLabels = [];
  const pieData = [];
  const bgColors = [C('--hp-brand-primary'), C('--hp-brand-accent'), C('--hp-warning'), C('--hp-danger'), C('--hp-muted')];
  let colorIdx = 0;
  for (const [name, row] of Object.entries(mpMap)) {
    pieLabels.push(name);
    pieData.push(row.total);
  }

  if (document.getElementById('chart-manpower-pie')) {
    window.myPieChart = new Chart(document.getElementById('chart-manpower-pie'), {
      type: 'doughnut',
      data: {
        labels: pieLabels,
        datasets: [{
          data: pieData,
          backgroundColor: pieLabels.map(() => bgColors[(colorIdx++) % bgColors.length]),
          borderColor: borderCol,
          borderWidth: 1
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { 
            position: 'right',
            labels: { color: textSecondary }
          } 
        } 
      }
    });
  }
  
  // Show Export and Print buttons
  const btnExport = $('btn-export-excel');
  const btnPrint = $('btn-print-report');
  if(btnExport) btnExport.style.display = 'inline-block';
  if(btnPrint) btnPrint.style.display = 'inline-block';
}
// set default date for r-date
if($('r-date')) {
  $('r-date').value = new Date().toISOString().split("T")[0];
}

// Giao tiếp với App chính (bỏ qua CORS)
window.addEventListener('message', async (e) => {
  if (!e.data || !e.data.type) return;
  
  if (e.data.type === 'GET_PROJECT_INFO') {
    try {
      const projects = await DataService.listProjects();
      const proj = projects.find(p => p.id === CUR.project);
      e.source.postMessage({ type: 'PROJECT_INFO_RESULT', reqId: e.data.reqId, data: proj }, '*');
    } catch(err) {
      e.source.postMessage({ type: 'PROJECT_INFO_ERROR', reqId: e.data.reqId, error: err.message }, '*');
    }
  }
  
  if (e.data.type === 'SAVE_REPORT') {
    try {
      await DataService.saveDailyReport(e.data.data);
      e.source.postMessage({ type: 'SAVE_REPORT_SUCCESS', reqId: e.data.reqId }, '*');
    } catch(err) {
      e.source.postMessage({ type: 'SAVE_REPORT_ERROR', reqId: e.data.reqId, error: err.message }, '*');
    }
  }

  // Iframe Báo cáo ngày xin danh sách báo cáo (nút "Mẫu hôm qua", biểu đồ tuần...).
  // Bắt buộc đi qua kênh này: DataService/CUR khai báo const/let nên KHÔNG nằm trên window,
  // iframe truy cập window.parent.DataService trực tiếp sẽ luôn là undefined.
  if (e.data.type === 'GET_DAILY_REPORTS') {
    try {
      const reports = await DataService.listDailyReports();
      e.source.postMessage({ type: 'GET_DAILY_REPORTS_SUCCESS', reqId: e.data.reqId, data: { reports, project: CUR.project } }, '*');
    } catch(err) {
      e.source.postMessage({ type: 'GET_DAILY_REPORTS_ERROR', reqId: e.data.reqId, error: err.message }, '*');
    }
  }

  if (e.data.type === 'REQUEST_KB_SYNC') {
    syncKBToIframe();
  }

  if (e.data.type === 'DAILY_REPORT_SAVED') {
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof pushAiSnapshot === 'function') pushAiSnapshot(); // cập nhật dữ liệu cho bot Telegram
  }
});


// DARK MODE
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('meta_dark_mode', isDark);
  const iframe = document.querySelector('iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'TOGGLE_DARK_MODE', isDark: isDark }, '*');
  }
}
const savedDark = localStorage.getItem('meta_dark_mode');
const isDark = (savedDark === null) ? true : (savedDark === 'true');
if (isDark) { document.body.classList.add('dark-mode'); }

// Quản lý Gemini API Key
function saveGeminiKey() {
  const key = document.getElementById('sys-gemini-key').value.trim();
  if (!key) {
    document.getElementById('gemini-msg').style.color = 'var(--danger)';
    document.getElementById('gemini-msg').innerText = '❌ Vui lòng nhập API Key';
    return;
  }
  localStorage.setItem('sys_gemini_key', key);
  document.getElementById('gemini-msg').style.color = 'var(--success)';
  document.getElementById('gemini-msg').innerText = '✅ Đã lưu API Key thành công!';

  // ADMIN/GIÁM ĐỐC lưu key -> chia sẻ cho CẢ PHÒNG qua kho đồng bộ (tự đẩy Firebase).
  // Máy khác mở app/F5 là tự nhận key (adoptSharedGeminiKey) — đọc PDF tiến độ không phải nhập gì.
  if (typeof catalogAutoPushAllowed === 'function' && catalogAutoPushAllowed()) {
    metaSet('sys_ai_gemini_key', key);
    document.getElementById('gemini-msg').innerText = '✅ Đã lưu + chia sẻ key cho cả phòng (máy khác F5 là dùng được)!';
  }

  // Truyền sang iframe nếu đang mở
  const iframe = document.querySelector('iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'SET_GEMINI_KEY', key: key }, '*');
  }

  setTimeout(() => { document.getElementById('gemini-msg').innerText = ''; }, 3000);
}

// Mọi máy: sau khi kéo dữ liệu về, tự nhận API Key Gemini dùng chung (Sếp nhập 1 lần trên web).
// Key nằm trong kho đồng bộ meta 'sys_ai_gemini_key' -> chép vào localStorage cho các module
// (tiến độ PDF, AI dịch, AI Center) dùng như cũ — không ai phải nhập key thủ công.
async function adoptSharedGeminiKey() {
  try {
    const shared = await metaGet('sys_ai_gemini_key', '');
    if (shared && localStorage.getItem('sys_gemini_key') !== shared) {
      localStorage.setItem('sys_gemini_key', shared);
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'SET_GEMINI_KEY', key: shared }, '*');
      }
      console.log('Đã nhận API Key Gemini dùng chung từ hệ thống.');
    }
  } catch (e) { /* chưa có key chung — bỏ qua */ }
}
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('sys_gemini_key');
  if (savedKey && document.getElementById('sys-gemini-key')) {
    document.getElementById('sys-gemini-key').value = savedKey;
  }
});

async function luuPhienBan() {
  const btn    = document.getElementById('btn-luu-phien-ban');
  const status = document.getElementById('luu-phien-ban-status');
  const result = document.getElementById('luu-phien-ban-result');
  if(!btn) return;

  btn.disabled = true;
  btn.textContent = '⏳ Đang lưu...';
  if(status) status.textContent = '';
  if(result) result.classList.add('hide');

  try {
    const res  = await fetch('/api/luu-phien-ban', { method: 'POST' });
    if(!res.ok) throw new Error('API_UNAVAILABLE');
    const data = await res.json();
    if(data.ok) {
      btn.textContent = '✅ Đã lưu';
      btn.style.background = 'var(--success)';
      if(status) status.textContent = data.ts;
      if(result) {
        result.classList.remove('hide');
        result.style.background = '#F0FDF4';
        result.style.border     = '1px solid #BBF7D0';
        result.style.color      = 'var(--success)';
        result.innerHTML = '<b>Lưu phiên bản thành công!</b><br><code style="font-size:12px;color:var(--text-muted)">' + (data.log || '') + '</code>';
      }
    } else {
      throw new Error(data.error || 'Lỗi không xác định');
    }
  } catch(e) {
    btn.disabled = false;
    btn.textContent = '💾 Lưu phiên bản ngay';
    btn.style.background = '';
    if(result) {
      result.classList.remove('hide');
      result.style.background = '#FEF2F2';
      result.style.border     = '1px solid #FECACA';
      result.style.color      = 'var(--danger)';
      const isNetErr = e.message === 'API_UNAVAILABLE' || e.message.includes('fetch') || e.message.includes('Failed');
      result.innerHTML = isNetErr
        ? '<b>Không kết nối được server API.</b><br><span style="color:var(--text-muted)">Hãy khởi động app qua <code>start.bat</code> (không phải double-click index.html).</span>'
        : '<b>Lỗi:</b> ' + e.message;
    }
  }
}

// =================== GLOBAL CONTRACTOR DICTIONARY (KB) ===================
// LƯU Ý (sửa 2026-07-09): trước đây 2 hàm dưới đặt tên importKBContractors/renderKB — TRÙNG TÊN
// với cặp hàm của "Từ điển AI cho Voice" trong modules/tiendo.js và ĐÈ MẤT chúng (app.js nạp sau
// cùng), làm card Từ điển Voice ở tab Hệ thống nạp nhầm kho + nút Xem không hiển thị. Đã đổi tên
// thành importCentralKBContractors/renderCentralKB (kho kb_contractors — Từ điển Trung tâm, khác
// với kho `kb` của Voice). Hiện KHÔNG có nút nào trong HTML gọi bản này; giữ lại để dùng khi cần.
async function importCentralKBContractors(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {header: 1}); // Array of arrays
      
      let kb = await metaGet('kb_contractors', []);
      let added = 0;
      
      // Bỏ qua dòng tiêu đề (index 0)
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 2) continue;
        // Cột 0: ID, Cột 1: TÊN, Cột 2: ALIAS
        const id = r[0] ? r[0].toString().trim() : '';
        const name = r[1] ? r[1].toString().trim() : '';
        const aliasStr = r[2] ? r[2].toString().trim() : '';
        
        if (!name) continue;
        
        // Tách alias bằng dấu phẩy
        let aliases = [];
        if (aliasStr) {
          aliases = aliasStr.split(',').map(x => x.trim()).filter(Boolean);
        }
        
        // Kiểm tra trùng
        const existIdx = kb.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
        if (existIdx >= 0) {
          // Gộp alias nếu trùng tên
          const mergedAliases = new Set([...kb[existIdx].aliases, ...aliases]);
          kb[existIdx].aliases = Array.from(mergedAliases);
        } else {
          kb.push({ id: id || (Date.now() + i).toString(), name: name, aliases: aliases });
          added++;
        }
      }
      
      await metaSet('kb_contractors', kb);
      alert(`✅ Đã nạp thành công! Thêm mới ${added} nhà thầu/tổ đội vào Từ điển Trung tâm.`);
      renderCentralKB();
      syncKBToIframe();
    } catch (err) {
      alert("❌ Lỗi đọc file Excel: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

async function renderCentralKB() {
  const kb = await metaGet('kb_contractors', []);
  // Có thể in ra giao diện nếu cần, tạm thời console log
  console.log("KHO TỪ ĐIỂN NHÀ THẦU:", kb);
}

async function syncKBToIframe() {
  const contractors = CUR.project
    ? (await DataService.listContractors(CUR.project)).filter(c => c.status !== 'inactive' && c.status !== 'finished')
    : [];
  const kb = contractors.map(c => {
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      aliases: Array.isArray(c.aliases) ? c.aliases : [],
      voiceKeywords: Array.isArray(c.voiceKeywords) ? c.voiceKeywords : []
    };
  });

  let categories = [];
  let tasks = [];
  if (CUR.project) {
    try {
      const schedKey = 'progress:' + CUR.project;
      const progress = await metaGet(schedKey, []);
      if (Array.isArray(progress)) {
        categories = Array.from(new Set(
          progress.map(p => p.task)
            .filter(t => t && (t === t.toUpperCase() || /^[IVXLC]+[\.\)]/.test(t.trim())))
        ));
        tasks = Array.from(new Set(
          progress.map(p => p.task).filter(Boolean)
        ));
      }
    } catch(err) {
      console.warn("Failed to read progress for iframe sync:", err);
    }
  }

  const iframe = document.querySelector('iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ 
      type: 'SYNC_KB', 
      kb: kb,
      categories: categories,
      tasks: tasks
    }, '*');

    if (typeof CUR_USER !== 'undefined' && CUR_USER) {
      iframe.contentWindow.postMessage({
        type: 'SYNC_USER',
        id: CUR_USER.id,
        role: CUR_USER.role,
        userName: CUR_USER.full_name
      }, '*');
    }
  }
}

// Chạy khi khởi động để truyền KB sang iframe
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(syncKBToIframe, 1500); // Chờ iframe load xong
});


// =================== GLOBAL CONTRACTOR DICTIONARY ADD TO PROJECT ===================
async function addContractorCmd() {
  if (!CUR.project) return alert("Vui lòng chọn một dự án trước.");
  const sel = document.getElementById('kb-contractor-select');
  const txt = document.getElementById('new-contractor');
  let name = "";
  if (txt && txt.value.trim()) {
    name = txt.value.trim();
  } else if (sel && sel.value) {
    name = sel.value;
  }
  if (!name) return;
  
  await DataService.addContractor(CUR.project, name);
  if(txt) txt.value = '';
  if(sel) sel.value = '';
  renderContractors();
}

// Hook vào renderContractors để điền danh sách select
const oldRenderContractors = renderContractors;
renderContractors = async function() {
  await oldRenderContractors();
  const kb = await metaGet("kb_contractors", []);
  const sel = document.getElementById("kb-contractor-select");
  if(sel) {
    let html = '<option value="">-- Chọn từ Kho (Global) --</option>';
    kb.forEach(k => {
      html += `<option value="${k.name}">${k.name}</option>`;
    });
    sel.innerHTML = html;
  }
};



// =================== EXPORT DASHBOARD TO EXCEL ===================
function exportDashboardToExcel() {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Bảng Nhân lực
  const tableHead = document.getElementById('stat-mp-head');
  const tableBody = document.getElementById('stat-mp-body');
  if(!tableHead || !tableBody) return alert("Không có dữ liệu nhân lực để xuất!");
  
  const aoa = [];
  // Parse Thead
  const thRow = [];
  const ths = tableHead.querySelectorAll('th');
  ths.forEach(th => thRow.push(th.innerText));
  aoa.push(thRow);
  // Parse Tbody
  const trs = tableBody.querySelectorAll('tr');
  trs.forEach(tr => {
    const tdRow = [];
    tr.querySelectorAll('td').forEach(td => tdRow.push(td.innerText));
    aoa.push(tdRow);
  });
  
  const ws1 = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws1, "Bang Nhan Luc");

  // 2. Sheet Sổ tay Vấn đề
  const issuesDiv = document.getElementById('stat-issues');
  const issuesAoa = [["Ngày", "Nội dung"]];
  if (issuesDiv && issuesDiv.children.length > 0) {
    const blocks = issuesDiv.querySelectorAll('div > div');
    blocks.forEach(block => {
      if(block.style.fontWeight === 'bold') {
        const dateText = block.innerText;
        const ul = block.nextElementSibling;
        if(ul && ul.tagName === 'UL') {
          ul.querySelectorAll('li').forEach(li => {
            issuesAoa.push([dateText, li.innerText]);
          });
        }
      }
    });
  }
  const ws2 = XLSX.utils.aoa_to_sheet(issuesAoa);
  XLSX.utils.book_append_sheet(wb, ws2, "So Tay Van De");

  // Xuất file
  const fileName = `TongHopBaoCao_${document.getElementById('r-period').value}_${document.getElementById('r-date').value}.xlsx`;
  XLSX.writeFile(wb, fileName);
}



// =================== IN BÁO CÁO TỔNG HỢP (PDF A4 đẹp, nguồn daily_reports) ===================
async function printDashboard() {
  const dashEl = $('report-dashboard');
  if(!dashEl || dashEl.style.display === 'none') {
    alert('Vui lòng bấm "XEM THỐNG KÊ" trước khi in.');
    return;
  }
  const period = $('r-period').value;
  const dateStr = $('r-date').value;
  const periodLabel = period === 'day' ? 'Theo ngày' : (period === 'week' ? 'Theo tuần' : 'Theo tháng');

  const projs = await DataService.listProjects();
  const proj = projs.find(p => p.id === CUR.project);
  const projName = proj ? proj.name : '';

  // Lấy dữ liệu đã được viewReport() render từ daily_reports
  const rain = $('stat-rain').innerText;
  const avgMp = $('stat-manpower').innerText;
  const days = $('stat-days').innerText;
  const mpHead = $('stat-mp-head').innerHTML;
  const mpBody = $('stat-mp-body').innerHTML;
  const issuesHtml = $('stat-issues').innerHTML;
  const imgs = Array.from($('stat-photos').querySelectorAll('img'))
    .map(im => '<img src="' + im.src + '">').join('');

  const html =
  '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title> </title><style>'
  + '@page{size:A4 portrait;margin:20mm 15mm 20mm 30mm;}' /* Lề chuẩn NĐ30/2020: trên 20, phải 15, dưới 20, trái 30mm */
  + 'html,body{width:100%;margin:0;padding:0;font-family:Arial,sans-serif;color:#1f2937;font-size:12.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
  + 'table.layout{width:100%;border-collapse:collapse;}'
  + 'table.layout>thead>tr>td,table.layout>tfoot>tr>td{border:none;padding:0;}'
  + 'table.layout>tbody>tr>td{border:none;padding:10px 0 0;}'
  + 'thead{display:table-header-group;}tfoot{display:table-footer-group;}'
  + '.hdr{border-bottom:2px solid #2E6B22;padding-bottom:3px;margin-bottom:10px;}'
  + '.hdr img{width:100%;height:auto;aspect-ratio:1200/113;display:block;}'
  + '.ftr{border-top:1px solid #ccc;padding-top:3px;font-size:10px;color:#555;}'
  + 'h1{font-size:17px;color:#2E6B22;text-align:center;margin:0 0 2px;}'
  + '.sub{text-align:center;color:#555;margin:0 0 12px;font-size:11px;}'
  + '.kpi-row{display:flex;gap:12px;margin:8px 0 14px;}'
  + '.kpi-box{flex:1;border:1px solid #cbd5e1;border-radius:6px;padding:8px;text-align:center;}'
  + '.kpi-box .v{font-size:20px;font-weight:700;color:#2E6B22;}'
  + '.kpi-box .l{font-size:10px;color:#555;text-transform:uppercase;}'
  + 'table.data{width:100%;border-collapse:collapse;margin:6px 0 12px;}'
  + 'table.data th,table.data td{border:1px solid #cbd5e1;padding:5px 8px;text-align:center;}'
  + 'table.data th{background:#2E6B22;color:#fff;}'
  + 'table.data td:first-child{text-align:left;}'
  + 'h3{font-size:13px;color:#2E6B22;margin:14px 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:2px;}'
  + '.ticket-card{border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin:6px 0;}'
  + '.ticket-date{font-weight:700;color:#2E6B22;margin-bottom:4px;}'
  + '.ticket-content{margin:0;padding-left:18px;}'
  + '.gallery-container{display:flex;flex-wrap:wrap;gap:6px;}'
  + '.gallery-item{width:31%;}'
  + '.gallery-item img,.photos img{width:100%;height:auto;border:1px solid #cbd5e1;border-radius:4px;}'
  + '.gallery-caption{font-size:10px;color:#555;margin-top:2px;}'
  + '.sign{display:flex;justify-content:space-around;margin-top:30px;text-align:center;font-size:12px;}'
  + '.sign>div{width:45%;}.sign .role{font-weight:700;}.sign .sp{height:55px;}'
  + 'button{display:none;}'
  + '</style></head><body>'
  + '<table class="layout">'
  + '<thead><tr><td>'
  + '<div class="hdr"><img id="logo-img" src="' + HPCONS_LOGO + '" width="1200" height="113" alt="P.KTTC"></div>'
  + '</td></tr></thead>'
  + '<tfoot><tr><td>'
  + '<div class="ftr">' + esc(projName) + ' — Báo cáo tổng hợp</div>'
  + '</td></tr></tfoot>'
  + '<tbody><tr><td>'
  + '<h1>BÁO CÁO TỔNG HỢP THI CÔNG</h1>'
  + '<p class="sub">' + esc(projName) + ' · ' + periodLabel + ' · Ngày mốc: ' + fmtVN(dateStr) + '</p>'
  + '<div class="kpi-row">'
  + '<div class="kpi-box"><div class="v">' + rain + '</div><div class="l">Tổng giờ mưa ảnh hưởng</div></div>'
  + '<div class="kpi-box"><div class="v">' + avgMp + '</div><div class="l">Nhân lực TB / ngày</div></div>'
  + '<div class="kpi-box"><div class="v">' + days + '</div><div class="l">Số ngày đã báo cáo</div></div>'
  + '</div>'
  + '<h3>I. Bảng nhân lực theo ngày</h3>'
  + '<table class="data"><thead>' + mpHead + '</thead><tbody>' + mpBody + '</tbody></table>'
  + '<h3>II. Ghi chú · Kiến nghị · An toàn · Chất lượng</h3>'
  + issuesHtml
  + (imgs ? '<h3>III. Ảnh hiện trường</h3><div class="gallery-container">' + imgs + '</div>' : '')
  + '<div class="sign"><div><div class="role">NGƯỜI LẬP BÁO CÁO</div><div>(KS. Hiện trường)</div><div class="sp"></div></div>'
  + '<div><div class="role">CHỈ HUY TRƯỞNG</div><div>(CHT)</div><div class="sp"></div></div></div>'
  + '</td></tr></tbody></table>'
  + '</body></html>';

  const win = window.open('', '_blank');
  if(!win){ alert('Trình duyệt chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại.'); return; }
  win.document.open(); win.document.write(html); win.document.close();
  setTimeout(function(){
    var done = false;
    function go(){ if(done) return; done = true; win.focus(); win.print(); }
    var img = win.document.getElementById('logo-img');
    if(img){
      if(img.complete) {
        go();
      } else {
        img.onload = go;
        img.onerror = go;
        setTimeout(go, 1500);
      }
    }
    else go();
  }, 200);
}

// ========== PWA Custom Install Prompt ==========
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.classList.remove('hide');
    installBtn.style.setProperty('display', 'flex', 'important');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('pwa-install-btn');
  
  // Phát hiện iOS và hiển thị nút cài đặt hướng dẫn thủ công
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  
  if (isIOS && !isStandalone && installBtn) {
    installBtn.classList.remove('hide');
    installBtn.style.setProperty('display', 'flex', 'important');
  }

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (isIOS) {
        Swal.fire({
          title: 'Cài đặt ứng dụng (iOS)',
          html: '<div style="text-align:left; font-size:14px; line-height:1.6;">' +
                '<p>Để thêm ứng dụng HP CONS vào màn hình chính iPhone/iPad:</p>' +
                '<ol>' +
                '<li>Nhấp vào nút <b>Chia sẻ</b> (biểu tượng <span style="font-size:18px;">📤</span> hoặc ô vuông mũi tên lên trên thanh công cụ Safari).</li>' +
                '<li>Cuộn xuống dưới và chọn mục <b>Thêm vào màn hình chính</b> (Add to Home Screen <span style="font-size:16px;">➕</span>).</li>' +
                '<li>Nhấn <b>Thêm</b> (Add) ở góc phải để hoàn tất.</li>' +
                '</ol>' +
                '</div>',
          icon: 'info',
          confirmButtonText: 'Đồng ý',
          confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#096AA7'
        });
        return;
      }
      
      if (!deferredPrompt) {
        Swal.fire({
          title: 'Hướng dẫn cài đặt',
          text: 'Vui lòng nhấn vào dấu 3 chấm góc phải trình duyệt và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".',
          icon: 'info',
          confirmButtonText: 'Đồng ý',
          confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#096AA7'
        });
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA Install Prompt result:', outcome);
      deferredPrompt = null;
      installBtn.classList.add('hide');
      installBtn.style.setProperty('display', 'none', 'important');
    });
  }
});

window.addEventListener('appinstalled', (evt) => {
  console.log('PWA app installed successfully');
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.classList.add('hide');
    installBtn.style.setProperty('display', 'none', 'important');
  }
});

function renderTimeline(startStr, endStr, completedPct, isProjectDone = false) {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr);
  const end = new Date(endStr);
  const today = new Date();
  
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const passedDays = Math.round((today - start) / (1000 * 60 * 60 * 24)) + 1;
  
  let timePct = 0;
  if (totalDays > 0) {
    timePct = Math.max(0, Math.min(100, Math.round((passedDays / totalDays) * 100)));
  }
  
  const dLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  let statusText = '';
  let statusColor = 'var(--hp-primary)';
  
  if (isProjectDone) {
    statusText = 'Hoàn thành';
    statusColor = 'var(--hp-success)';
  } else if (dLeft < 0) {
    statusText = `Quá hạn ${Math.abs(dLeft)} ngày`;
    statusColor = 'var(--hp-danger)';
  } else {
    statusText = `Còn ${dLeft} ngày`;
    if (timePct >= 90) statusColor = 'var(--hp-danger)';
    else if (timePct >= 70) statusColor = 'var(--hp-warning)';
  }
  
  const startFmt = start.getDate().toString().padStart(2,'0') + '/' + (start.getMonth()+1).toString().padStart(2,'0') + '/' + start.getFullYear();
  const endFmt = end.getDate().toString().padStart(2,'0') + '/' + (end.getMonth()+1).toString().padStart(2,'0') + '/' + end.getFullYear();

  return `
    <div class="hp-timeline-container" style="margin-top:12px; margin-bottom:12px; width:100%; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; color:var(--hp-text-secondary); font-weight:500;">
        <span>📅 Bắt đầu: <b>${startFmt}</b> · Kết thúc: <b>${endFmt}</b></span>
        <span style="font-weight:700; color:${statusColor}">${statusText} (${timePct}% thời gian đã dùng)</span>
      </div>
      <div class="hp-timeline-track" style="height:9px; border-radius:10px; background:var(--hp-divider); overflow:hidden; border:1px solid var(--hp-border); position:relative;">
        <div class="hp-timeline-bar" style="width:${timePct}%; height:100%; background:${statusColor}; border-radius:10px; transition:width 0.3s ease;"></div>
      </div>
    </div>
  `;
}
window.renderTimeline = renderTimeline;

function renderEmptyState(icon, title, desc) {
  return `
    <div class="hp-empty-state">
      <div class="icon">${icon}</div>
      <div class="title">${title}</div>
      <div class="desc">${desc}</div>
    </div>
  `;
}
window.renderEmptyState = renderEmptyState;
