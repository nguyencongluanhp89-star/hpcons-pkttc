// ---------- DATA SERVICE ----------
// API dữ liệu nghiệp vụ local duy nhất; giữ nguyên hành vi từ app.js.
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

window.DataService = DataService;
