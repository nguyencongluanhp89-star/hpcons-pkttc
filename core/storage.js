// ---------- INDEXEDDB STORAGE ----------
// Nguồn duy nhất cho database/store và helper local của app chính.
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

// Giữ API global tương thích cho feature module, iframe và các phase refactor sau.
window.db = db;
window.tx = tx;
window.idbPut = idbPut;
window.idbGet = idbGet;
window.idbAll = idbAll;
window.idbDel = idbDel;
window.idbClear = idbClear;
window.metaGet = metaGet;
window.metaSet = metaSet;
