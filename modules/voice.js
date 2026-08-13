// Voice journal capture and offline Vietnamese parser.
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
  // Trước đây gọi Edge Function Supabase "parse-journal" — hàm đó đã NGHỈ HƯU (GĐ7) và Supabase
  // đã gỡ bỏ 28/07. Nay phân tích hoàn toàn TRÊN MÁY bằng parseJournalLocal (không cần mạng).
  let parsed = parseJournalLocal(text, { contractors: known });
  if(st) st.textContent = "Đã phân tích (trên máy).";
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
