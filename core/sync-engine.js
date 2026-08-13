// ---------- SYNC ORCHESTRATION ----------
// Điều phối local dirty-key và FirebaseSync; mapping cloud vẫn chỉ nằm ở firebase-sync.js.
const SyncEngine = {
  online: navigator.onLine,
  status: "idle",
  lastError: "",
  // Supabase đã gỡ bỏ 28/07 — giữ configured() trả false để mọi nhánh cũ (nếu còn) tự dừng an toàn.
  configured(){ return false; },
  async setPill(){
    const p = document.getElementById("sync-pill"); if(!p) return;
    // Chỉ hiển thị cho tài khoản admin theo yêu cầu
    if (typeof CUR_USER !== 'undefined' && CUR_USER && CUR_USER.role !== 'admin') {
      p.style.display = "none";
      return;
    } else {
      p.style.display = "";
    }
    // Hiển thị trạng thái thật, không đồng nhất "có mạng" với "đã đồng bộ".
    p.style.cursor="default"; p.onclick=null;
    if (!this.online) { p.textContent="Chờ mạng — đã lưu trên máy"; p.className="pill pill-off"; return; }
    if (!(typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED && typeof FirebaseSync !== "undefined" && FirebaseSync.ready())) {
      p.textContent="Chưa kết nối máy chủ"; p.className="pill pill-off"; return;
    }
    if (this.status === "syncing") { p.textContent="Đang đồng bộ…"; p.className="pill pill-sync"; return; }
    if (this.status === "error") { p.textContent="Đồng bộ lỗi — dữ liệu vẫn ở máy"; p.className="pill pill-dan"; p.title=this.lastError; return; }
    const dirty = await idbGet("meta", "meta_dirty_keys").catch(()=>null);
    const pending = ((dirty && dirty.value) || []).filter(k=>!SYNC_SKIP_KEYS.includes(k)).length;
    p.textContent = pending ? `Có ${pending} thay đổi chờ đồng bộ` : "Đã đồng bộ";
    p.className = pending ? "pill pill-warn" : "pill pill-ok";
  },
  async tryPush(){
    if(!this.online) { await this.setPill(); return; }

    if (typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED) {
      try {
        if (typeof FirebaseSync !== "undefined" && FirebaseSync.ready()) {
          this.status="syncing"; await this.setPill();
          const result = await FirebaseSync.pushAllDirty(true);
          if (result && result.failed && result.failed.length) throw new Error(result.failed.join("; "));
          this.status="idle"; this.lastError="";
        }
      } catch (err) {
        this.status="error"; this.lastError=(err && err.message) || String(err);
        console.warn("FirebaseSync pushAllDirty lỗi:", err);
      }
    }
    await this.setPill();
  },
  async pull(){
    if(!this.online) { await this.setPill(); return; }
    this.status="syncing"; await this.setPill();

    const promises = [];
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
    this.status="idle"; this.lastError=""; await this.setPill();
  },
};
window.addEventListener("online", ()=>{ SyncEngine.online=true; SyncEngine.tryPush(); });
window.addEventListener("offline", ()=>{ SyncEngine.online=false; SyncEngine.setPill(); });

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
  if(!fbReady){ alert("Chưa sẵn sàng đồng bộ (Firebase)."); return; }
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
  if(!fbReady){ alert("Chưa sẵn sàng đồng bộ (Firebase)."); return; }
  if(!navigator.onLine){ alert("Cần kết nối mạng."); return; }
  if(!confirm("KÉO TOÀN BỘ dữ liệu từ server về máy này (sẽ GHI ĐÈ dữ liệu local của máy này).\nDùng ở MÁY ĐỒNG BỘ THEO. Tiếp tục?")) return;
  try{
    await idbPut("meta", { key:"meta_dirty_keys", value:[] }); // bỏ cờ dirty để không chặn việc nhận bản server

    const promises = [];
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
