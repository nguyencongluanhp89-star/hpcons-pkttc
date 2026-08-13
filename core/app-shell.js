// Application shell: navigation, project context routing and bootstrap.
// ---------- NAV + KHỞI ĐỘNG ----------
const HOME_TABS=["dieuhanh","hethong"];                                                   // cấp công ty
const MOBILE_REPORT_QUERY = "(max-width: 760px)";
function isMobileReportMode(){ return window.matchMedia(MOBILE_REPORT_QUERY).matches; }
window.isMobileReportMode = isMobileReportMode;

function applyMobileReportMode(){
  const mobile = isMobileReportMode();
  document.body.classList.toggle("mobile-report-only", mobile);
  return mobile;
}
window.applyMobileReportMode = applyMobileReportMode;
applyMobileReportMode();

function showMobileDesktopNotice(){
  document.querySelectorAll("section[id^='tab-']").forEach(el => el.classList.add("hide"));
  const notice = document.getElementById("mobile-desktop-notice");
  if(notice) notice.classList.remove("hide");
}
window.showMobileDesktopNotice = showMobileDesktopNotice;

function setMode(mode){
  // Sidebar: hiện tất cả mục mà vai trò được phép (data-tab)
  document.querySelectorAll(".side-nav .nav-btn").forEach(b=>{
    if(b.id==="side-logout"){ b.style.display=(LOGIN_ENABLED && CUR_USER)?"flex":"none"; return; }
    const t=b.dataset.tab; if(t) b.style.display=can(t)?"flex":"none";
  });
}
function switchTab(tab){
  closeNav();
  const mobileReportOnly = applyMobileReportMode();
  if(mobileReportOnly && tab !== "baocaongay-new"){
    if(CUR_USER && can("baocaongay-new")) tab = "baocaongay-new";
    else if(CUR_USER){ showMobileDesktopNotice(); return; }
  }
  const mobileNotice = document.getElementById("mobile-desktop-notice");
  if(mobileNotice) mobileNotice.classList.add("hide");
  
  const SUBTABS_THICONG = ["tc-nhansu", "tc-duan", "tc-themduan", "tc-muctieu"];
  const SUBTABS_PROJECT = ["dashboard","baocaongay-new","tiendo","thanhtoan","lpb","danhmuc","thanhvien","baocao"];
  const SUBTABS_SD = ["sd-dashboard", "sd-nhansu", "sd-baocao", "sd-muctieu"];
  const SUBTABS_QAQC = ["qaqc-dashboard", "qaqc-nhansu", "qaqc-baocao", "qaqc-muctieu"];
  const SUBTABS_HSE = ["hse-dashboard", "hse-nhansu", "hse-baocao", "hse-muctieu"];
  const SUBTABS_MT = ["mt-dashboard", "mt-nhansu", "mt-baocao", "mt-muctieu"];
  
  let mainTab = tab;
  let subTab = null;

  if (SUBTABS_PROJECT.includes(tab)) {
    mainTab = "project";
    subTab = tab;
  } else if (tab === "project") {
    subTab = "dashboard";
  } else if (SUBTABS_THICONG.includes(tab)) {
    mainTab = "thicong";
    subTab = tab;
  } else if (tab === "thicong") {

    subTab = "tc-duan";
  } else if (SUBTABS_SD.includes(tab)) {
    mainTab = "shopdrawing";
    subTab = tab;
  } else if (tab === "shopdrawing") {
    subTab = "sd-dashboard";
  } else if (SUBTABS_QAQC.includes(tab)) {
    mainTab = "qaqc";
    subTab = tab;
  } else if (tab === "qaqc") {
    subTab = "qaqc-dashboard";
  } else if (SUBTABS_HSE.includes(tab)) {
    mainTab = "hse";
    subTab = tab;
  } else if (tab === "hse") {
    subTab = "hse-dashboard";
  } else if (SUBTABS_MT.includes(tab)) {
    mainTab = "baotri";
    subTab = tab;
  } else if (tab === "baotri") {
    subTab = "mt-dashboard";
  }

  let checkTab = mainTab === "project" ? subTab : mainTab;
  if(CUR_USER && !can(checkTab)) return;

  setMode((mainTab==="dieuhanh"||mainTab==="hethong") ? "home" : "project");
  updateProjBanner(subTab || mainTab);
  
  // Highlight sidebar
  const highlightTab = (mainTab === "project") ? "thicong" : mainTab;
  document.querySelectorAll(".side-nav .nav-btn").forEach(b => {
    if(b.dataset.tab) b.classList.toggle("active", b.dataset.tab === highlightTab);
  });

  // Cập nhật brand sidebar theo department đang active (luôn luôn cố định 'PHÒNG KỸ THUẬT THI CÔNG' theo yêu cầu)
  const brand = { name: 'THI CÔNG', sub: 'PHÒNG KỸ THUẬT' };
  const elBrandName = document.getElementById('side-brand-name');
  const elBrandSub  = document.getElementById('side-brand-sub');
  const isDept = true;
  if(elBrandName){
    elBrandName.textContent  = brand.name;
    elBrandName.style.fontSize = isDept ? '30px' : '18px';
  }
  if(elBrandSub){
    elBrandSub.textContent = brand.sub;
    elBrandSub.style.color = isDept ? '#F59E0B' : '#94a3b8';
  }
  
  // Manage subnav visibility
  document.querySelectorAll(".subnav-tabs").forEach(el => el.classList.add("hide"));
  const activeSubnav = $("subnav-" + mainTab);
  if(activeSubnav) {
    activeSubnav.classList.remove("hide");
    $("breadcrumb").style.display = "none";
    if(subTab){
      activeSubnav.querySelectorAll(".sub-tab-btn").forEach(b=>{
        b.classList.toggle("active", b.dataset.tab === subTab);
      });
    }
  } else {
    $("breadcrumb").style.display = "block";
  }

  // Determine section to show
  let targetSection = subTab ? subTab : mainTab; if(targetSection === "duan") targetSection = "dieuhanh";
  // Chốt chặn quyền: chỉ vai có quyền "dieuhanh" (admin/director/pm) mới thấy Trung tâm điều hành
  if(targetSection === "dieuhanh" && CUR_USER && !can("dieuhanh")) targetSection = "dashboard";

  document.querySelectorAll("section[id^='tab-']").forEach(el => {
    el.classList.toggle("hide", el.id !== "tab-"+targetSection);
  });
  
  const t = targetSection;
  if(t==="dashboard") renderDashboard();
  if(t==="ai-center") renderAiCenter();
  if(t==="dieuhanh") renderExecutive();
  if(t==="thanhvien") renderTeam();

  if(t==="danhmuc") renderContractors();
  if(t==="tiendo") renderTiendo();
  if(t==="thanhtoan") renderCdt();
  if(t==="lpb") renderLpb();
  if(t==="hethong"){ renderHethong(); renderUserMgmt(); renderRoleMgmt(); loadTelegramConfig(); }
  if(t==="tc-duan") renderProjectList();
  if(t==="tc-muctieu") renderTcGoals();
  if(t==="baocaongay-new"){
    const iframe = document.querySelector('#tab-baocaongay-new iframe') || document.querySelector('iframe');
    if (iframe) {
      if (!iframe.getAttribute('data-src-set')) {
        const base = location.hostname.includes('netlify') ? 'baocao/' : 'BAO-CAO-APP/';
        iframe.src = base + 'index.html?embed=1';
        iframe.setAttribute('data-src-set', '1');
        iframe.onload = async () => {
          if (typeof syncKBToIframe === 'function') syncKBToIframe();
          try {
            const list = await DataService.listProjects();
            const curNorm = (CUR.project || '').trim().toLowerCase();
            const _p = (list || []).find(x => x.id === CUR.project || (x.name && x.name.trim().toLowerCase() === curNorm));
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'PROJECT_CHANGED',
                projectId: CUR.project,
                projName: (_p && _p.name) || CUR.project || '',
                projInfo: {
                  name: (_p && _p.name) || CUR.project || '',
                  address: (_p && _p.address) || '',
                  scale: (_p && _p.scale) || '',
                  start_date: (_p && _p.start_date) || '',
                  end_date: (_p && _p.end_date) || ''
                }
              }, '*');
            }
          } catch (_) {}
        };
      } else {
        if (typeof syncKBToIframe === 'function') syncKBToIframe();
        (async () => {
          try {
            const list = await DataService.listProjects();
            const curNorm = (CUR.project || '').trim().toLowerCase();
            const _p = (list || []).find(x => x.id === CUR.project || (x.name && x.name.trim().toLowerCase() === curNorm));
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'PROJECT_CHANGED',
                projectId: CUR.project,
                projName: (_p && _p.name) || CUR.project || '',
                projInfo: {
                  name: (_p && _p.name) || CUR.project || '',
                  address: (_p && _p.address) || '',
                  scale: (_p && _p.scale) || '',
                  start_date: (_p && _p.start_date) || '',
                  end_date: (_p && _p.end_date) || ''
                }
              }, '*');
            }
          } catch (_) {}
        })();
      }
    }
  }
  // Kích hoạt vẽ vector icon Lucide
  setTimeout(() => {
    if (typeof lucide !== "undefined") lucide.createIcons();
  }, 100);
}
async function updateProjBanner(tab){
  const p=(await DataService.listProjects()).find(x=>x.id===CUR.project);
  const breadcrumb=$("breadcrumb"); 
  if(breadcrumb) {
    if(tab==="dieuhanh") {
       breadcrumb.innerHTML = 'Trang chủ';
    } else if (tab==="hethong") {
       breadcrumb.innerHTML = 'Trang chủ / <b>Hệ thống</b>';
    } else {
       // Find the active submenu to show in breadcrumb
       let activeSub = "";
       document.querySelectorAll(".sub-btn").forEach(b => {
         if(b.dataset.tab === tab) activeSub = b.textContent.replace('↳ ', '');
       });
       breadcrumb.innerHTML = p ? ('Trang chủ / <b>' + esc(p.name) + '</b>' + (activeSub ? ' / ' + activeSub : '')) : 'Trang chủ';
    }
  }
}
function toggleNav(){ const s=$("sidebar"), sc=$("sidebar-scrim"); if(s) s.classList.toggle("open"); if(sc) sc.classList.toggle("show", s&&s.classList.contains("open")); }
function closeNav(){ const s=$("sidebar"), sc=$("sidebar-scrim"); if(s) s.classList.remove("open"); if(sc) sc.classList.remove("show"); }
window.addEventListener("load", async ()=>{
  // Chuẩn thông báo: thành công = toast; cảnh báo/lỗi = modal có hướng xử lý.
  if (typeof Swal !== "undefined") {
    window.hpNotify = function(message, forcedType) {
      const text=String(message==null?"":message);
      const inferred=/^(✅|Đã |Thành công)/i.test(text)?"success"
        : /^(❌|Lỗi|Không thể|Thất bại)/i.test(text)?"error"
        : /^(⚠|Cảnh báo|Chưa |Cần |Vui lòng)/i.test(text)?"warning":"info";
      const type=forcedType||inferred;
      if(type==="success"){
        return Swal.fire({toast:true,position:"top-end",icon:"success",title:text,showConfirmButton:false,timer:1800,timerProgressBar:true});
      }
      return Swal.fire({
        text,
        icon:type,
        confirmButtonColor:'var(--primary)',
        confirmButtonText:type==="error"?'Đã hiểu':'Đồng ý'
      });
    };
    window.alert = function(message) { return window.hpNotify(message); };
  }
  await db();
  let users = await DataService.listUsers();
  let projects = await DataService.listProjects();
  const seededOnce = await metaGet("projects_seeded_once", false);
  if (projects && projects.length > 0) {
    if (!seededOnce) await metaSet("projects_seeded_once", true); // máy đã có dữ liệu -> đánh dấu đã qua seed
  } else if (!seededOnce) {
    projects = SEED.projects;                    // chỉ seed lần đầu tiên trên máy mới tinh
    await metaSet("projects", projects);
    await metaSet("projects_seeded_once", true);
  }
  
  $("cur-user").innerHTML=users.map(u=>'<option value="'+u.id+'">'+esc(u.full_name)+'</option>').join("");
  $("cur-project").innerHTML=projects.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join("");
  CUR.user=await metaGet("cur_user", users[0]?.id || ""); CUR.project=await metaGet("cur_project", projects[0]?.id || "");
  $("cur-user").value=CUR.user; $("cur-project").value=CUR.project;
  $("cur-user").onchange=e=>{ CUR.user=e.target.value; metaSet("cur_user",CUR.user); renderMySubs(); };
  $("cur-project").onchange=async e=>{ CUR.project=e.target.value; metaSet("cur_project",CUR.project); const curNorm=(CUR.project||'').trim().toLowerCase(); const _p0=(projects||[]).find(x=>x.id===CUR.project||(x.name&&x.name.trim().toLowerCase()===curNorm)); try{ if(typeof Swal!=='undefined') Swal.fire({toast:true, position:'top', icon:'info', title:'Đang chuyển sang: '+((_p0&&_p0.name)||CUR.project||'…'), showConfirmButton:false, timer:900, didOpen:(t)=>{ const b=Swal.getContainer(); } }); }catch(_){} document.body.style.cursor='progress'; await SyncEngine.pull(); renderDashboard(); renderMySubs(); renderContractors(); renderTiendo(); renderCdt(); renderTeam(); updateProjBanner(document.querySelector(".nav-btn.active, .sub-btn.active")?.dataset.tab); syncKBToIframe(); const _p=(projects||[]).find(x=>x.id===CUR.project||(x.name&&x.name.trim().toLowerCase()===curNorm)); const _bcn=document.querySelector('iframe'); if(_bcn&&_bcn.contentWindow) _bcn.contentWindow.postMessage({type:'PROJECT_CHANGED', projectId: CUR.project, projName:(_p&&_p.name)||CUR.project||'', projInfo:{name:(_p&&_p.name)||CUR.project||'', address:(_p&&_p.address)||'', scale:(_p&&_p.scale)||'', start_date:(_p&&_p.start_date)||'', end_date:(_p&&_p.end_date)||''}},'*'); document.body.style.cursor=''; try{ if(typeof Swal!=='undefined') Swal.fire({toast:true, position:'top', icon:'success', title:'Đang xem: '+((_p&&_p.name)||CUR.project||''), showConfirmButton:false, timer:1200}); }catch(_){} };
  document.querySelectorAll(".nav-btn[data-tab], .sub-tab-btn[data-tab]").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  const dz=$("td-drop");
  if(dz){
    dz.addEventListener("dragover", e=>{ e.preventDefault(); dz.classList.add("drag"); });
    dz.addEventListener("dragleave", ()=>dz.classList.remove("drag"));
    dz.addEventListener("drop", e=>{ e.preventDefault(); dz.classList.remove("drag"); if(e.dataTransfer.files&&e.dataTransfer.files[0]) importProgressFile(e.dataTransfer.files[0]); });
  }
  $("r-date").value=todayISO();
  // Kéo dữ liệu LUÔN chạy (SyncEngine.pull tự lo Firebase + Supabase-nếu-bật + làm mới form) —
  // KHÔNG gate theo Supabase, để tắt Supabase thì Firebase vẫn kéo về lúc khởi động.
  SyncEngine.pull().then(()=>{ SyncEngine.setPill(); if (typeof adoptSharedGeminiKey==='function') adoptSharedGeminiKey(); }).catch(()=>{});
  SyncEngine.setPill();
  if(typeof renderProjectList === "function") renderProjectList();
  // Cổng đăng nhập (RBAC) — bật/tắt bằng LOGIN_ENABLED
  await ensureUsers();
  if(typeof loadCustomRoles==="function") await loadCustomRoles();
  await syncDeptUsers();
  const allUsers=await DataService.listUsers();
  if(LOGIN_ENABLED){
    const sid=await metaGet("session_user", null);
    const su=sid && allUsers.find(u=>u.id===sid);
    if(su){
      setTimeout(()=>startSession(su), 50);
      // Vào app bằng PHIÊN LƯU SẴN (không gõ mật khẩu) => firebaseAuthSync KHÔNG chạy nên có thể
      // KHÔNG có phiên Firebase Auth (nhất là sau khi mật khẩu Firebase bị đổi -> phiên cũ hết hiệu
      // lực). Khi đó Firestore CHẶN MỌI truy cập: badge "Offline (local)" + tab Báo cáo ngày báo
      // "Missing or insufficient permissions". Kiểm sau 4s (đủ để Firebase khôi phục phiên) rồi nhắc.
      setTimeout(checkFirebaseSessionAfterAutoLogin, 4000);
    }
    else { initLoginFlow(); $("login-screen").classList.remove("hide"); }
  } else {
    const admin=allUsers.find(u=>u.role==="admin")||allUsers[0];
    $("login-screen").classList.add("hide");
    $("login-screen").classList.add("hide");
    setTimeout(()=>startSession(admin), 50);
  }
  // Đẩy snapshot dữ liệu cho bot Telegram khi mở app (sau khi đăng nhập + đồng bộ xong)
  setTimeout(()=>{ if(typeof pushAiSnapshot==="function") pushAiSnapshot(); }, 2500);
});

window.exitProjectMode = function() {
  switchTab(can("dieuhanh") ? "dieuhanh" : "dashboard");
};

window.addEventListener("resize", () => {
  const mobile = applyMobileReportMode();
  if(!CUR_USER) return;
  if(mobile){
    if(can("baocaongay-new")) switchTab("baocaongay-new");
    else showMobileDesktopNotice();
  }
});
