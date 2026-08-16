// =====================================================================
// FIREBASE SYNC — đường đồng bộ cloud hiện hành khi FIREBASE_ENABLED=true.
// Nhận dữ liệu local dạng {key, value}, rồi map sang cấu trúc Firestore được mô tả
// tại firebase/schema-mapping.md. SyncEngine trong core/sync-engine.js gọi các hàm push/pull này.
// Supabase đã được gỡ khỏi app chính ngày 28/07/2026.
// =====================================================================
const FIREBASE_LEGACY_SKIP_PREFIXES = ["hr_fixed_", "hr_migrated_", "hr_dedupe_", "hr_imported_", "users_seed_v"];

function fbSkipKey(key) {
  if (typeof SYNC_SKIP_KEYS !== "undefined" && SYNC_SKIP_KEYS.includes(key)) return true;
  return FIREBASE_LEGACY_SKIP_PREFIXES.some(p => key.startsWith(p));
}

const FirebaseSync = {
  ready() {
    return typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED &&
      window.fb && window.fb.db && window.fb.auth && window.fb.auth.currentUser;
  },

  // Đẩy NGAY 1 dự án lên bảng projects/{pid} — gọi khi thêm/sửa dự án ở app chính,
  // để app báo cáo thấy tức thì (không phải chờ bấm "Đẩy toàn bộ lên").
  // merge:true nên KHÔNG đụng member_uids (danh sách thành viên đã gán được giữ nguyên).
  // Chiều XÓA đã có sẵn trong window.deleteProject (app.js) — xóa cascade trên Firebase.
  async pushProjectDoc(p) {
    if (!this.ready() || !p || !p.id) return false;
    try {
      await window.fb.db.collection("projects").doc(p.id).set({
        name: p.name || "",
        address: p.address || "",
        scale: p.scale || "",
        start_date: p.start_date || null,
        end_date: p.end_date || null,
        commander: p.commander || "",
        investor: p.investor || "",
        status: p.status || "",
        contract_no: p.contract_no || "",
        latitude: p.latitude || null,
        longitude: p.longitude || null,
        updated_at: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn("FirebaseSync.pushProjectDoc lỗi:", e && e.message);
      return false;
    }
  },

  async pushAllDirty(autoOnly = false) {
    if (!this.ready()) return;
    try {
      const db = window.fb.db;
      const dirtyMetaObj = await idbGet("meta", "meta_dirty_keys");
      const dirtyMetaKeys = dirtyMetaObj ? (dirtyMetaObj.value || []) : [];
      const pushedKeys = [];
      const failedKeys = []; // key đẩy LỖI — trả về cho nút "Đẩy toàn bộ" báo trung thực
      for (const key of dirtyMetaKeys) {
        if (fbSkipKey(key)) continue;
        // Auto-push BỎ QUA dữ liệu nền/danh mục (người dùng, phòng ban...) — TRỪ khi người đang
        // đăng nhập là ADMIN/GIÁM ĐỐC (Sếp chốt 17/07: admin sửa là tự đồng bộ, khỏi bấm Đẩy).
        // Sếp chốt 23/07 (GĐ A): Thành viên (members:, team:, org_chart_) & Nhà thầu (contractors, kb_contractors)
        // ALWAYS auto-push cho MỌI vai trò (bỏ qua điều kiện catalogAutoPushAllowed).
        const isAlwaysPush = key.startsWith("members:") || key.startsWith("team:") || key.startsWith("org_chart_") || key === "contractors" || key === "kb_contractors";
        if (autoOnly && typeof isManualPushOnlyKey === "function" && isManualPushOnlyKey(key) && !isAlwaysPush
            && !(typeof window.catalogAutoPushAllowed === "function" && window.catalogAutoPushAllowed())) continue;
        const valObj = await idbGet("meta", key);
        if (!valObj) continue;
        try {
          if (key === "daily_reports") {
            await this._pushDailyReports(valObj.value || []);
          } else if (key === "lpb_requests") {
            await this._pushLpbRequests(valObj.value || []);
          } else if (key === "projects") {
            for (const p of (valObj.value || [])) {
              if (!p.id) continue;
              await db.collection("projects").doc(p.id).set({
                name: p.name || "",
                address: p.address || "",
                scale: p.scale || "",
                start_date: p.start_date || null,
                end_date: p.end_date || null,
                commander: p.commander || "",
                investor: p.investor || "",
                status: p.status || "",
                contract_no: p.contract_no || "",
                latitude: p.latitude || null,
                longitude: p.longitude || null,
                updated_at: new Date().toISOString()
              }, { merge: true });
            }
          } else if (key.includes(":")) {
            const [type, pid] = key.split(":");
            await db.collection("projects").doc(pid).collection("data").doc(type).set({
              items: valObj.value, updated_at: new Date().toISOString()
            }, { merge: true });
          } else if (key.startsWith("org_chart_")) {
            const pid = key.substring("org_chart_".length);
            await db.collection("projects").doc(pid).collection("data").doc("org_chart").set({
              items: valObj.value, updated_at: new Date().toISOString()
            }, { merge: true });
          } else {
            await db.collection("config").doc(key).set({
              value: valObj.value, updated_at: new Date().toISOString()
            }, { merge: true });
          }
          pushedKeys.push(key); // đẩy Firebase thành công
        } catch (e) {
          console.warn("FirebaseSync push lỗi cho key " + key + ":", e && e.message);
          failedKeys.push(key + " (" + ((e && e.message) || "lỗi không rõ").slice(0, 80) + ")");
        }
      }

      // Firebase TỰ dọn cờ dirty các key đã đẩy (trước đây do Supabase.pushAllDirty đảm nhiệm).
      // Không dọn -> đẩy lặp vô hạn. Supabase đã GỠ BỎ hoàn toàn 28/07 nên bỏ điều kiện
      // SUPABASE_ENABLED (biến không còn tồn tại — giữ điều kiện sẽ khiến cờ dirty không bao giờ dọn).
      if (pushedKeys.length) {
        const cur = await idbGet("meta", "meta_dirty_keys");
        const remain = ((cur && cur.value) || []).filter(k => !pushedKeys.includes(k));
        await idbPut("meta", { key: "meta_dirty_keys", value: remain });
      }
      return { ok: pushedKeys.length, failed: failedKeys };
    } catch (e) {
      console.warn("FirebaseSync.pushAllDirty lỗi:", e);
      return { ok: 0, failed: ["(toàn bộ) " + ((e && e.message) || e)] };
    }
  },

  async _pushDailyReports(arr) {
    const db = window.fb.db;
    const storage = window.fb.storage;
    let localChanged = false;

    // Tách 1 ảnh base64 -> Storage, trả URL (doc chỉ giữ URL để < 1MB)
    const uploadImg = async (val, r, name) => {
      if (!storage || !val || typeof val !== "string" || !val.startsWith("data:image/")) return val;
      try {
        const blob = await (await fetch(val)).blob();
        const path = `reports/${r.project_id}/${r.date}/${name}_${Date.now()}_${Math.round(Math.random()*1e6)}.jpg`;
        const ref = storage.ref().child(path);
        const snap = await ref.put(blob);
        return await snap.ref.getDownloadURL();
      } catch (e) {
        console.warn("[FirebaseSync] upload anh daily_report loi:", e && e.message);
        return val; // giữ base64 nếu upload lỗi
      }
    };

    for (const r of (arr || [])) {
      if (!r || !r.project_id || !r.date) continue;
      if (r.dirty !== true) continue;

      // Tách ảnh base64 (photos/draws) lên Storage -> URL
      if (Array.isArray(r.photos)) {
        for (let i = 0; i < r.photos.length; i++) {
          if (r.photos[i] && typeof r.photos[i].img === "string" && r.photos[i].img.startsWith("data:image/")) {
            r.photos[i].img = await uploadImg(r.photos[i].img, r, "img" + i);
            localChanged = true;
          }
        }
      }
      if (Array.isArray(r.draws)) {
        for (let i = 0; i < r.draws.length; i++) {
          if (r.draws[i] && typeof r.draws[i].img === "string" && r.draws[i].img.startsWith("data:image/")) {
            r.draws[i].img = await uploadImg(r.draws[i].img, r, "draw" + i);
            localChanged = true;
          }
        }
      }
      // Ảnh tổng quan 01 + logo (ảnh đơn) -> Storage
      for (const f of ["ov_main", "ov_sub1", "ov_sub2", "logo_cdt", "logo_ntc"]) {
        if (typeof r[f] === "string" && r[f].startsWith("data:image/")) {
          r[f] = await uploadImg(r[f], r, f);
          localChanged = true;
        }
      }

      const rStr = JSON.stringify(r);
      if (rStr.length > 900 * 1024) {
        throw new Error(`Báo cáo ${r.date} quá lớn (${Math.round(rStr.length/1024)}KB), chưa thể đồng bộ.`);
      }

      const id = [r.project_id, r.date].join("_").replace(/[^a-zA-Z0-9_.-]/g, "-");
      const syncedAt = new Date().toISOString();
      await db.collection("daily_reports").doc(id).set({ ...r, dirty: false, updated_at: syncedAt }, { merge: true });
      r.dirty = false;
      r.updated_at = syncedAt;
      localChanged = true;
    }

    // Cập nhật lại local (ảnh -> URL) để lần sau KHÔNG upload lại + app chính hiển thị bằng URL
    if (localChanged) {
      try { await idbPut("meta", { key: "daily_reports", value: arr }); }
      catch (e) { console.warn("[FirebaseSync] cap nhat local daily_reports loi:", e && e.message); }
    }
  },

  async _pushLpbRequests(arr) {
    const db = window.fb.db;
    for (const r of (arr || [])) {
      if (!r || !r.id || !r.project_id) continue;
      if (r.dirty !== true) continue;
      const syncedAt = new Date().toISOString();
      await db.collection("lpb_requests").doc(String(r.id)).set({ ...r, dirty: false, updated_at: syncedAt }, { merge: true });
      r.dirty = false;
      r.updated_at = syncedAt;
    }
    await idbPut("meta", { key: "lpb_requests", value: arr });
  },

  async pull(projectId) {
    if (!this.ready()) return;
    try {
      const db = window.fb.db;

      const configSnap = await db.collection("config").get();
      for (const doc of configSnap.docs) {
        // "projects" quản lý per-document ở collection projects/{pid} (FIX-2);
        // blob config/projects là bản đẩy nhầm chỗ cũ — kéo về sẽ ĐÈ hồ sơ dự án thật bằng dữ liệu cũ.
        if (doc.id === "projects" || doc.id.startsWith("test_")) continue;
        await this._mergeLocal(doc.id, doc.data().value);
      }

      // Dự án được lưu theo từng document tại projects/{pid}, không nằm trong config/projects.
      // Phải kéo danh sách này trước để máy mới có CUR.project và tiếp tục nhận dữ liệu con.
      const projectsSnap = await db.collection("projects").get();
      const projects = projectsSnap.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(project => project.name || project.code || project.status);
      await this._mergeLocal("projects", projects);

      if (projectId) {
        const dataSnap = await db.collection("projects").doc(projectId).collection("data").get();
        for (const doc of dataSnap.docs) {
          const key = doc.id === "org_chart" ? ("org_chart_" + projectId) : (doc.id + ":" + projectId);
          await this._mergeLocal(key, doc.data().items);
        }

        const drSnap = await db.collection("daily_reports").where("project_id", "==", projectId).get();
        if (!drSnap.empty) {
          const allDaily = await metaGet("daily_reports", []);
          drSnap.docs.forEach(doc => {
            const r = doc.data();
            const idx = allDaily.findIndex(x => x.project_id === r.project_id && x.date === r.date);
            if (idx >= 0) { if (!allDaily[idx].dirty) allDaily[idx] = r; }
            else allDaily.push(r);
          });
          await idbPut("meta", { key: "daily_reports", value: allDaily });
        }

        const lpbSnap = await db.collection("lpb_requests").where("project_id", "==", projectId).get();
        if (!lpbSnap.empty) {
          const allLpb = await metaGet("lpb_requests", []);
          lpbSnap.docs.forEach(doc => {
            const r = doc.data();
            const idx = allLpb.findIndex(x => x.id === r.id);
            if (idx >= 0) {
              const local = allLpb[idx];
              const localTime = new Date(local.updated_at || 0).getTime();
              const remoteTime = new Date(r.updated_at || 0).getTime();
              if (!local.dirty && remoteTime > localTime) allLpb[idx] = r;
            } else allLpb.push(r);
          });
          await idbPut("meta", { key: "lpb_requests", value: allLpb });
        }
      }
    } catch (e) {
      console.warn("FirebaseSync.pull lỗi:", e);
    }
  },

  async pullDailyReports() {
    if (!this.ready()) return;
    try {
      const db = window.fb.db;
      const projectId = window.CUR ? window.CUR.project : null;
      if (!projectId) return;

      const drSnap = await db.collection("daily_reports").where("project_id", "==", projectId).get();
      if (!drSnap.empty) {
        const allDaily = await metaGet("daily_reports", []);
        drSnap.docs.forEach(doc => {
          const r = doc.data();
          const idx = allDaily.findIndex(x => x.project_id === r.project_id && x.date === r.date);
          if (idx >= 0) {
            const localRep = allDaily[idx];
            if (localRep.dirty) return; // không đè bản local đang dirty
            
            const localTime = new Date(localRep.updated_at || 0).getTime();
            const remoteTime = new Date(r.updated_at || 0).getTime();
            if (remoteTime > localTime) {
              allDaily[idx] = r; // updated_at mới hơn thắng
            }
          } else {
            allDaily.push(r);
          }
        });
        await idbPut("meta", { key: "daily_reports", value: allDaily });
      }
    } catch (e) {
      console.warn("FirebaseSync.pullDailyReports lỗi:", e);
    }
  },

  async _mergeLocal(key, value) {
    if (value === undefined) return;
    const dirtyMetaObj = await idbGet("meta", "meta_dirty_keys");
    const dirtyMetaKeys = new Set(dirtyMetaObj ? (dirtyMetaObj.value || []) : []);
    if (dirtyMetaKeys.has(key)) return; // đang có sửa cục bộ chưa đẩy lên -> không ghi đè
    await idbPut("meta", { key, value, updated_at: new Date().toISOString() });
  }
};
