const SUPABASE_CONFIG = { url: "https://guqttgckrqwvtlpfchws.supabase.co", anonKey: "sb_publishable_eg2mhQLEfcJhi_YmjXq9cg_EcDT8gGc", functionUrl: "https://guqttgckrqwvtlpfchws.supabase.co/functions/v1/consolidate" };
// CÔNG TẮC SUPABASE — Sếp chốt 2026-07-15 chuyển TOÀN BỘ sang Firebase, tắt Supabase (hết lỗi 503).
// Đặt false = không dùng Supabase (chỉ Firebase). Bật lại true nếu cần lùi. Giữ nguyên code Supabase bên dưới.
const SUPABASE_ENABLED = false;

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

// ---------- IndexedDB ----------
const DB_NAME = "hpcons_baocao", DB_VER = 1;
let _db = null;
function db(){
  return new Promise((res, rej) => {
    if (_db) return res(_db);
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains("submissions")) d.createObjectStore("submissions", {keyPath:"client_uuid"});
      if (!d.objectStoreNames.contains("attachments")) d.createObjectStore("attachments", {keyPath:"id"});
      if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta", {keyPath:"key"});
    };
    r.onsuccess = e => { _db = e.target.result; res(_db); };
    r.onerror = e => rej(e.target.error);
  });
}
function tx(store, mode){ return db().then(d => d.transaction(store, mode||"readonly").objectStore(store)); }
function idbPut(store, val){ return tx(store,"readwrite").then(s => new Promise((res,rej)=>{const r=s.put(val);r.onsuccess=()=>res(val);r.onerror=()=>rej(r.error);})); }
function idbGet(store, key){ return tx(store).then(s => new Promise((res,rej)=>{const r=s.get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);})); }
function idbAll(store){ return tx(store).then(s => new Promise((res,rej)=>{const r=s.getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);})); }
function idbDel(store, key){ return tx(store,"readwrite").then(s => new Promise((res,rej)=>{const r=s.delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);})); }
function idbClear(store){ return tx(store,"readwrite").then(s => new Promise((res,rej)=>{const r=s.clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error);})); }
async function metaGet(key, def){ const v = await idbGet("meta", key); return v ? v.value : def; }
async function metaSet(key, value){
  await idbPut("meta", {key, value});
  const skip = ["meta_dirty_keys", "cur_user", "cur_project", "meta_dark_mode", "session_user"];
  if (!skip.includes(key)) {
    try {
      const dirtyObj = (await idbGet("meta", "meta_dirty_keys")) || { key: "meta_dirty_keys", value: [] };
      const list = dirtyObj.value || [];
      if (!list.includes(key)) {
        list.push(key);
        await idbPut("meta", { key: "meta_dirty_keys", value: list });
      }
    } catch(e) {}
    SyncEngine.tryPush();
  }
  return {key, value};
}

// ---------- DATA SERVICE ----------
const DataService = {
  async listProjects(){ return await metaGet("projects", []); },
  async listUsers(){ return await metaGet("users", SEED.users); },
  async listContractors(pid){ const all = await metaGet("contractors", SEED.contractors); return all.filter(c => c.project_id === pid); },
  async addContractor(pid, name){
    const all = await metaGet("contractors", SEED.contractors);
    if (all.some(c => c.project_id===pid && c.name.toLowerCase()===name.toLowerCase())) return;
    all.push({project_id:pid, name}); await metaSet('contractors', all);
      // Thêm vào KB nếu chưa có
      let kb = await metaGet('kb_contractors', []);
      if (!kb.find(x => x.name.toLowerCase() === name.toLowerCase())) {
        let newId = 1;
        if (kb.length > 0) {
           const maxId = Math.max(...kb.map(x => parseInt(x.id) || 0));
           newId = maxId + 1;
        }
        kb.push({ id: newId.toString(), name: name, aliases: [] });
        await metaSet('kb_contractors', kb);
        syncKBToIframe();
      }
  },
  async listDailyReports() { return await metaGet('daily_reports', []); },
    async saveDailyReport(data) {
      const all = await metaGet('daily_reports', []);
      data.project_id = CUR.project;
      data.dirty = true;
      data.updated_at = new Date().toISOString();
      const existIdx = all.findIndex(x => x.project_id === data.project_id && x.date === data.date);
      if(existIdx >= 0) all[existIdx] = data;
      else all.push(data);
      await metaSet('daily_reports', all);
      SyncEngine.tryPush();
      return data;
    },
    async listSubmissions(){ return await idbAll("submissions"); },
  async saveSubmission(sub){
    const prev=await idbGet("submissions", sub.client_uuid);
    if(prev){
      const snap={ at:prev.updated_at||prev.created_at, by:prev.submitted_by,
        manpower:prev.manpower, completed:prev.completed, plans:prev.plans, issues:prev.issues, milestones:prev.milestones,
        shift:prev.shift, area:prev.area, weather:prev.weather, note:prev.note };
      sub.versions=(prev.versions||[]).concat([snap]);
      if(sub.versions.length>15) sub.versions=sub.versions.slice(-15);
    }
    sub.dirty = true; sub.updated_at = new Date().toISOString();
    await idbPut("submissions", sub); SyncEngine.tryPush(); return sub;
  },
  async deleteSubmission(u){
    const s = await idbGet("submissions", u);
    if (s && s.photoIds) for (const id of s.photoIds) await idbDel("attachments", id);
    await idbDel("submissions", u);
  },
  async savePhoto(blob){ const id = uuid(); await idbPut("attachments", {id, blob}); return id; },
  async getPhoto(id){ const a = await idbGet("attachments", id); return a ? a.blob : null; },
};

// ---------- SYNC (stub an toàn) ----------
const SyncEngine = {
  online: navigator.onLine,
  configured(){ return SUPABASE_ENABLED && !!SUPABASE_CONFIG.url && !!SUPABASE_CONFIG.anonKey; },
  setPill(){
    const p = document.getElementById("sync-pill"); if(!p) return;
    // Chỉ hiển thị cho tài khoản admin theo yêu cầu
    if (typeof CUR_USER !== 'undefined' && CUR_USER && CUR_USER.role !== 'admin') {
      p.style.display = "none";
      return;
    } else {
      p.style.display = "";
    }
    if (!this.configured()){
      // Supabase tắt → hệ thống chạy Firebase. Hiển thị theo trạng thái Firebase.
      p.style.cursor="default"; p.onclick=null;
      if (typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED && typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
        p.textContent = this.online ? "Đã đồng bộ (Firebase)" : "Chờ mạng…";
        p.className = this.online ? "pill pill-ok" : "pill pill-off";
      } else {
        p.textContent="Offline (local)"; p.className="pill pill-off";
      }
      return;
    }
    p.style.cursor="pointer";
    p.onclick=()=>SupabaseSync.toggleAuth();
    if (!SupabaseSync.user){ p.textContent="Đăng nhập"; p.className="pill pill-off"; return; }
    if (!this.online){ p.textContent="Chờ mạng…"; p.className="pill pill-off"; return; }
    p.textContent = "Đã đồng bộ · " + (SupabaseSync.userName||"online"); p.className="pill pill-ok";
  },
  async tryPush(){
    this.setPill();
    if(!this.online) return;

    if(this.configured()) {
      try {
        await SupabaseSync.pushAllDirty(true);
      } catch (err) {
        // Supabase lỗi (vd 503) KHÔNG được chặn việc đẩy lên Firebase — nếu không, app báo cáo (đọc Firebase) sẽ thiếu dữ liệu.
        console.warn("SupabaseSync pushAllDirty lỗi (bỏ qua, vẫn đẩy Firebase):", err);
      }
    }

    if (typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED) {
      try {
        if (typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
          await FirebaseSync.pushAllDirty(true);
        }
      } catch (err) {
        console.warn("FirebaseSync pushAllDirty lỗi:", err);
      }
    }
    this.setPill();
  },
  async pull(){
    if(!this.online) return;

    const promises = [];
    if(this.configured()) {
      // Bọc catch: Supabase sập (503) KHÔNG được làm chết bước kéo Firebase + làm mới form phía sau.
      promises.push(SupabaseSync.pull(CUR.project).catch(err => {
        console.warn("SupabaseSync pull lỗi (bỏ qua, không chặn Firebase):", err && err.message);
      }));
    }
    if (typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED) {
      if (typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
        promises.push(FirebaseSync.pull(CUR.project).catch(err => {
          console.warn("FirebaseSync pull lỗi:", err);
        }));
      }
    }

    await Promise.all(promises);

    if (typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED) {
      try {
        if (typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
          await FirebaseSync.pullDailyReports();
        }
      } catch (err) {
        console.warn("FirebaseSync pullDailyReports lỗi:", err);
      }
    }

    // Làm mới form Báo cáo ngày sau khi dữ liệu đã về (độc lập Supabase) — iframe hiển thị
    // mẫu mặc định cho tới khi nhận lệnh nạp. Chỉ gửi khi có hồ sơ dự án thật (tránh xóa trắng form).
    try {
      const list = await DataService.listProjects();
      const _p = (list || []).find(x => x.id === CUR.project);
      if (_p) {
        const _f = document.querySelector('iframe');
        if (_f && _f.contentWindow) _f.contentWindow.postMessage({ type:'PROJECT_CHANGED', projectId: CUR.project, projName:_p.name||'', projInfo:{ name:_p.name||'', address:_p.address||'', scale:_p.scale||'', start_date:_p.start_date||'', end_date:_p.end_date||'' } }, '*');
      }
    } catch(_) {}
  },
};
window.addEventListener("online", ()=>{ SyncEngine.online=true; SyncEngine.tryPush(); });
window.addEventListener("offline", ()=>{ SyncEngine.online=false; SyncEngine.setPill(); });

// Hàm đệm: renderMySubs thuộc module nhật ký cũ đã gỡ, nhưng còn 4 nơi gọi
// (đổi/mở dự án, sau pull) — thiếu nó là ReferenceError làm đứt cả chuỗi đổi dự án.
function renderMySubs(){}

// =====================================================================
// SUPABASE SYNC — sẵn sàng cắm key. Để trống SUPABASE_CONFIG => không kích hoạt.
// Cần nạp thư viện supabase-js (đã thêm <script> ở <head>) + có mạng + đăng nhập.
// =====================================================================
const SupabaseSync = {
  client:null, user:null, userName:"", realtimeChannel:null,
  subscribeRealtime(){
    try {
      const c = this.init();
      if (!c) return;
      if (this.realtimeChannel) {
        c.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
      this.realtimeChannel = c.channel('hpcons-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_meta' }, async (payload) => {
          console.log('Realtime update on app_meta:', payload);
          await SyncEngine.pull();
          const activeTab = document.querySelector(".nav-btn.active, .sub-btn.active")?.dataset.tab;
          if (activeTab) switchTab(activeTab);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_consolidated' }, async (payload) => {
          console.log('Realtime update on daily_consolidated:', payload);
          await SyncEngine.pull();
          const activeTab = document.querySelector(".nav-btn.active, .sub-btn.active")?.dataset.tab;
          if (activeTab) switchTab(activeTab);
        })
        .subscribe((status) => {
          console.log("Realtime subscription status:", status);
        });
    } catch(err) {
      console.warn("Lỗi đăng ký Realtime:", err);
    }
  },
  init(){
    if(!SUPABASE_ENABLED) return null; // Supabase đã tắt -> mọi nơi gọi init() tự dừng an toàn
    if(this.client) return this.client;
    if(!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) return null;
    if(typeof supabase==="undefined" || !supabase.createClient) return null; // chưa nạp được lib (offline)
    this.client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return this.client;
  },
  async refreshUser(){
    const c=this.init(); if(!c){ this.user=null; return null; }
    const { data } = await c.auth.getUser();
    this.user = data?.user || null;
    this.userName = this.user ? (this.user.email||"") : "";
    return this.user;
  },
  async toggleAuth(){
    const c=this.init(); if(!c){ alert("Chưa cấu hình Supabase (URL + anon key)."); return; }
    if(this.user){ if(confirm("Đăng xuất khỏi đồng bộ?")){ await c.auth.signOut(); this.user=null; SyncEngine.setPill(); } return; }
    const email=prompt("Email đăng nhập Supabase:"); if(!email) return;
    const pw=prompt("Mật khẩu:"); if(!pw) return;
    const { error } = await c.auth.signInWithPassword({ email, password: pw });
    if(error){ alert("Đăng nhập lỗi: "+error.message); return; }
    await this.refreshUser(); SyncEngine.setPill(); this.subscribeRealtime();
    await this.pull(CUR.project); renderDashboard(); renderMySubs();
    alert("Đăng nhập thành công. Đã đồng bộ dữ liệu.");
  },
  async pushSubmission(sub){
    const c=this.init(); if(!c || !this.user) return false;
    const photoPaths = (sub.photoPaths||[]).slice();
    for(const id of (sub.photoIds||[])){
      const blob=await DataService.getPhoto(id); if(!blob) continue;
      const path=sub.project_id+"/"+sub.client_uuid+"/"+id+".jpg";
      const up=await c.storage.from("site-photos").upload(path, blob, {upsert:true, contentType:"image/jpeg"});
      if(!up.error && photoPaths.indexOf(path)<0) photoPaths.push(path);
    }
    const data={ shift:sub.shift, area:sub.area, weather:sub.weather, note:sub.note,
      manpower:sub.manpower||[], completed:sub.completed||[], plans:sub.plans||[],
      issues:sub.issues||[], milestones:sub.milestones||[], photoPaths, created_at:sub.created_at };
    const { error } = await c.from("submissions").upsert({
      client_uuid:sub.client_uuid, project_id:sub.project_id, log_date:sub.log_date,
      submitted_by:this.user.id, data }, { onConflict:"client_uuid" });
    if(error){ console.warn("push lỗi:", error.message); return false; }
    if(SUPABASE_CONFIG.functionUrl){
      try{ await fetch(SUPABASE_CONFIG.functionUrl, {method:"POST", headers:{"content-type":"application/json"},
        body:JSON.stringify({project_id:sub.project_id, log_date:sub.log_date})}); }catch(_){}
    }
    return true;
  },
  async pushDailyReport(r) {
    const c=this.init(); if(!c || !this.user) return false;
    const log_date = r.date;
    const project_id = r.project_id;

    // Kiểm tra xung đột phiên bản (Concurrency Control)
    let overwrite = true;
    if (r.updated_at) {
      try {
        const { data: remote } = await c.from("daily_consolidated").select("updated_at").eq("project_id", project_id).eq("log_date", log_date).maybeSingle();
        if (remote && new Date(remote.updated_at).getTime() > new Date(r.updated_at).getTime() + 1000) {
          const action = confirm(`[XUNG ĐỘT BÁO CÁO NGÀY] Báo cáo ngày ${log_date} đã được người khác cập nhật mới hơn trên máy chủ.\n\n- Nhấn OK để Ghi đè (giữ lại bản sửa của bạn).\n- Nhấn Cancel để Hủy bỏ bản sửa và tải bản mới nhất từ máy chủ.`);
          if (!action) {
            overwrite = false;
            const { data: newest } = await c.from("daily_consolidated").select("*").eq("project_id", project_id).eq("log_date", log_date).maybeSingle();
            if (newest) {
              const allDaily = await metaGet('daily_reports', []);
              const localIdx = allDaily.findIndex(x => x.project_id === project_id && x.date === log_date);
              let report = newest.data || {
                date: newest.log_date, project_id: newest.project_id,
                total_manpower: newest.total_headcount, units: newest.manpower_by_contractor || [],
                works_full: newest.completed || [], draws: newest.issues || [], status: 'approved'
              };
              report.updated_at = newest.updated_at;
              report.dirty = false;
              if (localIdx >= 0) allDaily[localIdx] = report;
              else allDaily.push(report);
              await idbPut("meta", {key: 'daily_reports', value: allDaily});
              console.log(`Đã hủy bản sửa local và nạp báo cáo ngày ${log_date} mới nhất.`);
            }
          }
        }
      } catch(err) {
        console.warn("Lỗi kiểm tra xung đột báo cáo ngày:", err);
      }
    }

    if (!overwrite) return true; // coi như đã hoàn thành xử lý bằng hủy bỏ bản sửa

    const total_headcount = parseInt(r.total_manpower) || 0;
    const manpower_by_contractor = r.units || [];
    const completed = r.works_full || [];
    const { data: res, error } = await c.from("daily_consolidated").upsert({
      project_id,
      log_date,
      total_headcount,
      manpower_by_contractor,
      completed,
      issues: r.draws || [],
      data: r,
      updated_at: new Date().toISOString()
    }, { onConflict: "project_id, log_date" }).select("updated_at").maybeSingle();
    if (error) {
      console.warn("push báo cáo ngày lỗi:", error.message);
      return false;
    }
    if (res) {
      r.updated_at = res.updated_at;
    }
    return true;
  },
  async pushAllDirty(autoOnly=false){
    const c=this.init(); if(!c) return;
    // Phương án A (đồng bộ nội bộ): CHỈ đồng bộ qua app_meta. Bỏ đồng bộ hệ cũ submissions/daily_consolidated
    // (dữ liệu báo cáo ngày đã nằm trong app_meta key 'daily_reports') — tránh lỗi 403 RLS không cần thiết.
    try {
      const dirtyMetaObj = await idbGet("meta", "meta_dirty_keys");
      const dirtyMetaKeys = dirtyMetaObj ? (dirtyMetaObj.value || []) : [];
      if (dirtyMetaKeys.length > 0) {
        const remainingKeys = [];
        for (const key of dirtyMetaKeys) {
          // Auto-push (sau mỗi sửa) BỎ QUA key dữ liệu nền/danh mục — giữ dirty để bấm "Đẩy toàn bộ" mới đẩy.
          if (autoOnly && isManualPushOnlyKey(key)) { remainingKeys.push(key); continue; }
          const valObj = await idbGet("meta", key);
          if (valObj) {
            // GỘP THÔNG MINH cho báo cáo ngày: đọc bản server mới nhất rồi gộp báo cáo của mình vào,
            // giữ nguyên báo cáo của người khác (chống 2 người nộp gần nhau đè mất nhau).
            if (key === "daily_reports") {
              try {
                const { data: remoteRow } = await c.from("app_meta").select("value").eq("key","daily_reports").maybeSingle();
                const serverArr = Array.isArray(remoteRow && remoteRow.value) ? remoteRow.value : [];
                const localArr = Array.isArray(valObj.value) ? valObj.value : [];
                const rkey = (r)=> (r.project_id||"")+"|"+(r.date||"")+"|"+(r.created_by||"");
                const byKey = {};
                serverArr.forEach(r=>{ byKey[rkey(r)] = r; });
                localArr.forEach(r=>{
                  const k=rkey(r), ex=byKey[k];
                  if(!ex) byKey[k]=r;                                                   // báo cáo chưa có trên server -> thêm
                  else if(r.dirty) byKey[k]=r;                                          // báo cáo mình vừa sửa -> thắng
                  else if(new Date(r.updated_at||0) > new Date(ex.updated_at||0)) byKey[k]=r; // bản mới hơn -> thắng
                });
                const merged = Object.values(byKey).map(r=>({ ...r, dirty:false }));
                const { data: res, error } = await c.from("app_meta").upsert({ key:"daily_reports", value:merged, updated_at:new Date().toISOString() }, { onConflict:"key" }).select("updated_at").maybeSingle();
                if(error){ console.warn("push daily_reports (gộp) lỗi:", error.message); remainingKeys.push(key); }
                else { await idbPut("meta", { key:"daily_reports", value:merged, updated_at: res?res.updated_at:new Date().toISOString() }); }
              } catch(e){ console.warn("gộp daily_reports lỗi:", e); remainingKeys.push(key); }
              continue;
            }
            let overwrite = true;
            if (valObj.updated_at) {
              try {
                const { data: remote } = await c.from("app_meta").select("updated_at").eq("key", key).maybeSingle();
                if (remote && new Date(remote.updated_at).getTime() > new Date(valObj.updated_at).getTime() + 1000) {
                  const action = confirm(`[XUNG ĐỘT DỮ LIỆU] Mục cấu hình "${key}" đã được người khác cập nhật mới hơn trên máy chủ.\n\n- Nhấn OK để Ghi đè (giữ lại bản sửa của bạn).\n- Nhấn Cancel để Hủy bỏ bản sửa và tải bản mới nhất từ máy chủ.`);
                  if (!action) {
                    overwrite = false;
                    const { data: newest } = await c.from("app_meta").select("*").eq("key", key).maybeSingle();
                    if (newest) {
                      await idbPut("meta", { key: newest.key, value: newest.value, updated_at: newest.updated_at });
                      console.log(`Đã hủy bản sửa local và nạp cấu hình "${key}" mới nhất.`);
                    }
                  }
                }
              } catch(err) {
                console.warn("Lỗi kiểm tra xung đột app_meta:", err);
              }
            }
            if (overwrite) {
              const { data: res, error } = await c.from("app_meta").upsert({
                key: key,
                value: valObj.value,
                updated_at: new Date().toISOString()
              }, { onConflict: "key" }).select("updated_at").maybeSingle();
              if (error) {
                console.warn("push app_meta lỗi cho key " + key + ":", error.message);
                remainingKeys.push(key);
              } else if (res) {
                await idbPut("meta", { key, value: valObj.value, updated_at: res.updated_at });
              }
            }
          }
        }
        await idbPut("meta", { key: "meta_dirty_keys", value: remainingKeys });
      }
    } catch(err) {
      console.warn("Lỗi push app_meta:", err);
    }
    // Tự động đẩy snapshot dữ liệu mới nhất lên cho Bot Telegram sau khi đồng bộ thành công
    try {
      if (typeof pushAiSnapshot === "function") {
        await pushAiSnapshot();
      }
    } catch(err) {
      console.warn("Lỗi tự động đẩy snapshot cho Bot:", err);
    }
  },
  async pull(projectId){
    const c=this.init(); if(!c) return;
    // Phương án A (đồng bộ nội bộ): CHỈ kéo app_meta (báo cáo ngày đã nằm trong app_meta key 'daily_reports').
    // Bỏ kéo hệ cũ submissions/daily_consolidated — tránh lỗi 403 RLS không cần thiết.
    const { data: metaData, error: metaError } = await c.from("app_meta").select("*");
    if (metaError) {
      console.warn("pull app_meta lỗi:", metaError.message);
    } else if (metaData && metaData.length > 0) {
      const dirtyMetaObj = await idbGet("meta", "meta_dirty_keys");
      const dirtyMetaKeys = new Set(dirtyMetaObj ? (dirtyMetaObj.value || []) : []);
      for (const row of metaData) {
        if (dirtyMetaKeys.has(row.key)) {
          // Lưu lại updated_at của server để đối chiếu xung đột sau này
          const localObj = await idbGet("meta", row.key);
          if (localObj && !localObj.updated_at) {
            await idbPut("meta", { key: row.key, value: localObj.value, updated_at: row.updated_at });
          }
          continue;
        }
        await idbPut("meta", { key: row.key, value: row.value, updated_at: row.updated_at });
      }
    }
  },
  photoUrl(path){ const c=this.init(); if(!c) return ""; try{ return c.storage.from("site-photos").getPublicUrl(path).data.publicUrl; }catch(e){ return ""; } },
};

const SYNC_SKIP_KEYS = ["meta_dirty_keys","cur_user","cur_project","meta_dark_mode","session_user"];

// Các key DỮ LIỆU NỀN/DANH MỤC (dự án, người dùng, nhà thầu, phòng ban, thành viên, sơ đồ tổ chức...):
// CHỈ đẩy lên server khi bấm nút "Đẩy toàn bộ lên" (chủ đích), KHÔNG auto-push. Mục đích: browser lạ
// (vd Antigravity mở app test) dù có dữ liệu cũ cũng KHÔNG tự đẩy lên làm rối/hồi sinh demo.
// Báo cáo ngày (daily_reports), liên phòng ban, tiến độ, thanh toán... vẫn auto-push bình thường.
function isManualPushOnlyKey(key){
  const M = ["projects","users","departments","contractors","kb_contractors","custom_roles","tc_goals","kb"];
  if (M.includes(key)) return true;
  return key.startsWith("members:") || key.startsWith("team:") || key.startsWith("org_chart_");
}
window.isManualPushOnlyKey = isManualPushOnlyKey;
// Sếp chốt 17/07: tài khoản ADMIN/GIÁM ĐỐC sửa danh mục (người dùng, chức vụ, nhà thầu, vai trò...)
// thì TỰ đồng bộ lên hệ thống luôn — khỏi bấm "Đẩy toàn bộ lên". Kỹ sư/CHT hoặc máy chưa đăng nhập
// Firebase vẫn bị chặn như cũ (an toàn: không ai ghi đè danh mục ngoài quản trị).
function catalogAutoPushAllowed(){
  try { return typeof CUR_USER !== "undefined" && !!CUR_USER && isAdminLikeRole(CUR_USER.role); }
  catch(e){ return false; }
}
window.catalogAutoPushAllowed = catalogAutoPushAllowed;
// MÁY NGUỒN CHUẨN: đẩy TOÀN BỘ dữ liệu local lên server (ghi đè server). Dùng cho lần thiết lập đầu.
async function syncPushAll(){
  const fbReady = (typeof FirebaseSync !== "undefined" && FirebaseSync.ready());
  if(!SyncEngine.configured() && !fbReady){ alert("Chưa sẵn sàng đồng bộ (Firebase)."); return; }
  if(!navigator.onLine){ alert("Cần kết nối mạng."); return; }
  if(!confirm("ĐẨY TOÀN BỘ dữ liệu máy này lên server (sẽ GHI ĐÈ dữ liệu trên server).\nChỉ dùng ở MÁY NGUỒN CHUẨN. Tiếp tục?")) return;
  try{
    const all = await idbAll("meta");
    const keys = all.map(m=>m.key).filter(k=>!SYNC_SKIP_KEYS.includes(k));
    await idbPut("meta", { key:"meta_dirty_keys", value:keys });

    let firebasePromise = Promise.resolve({ ok: 0, failed: [] });
    if (typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
      firebasePromise = FirebaseSync.pushAllDirty();
    }

    if (SyncEngine.configured()) {
      try { await SupabaseSync.pushAllDirty(); } catch(err){ console.warn("syncPushAll Supabase lỗi (bỏ qua):", err); }
    }

    let fbResult = { ok: 0, failed: [] };
    try {
      fbResult = (await firebasePromise) || fbResult;
    } catch (err) {
      console.warn("syncPushAll FirebaseSync lỗi:", err);
      fbResult = { ok: 0, failed: ["(toàn bộ) " + (err && err.message || err)] };
    }

    // Báo TRUNG THỰC: trước đây luôn hiện "✅ Đã đẩy X mục" kể cả khi có mục lỗi
    // (lỗi chỉ nằm trong console) -> Sếp tưởng đẩy xong mà server vẫn bản cũ.
    if (fbResult.failed && fbResult.failed.length) {
      alert("⚠️ Đẩy xong " + fbResult.ok + " mục, nhưng " + fbResult.failed.length + " mục LỖI (server vẫn giữ bản cũ các mục này):\n\n- "
        + fbResult.failed.slice(0, 8).join("\n- ")
        + (fbResult.failed.length > 8 ? "\n… và " + (fbResult.failed.length - 8) + " mục khác" : "")
        + "\n\nHãy chụp màn hình này gửi hỗ trợ.");
    } else {
      alert("✅ Đã đẩy thành công " + fbResult.ok + " mục dữ liệu lên server. Giờ sang máy khác bấm 'Kéo toàn bộ về'.");
    }
  }catch(e){ alert("Lỗi đẩy dữ liệu: "+e); }
}
// MÁY ĐỒNG BỘ THEO: kéo TOÀN BỘ dữ liệu từ server về (ghi đè local).
async function syncPullAll(){
  const fbReady = (typeof FirebaseSync !== "undefined" && FirebaseSync.ready());
  if(!SyncEngine.configured() && !fbReady){ alert("Chưa sẵn sàng đồng bộ (Firebase)."); return; }
  if(!navigator.onLine){ alert("Cần kết nối mạng."); return; }
  if(!confirm("KÉO TOÀN BỘ dữ liệu từ server về máy này (sẽ GHI ĐÈ dữ liệu local của máy này).\nDùng ở MÁY ĐỒNG BỘ THEO. Tiếp tục?")) return;
  try{
    await idbPut("meta", { key:"meta_dirty_keys", value:[] }); // bỏ cờ dirty để không chặn việc nhận bản server

    const promises = [];
    if (SyncEngine.configured()) {
      promises.push(SupabaseSync.pull(CUR.project).catch(err => {
        console.warn("syncPullAll Supabase lỗi (bỏ qua):", err);
      }));
    }
    if (typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
      promises.push(FirebaseSync.pull(CUR.project).catch(err => {
        console.warn("syncPullAll FirebaseSync lỗi:", err);
      }));
    }

    await Promise.all(promises);
    alert("✅ Đã kéo dữ liệu từ server về. Trang sẽ tải lại để áp dụng.");
    location.reload();
  }catch(e){ alert("Lỗi kéo dữ liệu: "+e); }
}

// ---------- SEED ----------
const SEED = {
  // KHÔNG seed dự án demo nữa (vận hành thật): mỗi browser mới mở app với IndexedDB trống mà seed
  // SHUN HING/HOWELL (id cứng p3/p4) sẽ tự đẩy chúng lên Firebase làm demo "sống lại". Để rỗng —
  // máy mới sẽ tự kéo dự án thật từ Firebase/Supabase về.
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

// ---------- HELPERS ----------
function uuid(){ return (crypto.randomUUID ? crypto.randomUUID() : "id-"+Date.now()+"-"+Math.random().toString(16).slice(2)); }
function $(id){ return document.getElementById(id); }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
function todayISO(){ const d=new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function fmtVN(iso){ if(!iso) return ""; const p=iso.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }
function esc(s){ return (s==null?"":String(s)).replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
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
// ========== AI VOICE JOURNAL ENGINE (mục 28) ==========
let VOICE={rec:null, on:false, base:""};
function voiceSupported(){ return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window); }
function toggleVoice(){ if(VOICE.on) stopVoice(); else startVoice(); }
function startVoice(){
  if(!voiceSupported()){ alert("Trình duyệt không hỗ trợ ghi âm giọng nói. Hãy dùng Chrome hoặc Edge (cần mạng + cấp quyền micro).\nSếp vẫn có thể gõ/dán nội dung vào ô rồi bấm 🤖 Phân tích."); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec=new SR();
  rec.lang=($("voice-lang")&&$("voice-lang").value)||"vi-VN"; rec.continuous=true; rec.interimResults=true;
  VOICE.base=$("voice-text").value ? ($("voice-text").value.trim()+" ") : "";
  rec.onresult=(e)=>{ let fin="",interim="";
    for(let i=e.resultIndex;i<e.results.length;i++){ const tr=e.results[i]; if(tr.isFinal) fin+=tr[0].transcript+" "; else interim+=tr[0].transcript; }
    if(fin){ fin=fin.trim(); if(fin && !/[.!?;]$/.test(fin)) fin+=". "; else fin+=" "; VOICE.base+=fin; }
    $("voice-text").value=(VOICE.base+interim).trim();
  };
  rec.onerror=(e)=>{ const st=$("voice-status"); if(st){ let m=e.error||""; if(m==="not-allowed")m="chưa cấp quyền micro (nếu mở bằng file:// có thể bị chặn — xem hướng dẫn)"; else if(m==="network")m="cần mạng (Web Speech cần internet)"; st.textContent="Lỗi ghi âm: "+m; } };
  rec.onend=()=>{ if(VOICE.on){ try{rec.start();}catch(_){} } };
  try{ rec.start(); }catch(e){ alert("Không khởi động được ghi âm: "+e.message); return; }
  VOICE.rec=rec; VOICE.on=true;
  const b=$("voice-btn"); if(b){ b.textContent="⏹ Dừng ghi âm"; b.classList.remove("btn-ok"); b.classList.add("btn-dan"); }
  const st=$("voice-status"); if(st) st.textContent="🔴 Đang nghe… hãy đọc nội dung hiện trường.";
}
function stopVoice(){
  VOICE.on=false; if(VOICE.rec){ try{VOICE.rec.stop();}catch(_){} VOICE.rec=null; }
  const b=$("voice-btn"); if(b){ b.textContent="🎤 Bắt đầu ghi âm"; b.classList.add("btn-ok"); b.classList.remove("btn-dan"); }
  const st=$("voice-status"); if(st) st.textContent="Đã dừng. Bấm '🤖 Phân tích & xem trước'.";
}
// ----- Parser offline (đã kiểm thử với ví dụ mục 28.11) -----
function vStripD(s){ return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D"); }
function vNorm(s){ return vStripD((s||"").toLowerCase()).replace(/\s+/g," ").trim(); }
function vCap(s){ s=(s||"").trim(); return s? s.charAt(0).toUpperCase()+s.slice(1) : s; }
function vFuzzy(label, known){ const nl=vNorm(label);
  for(const k of (known||[])){ const nk=vNorm(k); if(nk && (nl===nk || nl.includes(nk) || nk.includes(nl))) return k; }
  return label; }
const V_UNIT="(?:công nhân|cong nhan|nhân công|nhan cong|người|nguoi|lao động|lao dong|công|cn|thợ|tho)";
// Tách chuỗi nói thành các mệnh đề kể cả khi KHÔNG có dấu câu (giọng nói thường không chấm câu)
function vSeg(text){
  let t=(text||"").replace(/\s+/g," ").trim();
  // 1) ngắt SAU mỗi cụm "<số> <đơn vị người>" (kết thúc một khai báo nhân lực)
  t=t.replace(new RegExp("(\\d+\\s*"+V_UNIT+")\\s+","gi"), "$1.\n");
  // 2) ngắt TRƯỚC các cụm mở đầu mệnh đề (đã/đang/ngày mai/kế hoạch...)
  t=t.replace(/(^|\s)(đã |da |đang |dang |ngày mai|ngay mai|ngày tiếp theo|ngay tiep theo|hôm sau|hom sau|sáng mai|sang mai|kế hoạch|ke hoach)/gi, "\n$2");
  // 3) ngắt TRƯỚC cụm vấn đề (giữ "hiện còn/hiện" đi cùng), không tách "chưa giao/chưa đủ" giữa câu
  t=t.replace(/(^|\s)((?:hiện còn\s+|hien con\s+|hiện\s+|hien\s+)?(?:thiếu|thieu|chờ|cho |vướng|vuong|sự cố|su co|hỏng|hong|phát sinh|phat sinh))/gi, "\n$2");
  return t;
}
// Tìm tên công tác trong Tiến độ tổng khớp gần đúng với câu nói (để GỢI Ý chuẩn hoá, không tự thay)
function vMatchTask(text, tasks){
  if(!tasks||!tasks.length||!text) return null;
  const toks=new Set(vNorm(text).split(/\s+/).filter(w=>w.length>1));
  if(!toks.size) return null;
  let best=null, bs=0;
  for(const tk of tasks){
    const tt=vNorm(tk).split(/\s+/).filter(w=>w.length>1);
    if(!tt.length) continue;
    let c=0; tt.forEach(w=>{ if(toks.has(w)) c++; });
    const score=c/tt.length;          // độ phủ tên công tác trong Tiến độ tổng
    if(score>bs){ bs=score; best=tk; }
  }
  return (best && bs>=0.5) ? best : null;
}
function parseJournalLocal(text, opts){
  opts=opts||{}; const known=opts.contractors||[];
  const res={manpower:[], completed:[], current:[], tomorrow:[], issues:[], notes:[]};
  if(!text||!text.trim()) return res;
  const sents=vSeg(text).split(/[.\n;]+/).map(s=>s.trim()).filter(Boolean);
  const UNIT=V_UNIT;
  for(let s of sents){
    const ns=vNorm(s);
    const mp=s.match(new RegExp("^(.*?)\\s*(?:có|gồm|:|=)?\\s*(\\d+)\\s*"+UNIT+"\\b","i"));
    if(mp && /\d/.test(mp[2])){
      let label=mp[1].replace(/^(hôm nay|hom nay|hiện nay|hien nay|hiện tại|hien tai|sáng nay|sang nay|chiều nay|chieu nay|hiện|hien|nay|thì|thi)\s+/i,"").trim();
      label=label.replace(/\s+(có|gồm|co|gom)\s*$/i,"").trim();
      if(label){ res.manpower.push({contractor:vFuzzy(vCap(label),known), headcount:parseInt(mp[2],10), work_desc:""}); continue; }
    }
    if(/(thiếu|thieu|chưa có|chua co|chưa giao|chua giao|chưa đủ|chua du|chờ nghiệm|cho nghiem|chờ|vướng|vuong|sự cố|su co|hỏng|hong|tai nạn|tai nan|nguy hiểm|nguy hiem|chậm|cham|dừng thi công|dung thi cong|chưa có bản vẽ|chua co ban ve)/i.test(s)){
      let d=s.replace(/^(hiện còn|hien con|hiện tại|hien tai|hiện nay|hien nay|hiện|hien|hôm nay|hom nay)\s+/i,"").trim();
      let sev="medium";
      if(/(sự cố|su co|tai nạn|tai nan|hỏng|hong|nguy hiểm|nguy hiem|dừng thi công|dung thi cong|sập|sap)/i.test(s)) sev="high";
      res.issues.push({description:vCap(d), severity:sev}); continue;
    }
    if(/^(ngày mai|ngay mai|ngày tiếp theo|ngay tiep theo|hôm sau|hom sau|sáng mai|sang mai|tiếp tục|tiep tuc)/i.test(s) || /\bkế hoạch\b|\bke hoach\b/.test(ns)){
      let d=s.replace(/^(ngày mai|ngay mai|ngày tiếp theo|ngay tiep theo|hôm sau|hom sau|sáng mai|sang mai|kế hoạch ngày mai|ke hoach ngay mai|kế hoạch|ke hoach)\s*:?\s*/i,"").trim();
      res.tomorrow.push(vCap(d)); continue;
    }
    if(/(đã hoàn thành|da hoan thanh|hoàn thành|hoan thanh|đã xong|da xong|hoàn tất|hoan tat|đã lắp|da lap|đã đổ|da do|đã thi công xong|da thi cong xong)/i.test(s)){
      let d=s.replace(/^(đã|da)\s+/i,"").trim();
      res.completed.push(vCap(d)); continue;
    }
    if(/^(đang|dang)\b/i.test(s) || /(đang thi công|dang thi cong|đang lắp|dang lap|đang thực hiện|dang thuc hien|đang làm|dang lam|đang triển khai|dang trien khai)/i.test(s)){
      let d=s.replace(/^(đang|dang)\s+/i,"").trim();
      res.current.push(vCap(d)); continue;
    }
    res.notes.push(s.trim());
  }
  return res;
}
function normalizeParsed(r){
  const out={manpower:[],completed:[],current:[],tomorrow:[],issues:[],notes:[],unknownContractors:[]};
  if(!r) return out;
  if(Array.isArray(r.manpower)) out.manpower=r.manpower.map(m=>({contractor:m.contractor||m.name||"",headcount:Number(m.headcount||m.count||0),work_desc:m.work_desc||""})).filter(m=>m.contractor);
  else if(r.manpower && typeof r.manpower==="object") out.manpower=Object.entries(r.manpower).map(([k,v])=>({contractor:k,headcount:Number(v)||0,work_desc:""}));
  const arr=x=>Array.isArray(x)?x:(x?[x]:[]);
  out.completed=arr(r.completedWorks||r.completed).map(String);
  out.current=arr(r.currentWorks||r.current).map(String);
  out.tomorrow=arr(r.tomorrowPlans||r.tomorrow).map(String);
  out.issues=arr(r.issues).map(i=> typeof i==="string"?{description:i,severity:"medium"}:{description:i.description||"",severity:i.severity||"medium"}).filter(i=>i.description);
  out.notes=arr(r.notes).map(String);
  out.unknownContractors=arr(r.unknownContractors).map(String);
  return out;
}
async function analyzeVoice(){
  if(VOICE.on) stopVoice();
  const text=$("voice-text").value.trim(); const st=$("voice-status");
  if(!text){ if(st)st.textContent="Chưa có nội dung. Hãy ghi âm hoặc gõ vào ô trên."; return; }
  const contractors=(await DataService.listContractors(CUR.project)).filter(c => c.status !== 'finished').map(c=>c.name);
  const dict=await metaGet("voiceDict:"+CUR.project, {contractors:[],items:[]});
  const known=Array.from(new Set([].concat(contractors, dict.contractors||[])));
  const tasks=(await getProgress()).map(t=>t.task).filter(Boolean);           // Tiến độ tổng
  const subsP=(await DataService.listSubmissions()).filter(s=>s.project_id===CUR.project);
  const areas=Array.from(new Set(subsP.map(s=>s.area).filter(Boolean)));        // khu vực đã từng nhập
  let parsed=null; const base=SUPABASE_CONFIG.functionUrl;
  if(base && navigator.onLine){
    if(st)st.textContent="Đang nhờ AI phân tích…";
    try{
      const url=base.replace(/consolidate\/?$/,"parse-journal");
      const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({transcript:text, contractors:known, masterSchedule:tasks, areas:areas, items:dict.items||[]})});
      const d=await r.json(); if(d && (d.result||d.manpower)){ parsed=normalizeParsed(d.result||d); }
    }catch(e){}
  }
  if(!parsed){ parsed=parseJournalLocal(text,{contractors:known}); if(st)st.textContent=(base?"AI ngoại tuyến — dùng phân tích trên máy.":"Đã phân tích (trên máy)."); }
  else { if(st)st.textContent="AI đã phân tích."; }
  renderVoicePreview(parsed, contractors, tasks);
}
function vField(label,id,val,rows){ return '<div style="margin-bottom:6px"><label style="font-size:13px;font-weight:600">'+label+'</label>'
  +'<textarea id="'+id+'" rows="'+(rows||2)+'" style="width:100%">'+esc(val)+'</textarea></div>'; }
function vMpOptions(rawName, contractors){
  const matched=vFuzzy(rawName, contractors||[]);
  let opts='<option value="">— chọn nhà thầu —</option>';
  (contractors||[]).forEach(c=>{ opts+='<option value="'+esc(c)+'"'+(c===matched?' selected':'')+'>'+esc(c)+'</option>'; });
  // nếu không khớp nhà thầu đã khai báo, thêm tên nghe được để vẫn dùng được
  if(matched===rawName && (contractors||[]).indexOf(rawName)<0 && rawName){ opts+='<option value="'+esc(rawName)+'" selected>'+esc(rawName)+' (mới)</option>'; }
  return opts;
}
function renderVoicePreview(p, contractors, tasks){
  contractors=contractors||[]; tasks=tasks||[];
  let mpHtml='<div style="margin-bottom:8px"><label style="font-size:13px;font-weight:600">👷 Nhân lực (chọn đúng nhà thầu + số lượng)</label><div id="vp-mp-rows">';
  (p.manpower||[]).forEach(m=>{
    mpHtml+='<div class="row" style="gap:6px;margin-bottom:4px;align-items:center">'
      +'<div style="flex:2"><select class="vpmp-c">'+vMpOptions(m.contractor, contractors)+'</select></div>'
      +'<div style="flex:0;min-width:80px"><input type="number" class="vpmp-n" min="0" value="'+(m.headcount!=null?m.headcount:"")+'"></div>'
      +'<div style="flex:2"><input class="vpmp-w" placeholder="công tác (tùy chọn)" value="'+esc(m.work_desc||"")+'"></div>'
      +'<div style="flex:0"><button class="btn btn-dan btn-sm" onclick="this.closest(\'.row\').remove()">✕</button></div></div>';
  });
  mpHtml+='</div><button class="btn btn-mut btn-sm" onclick="vpAddMp()">+ Thêm nhân lực</button></div>';
  VP_CONTRACTORS=contractors;
  // Nhà thầu chưa khớp danh mục (ưu tiên từ AI, nếu không thì tự dò)
  let unknown = (p.unknownContractors&&p.unknownContractors.length) ? p.unknownContractors.slice()
    : (p.manpower||[]).map(m=>m.contractor).filter(n=> n && vFuzzy(n,contractors)===n && contractors.indexOf(n)<0);
  unknown=Array.from(new Set(unknown));
  const warnHtml = unknown.length ? '<div class="note" style="margin-bottom:8px">⚠ Nhà thầu chưa khớp danh mục: <b>'+unknown.map(esc).join(", ")+'</b>. Hãy chọn lại trong ô nhà thầu, hoặc thêm vào tab Nhà thầu.</div>' : '';
  // Gợi ý chuẩn hoá theo Tiến độ tổng (không tự thay — bấm "Thay" mới áp dụng)
  VP_SUGG=[];
  [["vp-comp",p.completed],["vp-cur",p.current],["vp-tom",p.tomorrow]].forEach(pair=>{
    (pair[1]||[]).forEach(line=>{ const mt=vMatchTask(line, tasks); if(mt && vNorm(mt)!==vNorm(line)) VP_SUGG.push({field:pair[0], orig:line, sugg:mt}); });
  });
  const suggHtml = VP_SUGG.length ? '<div class="note-ok" style="margin-bottom:8px"><b>💡 Gợi ý chuẩn hoá theo Tiến độ tổng</b>'
    + VP_SUGG.map((s,i)=>'<div style="margin-top:4px">"'+esc(s.orig)+'" → <b>'+esc(s.sugg)+'</b> <button class="btn btn-mut btn-sm" onclick="vpApplySugg('+i+',this)">Thay</button></div>').join("")
    + '</div>' : '';
  const box=$("voice-preview"); box.classList.remove("hide");
  box.innerHTML='<h3 style="margin-top:0">📝 Bản xem trước — chỉnh sửa nếu cần rồi Áp dụng</h3>'
    +warnHtml+suggHtml
    +mpHtml
    +vField("✅ Công việc hoàn thành (mỗi dòng 1 việc)","vp-comp",(p.completed||[]).join("\n"),3)
    +vField("🔧 Đang thực hiện (đưa vào Ghi chú)","vp-cur",(p.current||[]).join("\n"),2)
    +vField("📅 Kế hoạch ngày mai (mỗi dòng 1 việc)","vp-tom",(p.tomorrow||[]).join("\n"),2)
    +vField("⚠️ Vấn đề phát sinh (mỗi dòng 1 việc)","vp-iss",(p.issues||[]).map(i=>i.description).join("\n"),2)
    +vField("🗒 Ghi chú khác","vp-note",(p.notes||[]).join("\n"),2)
    +'<div class="btnbar"><button class="btn btn-ok btn-sm" onclick="applyVoice()">✅ Áp dụng vào nhật ký</button>'
    +'<button class="btn btn-mut btn-sm" onclick="$(\'voice-preview\').classList.add(\'hide\')">Hủy</button></div>';
}
let VP_CONTRACTORS=[]; let VP_SUGG=[];
function vpApplySugg(i, btn){
  const s=VP_SUGG[i]; if(!s) return; const ta=$(s.field); if(!ta) return;
  ta.value=ta.value.split("\n").map(l=> l.trim()===s.orig.trim()? s.sugg : l).join("\n");
  if(btn){ btn.textContent="Đã thay ✓"; btn.disabled=true; btn.classList.remove("btn-mut"); btn.classList.add("btn-ok"); }
}
function vpAddMp(){
  const row=el("div","row"); row.style.cssText="gap:6px;margin-bottom:4px;align-items:center";
  row.innerHTML='<div style="flex:2"><select class="vpmp-c">'+vMpOptions("",VP_CONTRACTORS)+'</select></div>'
    +'<div style="flex:0;min-width:80px"><input type="number" class="vpmp-n" min="0" value=""></div>'
    +'<div style="flex:2"><input class="vpmp-w" placeholder="công tác (tùy chọn)" value=""></div>'
    +'<div style="flex:0"><button class="btn btn-dan btn-sm" onclick="this.closest(\'.row\').remove()">✕</button></div>';
  $("vp-mp-rows").appendChild(row);
}
async function applyVoice(){
  // Nhân lực: đọc từ các dropdown trong bản xem trước
  const mpRows=$("vp-mp-rows") ? [].slice.call($("vp-mp-rows").children) : [];
  const mpNames=[];
  for(const r of mpRows){
    const sel=r.querySelector(".vpmp-c"); const nIn=r.querySelector(".vpmp-n"); const wIn=r.querySelector(".vpmp-w");
    const name=sel?sel.value.trim():""; const cnt=nIn?parseInt(nIn.value,10):NaN;
    if(!name || isNaN(cnt)) continue;
    mpNames.push(name);
    await addManpower({contractor:name, headcount:cnt, work_desc:(wIn?wIn.value:"")});
    const rows=$("t-manpower").rows; const ms=rows[rows.length-1].querySelector(".mp-c");
    if(ms && ms.value!==name){ const o=document.createElement("option"); o.textContent=name; o.value=name; ms.appendChild(o); ms.value=name; }
  }
  $("vp-comp").value.split(/\n/).map(s=>s.trim()).filter(Boolean).forEach(d=>addCompleted({description:d}));
  $("vp-tom").value.split(/\n/).map(s=>s.trim()).filter(Boolean).forEach(d=>addPlan({description:d}));
  $("vp-iss").value.split(/\n/).map(s=>s.trim()).filter(Boolean).forEach(d=>addIssue({description:d,severity:"medium"}));
  const cur=$("vp-cur").value.split(/\n/).map(s=>s.trim()).filter(Boolean);
  const notes=$("vp-note").value.split(/\n/).map(s=>s.trim()).filter(Boolean);
  let noteAdd=[];
  if(cur.length) noteAdd.push("Đang thực hiện:\n- "+cur.join("\n- "));
  if(notes.length) noteAdd.push(notes.join("\n"));
  if(noteAdd.length){ const c0=$("f-note").value.trim(); $("f-note").value=(c0?c0+"\n":"")+noteAdd.join("\n"); }
  await learnVoice(mpNames, $("vp-comp").value+"\n"+$("vp-tom").value+"\n"+$("vp-cur").value);
  $("voice-preview").classList.add("hide"); $("voice-text").value="";
  const st=$("voice-status"); if(st) st.textContent="Đã điền vào nhật ký. Kiểm tra rồi bấm 💾 Lưu nhật ký.";
  alert("Đã áp dụng nội dung vào nhật ký. Sếp kiểm tra/chỉnh rồi bấm 💾 Lưu nhật ký.");
}
async function learnVoice(mpNames, worksText){
  const dict=await metaGet("voiceDict:"+CUR.project,{contractors:[],items:[]});
  const cset=new Set(dict.contractors||[]);
  (mpNames||[]).forEach(n=>{ if(n && n.trim()) cset.add(n.trim()); });
  const iset=new Set(dict.items||[]);
  (worksText||"").split(/\n/).map(s=>s.trim()).filter(Boolean).forEach(s=>iset.add(s));
  dict.contractors=Array.from(cset).slice(-100); dict.items=Array.from(iset).slice(-200);
  await metaSet("voiceDict:"+CUR.project,dict);
}
// ========== VOICE THEO TỪNG MỤC (mỗi mục một micro) ==========
const FV_HINT={
  manpower:"Đọc từng nhà thầu: tên – số lượng – công tác. NGẮT GIỌNG (nghỉ 1 nhịp) giữa mỗi nhà thầu. VD: “Nhà thầu A 85 công nhân lắp dựng cột” … “Tổ đội B 10 người đổ bê tông”.",
  completed:"Đọc từng việc đã hoàn thành, ngắt giọng giữa các việc. VD: “Hoàn thành lắp dựng cột trục A-B”.",
  plans:"Đọc từng việc kế hoạch ngày mai, ngắt giọng giữa các việc.",
  milestones:"Đọc tên hạng mục cần hoàn thành (khu vực & ngày nhập tay sau).",
  issues:"Đọc từng vấn đề phát sinh, ngắt giọng giữa các vấn đề. VD: “Thiếu bu lông neo”.",
  note:"Đọc nội dung ghi chú tự do."
};
let FV={rec:null,on:false,base:"",kind:null};
function _fvBegin(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const rec=new SR(); rec.lang=($("fv-lang")&&$("fv-lang").value)||"vi-VN"; rec.continuous=true; rec.interimResults=true;
  rec.onresult=e=>{ let fin="",it="";
    for(let i=e.resultIndex;i<e.results.length;i++){ const r=e.results[i]; if(r.isFinal) fin+=r[0].transcript+" "; else it+=r[0].transcript; }
    if(fin){ fin=fin.trim(); fin += (/[.!?;]$/.test(fin)?" ":". "); FV.base+=fin; }
    if($("fv-text")) $("fv-text").value=(FV.base+it).trim();
  };
  rec.onerror=e=>{ if($("fv-status")){ let m=e.error||""; if(m==="not-allowed")m="chưa cấp quyền micro (nếu mở bằng file:// có thể bị chặn)"; else if(m==="network")m="cần mạng"; $("fv-status").textContent="Lỗi ghi âm: "+m; } };
  rec.onend=()=>{ if(FV.on){ try{rec.start();}catch(_){} } };
  try{ rec.start(); }catch(e){ alert("Không khởi động được ghi âm: "+e.message); return false; }
  FV.rec=rec; FV.on=true;
  if($("fv-mic")) $("fv-mic").textContent="⏹ Dừng";
  if($("fv-status")) $("fv-status").textContent="🔴 Đang nghe…";
  return true;
}
function fvOpen(kind,label){
  if(!voiceSupported()){ alert("Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome/Edge (cần mạng + quyền micro).\nSếp vẫn có thể gõ trực tiếp vào ô bên dưới rồi bấm Điền."); }
  if(FV.on) fvPause();
  FV.kind=kind; FV.base="";
  if($("fv-title")) $("fv-title").textContent="🎤 "+(label||"Ghi âm");
  if($("fv-hint")) $("fv-hint").textContent=FV_HINT[kind]||"";
  if($("fv-text")) $("fv-text").value="";
  if($("fv-status")) $("fv-status").textContent="";
  $("fv-panel").classList.remove("hide");
  if(voiceSupported()) _fvBegin();
}
function fvMic(){ if(FV.on) fvPause(); else _fvBegin(); }
function fvPause(){ FV.on=false; if(FV.rec){ try{FV.rec.stop();}catch(_){} FV.rec=null; } if($("fv-mic")) $("fv-mic").textContent="▶ Ghi tiếp"; if($("fv-status")) $("fv-status").textContent="Đã tạm dừng. Bấm '✅ Điền vào nhật ký' hoặc '▶ Ghi tiếp'."; }
function fvCancel(){ fvPause(); $("fv-panel").classList.add("hide"); FV.kind=null; }
// ----- Bộ chuyển SỐ chữ → số, đọc NGÀY, đọc số lượng (offline) -----
const V_ONES={'không':0,'một':1,'mốt':1,'hai':2,'ba':3,'bốn':4,'tư':4,'năm':5,'lăm':5,'nhăm':5,'sáu':6,'bảy':7,'bẩy':7,'tám':8,'chín':9};
const V_NUMW=new Set([...Object.keys(V_ONES),'mười','mươi','trăm','nghìn','ngàn','lẻ','linh']);
const V_QUNIT=/^(người|nguoi|công|cong|cn|lao|nhân|nhan|thợ|tho|trên|tren|phần|phan|cột|cot|tấm|tam|mét|met|khối|khoi|xe|chuyến|chuyen|tấn|tan|bộ|bo|cái|cai|cây|cay)$/i;
function _v3(tk){ let h=0,t=0,o=0; let ti=tk.indexOf('trăm'); let rest=tk;
  if(ti>=0){ h=ti>0?(V_ONES[tk[ti-1]]||0):0; rest=tk.slice(ti+1); }
  rest=rest.filter(x=>x!=='lẻ'&&x!=='linh');
  const mi=rest.indexOf('mươi');
  if(mi>=0){ t=mi>0?(V_ONES[rest[mi-1]]||0):0; const af=rest.slice(mi+1); o=af.length?(V_ONES[af[0]]||0):0; }
  else { const di=rest.indexOf('mười'); if(di>=0){ t=1; const af=rest.slice(di+1); o=af.length?(V_ONES[af[0]]||0):0; } else { o=rest.length?(V_ONES[rest[0]]||0):0; } }
  return h*100+t*10+o; }
function _vWords2num(tk){ const ni=tk.findIndex(x=>x==='nghìn'||x==='ngàn'); if(ni>=0){ const th=ni===0?1:_v3(tk.slice(0,ni)); return th*1000+_v3(tk.slice(ni+1)); } return _v3(tk); }
function viNumWords(text){
  const parts=(text||"").split(/(\s+)/); const words=parts.filter((_,i)=>i%2===0);
  const out=[]; let i=0;
  while(i<words.length){
    if(V_NUMW.has(words[i].toLowerCase())){
      let j=i; const run=[]; while(j<words.length && V_NUMW.has(words[j].toLowerCase())){ run.push(words[j].toLowerCase()); j++; }
      const nextW=((j<words.length)?words[j]:"").replace(/[.,;:!?]+$/,"");
      if(run.length>=2 || (run.length===1 && V_QUNIT.test(nextW))){ out.push(String(_vWords2num(run))); i=j; continue; }
    }
    out.push(words[i]); i++;
  }
  return out.join(" ").replace(/\s+/g," ").trim();
}
function _pad2(n){ n=String(n); return n.length<2?"0"+n:n; }
function viParseDate(text, defYear){
  defYear=defYear||new Date().getFullYear();
  let m=text.match(/ng[àa]y\s+(\d{1,2})\s+th[áa]ng\s+(\d{1,2})(?:\s+n[ăa]m\s+(\d{4}))?/i);
  if(m){ return {iso:(m[3]?+m[3]:defYear)+"-"+_pad2(+m[2])+"-"+_pad2(+m[1]), match:m[0]}; }
  m=text.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})(?:\s*[\/\-]\s*(\d{4}))?/);
  if(m && +m[1]<=31 && +m[2]<=12){ return {iso:(m[3]?+m[3]:defYear)+"-"+_pad2(+m[2])+"-"+_pad2(+m[1]), match:m[0]}; }
  return null;
}
function viParseQty(text){ const m=text.match(/(\d+)\s*(?:tr[êe]n|\/)\s*(\d+)/i); return m?{done:+m[1],total:+m[2],match:m[0]}:null; }
async function fvApply(){
  fvPause();
  const text=($("fv-text").value||"").trim(); const kind=FV.kind;
  if(!text||!kind){ fvCancel(); return; }
  if(kind==="manpower"){ await fvManpowerConfirm(text); return; }   // nhân lực: xác nhận trước
  const n=await fvFill(kind, text);
  if($("fv-status")) $("fv-status").textContent="✓ Đã điền "+n+" mục vào nhật ký.";
  setTimeout(()=>{ $("fv-panel").classList.add("hide"); FV.kind=null; if($("fv-confirm")){$("fv-confirm").classList.add("hide");$("fv-confirm").innerHTML="";} }, 900);
}
// --- Tách nhiều nhà thầu từ MỘT câu đọc liền, dùng danh mục nhà thầu để tìm ranh giới ---
function _lev(a,b){ const m=a.length,n=b.length; const d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]); for(let j=0;j<=n;j++)d[0][j]=j; for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
function _stripPrefix(s){ return vNorm(s).replace(/^(nha thau|to doi|cong ty|doi|nhom|to)\s+/,""); }
// Điểm MAP tên cuối: độ phủ tên nhà thầu (thử cả tên đầy đủ & bỏ tiền tố) + dự phòng Levenshtein
function ctScore(cand, contractor){
  const ct=new Set(vNorm(cand).split(" ").filter(w=>w.length>1)); if(!ct.size) return 0;
  let best=0;
  for(const v of [vNorm(contractor), _stripPrefix(contractor)]){
    const cn=v.split(" ").filter(w=>w.length>1); if(!cn.length) continue;
    let m=0; cn.forEach(w=>{ if(ct.has(w)) m++; });
    let cov=m/cn.length;
    if(cov<0.6){ const a=[...ct].join(" "); const sim=1-_lev(a,v)/Math.max(a.length,v.length); if(sim>cov) cov=sim*0.9; }
    if(cov>best) best=cov;
  }
  return best;
}
// Điểm RANH GIỚI (tách công tác vs tên kế tiếp): F1 trên tên ĐẦY ĐỦ, phạt từ thừa — KHÔNG dùng Levenshtein
function ctScoreFull(cand, contractor){
  const ctA=vNorm(cand).split(" ").filter(w=>w.length>1); const ct=new Set(ctA); if(!ctA.length) return 0;
  const cn=vNorm(contractor).split(" ").filter(w=>w.length>1); if(!cn.length) return 0;
  let m=0; cn.forEach(w=>{ if(ct.has(w)) m++; });
  const prec=m/ctA.length, rec=m/cn.length; return (prec+rec)?2*prec*rec/(prec+rec):0;
}
function vBestContractor(name, contractors){
  let best=null,bs=0; for(const c of (contractors||[])){ const s=ctScore(name,c); if(s>bs){bs=s;best=c;} }
  return bs>=0.45? best : vCap((name||"").trim());
}
// Bỏ từ đệm đầu câu công tác (thì còn / rồi / và …) — KHÔNG đụng "thi công"
function _cleanWork(w){ return vCap((w||"").replace(/^(thì còn|thi con|thì|còn|con|rồi|roi|và|va|đồng thời|dong thoi|sau đó|sau do|thế|the)\s+/i,"").replace(/[.,;]+$/,"").trim()); }
const V_PERSON=new Set(['nguoi','lao','nhan','tho','cn','cong']);
function _isUnitAt(toks,k){ const w=vNorm(toks[k]||"").replace(/[.,;:]/g,''); return V_PERSON.has(w); }
function fvSplitManpowerSmart(text, contractors){
  text=viNumWords(text);
  const toks=text.replace(/\s+/g," ").trim().split(" ");
  const isNum=t=>/^\d+$/.test(t.replace(/[.,;:]/g,''));
  const anchors=[];
  for(let k=0;k<toks.length;k++){ if(isNum(toks[k]) && _isUnitAt(toks,k+1)) anchors.push(k); }
  if(!anchors.length) return [];
  const out=[]; let nameStart=0;
  for(let a=0;a<anchors.length;a++){
    const c=anchors[a]; let unitLen=1;
    if(vNorm(toks[c+1])==='cong' && vNorm(toks[c+2])==='nhan') unitLen=2;
    const count=parseInt(toks[c],10);
    const afterUnit=c+1+unitLen;
    const nextC=(a+1<anchors.length)?anchors[a+1]:toks.length;
    let splitK=nextC;
    if(a+1<anchors.length){
      let best=nextC,bestScore=0;
      for(let k=afterUnit+1;k<nextC;k++){
        const cand=toks.slice(k,nextC).join(" ");
        let bestC=0; for(const ct of (contractors||[])){ const s=ctScoreFull(cand,ct); if(s>bestC)bestC=s; }
        if(bestC>bestScore){ bestScore=bestC; best=k; }   // chọn k nhỏ nhất đạt điểm cao nhất (tên đủ tiền tố)
      }
      splitK= bestScore>=0.45? best : Math.max(afterUnit, nextC-2);
    }
    const nameRaw=toks.slice(nameStart,c).join(" ").replace(/^(hôm nay|hom nay|hiện|hien|nay|và|va|còn|con|rồi|roi|tiếp|tiep)\s+/i,"").replace(/\s+(có|gồm|co|gom)\s*$/i,"").trim();
    out.push({contractor:vBestContractor(nameRaw,contractors), headcount:count, work_desc:_cleanWork(toks.slice(afterUnit,splitK).join(" "))});
    nameStart=splitK;
  }
  return out;
}
// Tách 1 dòng nhân lực: "tên nhà thầu [- , :] số <đơn vị người> [- , :] công tác"
function parseManpowerLine(line, contractors){
  const m=line.match(new RegExp("^(.*?)\\s*(?:có|gồm|:|-|,)?\\s*(\\d+)\\s*"+V_UNIT+"\\b\\s*[-,:]?\\s*(.*)$","i"));
  if(!m) return null;
  let name=m[1].replace(/^(hôm nay|hom nay|hiện nay|hien nay|hiện|hien|nay)\s+/i,"").replace(/\s+(có|gồm|co|gom)\s*$/i,"").trim();
  if(!name) return null;
  return {contractor:vFuzzy(vCap(name), contractors||[]), headcount:parseInt(m[2],10), work_desc:(m[3]||"").replace(/^[-,:\s]+/,"").trim()};
}
// Nhân lực: dựng bảng xác nhận (dropdown nhà thầu) trước khi điền — đảm bảo khớp 100%
async function fvManpowerConfirm(text){
  const contractors=await kbAllContractors();                 // danh mục dự án + kho từ điển
  const tasks=await kbAllTasks();                             // tiến độ tổng + kho từ điển
  const kb=await getKB();
  let rows=fvSplitManpowerSmart(text, contractors);
  if(!rows.length){ rows=viNumWords(text).split(/[.\n;]+/).map(s=>s.trim()).filter(Boolean).map(l=>parseManpowerLine(l, contractors)).filter(Boolean); }
  const c=$("fv-confirm"); if(!c) return;
  if(!rows.length){ if($("fv-status"))$("fv-status").textContent="Chưa nhận ra nhân lực. Đọc dạng: “Nhà thầu A 85 công nhân lắp cột”."; return; }
  c.classList.remove("hide");
  FVM_SUGG=[];
  const body=rows.map(r=>{
    const lk=kb.links[vNorm(r.contractor)]; const linked = lk ? new Set(lk.tasks) : null;
    const bm=bestTaskMatch(r.work_desc||"", tasks, linked);
    let sugg="", note="";
    if(bm.task && vNorm(bm.task)!==vNorm(r.work_desc||"")){
      if(bm.score>=0.8){ r.work_desc=bm.task; note='<div class="muted" style="font-size:12px;margin:0 0 4px 2px;color:#2E6B22">✓ đã chuẩn hoá theo từ điển: <b>'+esc(bm.task)+'</b></div>'; }
      else if(bm.score>=0.5){ FVM_SUGG.push(bm.task); const si=FVM_SUGG.length-1;
        sugg='<div class="muted" style="font-size:12px;margin:0 0 4px 2px">≈ Gợi ý: <b>'+esc(bm.task)+'</b> <button class="btn btn-mut btn-sm" onclick="fvmSugg(this,'+si+')">Thay</button></div>'; }
    }
    return '<div class="fvmrow" style="margin-bottom:6px">'
      +'<div class="row" style="gap:6px;align-items:center">'
      +'<div style="flex:2"><select class="fvm-c">'+vMpOptions(r.contractor, contractors)+'</select></div>'
      +'<div style="flex:0;min-width:64px"><input type="number" class="fvm-n" min="0" value="'+r.headcount+'"></div>'
      +'<div style="flex:2"><input class="fvm-w" value="'+esc(r.work_desc||"")+'" placeholder="công tác"></div>'
      +'<div style="flex:0"><button class="btn btn-dan btn-sm" onclick="this.closest(\'.fvmrow\').remove()">✕</button></div></div>'
      + note + sugg + '</div>';
  }).join("");
  c.innerHTML='<div class="note-ok" style="margin-bottom:6px">Xác nhận nhà thầu & số lượng (công tác tự nắn theo Từ điển AI; chỗ gần giống có nút Thay) rồi bấm Điền:</div>'
    + body
    + '<button class="btn btn-ok btn-sm" onclick="fvConfirmManpower()">✅ Điền nhân lực vào nhật ký</button>';
}
let FVM_SUGG=[];
function fvmSugg(btn, i){
  const s=FVM_SUGG[i]; if(s==null) return; const row=btn.closest(".fvmrow"); if(!row) return;
  const w=row.querySelector(".fvm-w"); if(w) w.value=s;
  btn.textContent="Đã thay ✓"; btn.disabled=true; btn.classList.remove("btn-mut"); btn.classList.add("btn-ok");
}
async function fvConfirmManpower(){
  const rows=[].slice.call($("fv-confirm").querySelectorAll(".fvmrow"));
  for(const r of rows){
    const name=r.querySelector(".fvm-c").value.trim(); const cnt=parseInt(r.querySelector(".fvm-n").value,10); const work=r.querySelector(".fvm-w").value;
    if(!name || isNaN(cnt)) continue;
    await addManpower({contractor:name, headcount:cnt, work_desc:work});
    const mr=$("t-manpower").rows; const sel=mr[mr.length-1].querySelector(".mp-c");
    if(sel && sel.value!==name){ const o=document.createElement("option"); o.textContent=name; o.value=name; sel.appendChild(o); sel.value=name; }
  }
  $("fv-confirm").classList.add("hide"); $("fv-confirm").innerHTML="";
  $("fv-panel").classList.add("hide"); FV.kind=null;
}
async function fvFill(kind, text){
  if(kind==="note"){ const c0=$("f-note").value.trim(); $("f-note").value=(c0?c0+"\n":"")+text.trim(); return 1; }
  const _kbt=await kbAllTasks();
  const nudge=d=>{ const bm=bestTaskMatch(d,_kbt,null); return (bm.task && bm.score>=0.8 && vNorm(bm.task)!==vNorm(d))?bm.task:vCap(d); };  // chỉ tự nắn khi rất giống
  const lines=text.split(/[.\n;]+/).map(s=>s.trim()).filter(Boolean); let n=0;
  if(kind==="completed"){ lines.forEach(l=>{ let d=l.replace(/^(đã hoàn thành|da hoan thanh|đã|da)\s+/i,"").trim(); const q=viParseQty(d); let qd=null,qt=null; if(q){ qd=q.done; qt=q.total; d=d.replace(q.match,"").replace(/\s{2,}/g," ").trim(); } addCompleted({description:nudge(d), qty_done:qd, qty_total:qt}); n++; }); return n; }
  if(kind==="plans"){ lines.forEach(l=>{ let d=l.replace(/^(ngày mai|ngay mai|hôm sau|hom sau|kế hoạch|ke hoach)\s*:?\s*/i,"").trim(); const dt=viParseDate(d); let due=""; if(dt){ due=dt.iso; d=d.replace(dt.match,"").replace(/\s*(vào|trước|ngày)\s*$/i,"").replace(/\s{2,}/g," ").trim(); } addPlan({description:nudge(d), due_date:due}); n++; }); return n; }
  if(kind==="milestones"){ lines.forEach(l=>{ let d=l.trim(); const dt=viParseDate(d); let due=""; if(dt){ due=dt.iso; d=d.replace(dt.match,"").replace(/\s*(vào|trước|ngày|hoàn thành)\s*$/i,"").replace(/\s{2,}/g," ").trim(); } addMilestone({area:"",description:nudge(d),due_date:due}); n++; }); return n; }
  if(kind==="issues"){ lines.forEach(l=>{ let sev="medium"; if(/(sự cố|su co|tai nạn|tai nan|hỏng|hong|nguy hiểm|nguy hiem|dừng thi công|dung thi cong|sập|sap)/i.test(l)) sev="high"; addIssue({description:vCap(l.replace(/^(hiện còn|hien con|hiện|hien)\s+/i,"").trim()),severity:sev}); n++; }); return n; }
  return n;
}
function worksHtml(arr){ return (arr||[]).map(w=>esc(w).replace(/\r?\n/g,"<br>")).join("<br>"); }
function sevVN(s){ return ({low:"Thấp",medium:"Trung bình",high:"Cao"})[s] || s || ""; }
function consolidate(subs){
  const byC={}; let total=0;
  const completed=[]; const issues=[]; const seenC=new Set(), seenI=new Set();
  for(const s of subs){
    for(const m of s.manpower||[]){
      const n=m.headcount||0; total+=n;
      if(!byC[m.contractor]) byC[m.contractor]={total:0,works:[]};
      byC[m.contractor].total+=n;
      const wd=(m.work_desc||"").trim();
      if(wd && byC[m.contractor].works.indexOf(wd)<0) byC[m.contractor].works.push(wd);
    }
    for(const c of s.completed||[]){ const k=(c.description||"").trim().toLowerCase(); if(!seenC.has(k)){seenC.add(k);completed.push(c);} }
    for(const i of s.issues||[]){ const k=(i.description||"").trim().toLowerCase(); if(!seenI.has(k)){seenI.add(k);issues.push(i);} }
  }
  const manpower=Object.entries(byC).map(([contractor,v])=>({contractor,total:v.total,works:v.works})).sort((a,b)=>b.total-a.total);
  return {total, manpower, completed, issues};
}
let CUR = { user:"u1", project:"p1", editing:null, editingCreated:null, photoIds:[] };

// Expose lên window để iframe "Báo cáo ngày" (TAB BAO CAO NGAY) truy cập được qua window.parent.
// CUR + DataService khai bằng let/const (KHÔNG tự lên window) — thiếu 2 dòng này thì
// window.parent.DataService/CUR = undefined -> iframe không nạp được báo cáo (form kẹt ở mẫu mặc định).
window.CUR = CUR;
window.DataService = DataService;

// ---------- NAV + KHỞI ĐỘNG ----------
const HOME_TABS=["dieuhanh","hethong"];                                                   // cấp công ty
function setMode(mode){
  // Sidebar: hiện tất cả mục mà vai trò được phép (data-tab)
  document.querySelectorAll(".side-nav .nav-btn").forEach(b=>{
    if(b.id==="side-logout"){ b.style.display=(LOGIN_ENABLED && CUR_USER)?"flex":"none"; return; }
    const t=b.dataset.tab; if(t) b.style.display=can(t)?"flex":"none";
  });
}
function switchTab(tab){
  closeNav();
  
  const SUBTABS_THICONG = ["tc-dashboard", "tc-nhansu", "tc-duan", "tc-themduan", "tc-muctieu"];
  const SUBTABS_PROJECT = ["dashboard","baocaongay-new","baocao","danhmuc","tiendo","thanhtoan","lpb","thanhvien"];
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

    subTab = "tc-dashboard";
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
  if(t==="tc-dashboard") renderTcDashboard();
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
            const _p = (list || []).find(x => x.id === CUR.project);
            if (_p && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'PROJECT_CHANGED',
                projectId: CUR.project,
                projName: _p.name || '',
                projInfo: {
                  name: _p.name || '',
                  address: _p.address || '',
                  scale: _p.scale || '',
                  start_date: _p.start_date || '',
                  end_date: _p.end_date || ''
                }
              }, '*');
            }
          } catch (_) {}
        };
      } else {
        if (typeof syncKBToIframe === 'function') syncKBToIframe();
        (async () => {
          try {
            const _p = (await DataService.listProjects()).find(x => x.id === CUR.project);
            if (_p && iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'PROJECT_CHANGED',
                projectId: CUR.project,
                projName: _p.name || '',
                projInfo: {
                  name: _p.name || '',
                  address: _p.address || '',
                  scale: _p.scale || '',
                  start_date: _p.start_date || '',
                  end_date: _p.end_date || ''
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
  // Ghi đè alert mặc định bằng SweetAlert2 sang trọng
  if (typeof Swal !== "undefined") {
    window.alert = function(message) {
      Swal.fire({
        text: message,
        icon: 'info',
        confirmButtonColor: 'var(--primary)',
        confirmButtonText: 'Đồng ý'
      });
    };
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
  $("cur-project").onchange=async e=>{ CUR.project=e.target.value; metaSet("cur_project",CUR.project); const _p0=(projects||[]).find(x=>x.id===CUR.project); try{ if(typeof Swal!=='undefined') Swal.fire({toast:true, position:'top', icon:'info', title:'Đang chuyển sang: '+((_p0&&_p0.name)||'…'), showConfirmButton:false, timer:900, didOpen:(t)=>{ const b=Swal.getContainer(); } }); }catch(_){} document.body.style.cursor='progress'; await SyncEngine.pull(); renderDashboard(); renderMySubs(); renderContractors(); renderTiendo(); renderCdt(); renderTeam(); updateProjBanner(document.querySelector(".nav-btn.active, .sub-btn.active")?.dataset.tab); syncKBToIframe(); const _p=(projects||[]).find(x=>x.id===CUR.project); const _bcn=document.querySelector('iframe'); if(_bcn&&_bcn.contentWindow) _bcn.contentWindow.postMessage({type:'PROJECT_CHANGED', projectId: CUR.project, projName:(_p&&_p.name)||'', projInfo:_p?{name:_p.name||'', address:_p.address||'', scale:_p.scale||'', start_date:_p.start_date||'', end_date:_p.end_date||''}:null},'*'); document.body.style.cursor=''; try{ if(typeof Swal!=='undefined') Swal.fire({toast:true, position:'top', icon:'success', title:'Đang xem: '+((_p&&_p.name)||''), showConfirmButton:false, timer:1200}); }catch(_){} };
  document.querySelectorAll(".nav-btn[data-tab], .sub-tab-btn[data-tab]").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  const dz=$("td-drop");
  if(dz){
    dz.addEventListener("dragover", e=>{ e.preventDefault(); dz.classList.add("drag"); });
    dz.addEventListener("dragleave", ()=>dz.classList.remove("drag"));
    dz.addEventListener("drop", e=>{ e.preventDefault(); dz.classList.remove("drag"); if(e.dataTransfer.files&&e.dataTransfer.files[0]) importProgressFile(e.dataTransfer.files[0]); });
  }
  $("r-date").value=todayISO();
  // Đồng bộ Supabase chạy NỀN (không chặn hiển thị) — tránh app đứng chờ ~1 phút khi mạng/Supabase chậm
  // Supabase (nếu còn bật): auth + realtime chạy nền.
  if(SyncEngine.configured()){
    SupabaseSync.refreshUser().catch(()=>{});
    try{ SupabaseSync.subscribeRealtime(); }catch(_){}
  }
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
    if(su){ setTimeout(()=>startSession(su), 50); }
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



// ========== AI CENTER — Hỏi-đáp nhanh (voice + Gemini gọi trực tiếp) ==========
let AIV={rec:null,on:false};
let AI_MODELS=null;
// Tự hỏi Google danh sách model khả dụng với key này, ưu tiên bản flash; trả MẢNG để xoay vòng khi 1 model quá tải
async function pickGeminiModels(key){
  if(AI_MODELS) return AI_MODELS;
  try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    const d=await r.json();
    const ms=(d.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")).map(m=>m.name.replace(/^models\//,''));
    const flashStable=ms.filter(n=>/flash/.test(n) && !/(vision|thinking|exp|preview|live|image|tts)/.test(n));
    const flashAny=ms.filter(n=>/flash/.test(n) && !flashStable.includes(n));
    const rest=ms.filter(n=>!/flash/.test(n));
    AI_MODELS=[...flashStable, ...flashAny, ...rest];
    if(!AI_MODELS.length) AI_MODELS=["gemini-2.5-flash","gemini-flash-latest"];
  }catch(_){ AI_MODELS=["gemini-2.5-flash","gemini-flash-latest","gemini-2.0-flash"]; } // 1.5 đã bị Google khai tử
  return AI_MODELS;
}
function aiVoiceSupported(){ return ('webkitSpeechRecognition' in window)||('SpeechRecognition' in window); }
function aiVoiceToggle(){ if(AIV.on) aiVoiceStop(); else aiVoiceStart(); }
function aiVoiceStart(){
  if(!aiVoiceSupported()){ alert("Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome/Edge, hoặc gõ câu hỏi."); return; }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; const rec=new SR();
  rec.lang="vi-VN"; rec.continuous=true; rec.interimResults=true;
  AIV.base=$("ai-q")&&$("ai-q").value ? ($("ai-q").value.trim()+" ") : "";
  rec.onresult=(e)=>{ let fin="",interim=""; for(let i=e.resultIndex;i<e.results.length;i++){ const t=e.results[i]; if(t.isFinal) fin+=t[0].transcript+" "; else interim+=t[0].transcript; } if(fin) AIV.base+=fin; if($("ai-q")) $("ai-q").value=(AIV.base+interim).trim(); };
  rec.onend=()=>{ if(AIV.on){ try{rec.start();}catch(_){} } };
  try{ rec.start(); }catch(e){ alert("Không khởi động được ghi âm: "+e.message); return; }
  AIV.rec=rec; AIV.on=true;
  const b=$("ai-voice-btn"); if(b){ b.textContent="⏹ Dừng"; b.classList.remove("btn-ok"); b.classList.add("btn-dan"); }
}
function aiVoiceStop(){
  AIV.on=false; if(AIV.rec){ try{AIV.rec.stop();}catch(_){} AIV.rec=null; }
  const b=$("ai-voice-btn"); if(b){ b.textContent="🎤 Nói"; b.classList.add("btn-ok"); b.classList.remove("btn-dan"); }
}
// Thu thập dữ liệu app (chọn lọc theo dự án hiện tại) làm ngữ cảnh cho AI
async function buildAiContext(){
  const ctx={ today: todayISO() };
  try{
    const projects=await DataService.listProjects();
    const p=projects.find(x=>x.id===CUR.project);
    ctx.project = p ? p.name : "";
    let reports=(await DataService.listDailyReports()).filter(r=>r.project_id===CUR.project && (r.status||'approved')==='approved');
    reports.sort((a,b)=> (a.date<b.date?1:-1));
    ctx.recent_reports = reports.slice(0,7).map(r=>({
      date:r.date, total_manpower:r.total_manpower||0,
      completed:(r.completed||r.completedWorks||[]).slice(0,8),
      issues:(r.issues||[]).map(i=> typeof i==='string'?i:(i.description||'')).filter(Boolean).slice(0,8),
      note:r.f_note||r.note||""
    }));
    if(typeof getProgress==="function"){ const pr=await getProgress(); ctx.progress=(pr||[]).slice(0,40).map(t=>({task:t.task,start:t.start,end:t.end})); }
    const lpb=await metaGet("lpb_requests", []);
    ctx.lpb_open=(lpb||[]).filter(x=>x.project_id===CUR.project && x.status!=="completed" && x.status!=="closed")
      .slice(0,20).map(x=>({ma:x.id||x.code,title:x.title,bo_phan:x.to_dept||x.dept,trang_thai:x.status,uu_tien:x.priority,han:x.due_at}));
  }catch(e){ ctx._error=String(e); }
  return ctx;
}
// Định dạng nhẹ câu trả lời Markdown của AI → HTML an toàn (đậm, gạch đầu dòng)
function aiFormat(t){
  let s=esc(t||"");
  s=s.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');   // **đậm**
  s=s.replace(/^\s*[\*\-]\s+/gm,'• ');            // gạch đầu dòng * / -  → •
  s=s.replace(/^\s*(#{1,4})\s*/gm,'');            // bỏ dấu # tiêu đề markdown
  return s;
}
async function aiAsk(presetQ){
  const qEl=$("ai-q"); const out=$("ai-answer");
  if(presetQ && qEl) qEl.value=presetQ;
  const question=(presetQ||(qEl?qEl.value:"")||"").trim();
  if(!question){ if(out) out.innerHTML='<div style="color:#94a3b8">Hãy nhập hoặc nói câu hỏi.</div>'; return; }
  if(AIV.on) aiVoiceStop();
  if(!navigator.onLine){ if(out) out.innerHTML='<div style="color:#f87171">Cần kết nối mạng để hỏi AI Center.</div>'; return; }
  const key=(localStorage.getItem('sys_gemini_key')||"").trim();
  if(!key){ if(out) out.innerHTML='<div style="color:#fbbf24">Chưa có Gemini API Key. Vào <b>Hệ thống → Cấu hình Trợ lý AI (Gemini)</b> để nhập key (miễn phí tại aistudio.google.com).</div>'; return; }
  if(out) out.innerHTML='<div style="color:#fbbf24">⏳ Đang hỏi AI Center…</div>';
  try{
    const context=await buildAiContext();
    const sys="Bạn là trợ lý AI của Phòng Kỹ thuật Thi công (P.KTTC). Trả lời nhanh, chính xác, dễ hiểu cho lãnh đạo về tình hình công trình, dựa DUY NHẤT trên DỮ LIỆU được cung cấp. Bạn có thể: cung cấp thông tin, tóm tắt, tư vấn, đề xuất hướng xử lý. TUYỆT ĐỐI KHÔNG bịa số liệu, tên người, ngày tháng. Nếu dữ liệu không đủ để trả lời, hãy nói rõ: 'Dữ liệu hiện có chưa đủ để trả lời câu hỏi này.' Trả lời bằng tiếng Việt, ngắn gọn, có trọng tâm, ưu tiên gạch đầu dòng khi liệt kê.";
    const prompt=sys+"\n\n=== DỮ LIỆU APP (JSON) ===\n"+JSON.stringify(context,null,2)+"\n\n=== CÂU HỎI ===\n"+question;
    const models=await pickGeminiModels(key);
    let lastErr="";
    for(const model of models.slice(0,5)){
      try{
        const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.3,maxOutputTokens:800}})});
        const d=await r.json();
        if(d.error){
          lastErr=d.error.message||JSON.stringify(d.error);
          if(/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(lastErr)) break; // lỗi key → dừng hẳn
          continue; // quá tải / không hỗ trợ → thử model kế tiếp
        }
        const ans=d&&d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0]&&d.candidates[0].content.parts[0].text;
        if(ans){ window._aiLast={q:question,a:ans}; if(out) out.innerHTML='<div style="white-space:pre-wrap; line-height:1.6; color:#1e293b">'+aiFormat(ans)+'</div><button class="btn btn-pri btn-sm" onclick="tgSendAnswer(this)" style="margin-top:12px">📤 Gửi sang Telegram</button>'; return; }
        lastErr="model không trả về nội dung";
      }catch(e){ lastErr=String(e); }
    }
    if(out) out.innerHTML='<div style="color:#f87171">Lỗi Gemini: '+esc(lastErr||"không rõ")+'<br><span style="color:#94a3b8">Model miễn phí đang bận hoặc đã hết hạn mức — Sếp thử lại sau ít phút.</span></div>';
  }catch(e){ if(out) out.innerHTML='<div style="color:#f87171">Lỗi gọi AI: '+esc(String(e))+' (kiểm tra key Gemini ở Hệ thống và kết nối mạng)</div>'; }
}
// Đẩy "snapshot" dữ liệu dự án lên Supabase (bảng ai_snapshot) để bot Telegram đọc được khi không ai mở app
// Snapshot TỔNG HỢP toàn công ty (cho bot Telegram): mặc định trả lời tổng hợp,
// có kèm chi tiết từng dự án để khi hỏi đích danh 1 dự án thì trả lời riêng.
async function buildCompanySnapshot(){
  const out = { today: todayISO(), tong_hop: {}, du_an: [] };
  try {
    const projects = await DataService.listProjects();
    const statsList = [];
    for (const p of projects) {
      const st = (typeof projectStats==="function") ? await projectStats(p.id) : null;
      if (st) statsList.push(st);
    }
    const allReports = await metaGet("daily_reports", []);
    const stCounts = {}; statsList.forEach(s=>{ const k=s.proj.status||"Đang thi công"; stCounts[k]=(stCounts[k]||0)+1; });
    let totHD=0, totThu=0, totChi=0;
    for (const p of projects) {
      const sc=await metaGet("subcon_payments:"+p.id, []), ex=await metaGet("expenses:"+p.id, []), cd=await metaGet("cdt:"+p.id, []);
      (sc||[]).forEach(x=>{ if(!x.status||x.status==='approved') totChi+=Number(x.amount)||0; });
      (ex||[]).forEach(x=>{ if(!x.status||x.status==='approved') totChi+=Number(x.total)||0; });
      (cd||[]).forEach(x=>{ totHD+=Number(x.val)||0; totThu+=Number(x.paid)||0; });
    }
    const lpb = await metaGet("lpb_requests", []);
    const lpbKhan = (lpb||[]).filter(r=>r.status!=="completed" && (r.urgent || (r.due && new Date()>new Date(r.due)))).map(r=>({ma:r.id, tieu_de:r.title, phong:r.dept, han:r.due, khan:!!r.urgent}));
    const giaHan = [];
    for (const p of projects) {
      const items = await metaGet("progress:"+p.id, []);
      (items||[]).forEach(it=>(it.extensions||[]).forEach(ex=>giaHan.push({du_an:p.name, hang_muc:it.task, tu:ex.fromEnd, den:ex.toEnd, ly_do:ex.reason, khi:ex.at})));
    }
    giaHan.sort((a,b)=>(a.khi<b.khi?1:-1));
    out.tong_hop = {
      tong_du_an: statsList.length,
      dang_thi_cong: stCounts["Đang thi công"]||0,
      canh_bao_rui_ro: statsList.filter(s=>s.health<60).length,
      nhan_luc_hom_nay: statsList.reduce((a,s)=>a+(s.manpowerToday||0),0),
      hang_muc_qua_han: statsList.reduce((a,s)=>a+(s.overdueTasks||0),0),
      dong_tien: { gia_tri_hd: totHD, da_thu: totThu, con_phai_thu: totHD-totThu, da_chi: totChi, can_doi: totThu-totChi },
      lpb_khan: lpbKhan,
      gia_han_gan_day: giaHan.slice(0,30)
    };
    const today = todayISO();
    out.du_an = [];
    for (const s of statsList) {
      const pid = s.proj.id;
      const reps = (allReports||[]).filter(r=>r.project_id===pid && (r.status||'approved')==='approved').sort((a,b)=>(a.date<b.date?1:-1));
      const baoCaoHomNay = reps.some(r=>r.date===today);
      const items = await metaGet("progress:"+pid, []);
      const quaHan = (items||[]).filter(it=>it.end && today>it.end).map(it=>it.task).filter(Boolean).slice(0,10);
      const giaHanDA = [];
      (items||[]).forEach(it=>(it.extensions||[]).forEach(ex=>giaHanDA.push({hang_muc:it.task, tu:ex.fromEnd, den:ex.toEnd, ly_do:ex.reason, khi:ex.at})));
      giaHanDA.sort((a,b)=>(a.khi<b.khi?1:-1));
      const lpbDA = (lpb||[]).filter(r=>r.project_id===pid && r.status!=="completed").map(r=>({ma:r.id, tieu_de:r.title, phong:r.dept, trang_thai:r.status, khan:!!r.urgent, han:r.due}));
      const sc=await metaGet("subcon_payments:"+pid, []), ex2=await metaGet("expenses:"+pid, []), cd=await metaGet("cdt:"+pid, []);
      let chi=0, hd=0, thu=0;
      (sc||[]).forEach(x=>{ if(!x.status||x.status==='approved') chi+=Number(x.amount)||0; });
      (ex2||[]).forEach(x=>{ if(!x.status||x.status==='approved') chi+=Number(x.total)||0; });
      (cd||[]).forEach(x=>{ hd+=Number(x.val)||0; thu+=Number(x.paid)||0; });
      out.du_an.push({
        ten: s.proj.name,
        chi_huy_truong: s.proj.commander||"",
        trang_thai: s.proj.status||"Đang thi công",
        suc_khoe: s.health,
        tien_do_ke_hoach_pct: s.schedulePct,
        ti_le_bao_cao_pct: s.rate,
        bao_cao_ngay_hom_nay: baoCaoHomNay ? "Đã báo cáo" : "CHƯA báo cáo",
        nhan_luc_hom_nay: s.manpowerToday,
        tong_nhan_luc_da_huy_dong: s.totalManpower,
        so_hang_muc_qua_han: s.overdueTasks,
        ten_hang_muc_qua_han: quaHan,
        so_su_co_nghiem_trong: s.highIssues,
        gia_han_tien_do: giaHanDA.slice(0,15),
        lien_phong_ban: lpbDA.slice(0,15),
        tai_chinh: { gia_tri_hd: hd, da_thu: thu, con_phai_thu: hd-thu, da_chi: chi },
        bao_cao_gan_nhat: reps.slice(0,10).map(r=>({
          ngay:r.date,
          nhan_luc_tong: r.total_manpower||0,
          to_doi: [].concat(
            (r.bch ? [{ten:"Công nhật BCH", so_nguoi: parseInt(r.bch)||0}] : []),
            ((r.units||[]).map(u=>({ten:(u.name||'').trim(), so_nguoi: parseInt(u.n)||0})).filter(x=>x.ten))
          ),
          hoan_thanh:(r.completed||r.completedWorks||[]).slice(0,8),
          dang_lam:(r.current||r.currentWorks||[]).slice(0,8),
          van_de:(r.issues||[]).map(i=>typeof i==='string'?i:(i.description||'')).filter(Boolean).slice(0,8),
          ghi_chu:r.f_note||r.note||"",
          thoi_tiet:(function(){
            const L={sunny:'Nắng đẹp',cloudy:'Nhiều mây',rainy:'Có mưa',stormy:'Giông bão'};
            const sang=L[r.weather_m]||r.weather_m||'', chieu=L[r.weather_a]||r.weather_a||'';
            let t = (sang&&sang===chieu) ? ('cả ngày '+sang) : (sang&&chieu?('sáng '+sang+', chiều '+chieu):(sang||chieu));
            if((r.rain_hours||0)>0) t += (t?'; ':'')+'mưa ảnh hưởng thi công '+r.rain_hours+' giờ';
            return t||'(báo cáo không ghi nhận thời tiết)';
          })(),
          ghi_chu_thoi_tiet:r.weather_note||""
        }))
      });
    }
  } catch(e){ out._error=String(e); }
  return out;
}
async function pushAiSnapshot(){
  try{
    if(!navigator.onLine) return;
    // FIX 18/07: bot Telegram đọc ai_snapshot/_company trên FIREBASE (Admin SDK), nhưng hàm này
    // trước chỉ ghi Supabase — Supabase tắt là thoát sớm -> Firebase KHÔNG BAO GIỜ có snapshot
    // -> bot đói dữ liệu, Gemini tự bịa (Vinhomes/Ecopark...). Nay ghi Firebase là chính.
    const fbReady = (typeof FirebaseSync !== "undefined" && FirebaseSync.ready());
    const client = SupabaseSync.init(); // null khi SUPABASE_ENABLED=false
    if(!fbReady && !client) return;
    const ctx=await buildCompanySnapshot();
    // KHÓA AN TOÀN: không đẩy snapshot "nghèo dữ liệu" đè lên bản tốt trên server.
    // (VD: điện thoại vừa đăng nhập, chưa kéo dữ liệu về xong -> daily_reports còn rỗng.)
    if(ctx._error){ console.warn("Bỏ đẩy snapshot vì lỗi build:", ctx._error); return; }
    const totalReports = (ctx.du_an||[]).reduce((n,d)=>n+((d.bao_cao_gan_nhat||[]).length),0);
    if((ctx.du_an||[]).length===0 || totalReports===0){
      console.warn("Bỏ đẩy snapshot: chưa có dự án/báo cáo (có thể chưa đồng bộ xong) — tránh đè bản tốt.");
      return;
    }
    // FIREBASE — nguồn chính bot Telegram đọc (rules đã mở sẵn: allow write if isSignedIn)
    if (fbReady) {
      try {
        await window.fb.db.collection("ai_snapshot").doc("_company").set({
          data: ctx,
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (e) { console.warn("Lỗi push snapshot Firebase:", e && e.message); }
    }
    // Supabase — chỉ khi còn bật (giữ tương thích giai đoạn chuyển tiếp)
    if (client) {
      const { error } = await client.from("ai_snapshot").upsert({
        project_id: '_company',
        data: ctx,
        updated_at: new Date().toISOString()
      }, { onConflict: "project_id" });
      if(error) {
        console.warn("Lỗi push snapshot lên ai_snapshot:", error.message);
      }
    }
  }catch(e){
    console.warn("Lỗi gọi pushAiSnapshot:", e);
  }
}
function renderAiCenter(){ const q=$("ai-q"); if(q) q.focus(); pushAiSnapshot(); }

// ========== TELEGRAM — Đẩy thông báo từ app sang nhóm ==========
function saveTelegramConfig(){
  const t=($("tg-token")?$("tg-token").value:"").trim();
  const c=($("tg-chatid")?$("tg-chatid").value:"").trim();
  localStorage.setItem('tg_bot_token', t);
  localStorage.setItem('tg_chat_id', c);
  const m=$("tg-msg"); if(m){ m.style.color='var(--success)'; m.textContent='✅ Đã lưu cấu hình Telegram.'; setTimeout(()=>{ if(m) m.textContent=''; },3000); }
}
function loadTelegramConfig(){
  const t=localStorage.getItem('tg_bot_token'), c=localStorage.getItem('tg_chat_id');
  if(t && $("tg-token")) $("tg-token").value=t;
  if(c && $("tg-chatid")) $("tg-chatid").value=c;
}
// Gửi 1 tin nhắn tới nhóm Telegram. text hỗ trợ HTML (<b>, <i>). Trả {ok, ...}
async function tgNotify(text){
  const token=(localStorage.getItem('tg_bot_token')||'').trim();
  const chatId=(localStorage.getItem('tg_chat_id')||'').trim();
  if(!token||!chatId) return {ok:false, error:'Chưa cấu hình Telegram (Hệ thống → Thông báo qua Telegram)'};
  try{
    const params=new URLSearchParams({ chat_id:chatId, text:text, parse_mode:'HTML', disable_web_page_preview:'true' });
    const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method:'POST', body:params });
    return await r.json();
  }catch(e){ return {ok:false, error:String(e)}; }
}
async function tgTest(){
  const m=$("tg-msg"); if(m){ m.style.color='var(--primary)'; m.textContent='Đang gửi…'; }
  saveTelegramConfig();
  const r=await tgNotify('✅ <b>P.KTTC</b> — Kết nối Telegram thành công từ app P.KTTC.');
  if(m){ if(r&&r.ok){ m.style.color='var(--success)'; m.textContent='✅ Đã gửi! Kiểm tra nhóm Telegram.'; } else { m.style.color='var(--danger)'; m.textContent='❌ Lỗi: '+((r&&(r.description||r.error))||JSON.stringify(r)); } }
}
// Chuyển text sang HTML an toàn cho Telegram (escape + **đậm**)
function tgFmt(t){ let s=(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); return s.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>'); }
// Gửi câu hỏi + câu trả lời AI Center hiện tại sang nhóm Telegram
async function tgSendAnswer(btn){
  const L=window._aiLast; if(!L) return;
  if(btn){ btn.disabled=true; btn.textContent='Đang gửi…'; }
  const text='🤖 <b>AI Center — P.KTTC</b>\n\n<b>Hỏi:</b> '+tgFmt(L.q)+'\n\n'+tgFmt(L.a);
  const r=await tgNotify(text);
  if(btn){ btn.disabled=false; btn.textContent = (r&&r.ok) ? '✅ Đã gửi sang Telegram' : '📤 Gửi sang Telegram'; }
  if(!(r&&r.ok)) alert('Lỗi gửi Telegram: '+((r&&(r.description||r.error))||JSON.stringify(r))+'\n(Kiểm tra cấu hình ở Hệ thống → Thông báo qua Telegram)');
}

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

// --- AUTO IMPORT SCRIPT (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const imported = await metaGet("hr_imported_v2", false);
        if(!imported) {
            const newTeam = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trưởng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triệu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Từ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Từ Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bùi Đức Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đại",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Từ Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cầm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
            
            // Xóa sạch team cũ (nếu muốn) hoặc hợp nhất. Yêu cầu là "đưa từng vào từng bộ phận, theo đúng file a cung cấp"
            // Nên ghi đè để đảm bảo chính xác như file Excel.
            await metaSet("team:"+CUR.project, newTeam);
            await metaSet("hr_imported_v2", true);
            
            console.log("Đã import thành công 62 nhân sự từ file DANH SACH NHAN SU.xlsx vào hệ thống!");
            location.reload();
        }
    }
}, 3000);
// --------------------------------------

// --- AUTO IMPORT DEPARTMENTS (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const importedDepts = await metaGet("hr_imported_depts_v3", false);
        if(!importedDepts) {
            const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trưởng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triệu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Từ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Từ Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bùi Đức Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đại",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Từ Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cầm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
            let deptsData = await metaGet("departments", {});
            
            // Khởi tạo các mảng
            if(!deptsData.banql) deptsData.banql = [];
            if(!deptsData.thicong) deptsData.thicong = [];
            if(!deptsData.qaqc) deptsData.qaqc = [];
            if(!deptsData.hse) deptsData.hse = [];
            if(!deptsData.shopdrawing) deptsData.shopdrawing = [];
            if(!deptsData.baotri) deptsData.baotri = [];
            
            rawUsers.forEach(u => {
                let key = "";
                if(u.department === "Quản lý") key = "banql";
                else if(u.department === "Bộ phận Thi công") key = "thicong";
                else if(u.department === "Bộ phận QA-QC") key = "qaqc";
                else if(u.department === "Bộ phận HSE") key = "hse";
                else if(u.department === "Bộ phận Shopdrawing") key = "shopdrawing";
                else if(u.department === "Bộ phận Bảo trì") key = "baotri";
                
                if(key) {
                    deptsData[key].push({ name: u.name, position: u.title });
                }
            });
            
            await metaSet("departments", deptsData);
            await metaSet("hr_imported_depts_v3", true);
            
            console.log("Đã phân bổ 62 nhân sự vào từng phòng ban tương ứng!");
            location.reload();
        }
    }
}, 3000);
// --------------------------------------

// --- AUTO FIX NAMES (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const fixedNames = await metaGet("hr_fixed_names_v1_correct", false);
        if(!fixedNames) {
            const fixMap = {
                "Từ Minh Đạo": "Tô Minh Đạo",
                "Từ Trọng Hoài": "Tô Trọng Hoài",
                "Từ Hoàng Anh": "Tô Hoàng Anh",
                "Diệu Anh Quốc": "Điều Anh Quốc"
            };

            // 1. Fix in departments
            let deptsData = await metaGet("departments", {});
            let updatedDepts = false;
            Object.keys(deptsData).forEach(key => {
                deptsData[key].forEach(m => {
                    if(fixMap[m.name]) {
                        m.name = fixMap[m.name];
                        updatedDepts = true;
                    }
                });
            });
            if(updatedDepts) await metaSet("departments", deptsData);

            // 2. Fix in team
            let teamData = await metaGet("team:" + CUR.project, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedTeam = true;
                }
            });
            if(updatedTeam) await metaSet("team:" + CUR.project, teamData);

            // 3. Fix in users
            let usersData = await metaGet("users", []);
            let updatedUsers = false;
            usersData.forEach(u => {
                if(fixMap[u.full_name]) {
                    u.full_name = fixMap[u.full_name];
                    updatedUsers = true;
                }
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedUsers = true;
                }
            });
            if(updatedUsers) await metaSet("users", usersData);

            await metaSet("hr_fixed_names_v1_correct", true);
            console.log("Hệ thống đã sửa lỗi chính tả tên các nhân sự (Tô Hoàng Anh, Điều Anh Quốc...) thành công!");
            location.reload();
        }
    }
}, 3000);
// --------------------------------------

// --- AUTO FIX NAMES V2 (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const fixedNamesV2 = await metaGet("hr_fixed_names_v2", false);
        if(!fixedNamesV2) {
            const fixMap = {
                "Tô Minh Đạo": "Tạ Minh Đạo",
                "Từ Minh Đạo": "Tạ Minh Đạo",
                "Nguyễn Văn Đại": "Nguyễn Văn Đới",
                "Trần Văn Trưởng": "Trần Văn Trường",
                "Bùi Đức Thắng": "Bá Đức Thông",
                "Nguyễn Khắc Vũ": "Nguyễn Khắc Vụ"
            };

            // 1. Fix in departments
            let deptsData = await metaGet("departments", {});
            let updatedDepts = false;
            Object.keys(deptsData).forEach(key => {
                deptsData[key].forEach(m => {
                    if(fixMap[m.name]) {
                        m.name = fixMap[m.name];
                        updatedDepts = true;
                    }
                });
            });
            if(updatedDepts) await metaSet("departments", deptsData);

            // 2. Fix in team
            let teamData = await metaGet("team:" + CUR.project, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedTeam = true;
                }
            });
            if(updatedTeam) await metaSet("team:" + CUR.project, teamData);

            // 3. Fix in users
            let usersData = await metaGet("users", []);
            let updatedUsers = false;
            usersData.forEach(u => {
                if(fixMap[u.full_name]) {
                    u.full_name = fixMap[u.full_name];
                    updatedUsers = true;
                }
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedUsers = true;
                }
            });
            if(updatedUsers) await metaSet("users", usersData);

            await metaSet("hr_fixed_names_v2", true);
            console.log("Hệ thống đã cập nhật sửa lỗi tên (Tạ Minh Đạo, Nguyễn Văn Đới...) thành công!");
            location.reload();
        }
    }
}, 3500);
// --------------------------------------

// --- AUTO FIX NAMES V3 (RUNS ONCE) ---
setTimeout(async () => {
    if(CUR && CUR.project) {
        const fixedNamesV3 = await metaGet("hr_fixed_names_v3", false);
        if(!fixedNamesV3) {
            const fixMap = {
                "Đinh Văn Cường": "Đinh Văn Cương",
                "Võ Xuân Triệu": "Võ Xuân Triều",
                "Phạm Ngọc Cầm": "Phạm Ngọc Cẩm"
            };

            // 1. Fix in departments
            let deptsData = await metaGet("departments", {});
            let updatedDepts = false;
            Object.keys(deptsData).forEach(key => {
                deptsData[key].forEach(m => {
                    if(fixMap[m.name]) {
                        m.name = fixMap[m.name];
                        updatedDepts = true;
                    }
                });
            });
            if(updatedDepts) await metaSet("departments", deptsData);

            // 2. Fix in team
            let teamData = await metaGet("team:" + CUR.project, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedTeam = true;
                }
            });
            if(updatedTeam) await metaSet("team:" + CUR.project, teamData);

            // 3. Fix in users
            let usersData = await metaGet("users", []);
            let updatedUsers = false;
            usersData.forEach(u => {
                if(fixMap[u.full_name]) {
                    u.full_name = fixMap[u.full_name];
                    updatedUsers = true;
                }
                if(fixMap[u.name]) {
                    u.name = fixMap[u.name];
                    updatedUsers = true;
                }
            });
            if(updatedUsers) await metaSet("users", usersData);

            await metaSet("hr_fixed_names_v3", true);
            console.log("Hệ thống đã cập nhật sửa đổi: Đinh Văn Cương, Võ Xuân Triều, Phạm Ngọc Cẩm thành công!");
            location.reload();
        }
    }
}, 3500);
// --------------------------------------

// --- AUTO MIGRATE 62 USERS TO GLOBAL USERS TABLE (RUNS ONCE) ---
setTimeout(async () => {
    const migrated = await metaGet("hr_migrated_global_users", false);
    if(!migrated) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        let globalUsers = await metaGet("users", []);

        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        };
        const genUsername = (name) => {
            let parts = removeAccents(name).trim().split(/\s+/);
            if(parts.length === 1) return parts[0];
            let last = parts.pop();
            let initials = parts.map(p => p[0]).join('');
            return last + initials;
        };

        let countAdded = 0;
        rawUsers.forEach(u => {
            // Check if already exists by id
            let exists = globalUsers.find(g => g.id === u.id);
            if(!exists) {
                // Determine base username
                let baseUsername = genUsername(u.name);
                let finalUsername = baseUsername;
                let counter = 1;
                // Ensure unique username
                while(globalUsers.find(g => g.username === finalUsername)) {
                    finalUsername = baseUsername + counter;
                    counter++;
                }

                globalUsers.push({
                    id: u.id,
                    full_name: u.name,
                    username: finalUsername,
                    role: u.role,
                    pw: "" // FIX 18/07: khong cap mat khau mac dinh — lan dau dang nhap tu dat
                });
                countAdded++;
            }
        });

        if(countAdded > 0) {
            await metaSet("users", globalUsers);
        }
        await metaSet("hr_migrated_global_users", true);
        console.log("Đã khởi tạo thành công " + countAdded + " tài khoản người dùng với tên đăng nhập tương ứng! (Mật khẩu mặc định: 123456)");
        location.reload();
    }
}, 4000);
// --------------------------------------

// --- AUTO FIX GLOBAL USERS (RUNS ONCE) ---
setTimeout(async () => {
    const fixedGlobal = await metaGet("hr_fixed_global_users_v2", false);
    if(!fixedGlobal) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        let globalUsers = await metaGet("users", []);

        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        };
        const genUsername = (name) => {
            let parts = removeAccents(name).trim().split(/\s+/);
            if(parts.length === 1) return parts[0];
            let last = parts.pop();
            let initials = parts.map(p => p[0]).join('');
            return last + initials;
        };

        rawUsers.forEach(u => {
            // Find existing user by ID or by full_name
            let existing = globalUsers.find(g => g.id === u.id || g.full_name === u.name);
            
            let targetUsername = genUsername(u.name);
            // Deduplicate username
            let counter = 1;
            let finalUsername = targetUsername;
            while(globalUsers.find(g => g.username === finalUsername && g !== existing)) {
                finalUsername = targetUsername + counter;
                counter++;
            }

            if(existing) {
                // Force update
                existing.full_name = u.name;
                existing.username = finalUsername;
                existing.role = u.role;
                // FIX 18/07: khong tu dien mat khau mac dinh — pw rong de nguoi dung tu dat lan dau
            } else {
                // Create new
                globalUsers.push({
                    id: u.id,
                    full_name: u.name,
                    username: finalUsername,
                    role: u.role,
                    pw: "" // FIX 18/07: khong cap mat khau mac dinh — lan dau dang nhap tu dat
                });
            }
        });

        await metaSet("users", globalUsers);
        await metaSet("hr_fixed_global_users_v2", true);
        console.log("Đã CẬP NHẬT CHÍNH XÁC vai trò và tên đăng nhập cho tất cả nhân sự trong Quản lý Người dùng!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO DEDUPLICATE USERS (RUNS ONCE) ---
setTimeout(async () => {
    const fixedGlobal = await metaGet("hr_dedupe_global_users", false);
    if(!fixedGlobal) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        let globalUsers = await metaGet("users", []);

        const removeAccents = (str) => {
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        };
        const genUsername = (name) => {
            let parts = removeAccents(name).trim().split(/\s+/);
            if(parts.length === 1) return parts[0];
            let last = parts.pop();
            let initials = parts.map(p => p[0]).join('');
            return last + initials;
        };

        // Keep system defaults
        let newUsers = globalUsers.filter(u => ['u_admin','u_dir','u_pm','u_sm','u_eng','u_view'].includes(u.id));

        // Re-add 62 users from temp_team.json exactly
        rawUsers.forEach(u => {
            let targetUsername = genUsername(u.name);
            let counter = 1;
            let finalUsername = targetUsername;
            while(newUsers.find(g => g.username === finalUsername)) {
                finalUsername = targetUsername + counter;
                counter++;
            }

            // check if there's an existing pw from global users we can preserve
            let existing = globalUsers.find(g => g.full_name === u.name && g.pw);

            newUsers.push({
                id: u.id,
                full_name: u.name,
                username: finalUsername,
                role: u.role,
                pw: existing ? existing.pw : "" // FIX 18/07: het mat khau mac dinh 123456
            });
        });

        await metaSet("users", newUsers);
        await metaSet("hr_dedupe_global_users", true);
        console.log("Đã khởi tạo, làm sạch rác và cập nhật chính xác quyền CHT, Giám đốc, Kỹ sư cho toàn bộ người dùng!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX ROLES AND TITLES (RUNS ONCE) ---
setTimeout(async () => {
    const fixedRoles = await metaGet("hr_fixed_roles_titles", false);
    if(!fixedRoles) {
        const rawUsers = [
    {
        "id":  "7da2168a-47be-41a8-b11b-75e1bd448ce8",
        "title":  "P.TGĐ",
        "name":  "Hồ Văn Thi",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "9b0c8a97-3c8d-465f-a5ee-6edab2386d19",
        "title":  "",
        "name":  "Huỳnh Thanh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "director",
        "added_at":  "2026-06-24",
        "department":  "Quản lý"
    },
    {
        "id":  "78236f45-8794-4a59-86a3-609741e29065",
        "title":  "Thủ kho",
        "name":  "Nguyễn Hữu Phước",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bf456e50-ecd7-4a0e-8b83-53a1e36614df",
        "title":  "CHT",
        "name":  "Lê Hiếu",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f72be685-699d-4b00-bae7-2d63cfd55141",
        "title":  "CHT",
        "name":  "Thiều Quang Minh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "894f4cd6-e836-46c0-8a90-18be941abd50",
        "title":  "CHT",
        "name":  "Phan Lê Duy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e3171621-051a-47da-b4d7-2d2f37c69fc3",
        "title":  "CHT",
        "name":  "Phan Thành Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "70c65025-3fd2-4928-af2f-b91b3ee13943",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Lâm",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d549beec-ae12-4a7d-8af6-f9d72c9a7e11",
        "title":  "Thủ kho",
        "name":  "Nguyễn Thanh Bình",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "36f1eb27-b395-46bb-902d-c62d79e0c21d",
        "title":  "Kỹ sư",
        "name":  "Điều Anh Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "58a3f626-b197-4579-b7f8-71036aabce6c",
        "title":  "Thủ kho",
        "name":  "Phan Tiến Sĩ",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa144fa4-fd23-4ec8-b463-66edff6b39c8",
        "title":  "Kỹ sư",
        "name":  "Phạm Ngọc Vũ",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ca0cbd94-a295-42af-a537-c4d2a9bf14be",
        "title":  "CHT",
        "name":  "Trương Văn Vũ Em",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c18cf22b-a063-45d3-baca-f04925458849",
        "title":  "CHT",
        "name":  "Nguyễn Sư Hoài Anh Đức",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "3feb4094-dd65-4854-8876-7ac935550185",
        "title":  "Trắc đạc",
        "name":  "Trương Hoài Ngọc",
        "status":  "active",
        "phone":  "",
        "role":  "surveyor",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "b8d8d55b-f3c7-4d8c-80b3-8bb713de61d4",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Khuê",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "07b233ed-4c9c-4f6e-9774-1d6ae614d9ab",
        "title":  "Thủ kho",
        "name":  "Trần Văn Trường",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "aa3227b7-7466-47fc-8b45-72813d0c95b3",
        "title":  "Thủ kho",
        "name":  "Trần Ngọc Giàu",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d621ece9-ded4-48e6-af7d-7595abe801c9",
        "title":  "Thủ kho",
        "name":  "Phạm Thanh Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "4b76bed5-fe55-4b90-9f08-913537556b01",
        "title":  "Thủ kho",
        "name":  "Nguyễn Minh Khánh",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8e839c88-4b7a-4441-9031-ca17fd8d3bc5",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Thành",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "5de6b666-9497-4ae4-ade1-cb3fe25cd4b9",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Khắc Điệp",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "78a55374-67c9-49ce-b0fe-530a8a8d2d1d",
        "title":  "Thủ kho",
        "name":  "Nguyễn Trọng Việt",
        "status":  "active",
        "phone":  "",
        "role":  "storekeeper",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "8607c999-17fc-4933-b992-6aa121b2c8d7",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Thanh Luân",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c6c927ec-846f-495b-8014-6bf8ea570bc5",
        "title":  "Kỹ sư",
        "name":  "Trần Trung Kiên",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6106cfc8-d77f-4b85-abe3-d01853e774d1",
        "title":  "CHT",
        "name":  "Võ Xuân Triều",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "c822abd1-1a13-4740-96dc-bf647ab3b489",
        "title":  "CHT",
        "name":  "Tạ Minh Đạo",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "f3d3a811-2ae6-4d82-8d70-50374befc993",
        "title":  "Kỹ sư",
        "name":  "Tô Trọng Hoài",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "2c80c1a7-6da0-4289-8993-6c4dff5c5154",
        "title":  "Kỹ sư",
        "name":  "Trần Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "33b2f4f3-3418-497f-8194-de3c7a50eebc",
        "title":  "CHT",
        "name":  "Phan Bá Nam",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "ef7be1ef-db72-4c52-ae95-5e3cc973347d",
        "title":  "Kỹ sư",
        "name":  "Trần Hùng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "50bc0eda-c2d8-4fa4-8306-62013301527c",
        "title":  "Trắc đạc",
        "name":  "Lê Trung Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "surveyor",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "12791698-3216-4dee-9627-7f699bfa9273",
        "title":  "ME",
        "name":  "Bá Đức Thông",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "255f5997-18c3-46c3-8815-a9ac169c5e76",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Đới",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "d9cf462f-ac88-4545-bd78-7a4bd459b00b",
        "title":  "Kỹ sư",
        "name":  "Trần Sơn Anh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "adf19be9-b78a-4895-bc85-08fbacfd2b89",
        "title":  "Kỹ sư",
        "name":  "Trần Thanh Hậu",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "9b9cd828-4154-4fd1-87ea-d207fb9c780c",
        "title":  "CHT",
        "name":  "Nguyễn Tuấn Huy",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "399b97f3-8753-4279-8587-6c1ef3c8005d",
        "title":  "Kỹ sư",
        "name":  "Trương Phước Danh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "280ed8bd-e7bf-4e3e-8be8-7d101afcff3c",
        "title":  "Kỹ sư",
        "name":  "Cao Xuân Thắng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "46fec556-e311-4daf-a303-2bbe75420e3a",
        "title":  "CHT",
        "name":  "Tô Hoàng Anh",
        "status":  "active",
        "phone":  "",
        "role":  "site_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "7142ed39-6462-4b9f-b98b-de74dd62f62f",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Văn Trọng",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "e592e0be-d2d0-4a0d-bae8-b111bc37e7f7",
        "title":  "Kỹ sư",
        "name":  "Dương Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "24b7c37a-5385-4a5f-bff5-550359e8a3cd",
        "title":  "Kỹ sư",
        "name":  "Đinh Văn Cương",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "bb071b8d-3b67-4221-934a-19ecd1ce5a51",
        "title":  "Kỹ sư",
        "name":  "Nguyễn Hồng Hạnh",
        "status":  "active",
        "phone":  "",
        "role":  "engineer",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Thi công"
    },
    {
        "id":  "6ed3e1e1-9f15-4c32-b6d0-195b588b5900",
        "title":  "Nhân viên QA - QC",
        "name":  "Phan Đình Trí",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "939f45a6-bfb1-4bd4-b996-2360d9a8d0a3",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Đức Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "0e7791b8-a870-4a30-87d9-230dacdd1188",
        "title":  "Nhân viên QA - QC",
        "name":  "Phạm Ngọc Cẩm",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7003053b-7528-4d6a-b1ce-cefe8f641c2b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Ngọc Quốc",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "fd7dccc9-ec75-4cbf-bb2d-07b217e7745d",
        "title":  "Nhân viên QA - QC",
        "name":  "Lê Minh Khoa",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "7a23fbbb-a5bf-46fe-9a3b-2194577e926b",
        "title":  "Nhân viên QA - QC",
        "name":  "Nguyễn Khắc Vụ",
        "status":  "active",
        "phone":  "",
        "role":  "qc_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "84bf3485-6370-443f-822a-75f6c2e9402f",
        "title":  "Quản lý Bộ phận",
        "name":  "Phan Khánh Phương",
        "status":  "active",
        "phone":  "",
        "role":  "qc_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận QA-QC"
    },
    {
        "id":  "b5b56cfe-4818-4e87-9b5f-b6ad1c7b4ae6",
        "title":  "",
        "name":  "Nguyễn Tấn Hoanh",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "d209f527-c9d1-4cfa-b6f3-521232a44152",
        "title":  "Quản lý Bộ phận",
        "name":  "Lê Thanh Tuấn",
        "status":  "active",
        "phone":  "",
        "role":  "hse_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "491cc13b-4033-47ec-a43b-50e49a8536d3",
        "title":  "",
        "name":  "Phạm Duy Tài",
        "status":  "active",
        "phone":  "",
        "role":  "hse_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận HSE"
    },
    {
        "id":  "e5e2204c-cae0-465a-a889-48aa6bfb0cb1",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Công Luận",
        "status":  "active",
        "phone":  "",
        "role":  "sd_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "e394a159-56ec-44df-834b-087a4d192e5b",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Đặng Thanh Quang",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "09e6cf4e-a350-4eb2-ae94-967e9bf8dd7d",
        "title":  "Nhân viên Shopdrawing",
        "name":  "Trần Quốc Trung",
        "status":  "active",
        "phone":  "",
        "role":  "sd_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Shopdrawing"
    },
    {
        "id":  "6d04c992-56d6-46db-ba2c-5d612d61249d",
        "title":  "Quản lý Bộ phận",
        "name":  "Nguyễn Hoài Nam",
        "status":  "active",
        "phone":  "",
        "role":  "mt_manager",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "234c0de0-4b02-4f69-a396-f299c6074d6e",
        "title":  "Công nhân",
        "name":  "Lâm Văn Tiến",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "b274ab9f-0c43-4de8-83bd-2995c3fad60c",
        "title":  "Công nhân",
        "name":  "Võ Sơn Tùng",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "7f3e562f-f61b-4d75-9215-07f304d86c98",
        "title":  "Công nhân",
        "name":  "Hồ Văn Chanh Em",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    },
    {
        "id":  "6d9c77e5-1ec6-4aa7-a778-61f6dcaf370f",
        "title":  "Công nhân",
        "name":  "Nguyễn Văn Vũ Trường",
        "status":  "active",
        "phone":  "",
        "role":  "mt_staff",
        "added_at":  "2026-06-24",
        "department":  "Bộ phận Bảo trì"
    }
];
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        rawUsers.forEach(u => {
            // Update users
            let user = globalUsers.find(g => g.id === u.id);
            if(user) user.role = u.role;

            // Update team
            let tUser = teamData.find(g => g.id === u.id);
            if(tUser) {
                tUser.role = u.role;
                tUser.title = u.title;
            }

            // Update departments
            Object.keys(deptsData).forEach(key => {
                let dUser = deptsData[key].find(m => m.id === u.id);
                if(dUser) {
                    dUser.role = u.role;
                    dUser.position = u.title;
                    dUser.title = u.title;
                }
            });
        });

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_roles_titles", true);
        
        console.log("Đã CẬP NHẬT CHÍNH XÁC vai trò Thủ Kho, Trắc Đạc và chức vụ Nhân viên HSE!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX NAME TIEN AND ROLES (RUNS ONCE) ---
setTimeout(async () => {
    const fixedTien = await metaGet("hr_fixed_tien_congnhan", false);
    if(!fixedTien) {
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        const fixName = (arr) => {
            let u = arr.find(g => g.full_name === "Lâm Văn Tiến" || g.name === "Lâm Văn Tiến");
            if(u) {
                if(u.full_name) u.full_name = "Lâm Văn Tiền";
                if(u.name) u.name = "Lâm Văn Tiền";
            }
        };

        fixName(globalUsers);
        fixName(teamData);
        Object.keys(deptsData).forEach(key => fixName(deptsData[key]));

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_tien_congnhan", true);
        
        console.log("Đã SỬA LỖI TÊN Lâm Văn Tiền và cập nhật lại chính xác danh xưng Công nhân, Nhân viên Shopdrawing!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX BLANK POSITIONS (RUNS ONCE) ---
setTimeout(async () => {
    const fixedPos = await metaGet("hr_fixed_blank_pos", false);
    if(!fixedPos) {
        
        let deptsData = await metaGet("departments", {});
        
        // Hoanh
        if(deptsData["hse"]) {
            let hoanh = deptsData["hse"].find(m => m.name.includes("Hoanh"));
            if(hoanh && !hoanh.position) hoanh.position = "Nhân viên HSE";
            
            let tai = deptsData["hse"].find(m => m.name.includes("Tài"));
            if(tai && !tai.position) tai.position = "Nhân viên HSE";
        }

        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_blank_pos", true);
        
        console.log("Đã cập nhật hiển thị chức vụ Nhân viên HSE trên bảng Bộ phận!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX NAME DIEP (RUNS ONCE) ---
setTimeout(async () => {
    const fixedDiep = await metaGet("hr_fixed_name_diep_correct", false);
    if(!fixedDiep) {
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        const fixName = (arr) => {
            let u = arr.find(g => g.full_name === "Nguyễn Khắc Diệp" || g.name === "Nguyễn Khắc Diệp");
            if(u) {
                if(u.full_name) u.full_name = "Nguyễn Khắc Điệp";
                if(u.name) u.name = "Nguyễn Khắc Điệp";
            }
        };

        fixName(globalUsers);
        fixName(teamData);
        Object.keys(deptsData).forEach(key => fixName(deptsData[key]));

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_name_diep_correct", true);
        
        console.log("Đã sửa đúng chính tả tên Nguyễn Khắc Điệp!");
        location.reload();
    }
}, 1500);
// --------------------------------------

// --- AUTO FIX ROLE LUAN (RUNS ONCE) ---
setTimeout(async () => {
    const fixedLuan = await metaGet("hr_fixed_role_luan", false);
    if(!fixedLuan) {
        
        let globalUsers = await metaGet("users", []);
        let deptsData = await metaGet("departments", {});
        let teamData = await metaGet("team:" + CUR.project, []);

        const fixRole = (arr, isUserArray) => {
            let u = arr.find(g => g.full_name === "Nguyễn Thanh Luân" || g.name === "Nguyễn Thanh Luân");
            if(u) {
                u.role = "storekeeper";
                if(!isUserArray) {
                    if(u.title !== undefined) u.title = "Thủ kho";
                    if(u.position !== undefined) u.position = "Thủ kho";
                }
            }
        };

        fixRole(globalUsers, true);
        fixRole(teamData, false);
        Object.keys(deptsData).forEach(key => fixRole(deptsData[key], false));

        await metaSet("users", globalUsers);
        await metaSet("team:" + CUR.project, teamData);
        await metaSet("departments", deptsData);
        await metaSet("hr_fixed_role_luan", true);
        
        console.log("Đã CẬP NHẬT CHÍNH XÁC vai trò và chức vụ Thủ Kho cho Nguyễn Thanh Luân!");
        location.reload();
    }
}, 1500);
// --------------------------------------

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

// --- AUTO FIX SPELLING FOR DIỆU ANH QUỐC & NGUYỄN KHẮC DIỆP ---
setTimeout(async () => {
    const fixedSpelling = await metaGet("hr_fixed_spelling_vietnamese_2026", false);
    if (!fixedSpelling) {
        // 1. Fix in users
        let globalUsers = await metaGet("users", []);
        let updatedUsers = false;
        globalUsers.forEach(u => {
            if (u.full_name === "Diệu Anh Quốc") { u.full_name = "Điều Anh Quốc"; updatedUsers = true; }
            if (u.name === "Diệu Anh Quốc") { u.name = "Điều Anh Quốc"; updatedUsers = true; }
            if (u.full_name === "Nguyễn Khắc Diệp") { u.full_name = "Nguyễn Khắc Điệp"; updatedUsers = true; }
            if (u.name === "Nguyễn Khắc Diệp") { u.name = "Nguyễn Khắc Điệp"; updatedUsers = true; }
        });
        if (updatedUsers) {
            await metaSet("users", globalUsers);
        }

        // 2. Fix in departments
        let deptsData = await metaGet("departments", {});
        let updatedDepts = false;
        Object.keys(deptsData).forEach(key => {
            if (Array.isArray(deptsData[key])) {
                deptsData[key].forEach(m => {
                    if (m.name === "Diệu Anh Quốc") { m.name = "Điều Anh Quốc"; updatedDepts = true; }
                    if (m.name === "Nguyễn Khắc Diệp") { m.name = "Nguyễn Khắc Điệp"; updatedDepts = true; }
                });
            }
        });
        if (updatedDepts) {
            await metaSet("departments", deptsData);
        }

        // 3. Fix in all project teams
        const projects = await DataService.listProjects();
        for (const p of projects) {
            let teamData = await metaGet("team:" + p.id, []);
            let updatedTeam = false;
            teamData.forEach(u => {
                if (u.name === "Diệu Anh Quốc") { u.name = "Điều Anh Quốc"; updatedTeam = true; }
                if (u.name === "Nguyễn Khắc Diệp") { u.name = "Nguyễn Khắc Điệp"; updatedTeam = true; }
            });
            if (updatedTeam) {
                await metaSet("team:" + p.id, teamData);
            }
        }

        // 4. Mark as fixed and reload
        await metaSet("hr_fixed_spelling_vietnamese_2026", true);
        console.log("Đã cập nhật chính tả cho nhân sự: Điều Anh Quốc & Nguyễn Khắc Điệp thành công!");
        location.reload();
    }
}, 2000);



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
