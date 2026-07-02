// ---------- HỆ THỐNG: Audit + Backup/Restore ----------

async function audit(action, detail){

  const log=await metaGet("audit_log", []);

  const users=await DataService.listUsers();

  const uname=(users.find(u=>u.id===CUR.user)||{}).full_name || CUR.user;

  log.push({ at:new Date().toISOString(), user:uname, action, detail:detail||"" });

  if(log.length>500) log.splice(0, log.length-500);

  await metaSet("audit_log", log);

}

async function renderAuditList(){

  const log=(await metaGet("audit_log", [])).slice(-50).reverse();

  const w=$("audit-list"); if(!w) return;

  w.innerHTML = log.length ? log.map(e=>'<div class="it"><span><b>'+new Date(e.at).toLocaleString("vi-VN")+'</b> · '+esc(e.user)+' · '+esc(e.action)+(e.detail?' — '+esc(e.detail):'')+'</span></div>').join("") : '<p class="muted">Chưa có thao tác nào.</p>';

}

async function clearAudit(){ if(confirm("Xóa nhật ký thao tác?")){ await metaSet("audit_log", []); renderAuditList(); } }

async function renderHethong(){ renderAuditList(); renderKB(); const n=(await idbAll("submissions")).length; const b=$("backup-info"); if(b) b.textContent="Hiện có "+n+" nhật ký trên thiết bị này."; }



function dataURLtoBlob(d){ return fetch(d).then(r=>r.blob()); }

async function exportBackup(){

  const subs=await idbAll("submissions");

  const atts=await idbAll("attachments");

  const attData=[];

  for(const a of atts){ if(a.blob) attData.push({ id:a.id, b64:await blobToDataURL(a.blob) }); }

  const allMeta=await idbAll("meta"); const meta={}; allMeta.forEach(m=>meta[m.key]=m.value);

  const backup={ _app:"HPCONS_BAOCAO", _version:1, _at:new Date().toISOString(),

    submissions:subs, attachments:attData, meta };

  downloadBlob(JSON.stringify(backup), "HPCONS_backup_"+todayISO()+".json", "application/json");

  await metaSet("last_backup_at", new Date().toISOString());

  await audit("Sao lưu dữ liệu", subs.length+" nhật ký, "+attData.length+" ảnh");

}

async function maybeRemindBackup(){

  const last=await metaGet("last_backup_at", null);

  const days = last ? Math.floor((Date.now()-new Date(last).getTime())/86400000) : 999;

  // if(days>=7){ setTimeout(()=>alert("🔔 Nhắc sao lưu: "+(last?("đã "+days+" ngày chưa sao lưu."):"chưa từng sao lưu.")+"\nVào Hệ thống → Sao lưu (JSON) để phòng mất dữ liệu."), 800); }

}

function importBackup(ev){

  const file=ev.target.files[0]; if(!file) return;

  if(!confirm("Khôi phục sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại trên thiết bị này. Tiếp tục?")){ ev.target.value=""; return; }

  const reader=new FileReader();

  reader.onload=async ()=>{

    try{

      const b=JSON.parse(reader.result);

      if(b._app!=="HPCONS_BAOCAO"){ alert("File không đúng định dạng sao lưu HP CONS."); return; }

      await idbClear("submissions"); await idbClear("attachments"); await idbClear("meta");

      for(const s of (b.submissions||[])) await idbPut("submissions", s);

      for(const a of (b.attachments||[])){ try{ const blob=await dataURLtoBlob(a.b64); await idbPut("attachments", {id:a.id, blob}); }catch(_){} }

      for(const k in (b.meta||{})) await metaSet(k, b.meta[k]);

      ev.target.value="";

      alert("Đã khôi phục dữ liệu. Trang sẽ tải lại.");

      location.reload();

    }catch(e){ alert("Lỗi đọc file sao lưu: "+e); }

  };

  reader.readAsText(file,"UTF-8");

}



// ---------- NGƯỜI DÙNG + RBAC ----------

const ROLES={

  admin:        {label:"Quản trị (Admin)",           tabs:"*"},

  director:     {label:"Giám đốc (Director)",        tabs:["duan","ai-center","dieuhanh","thicong","dashboard","baocao","tiendo","thanhtoan","thanhvien","qaqc","hse","shopdrawing","baotri","lpb","danhmuc"]},

  pm:           {label:"Quản lý dự án (PM)",         tabs:["duan","ai-center","dieuhanh","thicong","dashboard","baocao","tiendo","thanhtoan","thanhvien","qaqc","hse","shopdrawing","baotri","lpb","danhmuc"]},

  site_manager: {label:"Chỉ huy trưởng (SM)",        tabs:["duan","ai-center","thicong","dashboard","nhatky","baocaongay-new","baocao","tiendo","thanhtoan","thanhvien","lpb","danhmuc"]},

  engineer:     {label:"Kỹ sư",             tabs:["duan","ai-center","thicong","dashboard","nhatky","baocaongay-new","baocao","tiendo","thanhtoan","lpb","danhmuc"]},

  storekeeper:  {label:"Thủ kho",                    tabs:["duan","ai-center","thicong","dashboard","baocao"]},
  surveyor:     {label:"Trắc đạc",                   tabs:["duan","ai-center","thicong","dashboard","baocao"]},
  accountant:   {label:"Kế toán công trình",         tabs:["duan","ai-center","thicong","dashboard","thanhtoan"]},

  viewer:       {label:"Người xem",                  tabs:["duan","ai-center","thicong","baocao"]},

  qc_manager:   {label:"Quản lý bộ phận QA-QC",      tabs:["qaqc"]},

  qc_staff:     {label:"Nhân viên QA-QC",            tabs:["qaqc"]},

  hse_manager:  {label:"Quản lý bộ phận HSE",        tabs:["hse"]},

  hse_staff:    {label:"Cán bộ HSE",                 tabs:["hse"]},

  sd_manager:   {label:"Quản lý bộ phận Shopdrawing",tabs:["shopdrawing"]},

  sd_staff:     {label:"Nhân viên Shopdrawing",          tabs:["shopdrawing"]},

  mt_manager:   {label:"Quản lý bộ phận Bảo trì",    tabs:["baotri"]},

  mt_staff:     {label:"Công nhân",              tabs:["baotri"]}

};

// Bản gốc vai trò mặc định — để admin có thể "Khôi phục mặc định" sau khi chỉnh quyền
const DEFAULT_ROLES_SNAPSHOT = JSON.parse(JSON.stringify(ROLES));

const ALL_TABS=["dieuhanh","duan","ai-center","thicong","dashboard","nhatky","baocaongay-new","baocao","tiendo","thanhtoan","thanhvien","danhmuc","hethong","qaqc","hse","shopdrawing","baotri","lpb"];

// Nhãn tiếng Việt cho từng quyền (dùng khi admin tạo vai trò mới)
const TAB_LABELS={
  dieuhanh:"Trung tâm điều hành", dashboard:"Tổng quan dự án", "ai-center":"AI Center",
  thicong:"Bộ phận Thi công", "baocaongay-new":"Báo cáo ngày",
  baocao:"Tổng hợp báo cáo", tiendo:"Tiến độ", thanhtoan:"Thanh toán",
  thanhvien:"Thành viên", lpb:"Liên phòng ban", qaqc:"QA-QC", hse:"HSE",
  shopdrawing:"Shopdrawing", baotri:"Bảo trì", danhmuc:"Nhà thầu",
  hethong:"Hệ thống"
};

// Các vai trò gốc (không cho xóa). Vai admin/director/pm... cố định trong code.
const DEFAULT_ROLE_KEYS=["admin","director","pm","site_manager","engineer","storekeeper","surveyor","accountant","viewer","qc_manager","qc_staff","hse_manager","hse_staff","sd_manager","sd_staff","mt_manager","mt_staff"];

// Nạp vai trò tùy chỉnh do admin tạo, gộp vào ROLES để can()/roleTabs() nhận diện
async function loadCustomRoles(){
  const cr=await metaGet("custom_roles", {});
  Object.keys(cr).forEach(k=>{ if(cr[k] && cr[k].tabs) ROLES[k]=cr[k]; });
  return cr;
}

function addableRoles(role){

  if(role==="admin") return ["admin","director","pm","site_manager","engineer","viewer"];

  if(role==="director"||role==="pm") return ["site_manager"];

  if(role==="site_manager") return ["engineer"];

  return [];

}

function legacyHashPw(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return "h"+h.toString(16); }

function hashPw(s) {
  function rotateRight(n, x) { return (x >>> n) | (x << (32 - n)); }
  
  var k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  
  var words = [];
  var ascii = s;
  for (var i = 0; i < ascii.length * 8; i += 8) {
    words[i >> 5] |= (ascii.charCodeAt(i / 8) & 0xff) << (24 - (i % 32));
  }
  var len = ascii.length * 8;
  words[len >> 5] |= 0x80 << (24 - (len % 32));
  words[(((len + 64) >> 9) << 4) + 15] = len;

  for (var i = 0; i < words.length; i += 16) {
    var w = words.slice(i, i + 16);
    for (var j = 16; j < 64; j++) {
      var s0 = rotateRight(7, w[j - 15]) ^ rotateRight(18, w[j - 15]) ^ (w[j - 15] >>> 3);
      var s1 = rotateRight(17, w[j - 2]) ^ rotateRight(19, w[j - 2]) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }
    
    var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], _h = h[7];
    
    for (var j = 0; j < 64; j++) {
      var S1 = rotateRight(6, e) ^ rotateRight(11, e) ^ rotateRight(25, e);
      var ch = (e & f) ^ (~e & g);
      var temp1 = (_h + S1 + ch + k[j] + w[j]) | 0;
      var S0 = rotateRight(2, a) ^ rotateRight(13, a) ^ rotateRight(22, a);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var temp2 = (S0 + maj) | 0;
      
      _h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + _h) | 0;
  }
  
  var hash = "";
  for (var i = 0; i < 8; i++) {
    var val = h[i];
    if (val < 0) val += 0x100000000;
    var hex = val.toString(16);
    while (hex.length < 8) hex = "0" + hex;
    hash += hex;
  }
  return "sha256_" + hash;
}

function roleTabs(role){ const r=ROLES[role]||ROLES.viewer; return r.tabs==="*"?ALL_TABS.slice():r.tabs.slice(); }

function can(tab){ return CUR_USER ? roleTabs(CUR_USER.role).indexOf(tab)>=0 : false; }

let CUR_USER=null;

async function ensureUsers(){

  const SEED_V=2; // tăng số này khi muốn nạp lại bộ tài khoản mẫu

  let users=await metaGet("users", null);

  const v=await metaGet("users_seed_v", 0);

  if(!users || !users.length || !users[0].role || v<SEED_V){

    // 6 tài khoản test theo 6 vai trò — mật khẩu chung: 123456

    users=[

      {id:"u_admin", full_name:"Quản trị (Admin)",            username:"admin",    role:"admin",        pw:hashPw("123456")},

      {id:"u_dir",   full_name:"Giám đốc (Director)",         username:"director", role:"director",     pw:hashPw("123456")},

      {id:"u_pm",    full_name:"Quản lý dự án (PM)",          username:"pm",       role:"pm",           pw:hashPw("123456")},

      {id:"u_sm",    full_name:"Chỉ huy trưởng (Site Manager)",username:"sm",      role:"site_manager", pw:hashPw("123456")},

      {id:"u_eng",   full_name:"Kỹ sư (Engineer)",            username:"eng",      role:"engineer",     pw:hashPw("123456")},

      {id:"u_view",  full_name:"Người xem (Viewer)",          username:"viewer",   role:"viewer",       pw:hashPw("123456")},

    ];

    await metaSet("users", users);

    await metaSet("users_seed_v", SEED_V);

    // gán Site Manager + Engineer vào công trình p1 để có dữ liệu kiểm tra

    await metaSet("members:p1", ["u_sm","u_eng","u_view"]);

  }

  return users;

}

const DEPARTMENT_ROLES = {

  "Quản lý": ["admin", "director"],

  "Bộ phận Thi công": ["pm", "site_manager", "engineer", "surveyor", "storekeeper", "accountant"],

  "Bộ phận QA-QC": ["qc_manager", "qc_staff"],

  "Bộ phận HSE": ["hse_manager", "hse_staff"],

  "Bộ phận Shopdrawing": ["sd_manager", "sd_staff"],

  "Bộ phận Bảo trì": ["mt_manager", "mt_staff"],

  "Phòng ban khác": ["viewer"]

};

// Danh sách bộ phận để admin chọn khi tạo vai trò mới (tự khớp DEPARTMENT_ROLES)
const DEPT_LIST = Object.keys(DEPARTMENT_ROLES);



let LOGIN_USERS = [];

async function initLoginFlow(){

  LOGIN_USERS = await ensureUsers();

  renderLoginDepts();

}



function renderLoginDepts(){

  const sel = $("login-dept");

  if(!sel) return;

  // Luôn luôn hiển thị tất cả các bộ phận

  const depts = Object.keys(DEPARTMENT_ROLES);

  sel.innerHTML = depts.map(d => `<option value="${d}">${d}</option>`).join("");

  renderLoginRoles();

}



function renderLoginRoles(){

  const d = $("login-dept").value;

  const sel = $("login-role");

  if(!sel) return;

  // Luôn luôn hiển thị tất cả chức vụ của bộ phận đó

  const allowedRoles = (DEPARTMENT_ROLES[d] || []).slice();

  // Vai trò tùy chỉnh hiển thị theo đúng bộ phận admin đã chọn khi tạo
  Object.keys(ROLES).forEach(k=>{
    if(ROLES[k] && ROLES[k].custom && ROLES[k].dept === d && !allowedRoles.includes(k)) allowedRoles.push(k);
  });

  

  sel.innerHTML = allowedRoles.map(r => {

    const label = (ROLES[r] || {}).label || r;

    return `<option value="${r}">${label}</option>`;

  }).join("");

  

  renderLoginUsers();

}



window._currentLoginUsers = [];

function renderLoginUsers(){

  const r = $("login-role").value;

  const sel = $("login-user");

  if(!sel) return;

  const users = LOGIN_USERS.filter(u => u.role === r);
  window._currentLoginUsers = users;

  sel.innerHTML = users.map(u => `<option value="${u.id}">${u.full_name}</option>`).join("");

  const searchInput = $("login-user-search");
  if(users.length > 0) {
    sel.value = users[0].id;
    if(searchInput) searchInput.value = users[0].full_name;
  } else {
    sel.value = "";
    if(searchInput) searchInput.value = "";
  }

  renderLoginUserDropdownList(users);

}

function renderLoginUserDropdownList(list) {
  const dropdown = $("login-user-dropdown");
  if(!dropdown) return;

  if(!list.length) {
    dropdown.innerHTML = `<div style="padding:10px 12px; color:var(--muted); text-align:center; font-size:13px;">Không tìm thấy nhân sự</div>`;
    return;
  }

  dropdown.innerHTML = list.map(u => {
    return `<div onmousedown="selectLoginUser('${u.id}', '${esc(u.full_name)}'); event.preventDefault();" style="padding:10px 14px; border-bottom:1px solid var(--border); cursor:pointer; font-size:13px; display:flex; justify-content:space-between; align-items:center;" onmouseover="this.style.background='var(--surface-2, #fafcff)'" onmouseout="this.style.background='transparent'">
      <div style="font-weight:600; color:var(--ink);">${esc(u.full_name)}</div>
      <div style="font-size:11px; color:var(--muted);">@${esc(u.username || '')}</div>
    </div>`;
  }).join('');
}

function showLoginUserDropdown() {
  const dropdown = $("login-user-dropdown");
  if(dropdown) dropdown.classList.remove("hide");
}

function filterLoginUsers() {
  const searchInput = $("login-user-search");
  if(!searchInput) return;

  let keyword = searchInput.value.toLowerCase().trim();
  if(keyword.startsWith("@")) {
    keyword = keyword.substring(1);
  }

  const filtered = window._currentLoginUsers.filter(u => {
    return (u.full_name || "").toLowerCase().includes(keyword) || 
           (u.username || "").toLowerCase().includes(keyword);
  });

  renderLoginUserDropdownList(filtered);
  showLoginUserDropdown();
}

function selectLoginUser(id, name) {
  const searchInput = $("login-user-search");
  const sel = $("login-user");
  if(searchInput) searchInput.value = name;
  if(sel) sel.value = id;

  const dropdown = $("login-user-dropdown");
  if(dropdown) dropdown.classList.add("hide");
}

// Hide dropdown when clicking outside
document.addEventListener("click", (e) => {
  const container = $("login-user-search");
  const dropdown = $("login-user-dropdown");
  if(container && dropdown && !container.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("hide");
  }
});



async function doLogin(){

  const uid=$("login-user").value, pw=$("login-pw").value;

  const users=await ensureUsers();

  const found=users.find(x=>x.id===uid);

  if(!found){ $("login-msg").textContent="Vui lòng chọn nhân sự."; return; }

  const wrap=$("login-pw2-wrap");

  if(!found.pw){ // lần đầu đăng nhập: đặt mật khẩu mới + xác nhận

    if(wrap.classList.contains("hide")){ wrap.classList.remove("hide"); $("login-msg").textContent="Lần đầu đăng nhập: hãy đặt mật khẩu mới và xác nhận."; return; }

    const pw2=$("login-pw2").value;

    if(pw.length<4){ $("login-msg").textContent="Mật khẩu tối thiểu 4 ký tự."; return; }

    if(pw!==pw2){ $("login-msg").textContent="Xác nhận mật khẩu không khớp."; return; }

    found.pw=hashPw(pw); await metaSet("users", users);

  } else { // đăng nhập thường

    const hashedInput = hashPw(pw);
    const legacyHashedInput = legacyHashPw(pw);

    if(found.pw!==hashedInput && found.pw!==legacyHashedInput){
      $("login-msg").textContent="Sai mật khẩu.";
      audit("Đăng nhập thất bại", `Tài khoản: ${found.full_name} (@${found.username || ''}) — Nhập sai mật khẩu`);
      return;
    }
    
    // Tự động nâng cấp thuật toán băm lên SHA-256 nếu đang dùng mã FNV-1a cũ
    if (found.pw === legacyHashedInput) {
      found.pw = hashedInput;
      await metaSet("users", users);
      console.log(`Đã nâng cấp mật khẩu của ${found.full_name} lên SHA-256.`);
    }

  }

  wrap.classList.add("hide"); $("login-pw2").value="";

  await metaSet("session_user", found.id);

  await startSession(found);

}

async function forgotPassword(){
  const uid = $("login-user").value;
  if(!uid) {
    $("login-msg").textContent = "Vui lòng chọn bộ phận, chức vụ và tên nhân sự cần khôi phục mật khẩu.";
    return;
  }
  const users = await ensureUsers();
  const found = users.find(x=>x.id===uid);
  if(!found) {
    $("login-msg").textContent = "Không tìm thấy thông tin nhân sự.";
    return;
  }
  
  const usernameInput = prompt(`Khai báo Tên đăng nhập (username) của nhân sự [${found.full_name}] để khôi phục mật khẩu:`);
  if (usernameInput === null) return;
  
  if (usernameInput.trim().toLowerCase() !== (found.username || "").toLowerCase()) {
    alert("Tên đăng nhập không chính xác! Vui lòng liên hệ Admin để khôi phục.");
    return;
  }
  
  found.pw = "";
  await metaSet("users", users);
  
  $("login-pw").value = "";
  $("login-pw2").value = "";
  const wrap = $("login-pw2-wrap");
  wrap.classList.remove("hide");
  $("login-msg").textContent = "Khai báo thành công! Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.";
  alert("Đặt lại mật khẩu thành công. Vui lòng nhập mật khẩu mới tại form đăng nhập.");
}

async function startSession(user){

  CUR_USER=user; CUR.user=user.id;
  if (typeof SyncEngine !== 'undefined' && SyncEngine.setPill) SyncEngine.setPill();

  $("login-pw").value=""; $("login-msg").textContent="";

  $("login-screen").classList.add("hide");

  const chip=$("user-chip");

  if($("user-ava")) $("user-ava").textContent=(user.full_name||"?").trim().charAt(0).toUpperCase();

  if($("user-name")) $("user-name").textContent=user.full_name;

  if($("user-role")) $("user-role").textContent=(ROLES[user.role]||{}).label||user.role;

  chip.style.display=LOGIN_ENABLED?"flex":"none";

  if($("side-logout")) $("side-logout").style.display=LOGIN_ENABLED?"flex":"none";

  await populateProjects();

  const tabs=roleTabs(user.role);
  const lastTab = localStorage.getItem(`last_tab:${user.id}`);
  const lastProj = localStorage.getItem(`last_project:${user.id}`);

  // Khôi phục dự án cũ nếu người dùng vẫn có quyền truy cập
  if (lastProj) {
    const list = await accessibleProjects();
    if (list.some(p => p.id === lastProj)) {
      CUR.project = lastProj;
      const psSelect = $("cur-project");
      if (psSelect) psSelect.value = lastProj;
      await SyncEngine.pull();
    }
  }

  // Khôi phục tab cũ nếu được phân quyền
  if (lastTab && tabs.includes(lastTab)) {
    switchTab(lastTab);
  } else {
    if (tabs.indexOf("dieuhanh")>=0) {
      switchTab("dieuhanh");
    } else {
      const list=await accessibleProjects();
      if(!list.length){
        alert("Tài khoản của bạn chưa được cấp dự án nào. Vui lòng liên hệ quản trị/PM.");
      }
      switchTab(tabs.includes("dashboard") ? "dashboard" : (tabs[0]||"baocao"));
    }
  }

  // Lắng nghe sự kiện thay đổi dự án để lưu lại
  const curProjSelect = $("cur-project");
  if (curProjSelect) {
    curProjSelect.addEventListener("change", (e) => {
      if (CUR_USER) {
        localStorage.setItem(`last_project:${CUR_USER.id}`, e.target.value);
      }
    });
  }

  audit("Đăng nhập","");

  if(can("hethong")) maybeRemindBackup();

  renderDeptPersonnel("sd-users-list", "shopdrawing", "Bộ Phận Shopdrawing");

  renderDeptPersonnel("qaqc-users-list", "qaqc", "Bộ Phận QA-QC");

  renderDeptPersonnel("hse-users-list", "hse", "Bộ Phận HSE");

  renderDeptPersonnel("mt-users-list", "baotri", "Bộ Phận Bảo Trì");

  renderDeptPersonnel("tc-users-list", "thicong", "Bộ Phận Thi Công");

  if (typeof syncKBToIframe === "function") {
    syncKBToIframe();
  }
}



async function renderDeptPersonnel(elementId, deptKey, deptName) {

  const deptsData = await metaGet("departments", {});

  const members = deptsData[deptKey] || [];

  const el = $(elementId);

  if(!el) return;



  const d = DEPARTMENTS.find(x => x.key === deptKey);

  const editable = !CUR_USER || ["admin","director","pm","site_manager"].includes(CUR_USER.role);



  let html = '';

  if(members.length === 0) {

    html += `<p class="muted" style="text-align:center;padding:40px 0">Chưa có nhân sự nào được phân công tại ${deptName}.</p>`;

  } else {
    // Phân nhóm nhân sự theo chức vụ để hiển thị dạng Grid
    const grouped = {};
    const getPosRank = (pos) => {
        const p = (pos || "").toLowerCase();
        if(p.includes("cht") || p.includes("chỉ huy trưởng") || p.includes("quản lý") || p.includes("p.tgđ")) return 1;
        if(p.includes("kỹ sư")) return 2;
        if(p.includes("thủ kho")) return 3;
        if(p.includes("trắc đạc")) return 4;
        return 5;
    };
    
    let sortedMembers = members.map((m, i) => ({ ...m, originalIndex: i }))
                               .sort((a, b) => getPosRank(a.position) - getPosRank(b.position));

    sortedMembers.forEach((m) => {
      const pos = m.position || "Khác";
      if (!grouped[pos]) grouped[pos] = [];
      grouped[pos].push(m);
    });

    html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">';

    Object.keys(grouped).forEach(pos => {
      const list = grouped[pos];
      html += `
        <div class="card" style="padding: 16px; margin-bottom: 0; display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.9); border-radius: var(--r-md); box-shadow: var(--shadow-sm);">
          <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span>💼 ${esc(pos)}</span>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: rgba(30, 58, 138, 0.1); color: var(--primary); font-weight: 700;">${list.length} người</span>
          </h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
      `;

      list.forEach(m => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: #F8FAFC; border-radius: 6px; font-size: 13px; border: 1px solid rgba(226, 232, 240, 0.5);">
            <span style="font-weight: 600; color: var(--ink);">${esc(m.name)}</span>
        `;
        if (editable) {
          html += `
            <button class="btn btn-dan btn-sm" onclick="deptTabDel('${deptKey}', ${m.originalIndex}, '${elementId}', '${deptName}')" style="padding: 2px 8px; font-size: 11px; border-radius: 4px;">
              Xóa
            </button>
          `;
        }
        html += `</div>`;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += '</div>';
  }



  if (editable && d) {

    html += `

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">

        <h4 style="margin-top:0;margin-bottom:12px;color:var(--primary-dark)">Thêm nhân sự mới</h4>

        <div class="row" style="align-items:flex-end">

          <div style="flex:1">

            <label>Họ tên</label>

            <input id="add-name-${deptKey}" placeholder="Nhập họ tên...">

          </div>

          <div style="flex:1">

            <label>Chức vụ</label>

            <select id="add-pos-${deptKey}">

              ${d.positions.map(p => `<option value="${p}">${esc(p)}</option>`).join('')}

            </select>

          </div>

          <div style="flex:0">

            <button class="btn btn-pri" onclick="deptTabAdd('${deptKey}', '${elementId}', '${deptName}')">+ Thêm</button>

          </div>

        </div>

      </div>

    `;

  }



  el.innerHTML = html;

}



async function deptTabAdd(key, elementId, deptName){

  const ni=$("add-name-"+key), pi=$("add-pos-"+key);

  if(!ni || !pi) return;

  const name=ni.value.trim(), pos=pi.value;

  if(!name){ alert("Vui lòng nhập họ tên nhân sự!"); return; }

  const data=await metaGet("departments", {}); if(!data[key]) data[key]=[];

  data[key].push({name, position:pos}); await metaSet("departments", data);

  if(typeof syncDeptUsers === "function") await syncDeptUsers();

  audit("Thêm nhân sự bộ phận", name+" — "+pos);

  renderDeptPersonnel(elementId, key, deptName);

}



async function deptTabDel(key, i, elementId, deptName){

  if(!confirm("Xóa nhân sự này khỏi bộ phận?")) return;

  const data=await metaGet("departments", {});

  if(data[key]){

    data[key].splice(i,1);

    await metaSet("departments", data);

    audit("Xóa nhân sự bộ phận","");

  }

  renderDeptPersonnel(elementId, key, deptName);

}



function logout(){

  metaSet("session_user", null); CUR_USER=null; closeAccount();
  if (typeof SyncEngine !== 'undefined' && SyncEngine.setPill) SyncEngine.setPill();

  $("user-chip").style.display="none"; if($("side-logout")) $("side-logout").style.display="none";

  $("login-pw").value=""; $("login-msg").textContent="";

  initLoginFlow();

  $("login-screen").classList.remove("hide");

}

function openAccount(){ if(!CUR_USER) return; $("account-name").textContent="Tài khoản: "+CUR_USER.full_name; $("acc-old").value=""; $("acc-new").value=""; $("acc-msg").textContent=""; $("account-modal").classList.remove("hide"); }

function closeAccount(){ $("account-modal").classList.add("hide"); }

async function changePassword(){

  const old=$("acc-old").value, nw=$("acc-new").value;

  if(!nw || nw.length<4){ $("acc-msg").textContent="Mật khẩu mới tối thiểu 4 ký tự."; return; }

  const users=await ensureUsers(); const me=users.find(x=>x.id===CUR_USER.id);

  if(!me || me.pw!==hashPw(old)){ $("acc-msg").textContent="Mật khẩu hiện tại không đúng."; return; }

  me.pw=hashPw(nw); await metaSet("users", users); audit("Đổi mật khẩu","");

  $("acc-msg").textContent="Đã đổi mật khẩu ✅";

}

let UM_EDIT=null;

async function renderUserMgmt(){

  const users=await ensureUsers(); const w=$("um-list"); if(!w) return;

  const rSel = $("um-role");

  if(rSel && rSel.options.length !== Object.keys(ROLES).length) {

    rSel.innerHTML = Object.keys(ROLES).map(k => `<option value="${k}">${ROLES[k].label}</option>`).join("");

  }

  w.innerHTML=users.map(u=>'<div class="it"><span><b>'+esc(u.full_name)+'</b> — @'+esc(u.username||"")+' — '+(((ROLES[u.role]||{}).label)||u.role)+'</span><span>'

    +'<button class="btn btn-mut btn-sm" onclick="umEdit(\''+u.id+'\')">Sửa</button> '

    +'<button class="btn btn-mut btn-sm" onclick="umResetPw(\''+u.id+'\')">Đặt lại MK</button> '

    +(u.id===CUR.user?'':'<button class="btn btn-dan btn-sm" onclick="umDelete(\''+u.id+'\')">Xóa</button>')

    +'</span></div>').join("");

}

function umReset(){ UM_EDIT=null; $("um-name").value=""; $("um-username").value=""; $("um-role").value="engineer"; $("um-msg").textContent=""; }

async function umEdit(id){ const u=(await ensureUsers()).find(x=>x.id===id); if(!u) return; UM_EDIT=id; $("um-name").value=u.full_name; $("um-username").value=u.username||""; $("um-role").value=u.role; $("um-msg").textContent="Đang sửa: "+u.full_name; }

async function umSave(){

  const name=$("um-name").value.trim(), un=$("um-username").value.trim().toLowerCase(), role=$("um-role").value;

  if(!name||!un){ $("um-msg").textContent="Nhập họ tên và tên đăng nhập."; return; }

  const users=await ensureUsers();

  if(users.some(x=>(x.username||"").toLowerCase()===un && x.id!==UM_EDIT)){ $("um-msg").textContent="Tên đăng nhập đã tồn tại."; return; }

  if(UM_EDIT){ const u=users.find(x=>x.id===UM_EDIT); u.full_name=name; u.username=un; u.role=role; }

  else { users.push({id:uuid(), full_name:name, username:un, role, pw:""}); }

  await metaSet("users", users); audit(UM_EDIT?"Sửa người dùng":"Thêm người dùng", name);

  umReset(); renderUserMgmt();

}

async function umDelete(id){ if(!confirm("Xóa người dùng này?")) return; const users=(await ensureUsers()).filter(x=>x.id!==id); await metaSet("users", users); audit("Xóa người dùng",""); renderUserMgmt(); }

async function umResetPw(id){ const users=await ensureUsers(); const u=users.find(x=>x.id===id); if(!u)return; u.pw=""; await metaSet("users", users); audit("Đặt lại mật khẩu", u.full_name); alert("Đã xóa mật khẩu của "+u.full_name+". Lần đăng nhập tới sẽ tự đặt mật khẩu mới."); }


// ---------- QUẢN LÝ VAI TRÒ (admin tự tạo vai trò mới) ----------
let ROLE_EDIT=null;

function refreshRoleDropdown(){
  const rSel=$("um-role"); if(!rSel) return;
  const cur=rSel.value;
  rSel.innerHTML=Object.keys(ROLES).map(k=>`<option value="${k}">${esc(ROLES[k].label)}</option>`).join("");
  if(ROLES[cur]) rSel.value=cur;
}

function roleReset(){
  ROLE_EDIT=null;
  if($("role-name")) $("role-name").value="";
  if($("role-dept")) $("role-dept").selectedIndex=0;
  document.querySelectorAll("#role-tabs input").forEach(c=>c.checked=false);
  if($("role-msg")) $("role-msg").textContent="";
  if($("role-save-btn")) $("role-save-btn").textContent="Lưu vai trò";
}

function renderRoleMgmt(){
  // Dựng danh sách checkbox quyền (1 lần)
  const box=$("role-tabs");
  if(box && !box.dataset.built){
    box.innerHTML=Object.keys(TAB_LABELS).map(t=>
      `<label style="display:inline-flex;align-items:center;gap:5px;font-size:13px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;cursor:pointer"><input type="checkbox" value="${t}"> ${TAB_LABELS[t]}</label>`
    ).join("");
    box.dataset.built="1";
  }
  // Dựng dropdown chọn bộ phận (1 lần)
  const dsel=$("role-dept");
  if(dsel && !dsel.dataset.built){
    dsel.innerHTML=DEPT_LIST.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("");
    dsel.dataset.built="1";
  }
  // Danh sách vai trò hiện có
  const w=$("role-list"); if(!w) return;
  w.innerHTML=Object.keys(ROLES).map(k=>{
    const r=ROLES[k]; const isCustom=!DEFAULT_ROLE_KEYS.includes(k);
    const tabsTxt = r.tabs==="*" ? "Toàn quyền (mọi mục)" : (r.tabs||[]).map(t=>TAB_LABELS[t]||t).join(", ");
    const deptTxt = r.dept ? (' &nbsp;·&nbsp; <b>Bộ phận:</b> '+esc(r.dept)) : '';
    const isOverridden = !isCustom && k!=="admin" && DEFAULT_ROLES_SNAPSHOT[k]
      && JSON.stringify(DEFAULT_ROLES_SNAPSHOT[k].tabs||[])!==JSON.stringify(r.tabs||[]);
    return '<div class="it" style="align-items:flex-start"><span><b>'+esc(r.label)+'</b> '
      +(isCustom?'<span style="color:var(--primary);font-size:12px">(tùy chỉnh)</span>':'<span class="muted" style="font-size:12px">(mặc định'+(isOverridden?' · đã chỉnh':'')+')</span>')
      +'<br><span class="muted" style="font-size:12px">'+esc(tabsTxt||"— chưa cấp quyền —")+deptTxt+'</span></span><span>'
      +(k!=="admin"?'<button class="btn btn-mut btn-sm" onclick="roleEdit(\''+k+'\')">Sửa</button> ':'')
      +(isCustom?'<button class="btn btn-dan btn-sm" onclick="roleDelete(\''+k+'\')">Xóa</button>':'')
      +(isOverridden?'<button class="btn btn-mut btn-sm" onclick="roleRestore(\''+k+'\')">Khôi phục</button>':'')
      +'</span></div>';
  }).join("");
}

function roleEdit(key){
  const r=ROLES[key]; if(!r) return;
  if(key==="admin"){ alert("Vai Quản trị (Admin) luôn có toàn quyền, không thể chỉnh."); return; }
  ROLE_EDIT=key;
  if($("role-name")) $("role-name").value=r.label;
  if($("role-dept") && r.dept) $("role-dept").value=r.dept;
  document.querySelectorAll("#role-tabs input").forEach(c=>{ c.checked=(r.tabs!=="*" && (r.tabs||[]).includes(c.value)); });
  if($("role-msg")) $("role-msg").textContent="Đang sửa vai trò: "+r.label+(DEFAULT_ROLE_KEYS.includes(key)?" (mặc định)":"");
  if($("role-save-btn")) $("role-save-btn").textContent="Cập nhật vai trò";
}

async function roleSave(){
  const name=($("role-name")?$("role-name").value:"").trim();
  if(!name){ if($("role-msg")) $("role-msg").textContent="Vui lòng nhập tên vai trò."; return; }
  const tabs=[...document.querySelectorAll("#role-tabs input:checked")].map(c=>c.value);
  if(!tabs.length){ if($("role-msg")) $("role-msg").textContent="Chọn ít nhất 1 quyền truy cập."; return; }
  const dept=($("role-dept")?$("role-dept").value:"")||DEPT_LIST[0];
  const cr=await metaGet("custom_roles", {});
  let key=ROLE_EDIT;
  if(!key){
    let base="role_"+name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,28);
    if(!base||base==="role_") base="role";
    key=base; let i=2; while(ROLES[key]){ key=base+"_"+i; i++; }
  }
  if(key==="admin"){ if($("role-msg")) $("role-msg").textContent="Không thể chỉnh vai Quản trị (Admin)."; return; }
  const isDefault=DEFAULT_ROLE_KEYS.includes(key);
  // Giữ lại các quyền ẩn (mục không nằm trong danh sách tick) của vai gốc để không bị mất khi sửa
  const curTabs=(ROLES[key] && Array.isArray(ROLES[key].tabs)) ? ROLES[key].tabs : [];
  const hidden=curTabs.filter(t=>!TAB_LABELS[t]);
  const finalTabs=[...new Set([...tabs, ...hidden])];
  const def = isDefault ? {label:name, tabs:finalTabs, custom:false} : {label:name, tabs:finalTabs, dept, custom:true};
  cr[key]=def; ROLES[key]=def;
  await metaSet("custom_roles", cr); audit(ROLE_EDIT?"Sửa vai trò":"Thêm vai trò", name);
  if($("role-msg")) $("role-msg").textContent=(ROLE_EDIT?"Đã cập nhật":"Đã thêm")+' vai trò "'+name+'" ✅';
  roleReset(); renderRoleMgmt(); refreshRoleDropdown();
}

async function roleDelete(key){
  if(DEFAULT_ROLE_KEYS.includes(key)){ alert("Không thể xóa vai trò mặc định."); return; }
  const cr=await metaGet("custom_roles", {});
  if(!cr[key]){ alert("Vai trò này không tồn tại trong danh sách tùy chỉnh."); return; }
  const users=await ensureUsers();
  const using=users.filter(u=>u.role===key);
  const warn = using.length
    ? ("Có "+using.length+" người dùng đang giữ vai trò này. Xóa sẽ khiến họ tạm về 'Người xem' cho đến khi gán vai khác. Tiếp tục?")
    : "Xóa vai trò này?";
  if(!confirm(warn)) return;
  delete cr[key]; delete ROLES[key];
  await metaSet("custom_roles", cr); audit("Xóa vai trò", (ROLES[key]?ROLES[key].label:key));
  roleReset(); renderRoleMgmt(); refreshRoleDropdown();
}

async function roleRestore(key){
  if(!DEFAULT_ROLE_KEYS.includes(key) || !DEFAULT_ROLES_SNAPSHOT[key]){ alert("Chỉ khôi phục được vai trò mặc định."); return; }
  if(!confirm("Khôi phục vai trò này về quyền mặc định ban đầu?")) return;
  const cr=await metaGet("custom_roles", {});
  delete cr[key];
  ROLES[key]=JSON.parse(JSON.stringify(DEFAULT_ROLES_SNAPSHOT[key]));
  await metaSet("custom_roles", cr); audit("Khôi phục vai trò mặc định", key);
  roleReset(); renderRoleMgmt(); refreshRoleDropdown();
}



// ---------- THÀNH VIÊN DỰ ÁN + PHÂN QUYỀN TRUY CẬP ----------

function membersKey(pid){ return "members:"+pid; }

async function getMembers(pid){ return await metaGet(membersKey(pid), []); }

async function setMembers(pid, arr){ return metaSet(membersKey(pid), arr); }

async function accessibleProjects(){

  const all=await DataService.listProjects();

  if(!CUR_USER || ["admin","director","pm"].indexOf(CUR_USER.role)>=0) return all;

  const myName=(CUR_USER.full_name||"").toLowerCase();

  const out=[];

  for(const p of all){

    const m=await getMembers(p.id);

    const team=await metaGet("team:"+p.id, []);

    const inTeam=team.some(t=>(t.name||"").toLowerCase()===myName);

    if(m.indexOf(CUR_USER.id)>=0 || inTeam) out.push(p);

  }

  return out;

}

async function populateProjects(){

  const ps=$("cur-project"); if(!ps) return;

  const list=await accessibleProjects();

  ps.innerHTML=list.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join("");

  if(list.length){ if(!list.find(p=>p.id===CUR.project)) CUR.project=list[0].id; ps.value=CUR.project; }

  else CUR.project="";

}


// ========== SƠ ĐỒ TỔ CHỨC CÔNG TRÌNH ==========

const ORG_POSITIONS = {
  cht:     { label: "Chỉ huy trưởng", icon: "👑", color: "#1e40af" },
  kysu:    { label: "Kỹ sư",          icon: "📐", color: "#065f46" },
  thukho:  { label: "Thủ kho",        icon: "📦", color: "#9333ea" },
  tracdat: { label: "Trắc đạc",       icon: "📏", color: "#b45309" },
  qaqc:    { label: "QA-QC Phụ trách", icon: "🔍", color: "#0284c7" },
  hse:     { label: "HSE Phụ trách",   icon: "⛑️", color: "#dc2626" },
  shop:    { label: "Shopdrawing",    icon: "📝", color: "#0d9488" },
  other:   { label: "Liên quan khác", icon: "👤", color: "#475569" }
};

function orgKey(pid) { return `org_chart_${pid}`; }

async function getOrgChart(pid) {
  const raw = await metaGet(orgKey(pid), null);
  let chart = {};
  Object.keys(ORG_POSITIONS).forEach(k => chart[k] = []);
  
  if (raw && typeof raw === 'object') {
    Object.keys(ORG_POSITIONS).forEach(k => {
      chart[k] = (raw[k] || []).map(item => {
        // Migration từ string sang object lưu trạng thái
        if (typeof item === 'string') return { id: item, status: 'active' };
        return item;
      });
    });
  }
  return chart;
}

async function setOrgChart(pid, chart) {
  await metaSet(orgKey(pid), chart);
  // Đồng bộ quyền: gộp tất cả userId đang active vào member list
  let allActiveIds = [];
  Object.values(chart).forEach(arr => {
    arr.forEach(item => {
      if (item.status === 'active') allActiveIds.push(item.id);
    });
  });
  allActiveIds = [...new Set(allActiveIds)];
  await setMembers(pid, allActiveIds);
}

// --- Render sơ đồ ---
async function renderTeam() {
  const pid = CUR.project;
  if (!pid) return;

  const chart = await getOrgChart(pid);
  const users = await ensureUsers();
  const editable = !CUR_USER || ["admin","director","pm","site_manager"].includes(CUR_USER.role);

  const hint = document.getElementById("team-hint");
  if (hint) hint.textContent = editable ? "Bạn có quyền quản lý sơ đồ tổ chức." : "Chỉ xem sơ đồ tổ chức.";

  // Ẩn/hiện nút Thêm theo quyền
  Object.keys(ORG_POSITIONS).forEach(pos => {
    const btn = document.getElementById(`org-btn-${pos}`);
    if (btn) btn.style.display = editable ? "inline-block" : "none";
  });

  const formatDate = (iso) => {
    if (!iso) return '---';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN');
  };

  // Render từng vị trí
  Object.keys(ORG_POSITIONS).forEach(pos => {
    const el = document.getElementById(`org-members-${pos}`);
    if (!el) return;
    const items = chart[pos] || [];
    if (!items.length) {
      el.innerHTML = `<div class="org-empty" style="text-align:center;color:var(--muted);font-size:12px;padding:6px 0;">Chưa có nhân sự</div>`;
      return;
    }
    el.innerHTML = items.map((item, index) => {
      const u = users.find(x => x.id === item.id);
      if (!u) return '';
      
      const isFinished = item.status === 'finished';
      const initials = (u.full_name || "?").split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      
      // Nút gọi & Zalo
      let contactHtml = '';
      if (u.phone) {
         contactHtml = `
           <a class="org-chip-btn" href="tel:${u.phone}" title="Gọi điện">📞</a>
           <a class="org-chip-btn" href="https://zalo.me/${u.phone}" target="_blank" title="Zalo">💬</a>
         `;
      }
      
      // Nút thay đổi trạng thái (chỉ dành cho người có quyền)
      let actionBtn = '';
      if (editable && !isFinished) {
         actionBtn = `<button class="org-chip-btn org-chip-remove" onclick="orgFinishUser('${pos}', ${index})" title="Kết thúc (Lưu ý: Không thể hoàn tác)">✕</button>`;
      }

      let timeText = '';
      if (isFinished) {
        timeText = `${formatDate(item.added_at)} → ${formatDate(item.finished_at)}`;
      } else {
        timeText = `Từ: ${formatDate(item.added_at)}`;
      }

      return `
        <div class="org-member-chip ${isFinished ? 'org-chip--finished' : ''}">
          <div class="org-chip-avatar">${initials}</div>
          <div class="org-chip-info">
            <div class="org-chip-name">${esc(u.full_name)}</div>
            <div class="org-chip-sub">${timeText}</div>
          </div>
          <div class="org-chip-actions">
            ${isFinished ? '' : contactHtml}
            ${actionBtn}
          </div>
        </div>`;
    }).join('');
  });
}

// --- Mở modal thêm nhân sự ---
let _orgCurrentPos = null;

// Mapping từ pos sang các role hợp lệ
window.orgPosToRole = {
  cht: ["site_manager"],
  kysu: ["engineer"],
  thukho: ["storekeeper"],
  tracdat: ["surveyor"],
  qaqc: ["qc_manager", "qc_staff"],
  hse: ["hse_manager", "hse_staff"],
  shop: ["sd_manager", "sd_staff"],
  other: []
};

window._orgAvailableUsers = [];

async function openOrgModal(pos) {
  _orgCurrentPos = pos;
  const posInfo = ORG_POSITIONS[pos];
  const title = document.getElementById("org-modal-title");
  if (title) title.textContent = `Thêm ${posInfo.icon} ${posInfo.label}`;

  const pid = CUR.project;
  const chart = await getOrgChart(pid);
  const users = await ensureUsers();

  const activeIds = (chart[pos] || []).filter(x => x.status === 'active').map(x => x.id);
  
  // Lọc user: Không nằm trong activeIds, và có role khớp (nằm trong mảng targetRoles)
  const targetRoles = window.orgPosToRole[pos];
  const available = users.filter(u => {
    if(activeIds.includes(u.id)) return false;
    if(targetRoles && targetRoles.length > 0 && !targetRoles.includes(u.role)) return false;
    return true;
  });

  window._orgAvailableUsers = available;

  const searchInput = document.getElementById("org-am-user-search");
  const hiddenInput = document.getElementById("org-am-user");
  if(searchInput) searchInput.value = "";
  if(hiddenInput) hiddenInput.value = "";
  
  renderOrgUserDropdown(available);

  document.getElementById("org-member-modal").classList.remove("hide");
}

function renderOrgUserDropdown(list) {
  const dropdown = document.getElementById("org-user-dropdown");
  if (!dropdown) return;
  if (!list.length) {
    dropdown.innerHTML = `<div style="padding:12px; color:var(--muted); text-align:center;">Không tìm thấy nhân sự phù hợp hoặc chưa có tài khoản nào được gán chức vụ này</div>`;
    return;
  }
  dropdown.innerHTML = list.map(u => {
    const roleLabel = (ROLES[u.role] || {}).label || u.role;
    
    // Bản đồ dịch tên bộ phận sang tiếng Việt
    const DEPT_NAMES = {
      banql: "Quản lý",
      thicong: "Thi công",
      qaqc: "QA/QC",
      hse: "HSE",
      shopdrawing: "Shopdrawing",
      baotri: "Bảo trì"
    };
    const deptLabel = u.dept ? (DEPT_NAMES[u.dept] || u.dept) : "";
    const badgeHtml = deptLabel ? `<span class="badge" style="margin-left:8px; background:var(--primary-light); color:var(--primary-dark); font-size:10px; padding:2px 6px; border-radius:4px; font-weight:normal">${esc(deptLabel)}</span>` : "";

    // Bắt sự kiện mousedown để tránh input blur làm mất sự kiện click
    return `<div onmousedown="selectOrgUser('${u.id}', '${esc(u.full_name)}'); event.preventDefault();" style="padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='transparent'">
      <div style="font-weight:600; color:var(--text-color); display:flex; align-items:center;">${esc(u.full_name)}${badgeHtml}</div>
      <div style="font-size:12px; color:var(--muted);">${esc(roleLabel)}</div>
    </div>`;
  }).join('');
}

function filterOrgUserDropdown() {
  const keyword = (document.getElementById("org-am-user-search").value || "").toLowerCase().trim();
  if(!keyword) {
    renderOrgUserDropdown(window._orgAvailableUsers);
    return;
  }
  const filtered = window._orgAvailableUsers.filter(u => {
    const roleLabel = (ROLES[u.role] || {}).label || u.role;
    return (u.full_name||"").toLowerCase().includes(keyword) || 
           (u.username||"").toLowerCase().includes(keyword) ||
           roleLabel.toLowerCase().includes(keyword);
  });
  renderOrgUserDropdown(filtered);
}

function selectOrgUser(id, name) {
  const searchInput = document.getElementById("org-am-user-search");
  const hiddenInput = document.getElementById("org-am-user");
  if(searchInput) searchInput.value = name;
  if(hiddenInput) hiddenInput.value = id;
  const dropdown = document.getElementById("org-user-dropdown");
  if(dropdown) dropdown.style.display = 'none';
}
function closeOrgModal() {
  const m = document.getElementById("org-member-modal");
  if (m) m.classList.add("hide");
  _orgCurrentPos = null;
}

async function orgAddUser() {
  if (!_orgCurrentPos) return;
  const sel = document.getElementById("org-am-user");
  const userId = sel ? sel.value : '';
  if (!userId) return alert("Vui lòng chọn nhân sự!");

  const pid = CUR.project;
  const chart = await getOrgChart(pid);
  if (!chart[_orgCurrentPos]) chart[_orgCurrentPos] = [];
  
  // Tránh thêm nếu đang active
  if (!chart[_orgCurrentPos].find(x => x.id === userId && x.status === 'active')) {
    chart[_orgCurrentPos].push({ 
      id: userId, 
      status: 'active', 
      added_at: new Date().toISOString() 
    });
    await setOrgChart(pid, chart);
    const users = await ensureUsers();
    const u = users.find(x => x.id === userId);
    if (u) audit(`Thêm ${ORG_POSITIONS[_orgCurrentPos].label} dự án`, u.full_name);
  } else {
    alert("Nhân sự này đang làm việc ở vị trí này rồi!");
  }

  closeOrgModal();
  renderTeam();
}

async function orgFinishUser(pos, index) {
  const msg = `Xác nhận KẾT THÚC CÔNG TÁC của nhân sự này tại vị trí ${ORG_POSITIONS[pos].label}?\n\nLưu ý:\n- Lịch sử sẽ ghi nhận thời gian kết thúc ngay lúc này.\n- Hành động này KHÔNG THỂ sửa đổi.\n- Nhân sự sẽ bị rút quyền xem dự án (nếu không còn ở vị trí nào khác).`;
  if (!confirm(msg)) return;
  
  const pid = CUR.project;
  const chart = await getOrgChart(pid);
  
  const item = chart[pos][index];
  if (!item || item.status !== 'active') return;

  item.status = 'finished';
  item.finished_at = new Date().toISOString();
  
  await setOrgChart(pid, chart);
  audit(`Kết thúc công tác ${ORG_POSITIONS[pos].label}`, "");
  renderTeam();
}

// getMembers/setMembers/membersKey được định nghĩa tại đầu file hethong.js

// --- HOOK SWITCH TAB TO REMEMBER USER SESSION ---
const originalSwitchTab = window.switchTab;
window.switchTab = function(tab) {
  if (CUR_USER) {
    localStorage.setItem(`last_tab:${CUR_USER.id}`, tab);
    if (CUR.project) {
      localStorage.setItem(`last_project:${CUR_USER.id}`, CUR.project);
    }
  }
  if (typeof originalSwitchTab === "function") {
    originalSwitchTab(tab);
  }
};

// --- TOGGLE PASSWORD VISIBILITY ---
window.togglePasswordVisibility = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const btn = el.nextElementSibling;
  if (el.type === "password") {
    el.type = "text";
    if (btn) btn.textContent = "🙈";
  } else {
    el.type = "password";
    if (btn) btn.textContent = "👁️";
  }
};


