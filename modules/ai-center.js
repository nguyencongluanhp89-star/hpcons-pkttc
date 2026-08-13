// AI Center, Gemini question flow and company snapshot.
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
    if(!fbReady) return; // Supabase đã gỡ bỏ 28/07 — chỉ còn đường Firebase
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
    // (Nhánh đẩy snapshot lên Supabase đã xóa 28/07 — bot Telegram đọc từ Firebase.)
  }catch(e){
    console.warn("Lỗi gọi pushAiSnapshot:", e);
  }
}
function renderAiCenter(){ const q=$("ai-q"); if(q) q.focus(); pushAiSnapshot(); }
