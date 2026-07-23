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
  return {proj, rate, highIssues, overdueConds, readyDots, dotCount:cdt.length, health: H.healthScore, healthStatus: H.healthStatus, healthColorToken: H.healthColorToken, totalManpower, manpowerToday, schedulePct, overdueTasks, logDays:days.length};
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
    pl.innerHTML = renderEmptyState('🏢', 'Chưa có dự án phân quyền', 'Vui lòng liên hệ Admin để được cấp quyền quản lý dự án.');
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
    $("exec-health").textContent = fmtHealth(avg) + "đ";
    $("exec-health").style.color = "var(" + healthTier(avg).token + ")";
  }
  if($("exec-date")){ try{ $("exec-date").textContent = new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}); }catch(e){ $("exec-date").textContent=tToday; } }

  // KPI tổng quan
  const kpiCards=[
    {icon:"🏢", val:total, label:"Tổng dự án", color:"var(--hp-primary)", iconBg:"var(--hp-info-bg)", desc:"Các dự án đang quản lý"},
    {icon:"🚧", val:stCounts["Đang thi công"], label:"Đang thi công", color:"var(--hp-brand-accent)", iconBg:"var(--hp-info-bg)", desc:"Đang triển khai thực tế"},
    {icon:"⚠️", val:risky, label:"Cảnh báo rủi ro", color:"var(--hp-danger)", iconBg:"var(--hp-danger-bg)", desc: risky > 0 ? "Yêu cầu kiểm tra" : "Hiện tại an toàn"},
    {icon:"👷", val:(subs.filter(s=>s.log_date===tToday).length===0 ? "—" : manpowerToday), label:"Nhân lực hôm nay", color:"var(--hp-success)", iconBg:"var(--hp-success-bg)", desc:"Tổng số thợ & kỹ sư"},
    {icon:"🕒", val:totalOverdue, label:"Quá hạn", color: totalOverdue>0?"var(--hp-danger)":"var(--hp-success)", iconBg: totalOverdue>0?"var(--hp-danger-bg)":"var(--hp-success-bg)", desc: totalOverdue>0 ? "Hạng mục trễ kế hoạch" : "Tiến độ đạt yêu cầu"}
  ];
  if($("exec-kpi")) $("exec-kpi").innerHTML = kpiCards.map(k=>`
    <div class="kpi-card" style="min-width:0; border-top:4px solid ${k.color}">
      <div class="kpi-icon" style="background:${k.iconBg}; color:${k.color}">${k.icon}</div>
      <div class="kpi-value" style="color:${k.color}; font-size:40px">${k.val}</div>
      <div class="kpi-label" style="color:${k.color}">${k.label}</div>
      <div class="kpi-desc">${k.desc}</div>
    </div>`).join("");

  const subsToday=subs.filter(s=>s.log_date===tToday);
  const reportedToday=new Set(subsToday.map(s=>s.project_id));

  // Bảng tình trạng dự án (Tiến độ kế hoạch theo thời gian + hạng mục quá hạn)
  if($("exec-progress-table")){
    if(!stats.length){
      $("exec-progress-table").innerHTML = renderEmptyState('🏢', 'Chưa có dự án nào', 'Hệ thống chưa khởi tạo dự án nào trên hệ thống điều hành.');
    } else {
      $("exec-progress-table").innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px">'
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
          const overdue= s.overdueTasks>0 ? `<div style="font-size:11px;color:var(--danger);margin-top:6px">⚠ ${s.overdueTasks} hạng mục quá hạn</div>` : '';
          return `<div onclick="openProject('${s.proj.id}')" style="cursor:pointer;border:1px solid var(--border);border-radius:var(--r-md);padding:14px;background:var(--surface);border-top:3px solid ${hc}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
              <div style="min-width:0;flex:1">
                <div style="font-weight:800;font-size:15px;color:var(--ink);line-height:1.25;overflow:hidden;text-overflow:ellipsis">${esc(s.proj.name)}</div>
                <div style="font-size:12px;color:var(--muted);margin-top:3px">${esc(s.proj.commander||'-')} · ${esc(s.proj.status||'Đang thi công')}</div>
              </div>
              <div style="text-align:center;flex-shrink:0;min-width:54px">
                <div style="font-weight:800;font-size:24px;color:${hc};line-height:1">${fmtHealth(s.health)}</div>
                <div style="font-size:10px;color:${hc};text-transform:uppercase;letter-spacing:.3px">${esc(s.healthStatus)}</div>
              </div>
            </div>
            <div style="margin-top:10px"><span style="display:inline-block;font-size:11px;font-weight:700;color:${stLabel.c};background:var(--surface-2);border:1px solid var(--border);padding:3px 10px;border-radius:var(--r-pill)">${stLabel.t}</span></div>
            <div style="margin-top:12px">
              ${renderTimeline(s.proj.start_date || s.proj.startDate, s.proj.end_date || s.proj.endDate, pct, s.proj.status === "Đã bàn giao")}
              ${overdue}
            </div>
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <div style="font-size:12px"><span style="color:var(--muted)">Báo cáo hôm nay: </span>${todayBadge}</div>
              <span style="color:var(--primary);font-weight:700;font-size:13px">Xem ›</span>
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
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;border-radius:var(--r-md);background:var(--tint);font-weight:700;color:${wkColor};font-size:12px">📅 Tuần ${week} · ${wkLabel}</div>
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

  // Khối chuyên môn (để sẵn giao diện)
  if($("exec-chuyenmon")){
    const cm=[
      {n:"QA-QC",     i:"✔️", t:"qaqc",        sub:"Kiểm soát chất lượng"},
      {n:"HSE",       i:"⛑️", t:"hse",          sub:"An toàn lao động"},
      {n:"Shopdrawing",i:"✏️",t:"shopdrawing",  sub:"Bản vẽ thi công"},
      {n:"Bảo trì",   i:"🔧", t:"baotri",       sub:"Bảo trì & sửa chữa"}
    ];
    $("exec-chuyenmon").innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">'
      + cm.map(c=>`<div class="dept-card" style="cursor:pointer;text-align:center" onclick="switchTab('${c.t}')">
          <div style="font-size:26px;margin-bottom:6px">${c.i}</div>
          <div style="font-weight:700;color:var(--primary-dark);font-size:14px">${c.n}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">${c.sub}</div>
          <div style="margin-top:8px;font-size:11px;color:var(--primary);font-weight:600">Vào bộ phận →</div>
        </div>`).join("")
      + '</div>';
  }

  // Biểu đồ cơ cấu trạng thái
  if(typeof Chart!=="undefined" && $("exec-status-chart")){
    if(window._execChart){ try{ window._execChart.destroy(); }catch(e){} }
    const css = getComputedStyle(document.documentElement);
    const C = (n) => css.getPropertyValue(n).trim();
    const borderCol = C('--hp-border') || 'rgba(255,255,255,0.08)';
    const textSecondary = C('--hp-text-secondary') || '#B8C0C8';
    window._execChart=new Chart($("exec-status-chart"),{ type:'doughnut',
      data:{ labels:Object.keys(stCounts), datasets:[{ data:Object.values(stCounts), backgroundColor:[C('--hp-muted'), C('--hp-brand-accent'), C('--hp-warning'), C('--hp-brand-primary')], borderWidth:2, borderColor:borderCol }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:textSecondary, boxWidth:10, usePointStyle:true, font:{size:11} } } }, cutout:'66%' } });
  }

  // Biểu đồ cột đôi Đã thu vs Đã chi theo dự án (grouped, cột dính nhau)
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
      const brandPrimary = C('--hp-brand-primary') || '#60BB46';
      const warningColor = C('--hp-warning') || '#FFA726';
      const textSecondary = C('--hp-text-secondary') || '#B8C0C8';
      const borderCol = C('--hp-border') || 'rgba(255,255,255,0.08)';

      window._financeChart = new Chart($("exec-finance-chart"), {
        type: 'bar',
        data: {
          labels: finTop.map(r => r.name.length > 18 ? r.name.slice(0, 17) + '…' : r.name),
          datasets: [
            {
              label: 'Đã thu',
              data: finTop.map(r => +(r.thu / divisor).toFixed(3)),
              backgroundColor: brandPrimary,
              borderRadius: { topLeft: 5, topRight: 5 },
              borderSkipped: false,
              barPercentage: 0.85,
              categoryPercentage: 0.7
            },
            {
              label: 'Đã chi',
              data: finTop.map(r => +(r.chi / divisor).toFixed(3)),
              backgroundColor: warningColor,
              borderRadius: { topLeft: 5, topRight: 5 },
              borderSkipped: false,
              barPercentage: 0.85,
              categoryPercentage: 0.7
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top', align: 'end',
              labels: { color: textSecondary, boxWidth: 12, usePointStyle: true, font: { size: 11 } }
            },
            tooltip: {
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
              ticks: { font: { size: 11 }, color: textSecondary }
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

  // VIỆC CẦN XỬ LÝ HÔM NAY (gom đầu việc cần lãnh đạo quyết)
  try {
    const todo = [];
    const allReports = await metaGet("daily_reports", []);
    const pendingReports = (allReports||[]).filter(r => r.status === "pending").length;
    if (pendingReports>0) todo.push({icon:"📝", text:`${pendingReports} báo cáo chờ duyệt`, color:"var(--warning)", tab:"baocao"});
    let pendingPay = 0;
    for (const p of projects) {
      const sc = await metaGet("subcon_payments:"+p.id, []);
      const ex = await metaGet("expenses:"+p.id, []);
      pendingPay += (sc||[]).filter(x=>x.status==="pending").length + (ex||[]).filter(x=>x.status==="pending").length;
    }
    if (pendingPay>0) todo.push({icon:"💰", text:`${pendingPay} đề nghị thanh toán chờ duyệt`, color:"var(--danger)", tab:"thanhtoan"});
    const lpbAll = await metaGet("lpb_requests", []);
    const lpbUrgent = (lpbAll||[]).filter(r => r.status!=="completed" && (r.urgent || (r.due && new Date()>new Date(r.due)))).length;
    if (lpbUrgent>0) todo.push({icon:"🔥", text:`${lpbUrgent} đề xuất liên phòng ban khẩn`, color:"#6b21a8", tab:"lpb"});
    const missing = stats.filter(s => (s.proj.status!=="Đã bàn giao" && s.proj.status!=="Tạm dừng") && !reportedToday.has(s.proj.id)).length;
    if (missing>0) todo.push({icon:"✗", text:`${missing} dự án chưa báo cáo hôm nay`, color:"var(--danger)", tab:"dashboard"});
    const box=$("exec-todo"), list=$("exec-todo-list");
    if (box && list) {
      box.classList.remove("hide");
      if (!todo.length) list.innerHTML = '<div style="color:var(--success); font-weight:600; padding:6px 0">✓ Không có việc tồn đọng cần xử lý hôm nay.</div>';
      else list.innerHTML = todo.map(t=>`<div onclick="switchTab('${t.tab}')" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding:10px 14px; border:1px solid var(--border); border-radius:10px; background:var(--surface); font-size:13px; font-weight:600" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='var(--surface)'"><span style="font-size:16px">${t.icon}</span><span style="color:${t.color}">${t.text}</span><span style="color:var(--primary); font-size:11px">→</span></div>`).join("");
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
