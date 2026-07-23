async function projectStats(id){
  const proj = (await DataService.listProjects()).find(p=>p.id===id);
  if(!proj) return null;
  const subs = (await DataService.listSubmissions()).filter(s=>s.project_id===id);
  const cdt = await metaGet("cdt:"+id, []);
  const progress = await metaGet("progress:"+id, []);
  
  const start = proj.start_date ? new Date(proj.start_date) : null;
  const end = proj.end_date ? new Date(proj.end_date) : null;
  const off = new Set(proj.off_weekdays||[0]);
  const t = todayISO();
  const days = [...new Set(subs.map(s=>s.log_date))];
  
  let workDays=0, reported=0;
  if(start && end){
    for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){ if(off.has(d.getDay())) continue; workDays++; if(days.includes(isoFromDate(d))) reported++; }
  }
  const rate=workDays?Math.round(reported/workDays*100):0;
  const highIssues=subs.flatMap(s=>s.issues||[]).filter(i=>i.severity==="high").length;
  let overdueConds=0, readyDots=0;
  cdt.forEach(d=>{ if(d.conditions && d.conditions.length>0 && d.conditions.every(c=>c.done)) readyDots++; if(d.conditions) d.conditions.forEach(c=>{ if(!c.done && c.due && t>c.due) overdueConds++; }); });
  const H = await computeProjectHealth(proj);
  const totalManpower=subs.reduce((a,s)=>a+(s.manpower||[]).reduce((x,m)=>x+(m.headcount||0),0),0);
  const manpowerToday=subs.filter(s=>s.log_date===t).reduce((a,s)=>a+(s.manpower||[]).reduce((x,m)=>x+(m.headcount||0),0),0);
  // Tiến độ kế hoạch theo thời gian (nhất quán với tab Tiến độ) + số hạng mục quá ngày kết thúc KH
  let schedulePct=0;
  if(start && end && end>start){ const pas=new Date(t)-start; schedulePct=Math.max(0,Math.min(100,Math.round(pas/(end-start)*100))); }
  // Trễ hạn: dùng ĐỊNH NGHĨA CHUẨN như điểm sức khỏe (chưa hoàn thành & quá hạn cuối, chỉ công tác lá).
  const overdueTasks=(progress||[]).filter(it=>
    ((typeof levelOf==='function')?levelOf(it.task)>1:true) &&
    ((typeof healthIsOverdue==='function') ? healthIsOverdue(it,t) : (it.status!=='done' && it.end && t>it.end))
  ).length;
  return {proj, rate, highIssues, overdueConds, readyDots, dotCount:cdt.length, health: H.healthScore, healthStatus: H.healthStatus, healthColorToken: H.healthColorToken, totalManpower, manpowerToday, schedulePct, overdueTasks, logDays:days.length, healthObj: H};
}

function healthColor(h){ return "var(" + healthTier(h).token + ")"; }

const DEPARTMENTS=[
  {key:"banql",       name:"Quản lý",              positions:["P. TGĐ","TP. KTTC"]},
  {key:"thicong",     name:"Bộ phận Thi công",     positions:["Chỉ huy trưởng","Kỹ sư","Trắc đạc","Thủ kho"]},
  {key:"qaqc",        name:"Bộ phận QA/QC",        positions:["Quản lý bộ phận","Nhân viên QA/QC"]},
  {key:"hse",         name:"Bộ phận HSE",          positions:["Quản lý bộ phận","Nhân viên HSE"]},
  {key:"shopdrawing", name:"Bộ phận Shopdrawing",  positions:["Quản lý bộ phận","Nhân viên Shopdrawing"]},
  {key:"baotri",      name:"Bộ phận Bảo trì",      positions:["Quản lý bộ phận","Nhân viên bảo trì","M&E"]},
];

function roleFromPosition(position){
  const p=(position||"").toLowerCase().trim();
  if(p.indexOf("tgđ")>=0 || p.indexOf("tcđ")>=0 || p.indexOf("p.tgđ")>=0) return "director";
  if(p.indexOf("kttc")>=0) return "pm";
  if(p.indexOf("chỉ huy")>=0 || p.indexOf("quản lý")>=0 || p.indexOf("cht")>=0) return "site_manager";
  if(p.indexOf("thủ kho")>=0) return "storekeeper";
  if(p.indexOf("trắc đạc")>=0) return "surveyor";
  return "engineer";
}

async function syncDeptUsers(){
  const depts=await metaGet("departments", {}); const users=await ensureUsers(); let changed=false;
  Object.keys(depts).forEach(key=>{ (depts[key]||[]).forEach(p=>{
    if(p.name && !users.some(u=>(u.full_name||"").toLowerCase()===p.name.toLowerCase())){
      users.push({id:uuid(), full_name:p.name, username:p.name, role:roleFromPosition(p.position), pw:"" /* FIX 18/07: het mat khau mac dinh */, dept:key, position:p.position}); changed=true;
    }
  }); });
  if(changed) await metaSet("users", users);
}

async function renderDepartments(){
  const data=await metaGet("departments", {}); const w=$("exec-depts"); if(!w) return;
  w.innerHTML = DEPARTMENTS.map(d=>{
    const members=data[d.key]||[];
    const by={}; members.forEach(m=>by[m.position]=(by[m.position]||0)+1);
    const breakdown = d.positions.map(p=>by[p]?(esc(p)+": <b>"+by[p]+"</b>"):null).filter(Boolean).join(" · ") || "Chưa có thành viên";
    return `<div class="dept-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0;color:#2E6B22">${esc(d.name)} <span class="muted" style="font-weight:400;font-size:12px">(${members.length} người)</span></h3><button class="btn btn-mut btn-sm" onclick="openDeptModal('${d.key}')">Quản lý ></button></div><div class="muted" style="margin-top:6px">${breakdown}</div></div>`;
  }).join("");
}

let DEPT_CUR=null;
function openDeptModal(key){ DEPT_CUR=key; renderDeptModal(); $("dept-modal").classList.remove("hide"); }
function closeDeptModal(){ $("dept-modal").classList.add("hide"); }

async function renderDeptModal(){
  const key=DEPT_CUR; const d=DEPARTMENTS.find(x=>x.key===key); if(!d) return;
  const data=await metaGet("departments", {}); const members=data[key]||[];
  const editable = !CUR_USER || isAdminLikeRole(CUR_USER.role) || CUR_USER.role === "pm";
  $("dept-modal-title").textContent=d.name+" ("+members.length+" người)";
  $("dept-modal-list").innerHTML = members.length ? members.map((m,i)=>`<div class="it"><span><b>${esc(m.name)}</b> · ${esc(m.position)}</span>${editable?'<button class="btn btn-dan btn-sm" onclick="deptDel(\''+key+'\','+i+')">Xóa</button>':''}</div>`).join("") : '<p class="muted">Chưa có thành viên.</p>';
  $("dept-modal-add").innerHTML = editable ? `<div class="row" style="align-items:flex-end"><div><label>Họ tên</label><input id="dep-name-${key}" placeholder="Họ tên"></div><div style="flex:0;min-width:170px"><label>Chức vụ</label><select id="dep-pos-${key}">${d.positions.map(p=>'<option>'+esc(p)+'</option>').join("")}</select></div><div style="flex:0"><button class="btn btn-ok" onclick="deptAdd('${key}')">+ Thêm</button></div></div>` : '';
}

async function deptAdd(key){
  const ni=$("dep-name-"+key), pi=$("dep-pos-"+key); const name=ni.value.trim(), pos=pi.value;
  if(!name){ alert("Nhập họ tên thành viên"); return; }
  const data=await metaGet("departments", {}); if(!data[key]) data[key]=[];
  data[key].push({name, position:pos}); await metaSet("departments", data);
  const users=await ensureUsers();
  if(!users.some(u=>(u.username||"").toLowerCase()===name.toLowerCase())){
    users.push({id:uuid(), full_name:name, username:name, role:roleFromPosition(pos), pw:"", dept:key, position:pos});
    await metaSet("users", users);
  }
  audit("Thêm nhân sự bộ phận", name+" · "+pos); renderDeptModal(); renderDepartments();
}

async function deptDel(key, i){
  if(!confirm("Xóa thành viên này khỏi bộ phận?")) return;
  const data=await metaGet("departments", {}); if(data[key]){ data[key].splice(i,1); await metaSet("departments", data); audit("Xóa nhân sự bộ phận",""); }
  renderDeptModal(); renderDepartments();
}

function resetProjectForm(){
  $("np-id").value=""; $("np-name").value=""; $("np-start").value=""; $("np-end").value=""; 
  $("np-addr").value=""; $("np-scale").value=""; $("np-lat").value=""; $("np-lon").value="";
  $("np-investor").value=""; $("np-commander").value=""; $("np-status").value="Đang thi công";
  $("np-contract").value="";
  $("btn-save-proj").innerText="+ Lưu dự án";
  $("btn-cancel-edit").classList.add("hide");
}

async function editProject(id){
  const proj = (await DataService.listProjects()).find(p=>p.id===id);
  if(!proj) return;
  $("np-id").value = proj.id;
  $("np-name").value = proj.name || "";
  $("np-start").value = proj.start_date || "";
  $("np-end").value = proj.end_date || "";
  $("np-addr").value = proj.address || "";
  $("np-scale").value = proj.scale || "";
  $("np-lat").value = proj.latitude || "";
  $("np-lon").value = proj.longitude || "";
  $("np-investor").value = proj.investor || "";
  $("np-commander").value = proj.commander || "";
  if(proj.status) $("np-status").value = proj.status;
  $("np-contract").value = proj.contract_no || "";
  
  $("btn-save-proj").innerText="💾 Cập nhật";
  $("btn-cancel-edit").classList.remove("hide");
  switchTab('tc-themduan');
  renderProjectList();
}

async function renderProjectList() {
  const pl = $("tc-project-list");
  if(!pl) return;
  
  const list = await accessibleProjects(); // Phân quyền
  const editable = !CUR_USER || isAdminLikeRole(CUR_USER.role) || ["pm","site_manager"].includes(CUR_USER.role);

  if(list.length === 0){
    pl.innerHTML = renderEmptyState(getDashSvg('building', 40, 'var(--hp-text-secondary)'), 'Chưa có dự án phân quyền', 'Vui lòng liên hệ Admin để được cấp quyền quản lý dự án.');
    return;
  }
  let html = '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">';
  list.forEach(p => {
    let stColor = "var(--text-color)";
    if(p.status === "Đang thi công") stColor = "var(--primary)";
    if(p.status === "Tạm dừng") stColor = "var(--warning)";
    if(p.status === "Đã bàn giao") stColor = "var(--success)";
    
    let editBtn = "";
    if (editable) {
       editBtn = `<button class="btn btn-mut btn-sm" onclick="event.stopPropagation(); editProject('${p.id}')" title="Sửa thông tin">Sửa</button>`;
    }
    
    html += `
    <div class="card" style="border:1px solid var(--border-color); box-shadow:0 2px 8px rgba(0,0,0,0.05); margin-bottom:0; cursor:pointer" onclick="openProject('${p.id}')">
      <div style="display:flex; justify-content:space-between">
        <h3 style="margin-top:0; margin-bottom:8px; color:var(--primary-dark); font-size:16px">${esc(p.name)}</h3>
        ${editBtn}
      </div>
      <div style="font-size:13px; line-height:1.6; margin-bottom:12px;">
        <div><b>Trạng thái:</b> <span style="color:${stColor}; font-weight:bold">${esc(p.status)}</span></div>
        <div><b>Chủ đầu tư:</b> ${esc(p.investor || "---")}</div>
        <div><b>CH Trưởng:</b> ${esc(p.commander || "---")}</div>
        <div><b>Tiến độ:</b> ${esc(p.start_date || "?")} đến ${esc(p.end_date || "?")}</div>
      </div>
      <div style="text-align:right">
        <button class="btn btn-ok btn-sm">Vào dự án ➔</button>
      </div>
    </div>
    `;
  });
  html += '</div>';
  pl.innerHTML = html;
}

async function addProject(){
  const idStr = $("np-id").value;
  const name=$("np-name").value.trim(), st=$("np-start").value, en=$("np-end").value;
  if(!name){ alert("Nhập tên công trình"); return; }
  const lat=parseFloat($("np-lat").value), lon=parseFloat($("np-lon").value);
  if(isNaN(lat)||isNaN(lon)){ alert("Bắt buộc nhập tọa độ (vĩ độ & kinh độ) để hệ thống tự lấy thời tiết.\nLấy nhanh: mở Google Maps, bấm chuột phải vào vị trí công trình → tọa độ hiện ra."); return; }
  if(lat<-90||lat>90||lon<-180||lon>180){ alert("Tọa độ không hợp lệ. Vĩ độ trong khoảng -90…90, kinh độ -180…180."); return; }
  
  const investor = $("np-investor").value.trim();
  const commander = $("np-commander").value.trim();
  const status = $("np-status").value;
  const contract_no = ($("np-contract").value || "").trim();
  const scale = ($("np-scale").value || "").trim();

  const list=await DataService.listProjects();
  if(idStr){
    const idx = list.findIndex(p=>p.id===idStr);
    if(idx>=0){
      list[idx] = {...list[idx], name, start_date:st||"", end_date:en||"", address:$("np-addr").value.trim(), scale, latitude:lat, longitude:lon, investor, commander, status, contract_no};
      audit("Sửa công trình", name);
    }
  } else {
    list.push({
      id:uuid(), name, start_date:st||"", end_date:en||"", off_weekdays:[0],
      address:$("np-addr").value.trim(), scale, latitude:lat, longitude:lon,
      investor: investor, commander: commander, status: status, contract_no
    });
    audit("Thêm công trình", name);
  }
  await metaSet("projects", list);
  // Đồng bộ NGAY dự án vừa thêm/sửa lên Firebase — app báo cáo thấy tức thì,
  // không phải chờ "Đẩy toàn bộ lên". (Xóa đã tự lan qua window.deleteProject.)
  const justSaved = idStr ? list.find(p=>p.id===idStr) : list[list.length-1];
  if (typeof FirebaseSync !== "undefined" && FirebaseSync.pushProjectDoc) {
    FirebaseSync.pushProjectDoc(justSaved);
  }
  resetProjectForm();
  await populateProjects(); renderExecutive(); renderProjectList();
  alert(idStr ? "Đã cập nhật dự án" : "Đã thêm công trình: "+name);
  switchTab('tc-duan');
}

async function delProject(id){
  if(!confirm("Xóa công trình này khỏi danh sách? (Nhật ký cũ vẫn lưu trên máy nhưng sẽ không hiển thị.)")) return;
  const list=(await DataService.listProjects()).filter(p=>p.id!==id);
  await metaSet("projects", list); audit("Xóa công trình", id);
  await populateProjects(); renderExecutive(); renderProjectList();
}

function getDashSvg(name, size = 18, color = "currentColor") {
  const paths = {
    'building': '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="6" x2="9.01" y2="6"></line><line x1="15" y1="6" x2="15.01" y2="6"></line><line x1="9" y1="10" x2="9.01" y2="10"></line><line x1="15" y1="10" x2="15.01" y2="10"></line><line x1="9" y1="14" x2="9.01" y2="14"></line><line x1="15" y1="14" x2="15.01" y2="14"></line><line x1="9" y1="18" x2="15" y2="18"></line>',
    'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
    'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
    'wallet': '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>',
    'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline>',
    'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
    'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
    'list-todo': '<rect x="3" y="5" width="6" height="6" rx="1"></rect><path d="m3 17 2 2 4-4"></path><path d="M13 6h8"></path><path d="M13 12h8"></path><path d="M13 18h8"></path>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>',
    'pen-tool': '<path d="m12 19 7-7 3 3-7 7-3-3z"></path><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18z"></path><path d="m2 2 7.5 7.5"></path><circle cx="11" cy="11" r="2"></circle>',
    'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
  };
  const path = paths[name] || '<circle cx="12" cy="12" r="10"></circle>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0;">${path}</svg>`;
}
window.getDashSvg = getDashSvg;

async function renderExecutive(){
 try{
  const projects=await DataService.listProjects();
  const stats=[]; for(const p of projects){ const st=await projectStats(p.id); if(st) stats.push(st); }
  stats.sort((a,b)=>b.health-a.health);
  const subs=await DataService.listSubmissions();
  const depts=await metaGet("departments", {});
  const tToday=todayISO();
  // Hàm định dạng tiền linh động: tự chọn đơn vị tỷ/tr theo độ lớn
  const fmtAuto=(v)=>{
    const abs=Math.abs(v||0);
    if(abs>=1e9){
      const n=(v/1e9);
      return { num: n.toLocaleString('vi-VN',{minimumFractionDigits:0,maximumFractionDigits:3}), unit:'tỷ' };
    }
    const rounded = Math.round((v||0)/1e6);
    return { num: rounded.toLocaleString('vi-VN'), unit:'tr' };
  };
  const isoWeek=(d)=>{ const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=x.getUTCDay()||7; x.setUTCDate(x.getUTCDate()+4-day); const ys=new Date(Date.UTC(x.getUTCFullYear(),0,1)); return Math.ceil((((x-ys)/86400000)+1)/7); };

  const total=stats.length;
  const stCounts={"Chuẩn bị":0,"Đang thi công":0,"Tạm dừng":0,"Đã bàn giao":0};
  stats.forEach(s=>{ const st=s.proj.status||"Đang thi công"; stCounts[st]=(stCounts[st]||0)+1; });
  const risky=stats.filter(s=>s.health<60).length;
  const manpowerToday=stats.reduce((a,s)=>a+(s.manpowerToday||0),0);
  const totalOverdue=stats.reduce((a,s)=>a+(s.overdueTasks||0),0);

  // Dòng tiền 2 chiều (toàn dự án): THU từ CĐT (val/paid) · CHI = trả nhà thầu + chi phí lẻ
  let totSubcon=0, totExp=0, totHD=0, totThu=0; const finRows=[];
  for(const p of projects){
    const sc=await metaGet("subcon_payments:"+p.id, []);
    const ex=await metaGet("expenses:"+p.id, []);
    const cd=await metaGet("cdt:"+p.id, []);
    let s=0; (sc||[]).forEach(x=>{ if(!x.status||x.status==='approved') s+=Number(x.amount)||0; });
    let e=0; (ex||[]).forEach(x=>{ if(!x.status||x.status==='approved') e+=Number(x.total)||0; });
    let hd=0, thu=0; (cd||[]).forEach(x=>{ hd+=Number(x.val)||0; thu+=Number(x.paid)||0; });
    totSubcon+=s; totExp+=e; totHD+=hd; totThu+=thu;
    if(s+e+hd+thu>0) finRows.push({name:p.name, chi:s+e, thu});
  }
  finRows.sort((a,b)=>(b.thu+b.chi)-(a.thu+a.chi)); const finTop=finRows.slice(0,5);
  const totChi=totSubcon+totExp;

  // Hero
  const avg = total ? healthRound1(stats.reduce((a,s)=>a+s.health,0)/total) : 0;
  if($("exec-health")){
    $("exec-health").textContent = fmtHealth(avg) + "/100";
    $("exec-health").style.color = "var(" + healthTier(avg).token + ")";
  }
  if($("exec-date")){ try{ $("exec-date").textContent = new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}); }catch(e){ $("exec-date").textContent=tToday; } }

  const subsToday=subs.filter(s=>s.log_date===tToday);
  const reportedToday=new Set(subsToday.map(s=>s.project_id));
  const hasSubToday = subsToday.length > 0;
  const mpVal = !hasSubToday ? "Chưa nộp" : (manpowerToday === 0 ? "0 người" : manpowerToday.toLocaleString('vi-VN') + " người");
  const mpColor = !hasSubToday ? "var(--hp-text-muted)" : (manpowerToday === 0 ? "var(--hp-warning)" : "var(--hp-success)");

  // KPI tổng quan
  const kpiCards=[
    {icon: getDashSvg("building", 22, "var(--hp-primary)"), val:total, label:"Tổng dự án", color:"var(--hp-primary)", iconBg:"var(--hp-info-bg)", desc:"Dự án đang quản lý"},
    {icon: getDashSvg("activity", 22, "var(--hp-brand-accent)"), val:stCounts["Đang thi công"], label:"Đang thi công", color:"var(--hp-brand-accent)", iconBg:"var(--hp-info-bg)", desc:"Đang triển khai thực tế"},
    {icon: getDashSvg("alert-triangle", 22, risky>0?"var(--hp-danger)":"var(--hp-success)"), val:risky, label:"Cảnh báo rủi ro", color:risky>0?"var(--hp-danger)":"var(--hp-success)", iconBg:risky>0?"var(--hp-danger-bg)":"var(--hp-success-bg)", desc: risky > 0 ? "Dự án điểm < 60đ" : "Các dự án an toàn"},
    {icon: getDashSvg("users", 22, mpColor), val:mpVal, label:"Nhân lực hôm nay", color:mpColor, iconBg:"var(--hp-info-bg)", desc: !hasSubToday ? "Chưa có báo cáo ngày" : "Tổng thợ & kỹ sư"},
    {icon: getDashSvg("clock", 22, totalOverdue>0?"var(--hp-danger)":"var(--hp-success)"), val:totalOverdue, label:"Công tác đang trễ", color: totalOverdue>0?"var(--hp-danger)":"var(--hp-success)", iconBg: totalOverdue>0?"var(--hp-danger-bg)":"var(--hp-success-bg)", desc: totalOverdue>0 ? "Việc trễ tiến độ" : "Tiến độ đạt yêu cầu"}
  ];
  if($("exec-kpi")) $("exec-kpi").innerHTML = kpiCards.map(k=>`
    <div class="kpi-card" style="min-width:0; border-top:4px solid ${k.color}">
      <div class="kpi-icon" style="background:${k.iconBg}; color:${k.color}">${k.icon}</div>
      <div class="kpi-value" style="color:${k.color}; font-size:32px">${k.val}</div>
      <div class="kpi-label" style="color:${k.color}">${k.label}</div>
      <div class="kpi-desc">${k.desc}</div>
    </div>`).join("");

  // Bảng tình trạng dự án (Tiến độ kế hoạch theo thời gian + hạng mục quá hạn)
  if($("exec-progress-table")){
    if(!stats.length){
      $("exec-progress-table").innerHTML = renderEmptyState(getDashSvg('building', 40, 'var(--hp-text-secondary)'), 'Chưa có dự án nào', 'Hệ thống chưa khởi tạo dự án nào trên hệ thống điều hành.');
    } else {
      $("exec-progress-table").innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">'
       + stats.map(s=>{
          const hc=healthColor(s.health);
          const stLabel = s.overdueTasks>0 ? {t:"Chậm tiến độ",c:"var(--danger)"}
            : s.highIssues>0 ? {t:"Có sự cố",c:"var(--danger)"}
            : s.overdueConds>0 ? {t:"Trễ thanh toán",c:"#854F0B"}
            : s.rate<70 ? {t:"Thiếu báo cáo",c:"#854F0B"}
            : {t:"Bình thường",c:"var(--success)"};
          const active=(s.proj.status!=="Đã bàn giao" && s.proj.status!=="Tạm dừng");
          const hasLog=reportedToday.has(s.proj.id);
          const pct=s.schedulePct||0;
          const todayBadge= !active ? '<span style="color:var(--muted);font-weight:700">—</span>' : (hasLog? '<span style="color:var(--success);font-weight:700">✓ Đã ghi</span>' : '<span style="color:var(--danger);font-weight:700">✗ Thiếu</span>');
          const hObj = s.healthObj || {};
          const schedStr = hObj.scheduleScore != null ? fmtHealth(hObj.scheduleScore) + 'đ' : 'N/A';
          const repStr = hObj.reportScore != null ? fmtHealth(hObj.reportScore) + 'đ' : 'N/A';
          const extStr = hObj.extensionScore != null ? fmtHealth(hObj.extensionScore) + 'đ' : 'N/A';
          const activeLateText = s.overdueTasks > 0 ? `<span style="color:var(--danger);font-weight:700">Đang trễ: ${s.overdueTasks} việc</span>` : `<span style="color:var(--success)">Đang trễ: 0</span>`;
          const doneLateText = (hObj.completedLateTasks || 0) > 0 ? `<span style="color:#d97706;font-weight:600">Hoàn thành trễ: ${hObj.completedLateTasks} việc</span>` : `Hoàn thành trễ: 0`;
          const breakdownHtml = `<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4" title="Tổng phạt trễ: ${(hObj.totalDelayPenalty || 0).toFixed(2)}">
            <div style="display:flex; gap:6px; margin-bottom:2px; flex-wrap:wrap;">
              <span class="dash-pillar-pill" style="font-size:10px; padding:1px 6px;">📈 TĐ ${schedStr}</span>
              <span class="dash-pillar-pill" style="font-size:10px; padding:1px 6px;">📋 BC ${repStr}</span>
              <span class="dash-pillar-pill" style="font-size:10px; padding:1px 6px;">⏱️ GH ${extStr}</span>
            </div>
            <div>${activeLateText} · ${doneLateText}</div>
          </div>`;
          const cardTitle = `Điểm sức khỏe V3: ${fmtHealth(s.health)}/100 (${s.healthStatus})\n• Tiến độ: ${schedStr}\n• Báo cáo: ${repStr}\n• Gia hạn: ${extStr}\n• Đang trễ: ${s.overdueTasks} · Hoàn thành trễ: ${hObj.completedLateTasks || 0} · Phạt: ${(hObj.totalDelayPenalty || 0).toFixed(2)}`;
          return `<div onclick="openProject('${s.proj.id}')" title="${esc(cardTitle)}" style="cursor:pointer;border:1px solid var(--border);border-radius:var(--r-md);padding:14px;background:var(--surface);border-top:3px solid ${hc}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
              <div style="min-width:0;flex:1">
                <div style="font-weight:800;font-size:15px;color:var(--ink);line-height:1.25;overflow:hidden;text-overflow:ellipsis">${esc(s.proj.name)}</div>
                <div style="font-size:12px;color:var(--muted);margin-top:4px">👤 CHT: <b>${esc(s.proj.commander||'Chỉ huy trưởng')}</b> · ${esc(s.proj.status||'Đang thi công')}</div>
              </div>
              <div style="text-align:center;flex-shrink:0;min-width:64px">
                <div style="font-weight:800;font-size:22px;color:${hc};line-height:1">${fmtHealth(s.health)}/100</div>
                <div style="font-size:10px;color:${hc};text-transform:uppercase;letter-spacing:.3px;font-weight:700;margin-top:2px;">${esc(s.healthStatus)}</div>
              </div>
            </div>
            <div style="margin-top:10px"><span style="display:inline-block;font-size:11px;font-weight:700;color:${stLabel.c};background:var(--surface-2);border:1px solid var(--border);padding:3px 10px;border-radius:var(--r-pill)">${stLabel.t}</span></div>
            <div style="margin-top:12px">
              ${renderTimeline(s.proj.start_date || s.proj.startDate, s.proj.end_date || s.proj.endDate, pct, s.proj.status === "Đã bàn giao")}
              ${breakdownHtml}
            </div>
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <div style="font-size:12px"><span style="color:var(--muted)">Báo cáo hôm nay: </span>${todayBadge}</div>
              <span style="color:var(--primary);font-weight:700;font-size:13px">Xem chi tiết ›</span>
            </div>
          </div>`;
        }).join("") + '</div>';
    }
  }

  // Dòng tiền 2 chiều + chỉ báo tuần thanh toán
  const week=isoWeek(new Date());
  const wkEven=(week%2===0);
  const wkLabel= wkEven ? 'ĐỀ NGHỊ THANH TOÁN' : 'TUẦN THANH TOÁN';
  const wkColor= wkEven ? 'var(--success)' : 'var(--primary)';
  const conPhaiThu=totHD-totThu;
  const canDoi=totThu-totChi;
  // metric card: nhận raw value (số nguyên VND), tự tính đơn vị
  const metric=(label,rawVal,color,emph)=>{
    const {num,unit}=fmtAuto(rawVal);
    const fontSize=num.length>9?'16px':num.length>6?'18px':'21px';
    return `<div style="padding:11px 13px;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface-2)${emph?(';box-shadow:inset 3px 0 0 '+color):''}">`
      +`<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;margin-bottom:5px">${label}</div>`
      +`<div style="font-size:${fontSize};font-weight:800;line-height:1;color:${color||'var(--ink)'};white-space:nowrap">${num} <span style="font-size:11px;font-weight:600;color:var(--muted)">${unit}</span></div>`
      +`</div>`;
  };
  if($("exec-payment-summary")) $("exec-payment-summary").innerHTML =
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;border-radius:var(--r-md);background:var(--tint);font-weight:700;color:${wkColor};font-size:12px">${getDashSvg('calendar', 16, wkColor)} Tuần ${week} · ${wkLabel}</div>
     <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">
       ${metric('Giá trị HĐ',   totHD,      'var(--ink)')}
       ${metric('Đã thu',        totThu,     'var(--success)')}
       ${metric('Còn phải thu',  conPhaiThu, 'var(--primary)')}
       ${metric('Đã chi',        totChi,     'var(--danger)')}
       ${metric('Cân đối thu–chi', canDoi,   canDoi>=0?'var(--success)':'var(--danger)', true)}
     </div>`;

  // Nhân sự theo bộ phận
  const deptNames={banql:"Quản lý",thicong:"Bộ phận Thi công",qaqc:"Bộ phận QA-QC",hse:"Bộ phận HSE",shopdrawing:"Bộ phận Shopdrawing",baotri:"Bộ phận Bảo trì"};
  const order=["banql","thicong","qaqc","hse","shopdrawing","baotri"];
  const sortedDepts=Object.keys(depts).sort((a,b)=>{ let ia=order.indexOf(a); if(ia<0)ia=99; let ib=order.indexOf(b); if(ib<0)ib=99; return ia-ib; });
  if($("exec-hr-list")) $("exec-hr-list").innerHTML = sortedDepts.length
    ? sortedDepts.map(k=>`<div class="it"><b>${deptNames[k]||esc(k)}</b><span>${(depts[k]||[]).length} người</span></div>`).join("")
    : '<div class="muted">Chưa phân bổ nhân sự bộ phận.</div>';

  // Khối chuyên môn (Khối 4 card compact nhỏ gọn)
  if($("exec-chuyenmon")){
    const sdCount = (depts.shopdrawing || []).length;
    const mtCount = (depts.baotri || []).length;
    const hasSubs = subs && subs.length > 0;
    
    const cm=[
      {
        n:"QA-QC", sub:"Kiểm soát chất lượng",
        i:getDashSvg('check-circle', 20, 'var(--hp-success)'), t:"qaqc",
        desc: !hasSubs ? "Chưa có dữ liệu" : "0 vấn đề chất lượng",
        statusBadge: !hasSubs ? "⚪ Chưa có dữ liệu" : "🟢 Tốt",
        color: !hasSubs ? "var(--muted)" : "var(--hp-success)",
        bg: !hasSubs ? "rgba(148,163,184,0.12)" : "rgba(34,197,94,0.12)"
      },
      {
        n:"HSE", sub:"An toàn lao động",
        i:getDashSvg('shield', 20, 'var(--hp-primary)'), t:"hse",
        desc: !hasSubs ? "Chưa có dữ liệu" : "An toàn: Tốt (0 cảnh báo)",
        statusBadge: !hasSubs ? "⚪ Chưa có dữ liệu" : "🟢 An toàn",
        color: !hasSubs ? "var(--muted)" : "var(--hp-success)",
        bg: !hasSubs ? "rgba(148,163,184,0.12)" : "rgba(34,197,94,0.12)"
      },
      {
        n:"Shopdrawing", sub:"Bản vẽ thi công",
        i:getDashSvg('pen-tool', 20, 'var(--hp-brand-accent)'), t:"shopdrawing",
        desc: sdCount === 0 ? "Chưa có dữ liệu" : `${sdCount} nhân sự`,
        statusBadge: sdCount === 0 ? "⚪ Chưa có dữ liệu" : "🟢 Hoạt động",
        color: sdCount === 0 ? "var(--muted)" : "var(--hp-brand-accent)",
        bg: sdCount === 0 ? "rgba(148,163,184,0.12)" : "rgba(14,165,233,0.12)"
      },
      {
        n:"Bảo trì", sub:"Bảo trì & sửa chữa",
        i:getDashSvg('wrench', 20, 'var(--hp-warning)'), t:"baotri",
        desc: mtCount === 0 ? "Chưa có dữ liệu" : `${mtCount} nhân sự`,
        statusBadge: mtCount === 0 ? "⚪ Chưa có dữ liệu" : "🟢 Hoạt động",
        color: mtCount === 0 ? "var(--muted)" : "var(--hp-warning)",
        bg: mtCount === 0 ? "rgba(148,163,184,0.12)" : "rgba(245,158,11,0.12)"
      }
    ];

    $("exec-chuyenmon").innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">'
      + cm.map(c=>`<div class="dept-card" onclick="switchTab('${c.t}')" style="cursor:pointer; padding:12px 14px; border:1px solid var(--border); border-radius:var(--r-md); background:var(--surface); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s, box-shadow 0.2s;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:32px; height:32px; border-radius:8px; background:var(--surface-2); display:flex; align-items:center; justify-content:center;">${c.i}</div>
              <div>
                <div style="font-weight:700; font-size:13px; color:var(--hp-text-primary); line-height:1.2;">${esc(c.n)}</div>
                <div style="font-size:11px; color:var(--muted); margin-top:2px;">${esc(c.sub)}</div>
              </div>
            </div>
            <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; background:${c.bg}; color:${c.color}; white-space:nowrap;">${c.statusBadge}</span>
          </div>
          <div style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; align-items:center; font-size:11px;">
            <span style="color:var(--hp-text-primary); font-weight:600;">${esc(c.desc)}</span>
            <span style="color:var(--primary); font-weight:700;">Xem ›</span>
          </div>
        </div>`).join("")
      + '</div>';
  }

  // Biểu đồ cơ cấu sức khỏe dự án (Donut)
  if(typeof Chart!=="undefined" && $("exec-status-chart")){
    if(window._execChart){ try{ window._execChart.destroy(); }catch(e){} }
    const css = getComputedStyle(document.documentElement);
    const C = (n) => css.getPropertyValue(n).trim();
    const borderCol = C('--hp-border') || 'rgba(255,255,255,0.08)';
    const textSecondary = '#CBD5E1';

    const tierCounts = { "Rất tốt": 0, "Tốt": 0, "Cần theo dõi": 0, "Cảnh báo": 0, "Nguy hiểm": 0 };
    const tierColors = {
      "Rất tốt": "#22c55e",
      "Tốt": "#3b82f6",
      "Cần theo dõi": "#eab308",
      "Cảnh báo": "#f97316",
      "Nguy hiểm": "#ef4444"
    };

    stats.forEach(s => {
      const tierName = s.healthStatus || (typeof healthTier === 'function' ? healthTier(s.health).name : "Tốt");
      tierCounts[tierName] = (tierCounts[tierName] || 0) + 1;
    });

    const activeLabels = Object.keys(tierCounts).filter(k => tierCounts[k] > 0);
    const activeData = activeLabels.map(k => tierCounts[k]);
    const activeColors = activeLabels.map(k => tierColors[k]);

    window._execChart = new Chart($("exec-status-chart"), {
      type: 'doughnut',
      data: {
        labels: activeLabels.length ? activeLabels : ["Chưa có dữ liệu"],
        datasets: [{
          data: activeData.length ? activeData : [1],
          backgroundColor: activeColors.length ? activeColors : ['#94a3b8'],
          borderWidth: 2,
          borderColor: borderCol
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textSecondary, boxWidth: 12, usePointStyle: true, font: { size: 11, weight: '600' } }
          },
          tooltip: {
            callbacks: {
              label: (c) => activeLabels.length ? `${c.label}: ${c.raw} dự án` : "Chưa có dự án"
            }
          }
        },
        cutout: '66%'
      }
    });
  }

  // Biểu đồ cột đôi Đã thu vs Đã chi theo dự án (grouped, cột gọn ~280px)
  if(typeof Chart!=="undefined" && $("exec-finance-chart")){
    if(window._financeChart){ try{ window._financeChart.destroy(); }catch(e){} }
    if(finTop.length){
      // Tính đơn vị linh động: nếu max >= 1 tỷ thì dùng "tỷ", còn dùng "tr"
      const allVals = finTop.flatMap(r => [r.thu, r.chi]);
      const maxVal  = Math.max(...allVals);
      const useTy   = maxVal >= 1e9;
      const divisor = useTy ? 1e9 : 1e6;
      const unit    = useTy ? 'tỷ' : 'tr';
      const fmt = (v) => {
        const n = v / divisor;
        return n % 1 === 0 ? n.toLocaleString('vi-VN') : n.toLocaleString('vi-VN', {minimumFractionDigits:1, maximumFractionDigits:3});
      };

      const css = getComputedStyle(document.documentElement);
      const C = (n) => css.getPropertyValue(n).trim();
      const brandPrimary = '#22c55e';
      const warningColor = '#f59e0b';
      const textSecondary = '#CBD5E1';
      const borderCol = 'rgba(255, 255, 255, 0.08)';

      window._financeChart = new Chart($("exec-finance-chart"), {
        type: 'bar',
        data: {
          labels: finTop.map(r => r.name.length > 18 ? r.name.slice(0, 17) + '…' : r.name),
          datasets: [
            {
              label: 'Đã thu',
              data: finTop.map(r => +(r.thu / divisor).toFixed(3)),
              backgroundColor: brandPrimary,
              borderRadius: { topLeft: 4, topRight: 4 },
              borderSkipped: false,
              maxBarThickness: 42,
              barPercentage: 0.75,
              categoryPercentage: 0.65
            },
            {
              label: 'Đã chi',
              data: finTop.map(r => +(r.chi / divisor).toFixed(3)),
              backgroundColor: warningColor,
              borderRadius: { topLeft: 4, topRight: 4 },
              borderSkipped: false,
              maxBarThickness: 42,
              barPercentage: 0.75,
              categoryPercentage: 0.65
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top', align: 'end',
              labels: { color: textSecondary, boxWidth: 12, usePointStyle: true, font: { size: 11, weight: '600' } }
            },
            tooltip: {
              backgroundColor: '#1E293B',
              titleColor: '#F5F7FA',
              bodyColor: '#F5F7FA',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              callbacks: {
                label: (c) => `${c.dataset.label}: ${fmt(c.raw * divisor)} ${unit}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (v) => v + ' ' + unit,
                font: { size: 10 },
                color: textSecondary
              },
              grid: { color: borderCol }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: '600' }, color: textSecondary }
            }
          }
        }
      });
    }
  }

  // Đồng bộ sang Dashboard Bộ phận Thi công (dùng chung dữ liệu)
  if($("tc-kpi")) $("tc-kpi").innerHTML=[["Tổng dự án",total],["Đang thi công",stCounts["Đang thi công"]],["Hoàn thành",stCounts["Đã bàn giao"]],["Cảnh báo rủi ro",risky]]
    .map(k=>`<div><div class="n" ${(k[0].indexOf('Cảnh báo')>=0 && k[1]>0)?'style="color:var(--danger)"':''}>${k[1]}</div><div class="l">${k[0]}</div></div>`).join("");
  if($("tc-progress-table") && $("exec-progress-table")) $("tc-progress-table").innerHTML=$("exec-progress-table").innerHTML;

  // --- LPB-M3: Đề xuất liên phòng ban khẩn cấp/quá hạn ---
  try {
    const lpbReqs = await metaGet("lpb_requests", []);
    const isOverdue = (r) => r.status !== "completed" && r.due && new Date() > new Date(r.due);
    const urgentReqs = lpbReqs.filter(r => r.status !== "completed" && (r.urgent || isOverdue(r)));
    
    const container = $("exec-lpb-urgent");
    const listEl = $("exec-lpb-urgent-list");
    
    if (container && listEl) {
      if (urgentReqs.length === 0) {
        container.classList.add("hide");
      } else {
        container.classList.remove("hide");
        
        // Helper định dạng ngày giờ
        const formatLpbDate = (dStr) => {
          if (!dStr) return "";
          const d = new Date(dStr);
          if (isNaN(d.getTime())) return dStr;
          const pad = (n) => String(n).padStart(2, "0");
          return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        
        listEl.innerHTML = urgentReqs.map(r => {
          const proj = projects.find(p => p.id === r.project_id);
          const projName = proj ? proj.name : "Dự án khác";
          const isOver = isOverdue(r);
          const badgeHtml = r.urgent 
            ? `<span class="lpb-badge badge-urgent" style="font-size:11px; padding:3px 6px; margin:0;">🔥 Khẩn</span>`
            : `<span class="lpb-badge badge-overdue" style="font-size:11px; padding:3px 6px; margin:0;">🔴 Quá hạn</span>`;
          
          return `
            <div class="sub-item" onclick="selectAndOpenLpbRequest('${r.project_id}', '${r.id}')" 
              style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid var(--border); border-radius:var(--r-sm); transition:background 0.2s;" 
              onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='transparent'">
              <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                <div style="font-size:16px;">🤝</div>
                <div style="text-align:left; min-width:0; flex:1;">
                  <div style="font-weight:700; color:var(--text-strong); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <span style="color:var(--primary-dark)">[${esc(projName)}]</span> ${esc(r.title)}
                  </div>
                  <div class="muted" style="font-size:11px; margin-top:2px;">
                    Mã: <b style="font-family:monospace; color:var(--primary)">${esc(r.id)}</b> · Gửi phòng: <b>${esc(r.dept)}</b> · Hạn: <span style="${isOver ? 'color:var(--danger); font-weight:bold' : ''}">${formatLpbDate(r.due)}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                ${badgeHtml}
                <span style="color:var(--primary); font-size:12px; font-weight:600;">Xử lý ➔</span>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  } catch (err) {
    console.error("Lỗi render đề xuất khẩn LPB:", err);
  }

  // Gia hạn tiến độ gần đây (toàn công ty) — thông báo cho Ban lãnh đạo
  try {
    const usersList = await DataService.listUsers();
    const nameOf = (id) => (usersList.find(u=>u.id===id)||{}).full_name || id || "BCH";
    const now = Date.now();
    const exts = [];
    for (const p of projects) {
      const items = await metaGet("progress:"+p.id, []);
      (items||[]).forEach(it => (it.extensions||[]).forEach(ex => exts.push({ proj:p.name, task:it.task, ...ex })));
    }
    exts.sort((a,b)=> (a.at<b.at?1:-1));
    const recent = exts.filter(e => e.at && (now - new Date(e.at).getTime()) <= 14*86400000).slice(0,20);
    const countByTask = {}; exts.forEach(e=>{ const k=e.proj+"|"+e.task; countByTask[k]=(countByTask[k]||0)+1; });
    const box=$("exec-extensions"), list=$("exec-extensions-list");
    if (box && list) {
      if (!recent.length) box.classList.add("hide");
      else {
        box.classList.remove("hide");
        const fmtD=(s)=>{ if(!s) return "?"; const d=new Date(s); return isNaN(d)?s:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; };
        list.innerHTML = recent.map(e=>{
          const times=countByTask[e.proj+"|"+e.task];
          const warn = times>=2 ? `<span style="color:var(--danger); font-weight:700"> · ⚠ gia hạn ${times} lần</span>` : "";
          return `<div style="display:flex; justify-content:space-between; gap:10px; padding:10px 12px; border:1px solid rgba(180,83,9,0.15); border-radius:8px; font-size:13px;">
            <div><b><span style="color:var(--primary-dark)">[${esc(e.proj)}]</span> ${esc(e.task)}</b>${warn}
              <div class="muted" style="font-size:11px; margin-top:2px;">Dời <b>${fmtD(e.fromEnd)} → ${fmtD(e.toEnd)}</b> · Lý do: <i>${esc(e.reason||'-')}</i> · BCH: ${esc(nameOf(e.by))}</div></div>
            <div class="muted" style="font-size:11px; white-space:nowrap">${fmtD(e.at)}</div>
          </div>`;
        }).join("");
      }
    }
  } catch(err){ console.error("render gia hạn lỗi:", err); }

  // VIỆC CẦN XỬ LÝ HÔM NAY (Bảng điều hành hành động)
  try {
    const todo = [];
    const allReports = await metaGet("daily_reports", []);
    const pendingReports = (allReports||[]).filter(r => r.status === "pending" || r.approval === "pending").length;
    if (pendingReports>0) todo.push({
      projName: "Toàn công ty",
      text: `Có <b>${pendingReports} Báo cáo ngày</b> đang chờ duyệt`,
      commander: "BCH / KTS",
      sev: { label: "🟡 Vừa", color: "var(--hp-warning)" },
      action: `<button class="btn btn-sm" style="padding:2px 8px;font-size:11px;" onclick="switchTab('baocaongay-new')">Duyệt ›</button>`
    });

    let pendingPay = 0;
    for (const p of projects) {
      const sc = await metaGet("subcon_payments:"+p.id, []);
      const ex = await metaGet("expenses:"+p.id, []);
      pendingPay += (sc||[]).filter(x=>x.status==="pending").length + (ex||[]).filter(x=>x.status==="pending").length;
    }
    if (pendingPay>0) todo.push({
      projName: "Toàn công ty",
      text: `Có <b>${pendingPay} Yêu cầu thanh toán / duyệt chi</b> đang chờ xử lý`,
      commander: "P.KTTC",
      sev: { label: "🔴 Cao", color: "var(--hp-danger)" },
      action: `<button class="btn btn-sm" style="padding:2px 8px;font-size:11px;" onclick="switchTab('thanhtoan')">Chi tiết ›</button>`
    });

    const lpbAll = await metaGet("lpb_requests", []);
    const lpbUrgent = (lpbAll||[]).filter(r => r.status!=="completed" && (r.urgent || (r.due && new Date()>new Date(r.due)))).length;
    if (lpbUrgent>0) todo.push({
      projName: "Liên phòng ban",
      text: `Có <b>${lpbUrgent} Đề xuất liên phòng ban khẩn/quá hạn</b>`,
      commander: "Các Phòng Ban",
      sev: { label: "🔴 Khẩn", color: "var(--hp-danger)" },
      action: `<button class="btn btn-sm" style="padding:2px 8px;font-size:11px;" onclick="switchTab('lpb')">Xử lý ›</button>`
    });

    stats.forEach(s => {
      if ((s.proj.status!=="Đã bàn giao" && s.proj.status!=="Tạm dừng") && !reportedToday.has(s.proj.id)) {
        todo.push({
          projName: s.proj.name,
          text: `Chưa nộp <b>Báo cáo thi công ngày hôm nay</b>`,
          commander: s.proj.commander || "Chỉ huy trưởng",
          sev: { label: "🟡 Vừa", color: "var(--hp-warning)" },
          action: `<button class="btn btn-sm" style="padding:2px 8px;font-size:11px;" onclick="openProject('${s.proj.id}')">Xem ›</button>`
        });
      }
    });

    const box=$("exec-todo"), list=$("exec-todo-list");
    if (box && list) {
      box.classList.remove("hide");
      if (!todo.length) {
        list.innerHTML = '<div style="color:var(--hp-success); font-weight:600; padding:6px 0">🟢 Không có việc tồn đọng cần xử lý hôm nay. Tất cả các dự án đang vận hành an toàn.</div>';
      } else {
        const tableHtml = `
          <table class="dash-action-table" style="width:100%; border-collapse:collapse; font-size:13px; background:var(--surface); border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="border-bottom:2px solid var(--border); text-align:left; color:var(--muted); font-size:11px;">
                <th style="padding:8px 10px;">Dự án</th>
                <th style="padding:8px 10px;">Vấn đề / Cảnh báo trọng tâm cần xử lý</th>
                <th style="padding:8px 10px;">Phụ trách (CHT)</th>
                <th style="padding:8px 10px; text-align:center;">Mức độ</th>
                <th style="padding:8px 10px; text-align:right;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${todo.slice(0, 5).map(t => `
                <tr>
                  <td style="font-weight:700; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(t.projName)}</td>
                  <td>${t.text}</td>
                  <td style="color:var(--muted); font-size:12px; white-space:nowrap;">👤 ${esc(t.commander)}</td>
                  <td style="text-align:center; white-space:nowrap;"><span style="font-weight:700; font-size:11px; color:${t.sev.color};">${t.sev.label}</span></td>
                  <td style="text-align:right; white-space:nowrap;">${t.action}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
        list.innerHTML = tableHtml;
      }
    }
  } catch(err){ console.error("render todo lỗi:", err); }

 }catch(err){ console.error("renderExecutive lỗi:", err); }
}
function openProject(id){
  const userProjects = Array.from($("cur-project").options).map(opt=>opt.value);
  if(userProjects.includes(id)) {
    CUR.project=id; metaSet("cur_project", id);
    const sel=$("cur-project"); if(sel) sel.value=id;
    switchTab("dashboard");
    renderMySubs(); renderContractors(); renderTiendo(); renderCdt();
  } else {
    alert("Dự án này bạn không được phân quyền truy cập!");
  }
}

async function selectAndOpenLpbRequest(projectId, requestId) {
  const selectProj = document.getElementById("cur-project");
  if (selectProj) {
    const userProjects = Array.from(selectProj.options).map(opt => opt.value);
    if (userProjects.includes(projectId)) {
      CUR.project = projectId;
      await metaSet("cur_project", projectId);
      selectProj.value = projectId;
      selectProj.dispatchEvent(new Event('change'));
    } else {
      alert("Dự án này bạn không được phân quyền truy cập!");
      return;
    }
  }
  
  setTimeout(async () => {
    switchTab("lpb");
    if (typeof openLpbDetailModal === "function") {
      openLpbDetailModal(requestId);
    }
  }, 300);
}
window.selectAndOpenLpbRequest = selectAndOpenLpbRequest;
