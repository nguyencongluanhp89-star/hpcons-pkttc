// =====================================================================
// FIREBASE SYNC — chạy song song SupabaseSync khi FIREBASE_ENABLED=true.
// Cùng format {key, value} với IndexedDB local, nhưng ghi vào cấu trúc Firestore
// đã thiết kế ở firebase/schema-mapping.md (KHÔNG phải bảng phẳng như app_meta).
// KHÔNG BAO GIỜ được thay thế/chặn SupabaseSync — chỉ cộng thêm, luôn bọc try/catch.
// GIAI ĐOẠN NÀY (FB-M4): viết xong, tự test thủ công — CHƯA gọi tự động ở đâu cả.
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
        // Auto-push BỎ QUA dữ liệu nền/danh mục (dự án, người dùng, nhà thầu...) — chỉ "Đẩy toàn bộ" mới đẩy.
        if (autoOnly && typeof isManualPushOnlyKey === "function" && isManualPushOnlyKey(key)) continue;
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

      // Supabase đã tắt (SUPABASE_ENABLED=false) -> Firebase TỰ dọn cờ dirty các key đã đẩy
      // (trước đây do Supabase.pushAllDirty đảm nhiệm). Không dọn -> đẩy lặp vô hạn.
      if (typeof SUPABASE_ENABLED !== "undefined" && !SUPABASE_ENABLED && pushedKeys.length) {
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
        console.warn(`[FirebaseSync] Bo qua push daily_report lon (${Math.round(rStr.length/1024)}KB) de tranh loi payload size.`);
        continue;
      }

      const id = [r.project_id, r.date].join("_").replace(/[^a-zA-Z0-9_.-]/g, "-");
      await db.collection("daily_reports").doc(id).set({ ...r, updated_at: new Date().toISOString() }, { merge: true });
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
      await db.collection("lpb_requests").doc(String(r.id)).set({ ...r, updated_at: new Date().toISOString() }, { merge: true });
    }
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
            if (idx >= 0) allLpb[idx] = r; else allLpb.push(r);
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
