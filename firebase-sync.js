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

  async pushAllDirty() {
    if (!this.ready()) return;
    try {
      const db = window.fb.db;
      const dirtyMetaObj = await idbGet("meta", "meta_dirty_keys");
      const dirtyMetaKeys = dirtyMetaObj ? (dirtyMetaObj.value || []) : [];
      for (const key of dirtyMetaKeys) {
        if (fbSkipKey(key)) continue;
        const valObj = await idbGet("meta", key);
        if (!valObj) continue;
        try {
          if (key === "daily_reports") {
            await this._pushDailyReports(valObj.value || []);
          } else if (key === "lpb_requests") {
            await this._pushLpbRequests(valObj.value || []);
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
        } catch (e) {
          console.warn("FirebaseSync push lỗi cho key " + key + ":", e && e.message);
        }
      }
    } catch (e) {
      console.warn("FirebaseSync.pushAllDirty lỗi:", e);
    }
  },

  async _pushDailyReports(arr) {
    const db = window.fb.db;
    for (const r of (arr || [])) {
      if (!r || !r.project_id || !r.date) continue;
      const id = [r.project_id, r.date, r.created_by || "x"].join("_").replace(/[^a-zA-Z0-9_.-]/g, "-");
      await db.collection("daily_reports").doc(id).set({ ...r, updated_at: new Date().toISOString() }, { merge: true });
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
            const idx = allDaily.findIndex(x => x.project_id === r.project_id && x.date === r.date && x.created_by === r.created_by);
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

  async _mergeLocal(key, value) {
    if (value === undefined) return;
    const dirtyMetaObj = await idbGet("meta", "meta_dirty_keys");
    const dirtyMetaKeys = new Set(dirtyMetaObj ? (dirtyMetaObj.value || []) : []);
    if (dirtyMetaKeys.has(key)) return; // đang có sửa cục bộ chưa đẩy lên -> không ghi đè
    await idbPut("meta", { key, value, updated_at: new Date().toISOString() });
  }
};
