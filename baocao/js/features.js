/* === js/features.js (voice + nhan dien cong tac + tien do % + anh) === Tu dong tach tu app goc. Cac file nap theo thu tu: data -> utils -> features -> render === */

function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

const PROGRESS_CHECKS = [
  { id: 'grp-02', label: '02 Nhân lực',  check: () => typeof units !== 'undefined' && units.length > 0 },
  { id: 'grp-03', label: '03 Hạng mục',  check: () => typeof works !== 'undefined' && works.length > 0 },
  { id: 'grp-03', label: '03 Ảnh',       check: () => typeof photos !== 'undefined' && photos.length > 0 },
  { id: 'grp-04', label: '04 Kế hoạch',  check: () => el('f_plan') && el('f_plan').value.trim().length > 3 },
  { id: 'grp-06', label: '06 Ghi chú',   check: () => el('f_note') && el('f_note').value.trim().length > 3 },
  { id: 'grp-07', label: '07 An toàn',   check: () => el('f_safe') && el('f_safe').value.trim().length > 3 },
];
// ====== THANH TIẾN ĐỘ HOÀN THÀNH ======


/* Web Speech API */
let recog=null, listening=false, finalTranscript='', voiceManualStop=false;
function toggleVoice(){

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

  if(!SR){ el('voiceStatus').innerHTML='⚠ Trình duyệt không hỗ trợ nhận giọng nói. Hãy dùng Chrome hoặc Edge.'; return; }

  if(listening){ voiceManualStop=true; recog.stop(); return; }

  voiceManualStop=false;

  recog=new SR(); recog.lang='vi-VN'; recog.continuous=true; recog.interimResults=true; finalTranscript='';

  // Hint Chrome nhận diện đúng tên nhà thầu/tổ đội từ KB
  const SG = window.SpeechGrammarList || window.webkitSpeechGrammarList;
  if (SG) {
    const kb = window.KB_CONTRACTORS || [];
    const names = kb.flatMap(k => [k.name, ...(k.aliases||[])]).filter(Boolean);
    if (names.length) {
      try {
        const grammar = '#JSGF V1.0; grammar kb; public <name> = ' + names.join(' | ') + ';';
        const gl = new SG(); gl.addFromString(grammar, 1); recog.grammars = gl;
      } catch(e2) {}
    }
  }

  recog.onstart=()=>{ 
    listening=true; 
    el('btnVoice').textContent='⏹ Dừng & phân tích'; 
    if (window.location.protocol === 'file:') {
      el('voiceStatus').innerHTML='🎙 Đang nghe... (tự nghe liên tục)<br><span style="color:#b45309;font-size:11px;font-weight:600;">⚠️ Chạy file start.bat (localhost) để Chrome lưu quyền micro, tránh bị hỏi lại sau khoảng lặng!</span>';
    } else {
      el('voiceStatus').textContent='🎙 Đang nghe... (tự nghe liên tục — bấm Dừng khi đọc xong)'; 
    }
  };

  recog.onresult=(e)=>{ let interim=''; for(let i=e.resultIndex;i<e.results.length;i++){ const tr=e.results[i][0].transcript; if(e.results[i].isFinal) finalTranscript+=tr+' '; else interim+=tr; } el('voiceTranscript').value=(finalTranscript+interim).trim(); };

  recog.onerror=(e)=>{ if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){ voiceManualStop=true; el('voiceStatus').textContent='⚠ Không truy cập được micro: '+e.error; } else if(e.error!=='no-speech'&&e.error!=='aborted'){ el('voiceStatus').textContent='⚠ Lỗi nhận giọng nói: '+e.error; } };

  const safeRestart = (delay = 300) => {
    if (voiceManualStop) return;
    setTimeout(() => {
      if (voiceManualStop) return;
      try {
        recog.start();
        if (window.location.protocol === 'file:') {
          el('voiceStatus').innerHTML='🎙 Đang nghe... (tự nghe liên tục)<br><span style="color:#b45309;font-size:11px;font-weight:600;">⚠️ Chạy file start.bat (localhost) để Chrome lưu quyền micro, tránh bị hỏi lại sau khoảng lặng!</span>';
        } else {
          el('voiceStatus').textContent='🎙 Đang nghe... (tự nghe liên tục — bấm Dừng khi đọc xong)'; 
        }
      } catch (err) {
        console.warn("[Voice] Restart failed, retrying:", err.message);
        safeRestart(Math.min(delay * 2, 2000));
      }
    }, delay);
  };

  recog.onend=()=>{
    if(!voiceManualStop){
      safeRestart();
      return;
    }
    listening=false; el('btnVoice').textContent='🎤 Bắt đầu nói'; el('voiceStatus').textContent='⏸ Đã dừng. Đang phân tích...'; applyVoice(el('voiceTranscript').value);
  };

  recog.start();

}

/* Thuật ngữ học theo dự án (lưu localStorage) */

function termKey(){ return 'equipTerms__'+((el('f_proj').value||'default').trim()); }

function loadTerms(){

  let custom=[];

  try{ const raw=localStorage.getItem(termKey()); if(raw) custom=JSON.parse(raw)||[]; }catch(e){}

  runtimeTerms=EQUIP_TERMS.concat(custom);

  const ta=el('customTerms'); if(ta) ta.value=custom.map(c=>c.name+' = '+c.aliases.join(', ')).join('\n');

}

function saveTerms(){

  const lines=el('customTerms').value.split('\n').map(l=>l.trim()).filter(Boolean);

  const custom=[];

  lines.forEach(l=>{ const eqi=l.indexOf('='); if(eqi>0){ const n=l.slice(0,eqi).trim(); const a=l.slice(eqi+1).split(',').map(s=>s.trim().toLowerCase()).filter(Boolean); if(n&&a.length) custom.push({name:n,aliases:a}); } });

  try{ localStorage.setItem(termKey(), JSON.stringify(custom)); el('voiceStatus').textContent='💾 Đã lưu '+custom.length+' thuật ngữ cho dự án "'+(el('f_proj').value||'default')+'".'; }

  catch(e){ el('voiceStatus').textContent='⚠ Không lưu được: '+e.message; }

  runtimeTerms=EQUIP_TERMS.concat(custom);

}



function renderWorkForm(){
  let h="";const colors=["var(--green)","var(--navy2)","var(--orange)","var(--teal)","var(--purple)","var(--red)"];
  const kbCats = window.KB_CATEGORIES || [];
  const kbTasks = window.KB_TASKS || [];

  // Tạo datalist cho Tên hạng mục
  let datalistHtml = `<datalist id="kb-sched-categories">`;
  kbCats.forEach(c => {
    datalistHtml += `<option value="${c}"></option>`;
  });
  datalistHtml += `</datalist>`;

  works.forEach((w,i)=>{h+=`<div class="item-card">
    <label>Tên hạng mục</label>
    <input type="text" list="kb-sched-categories" value="${w.t.replace(/"/g,'&quot;')}" 
      onfocus="this.setAttribute('data-old', this.value); this.value = '';" 
      onblur="setTimeout(() => { if (!this.value) { this.value = this.getAttribute('data-old') || ''; } else { works[${i}].t = this.value; draw(); } }, 250);"
      oninput="works[${i}].t=this.value;drawDebounced()"
      placeholder="Nhập hoặc chọn hạng mục...">

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
      <label style="margin: 0;">Chi tiết (mỗi dòng 1 ý)</label>
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 11px; color: var(--text-muted)">Gợi ý chèn:</span>
        <select style="font-size: 11px; padding: 2px 4px; border: 1px solid var(--border); border-radius: 4px; max-width: 200px;" onchange="if(this.value){ insertTaskToWorks(this, ${i}); }">
          <option value="">-- Chọn công tác --</option>
          ${kbTasks.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <textarea id="works-desc-${i}" oninput="works[${i}].d=this.value;drawDebounced()">${w.d}</textarea>
    <button class="delbtn" type="button" onclick="works.splice(${i},1);renderWorkForm();draw()">Xóa</button></div>`});

  el('work-list').innerHTML=h + datalistHtml;
  if (typeof updateProgress === 'function') updateProgress();
}
function addWork(){works.push({c:"var(--green)",t:"",d:""});renderWorkForm();draw()}

window.insertTaskToWorks = (selectElem, idx) => {
  const taskName = selectElem.value;
  if (!taskName) return;
  const textarea = document.getElementById(`works-desc-${idx}`);
  if (!textarea) return;
  
  let currentText = textarea.value;
  if (currentText && !currentText.endsWith('\n')) {
    currentText += '\n';
  }
  currentText += taskName + ': ';
  
  textarea.value = currentText;
  works[idx].d = currentText;
  draw();
  
  // Reset select
  selectElem.value = "";
  textarea.focus();
};



/* ============ GIỌNG NÓI: TỔNG HỢP CÁC HẠNG MỤC (mục 03) ============ */

const PALETTE=["var(--green)","var(--navy2)","var(--orange)","var(--teal)","var(--purple)","var(--red)"];

const HANGMUC=[

  {k:['văn phòng chuyên gia'], t:'VĂN PHÒNG CHUYÊN GIA'},

  {k:['nhà văn phòng','văn phòng'], t:'NHÀ VĂN PHÒNG'},

  {k:['nhà xưởng 1','nhà xưởng một','xưởng 1','xưởng một'], t:'NHÀ XƯỞNG 1'},

  {k:['nhà xưởng 2','nhà xưởng hai','xưởng 2','xưởng hai'], t:'NHÀ XƯỞNG 2'},

  {k:['nhà xưởng 3','xưởng 3'], t:'NHÀ XƯỞNG 3'},

  {k:['nhà xưởng 4','xưởng 4'], t:'NHÀ XƯỞNG 4'},

  {k:['hàng rào','tường rào'], t:'XÂY HÀNG RÀO'},

  {k:['hạ tầng kỹ thuật','hạ tầng'], t:'HẠ TẦNG KỸ THUẬT'},

  {k:['hố ga','mối nối cống','thoát nước'], t:'HỆ THỐNG THOÁT NƯỚC'},

  {k:['nhà ăn'], t:'NHÀ ĂN'},{k:['nhà xe'], t:'NHÀ XE'},{k:['nhà bảo vệ'], t:'NHÀ BẢO VỆ'},

  {k:['trạm xử lý nước thải','xử lý nước thải'], t:'TRẠM XỬ LÝ NƯỚC THẢI'},

  {k:['pccc','phòng cháy'], t:'HỆ THỐNG PCCC'},

];

function capLines(s){ return s.split('\n').map(l=>capFirst(l)).join('\n'); }

/* chuyển lệnh đọc dấu câu: "chấm xuống hàng" -> xuống dòng, "phẩy" -> , ... */

function preprocess(text){
  let s=' '+text.toLowerCase()+' ';
  s=s.replace(/(chấm|cấm|cham)\s+(xuống|xuông|trung|suống)\s+(hàng|dòng)/g,'\n');
  s=s.replace(/\b(xuống|xuông)\s+(hàng|dòng)\b/g,'\n');
  s=s.replace(/\b(một là|hai là|ba là|bốn là|năm là|sáu là|bảy là|tám là|chín là|mười là)\b/g,'\n');
  s=s.replace(/\b(thứ nhất|thứ hai|thứ ba|thứ tư|thứ năm|thứ sáu|thứ bảy|thứ tám)\b/g,'\n');
  s=s.replace(/\b(công việc |đầu việc )?(một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|\d+)(\s+là|\s+chấm|:|\.)\b/g,'\n');
  s=s.replace(/\bchấm phẩy\b/g,';');
  s=s.replace(/\bphẩy\b/g,',');
  s=s.replace(/\bchấm phẩy\b/g,';');

  s=s.replace(/\bphẩy\b/g,',');

  s=s.replace(/\bchấm\b/g,'\n');

  return s;

}

/* đổi số chữ -> chữ số, đơn vị: phần trăm->%, mét vuông->m², mét khối->m³, mét dài->md, "X trên Y"->X/Y */

function convertNumbers(s){

  s=s.replace(/\bphần trăm\b/g,'%');

  s=s.replace(/\bmét vuông\b/g,'m²').replace(/\bmét khối\b/g,'m³').replace(/\bmét dài\b/g,'md').replace(/\bmét tới\b/g,'md').replace(/\bmét\b/g,'m');

  const nr=/((?:không|một|mốt|hai|ba|bốn|tư|năm|lăm|nhăm|sáu|bảy|bẩy|tám|chín|mười|mươi|trăm|linh|lẻ)(?:\s+(?:không|một|mốt|hai|ba|bốn|tư|năm|lăm|nhăm|sáu|bảy|bẩy|tám|chín|mười|mươi|trăm|linh|lẻ))*)/g;

  s=s.replace(nr, m=>{ const n=vnToNum(m.trim()); return n==null?m:(' '+n+' '); });

  s=s.replace(/(\d+)\s*trên\s*(\d+)/g,'$1/$2');

  s=s.replace(/\s*%/g,'%');

  return s.split('\n').map(l=>l.replace(/[ \t]+/g,' ').replace(/\s+([,;])/g,'$1').trim()).filter(Boolean).join('\n');

}

function noTone(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');}

/* Thư viện CÔNG TÁC CHUẨN (đối chiếu KNOWLEDGE + tiến độ dự án) */

const STD=[

 {n:'Ép cọc thử', p:[['ep coc thu',3]]},

 {n:'Ép cọc đại trà', p:[['ep coc dai tra',3],['ep coc',2],['ya coc',2],['ep coc my',2]]},

 {n:'Đào đất hố móng', p:[['dao dat',2],['dao mong',2],['ho mong',2]]},

 {n:'Bê tông lót móng', p:[['be tong lot',3],['betong lot',3],['lot mong',2]]},

 {n:'Cốt thép, cốp pha móng', p:[['cot thep',1],['cot pha',1],['cop pha',1],['coffa',1],['van khuon',1],['mong',1]]},

 {n:'Đổ bê tông móng', p:[['be tong mong',3],['betong mong',3]]},

 {n:'Cốt thép, cốp pha cổ cột', p:[['cot thep',1],['co cot',2]]},

 {n:'Đổ bê tông cổ cột', p:[['be tong co cot',3],['betong co cot',3]]},

 {n:'Cốt thép, cốp pha đà kiềng', p:[['da kieng',2],['cot thep',1],['cot pha',1],['cop pha',1],['coffa',1]]},

 {n:'Đổ bê tông đà kiềng', p:[['be tong da kieng',3],['betong da kieng',3],['be tong dia',2]]},

 {n:'Lắp dựng cốt thép sàn', p:[['thep san',2]]},

 {n:'Đổ bê tông sàn', p:[['be tong san',3],['san cote',2]]},

 {n:'Đổ bê tông nền', p:[['be tong nen',3],['nen cote',2]]},

 {n:'Gia công kết cấu thép', p:[['ket cau thep',2],['gcsx',2]]},

 {n:'Lắp dựng kết cấu thép', p:[['ket cau thep',2],['khung chinh',2]]},

 {n:'Lắp dựng tôn mái + vách', p:[['tole',2],['ton mai',2]]},

 {n:'Lắp dựng xà gồ mái + vách', p:[['xa go',2]]},

 {n:'Xây tường', p:[['xay tuong',2]]},

 {n:'Trát tường', p:[['trat tuong',2],['to tuong',2]]},

 {n:'Sơn nước', p:[['son nuoc',2]]},

 {n:'Lắp đặt cửa', p:[['lap dat cua',2]]},

 {n:'Xây hàng rào', p:[['hang rao',2],['tuong rao',2]]},

 {n:'Đổ bê hố ga, cống', p:[['ho ga',2],['moi noi cong',2]]},

 {n:'Tập kết vật tư', p:[['tap ket',2],['vat tu',2]]},

];

/* Levenshtein (chan o 2 cho nhanh) - cho nhan dien giong noi sai 1 ky tu */

function _lev(a,b){ const m=a.length,n=b.length; if(Math.abs(m-n)>1)return 2;

  let prev=[],cur=[]; for(let j=0;j<=n;j++)prev[j]=j;

  for(let i=1;i<=m;i++){ cur[0]=i; for(let j=1;j<=n;j++){ cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1)); } [prev,cur]=[cur,prev]; }

  return prev[n]; }

function _tokClose(a,b){ if(a===b)return 0; if(a.length<2||b.length<2)return 9; return _lev(a,b)<=1?1:9; }

function _fuzzySeq(toks,pt){ if(!pt.length)return false; for(let i=0;i+pt.length<=toks.length;i++){ let edits=0,ok=true; for(let k=0;k<pt.length;k++){ const c=_tokClose(toks[i+k],pt[k]); if(c===9){ok=false;break;} edits+=c; } if(ok&&edits<=1)return true; } return false; }

function matchStandard(name){

  const norm=noTone(name).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

  const t=' '+norm+' ';

  let best=null,bestScore=0;

  STD.forEach(e=>{ let sc=0; e.p.forEach(a=>{ if(t.includes(' '+a[0]+' ')||t.includes(a[0])) sc+=a[1]; }); if(sc>bestScore){bestScore=sc;best=e;} });

  if(bestScore>=2) return best.n;

  /* fallback nhan dien gan dung cho giong noi (vd "be tong nong" -> "be tong mong") */

  const toks=norm.split(' ').filter(Boolean);

  let fb=null,fScore=0;

  STD.forEach(e=>{ let sc=0; e.p.forEach(a=>{ const pt=a[0].split(' ').filter(Boolean); if(pt.length>=2&&_fuzzySeq(toks,pt)) sc+=a[1]; }); if(sc>fScore){fScore=sc;fb=e;} });

  return fScore>=2?fb.n:null;

}

/* tách "tên công tác : sản lượng" — ưu tiên %, tỉ lệ, rồi số+đơn vị */

function splitNameQty(line){

  const pats=[ /(\d+(?:[.,]\d+)?\s*%)/,

    /(\d+\s*\/\s*\d+)\s*(md|m²|m³|m2|m3|tim|kim|cái|cây|cay|cọc|tấn|tấm|bộ)?/,

    /(\d+(?:[.,]\d+)?)\s*(md|m²|m³|m2|m3|tim|kim|cái|cây|cay|cọc|tấn|tấm|bộ|m)\b/i ];

  let m=null; for(const p of pats){ const mm=line.match(p); if(mm){ m=mm; break; } }

  if(!m) return {name:line.replace(/[:\-–,\s]+$/,'').trim(), qty:''};

  let name=line.slice(0,m.index).replace(/\b(đạt|được|là|khoảng|tầm)\s*$/i,'').replace(/[:\-–,\s]+$/,'').trim();

  let val=m[1].replace(/\s*\/\s*/,'/').replace(/\s*%/,'%');

  let unit=(m[2]||'').toLowerCase(); const um={'kim':'tim','m2':'m²','m3':'m³','cay':'cây'}; if(um[unit])unit=um[unit];

  return {name, qty:val+(unit?(' '+unit):'')};

}

/* ===== SONG NGU muc 03 (Viet / Trung) - render-time, KHONG doi du lieu nhap ===== */

function wkey(s){ return noTone(s).replace(/[^a-z0-9 +]/g,' ').replace(/\s+/g,' ').trim(); }

const WORK_CN={};

CONGTAC.forEach(c=>{ WORK_CN[wkey(c.vi)]=c.cn; });

[

 ['ep coc thu','试打桩'],

 ['ep coc dai tra','大批量压桩'],

 ['dao dat ho mong','基础开挖土'],

 ['be tong lot mong','基础垫层混凝土'],

 ['cot thep, cop pha mong','基础钢筋、模板'],

 ['do be tong mong','基础混凝土浇筑'],

 ['cot thep, cop pha co cot','柱基钢筋、模板'],

 ['do be tong co cot','柱基混凝土浇筑'],

 ['cot thep, cop pha da kieng','地梁钢筋、模板'],

 ['do be tong da kieng','地梁混凝土浇筑'],

 ['lap dung cot thep san','楼板钢筋安装'],

 ['do be tong san','楼板混凝土浇筑'],

 ['do be tong nen','混凝土地板浇筑'],

 ['gia cong ket cau thep','加工生产钢结构'],

 ['lap dung ket cau thep','安装主钢框架'],

 ['lap dung ton mai + vach','安装屋顶+墙壁浪板'],

 ['lap dung xa go mai + vach','安装屋顶+墙壁檩条'],

 ['xay tuong','砌墙壁'],

 ['trat tuong','墙壁抹灰'],

 ['son nuoc','涂水性漆'],

 ['lap dat cua','安装门'],

 ['do be ho ga, cong','检查井及管路混凝土浇筑'],

 ['tap ket vat tu','材料运输集结到工地'],

 ['van phong chuyen gia','专家办公室'],

 ['nha van phong','办公室'],

 ['nha xuong 1','厂房1'],['nha xuong 2','厂房2'],['nha xuong 3','厂房3'],['nha xuong 4','厂房4'],

 ['xay hang rao','砌围墙'],

 ['ha tang ky thuat','技术下层'],

 ['he thong thoat nuoc','排水系统'],

 ['nha an','食堂'],['nha xe','车库'],['nha bao ve','警卫室'],

 ['tram xử lý nước thải','污水处理站'],

 ['he thong pccc','消防系统'],

].forEach(p=>{ WORK_CN[wkey(p[0])]=p[1]; });

function workCN(vi){ const k=wkey(vi); if(!k)return ''; if(WORK_CN[k])return WORK_CN[k];

  let best='',bl=0; for(const g in WORK_CN){ if(g.length>=4 && (k.indexOf(g)>=0||g.indexOf(k)>=0) && g.length>bl){best=WORK_CN[g];bl=g.length;} }

  return best||((typeof kbCN==='function')?kbCN(vi):''); }

function biTitle(t){ const c=workCN(t); return (t||'')+(c?(' <span style="font-weight:400;color:var(--grey)">/ '+c+'</span>'):''); }

function biLineSplit(line){
  let s=(line||'').replace(/^[•\-•\s]+/,'').trim();
  let m=s.match(/^(.*?)[:：]\s*(.+)$/);
  if(m) {
    let n=m[1].trim(), q=m[2].trim();
    if(/[&+\-/]$|(?:\s+v\u00e0|\s+va)$/i.test(n)) return {n:s, q:''};
    return {n, q};
  }
  m=s.match(/^(.*?)(\s+\d[\d.,/]*\s*\S*)$/);
  if(m) {
    let n=m[1].trim(), q=m[2].trim();
    if(/[&+\-/]$|(?:\s+v\u00e0|\s+va)$/i.test(n)) return {n:s, q:''};
    return {n, q};
  }
  return {n:s, q:''};
}

function biDetail(d){ 

  return '<ul class="wd-ul">' + (d||'').split('\n').filter(x=>x.trim()).map(line=>{ 

    const o=biLineSplit(line); const c=workCN(o.n); const nm=o.n+(c?(' / '+c):''); 

    return '<li>'+nm+(o.q?(': '+o.q):'')+'</li>'; 

  }).join('') + '</ul>'; 

}

function standardizeLine(line){ const o=splitNameQty(line); if(!o.name && !o.qty) return '';

  const std=matchStandard(o.name); return '• '+(std||capFirst(o.name))+(o.qty?(': '+o.qty):''); }

function buildDetail(raw){ return convertNumbers(raw).split('\n').map(standardizeLine).filter(Boolean).join('\n'); }

function parseWorks(text){

  const low=preprocess(text);

  const searchable=low.replace(/\n/g,' ');   // cùng độ dài -> giữ đúng vị trí

  const hits=[];

  HANGMUC.forEach(h=>{ h.k.forEach(kw=>{ let idx=searchable.indexOf(' '+kw+' ');

    while(idx>=0){ hits.push({pos:idx+1,len:kw.length,t:h.t}); idx=searchable.indexOf(' '+kw+' ',idx+1); } }); });

  if(!hits.length) return [{c:PALETTE[0],t:'HẠNG MỤC',d:buildDetail(low)}];

  hits.sort((a,b)=>a.pos-b.pos||b.len-a.len);

  const picked=[]; let lastEnd=-1;

  hits.forEach(h=>{ if(h.pos>=lastEnd){ picked.push(h); lastEnd=h.pos+h.len; } });

  const ws=[];

  picked.forEach((h,i)=>{ const start=h.pos+h.len; const end=i+1<picked.length?picked[i+1].pos:low.length;

    let d=low.slice(start,end).replace(/^[\s:,.\-–\n]+/,'').trim();

    ws.push({c:PALETTE[i%PALETTE.length], t:h.t, d:buildDetail(d)}); });

  return ws;

}

let recogW=null, listeningW=false, finalW='', worksManualStop=false;

/* ===== VOICE cho muc 05 - Ke hoach ngay mai ===== */

let recogP=null, listeningP=false, finalPlan='', planManualStop=false, planBase='';

function planFormat(text){ let s=preprocess(text); s=convertNumbers(s);

  return s.split('\n').map(l=>capFirst(l.trim())).filter(Boolean).join('\n'); }

function toggleVoicePlan(){

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

  if(!SR){ el('planVoiceStatus').innerHTML='⚠ Trình duyệt không hỗ trợ. Dùng Chrome/Edge.'; return; }

  if(listeningP){ planManualStop=true; recogP.stop(); return; }

  planManualStop=false; finalPlan=''; planBase=el('f_plan').value.trim();

  recogP=new SR(); recogP.lang='vi-VN'; recogP.continuous=true; recogP.interimResults=true;

  recogP.onstart=()=>{ listeningP=true; el('btnVoicePlan').textContent='⏹ Dừng'; el('planVoiceStatus').textContent='🎙 Đang nghe kế hoạch... (bấm Dừng khi xong)'; };

  recogP.onresult=e=>{ let it=''; for(let i=e.resultIndex;i<e.results.length;i++){ const tr=e.results[i][0].transcript; if(e.results[i].isFinal)finalPlan+=tr+' '; else it+=tr; }

    el('f_plan').value=((planBase?planBase+'\n':'')+planFormat(finalPlan+it)).replace(/\n+$/,''); draw(); };

  recogP.onerror=e=>{ if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){ planManualStop=true; el('planVoiceStatus').textContent='⚠ Không truy cập được micro: '+e.error; } else if(e.error!=='no-speech'&&e.error!=='aborted'){ el('planVoiceStatus').textContent='⚠ Lỗi: '+e.error; } };

  const safeRestartP = (delay = 200) => {
    if (planManualStop) return;
    setTimeout(() => {
      if (planManualStop) return;
      try {
        recogP.start();
        el('planVoiceStatus').textContent='🎙 Đang nghe... (tự nghe liên tục)';
      } catch (err) {
        console.warn("[Plan Voice] Restart failed, retrying:", err.message);
        safeRestartP(Math.min(delay * 2, 2000));
      }
    }, delay);
  };

  recogP.onend=()=>{
    if(!planManualStop){
      safeRestartP();
      return;
    }
    listeningP=false; el('btnVoicePlan').textContent='🎤 Bắt đầu nói'; el('planVoiceStatus').textContent='⏸ Đã dừng.';
    el('f_plan').value=((planBase?planBase+'\n':'')+planFormat(finalPlan)).trim(); draw();
  };

  recogP.start();

}

function toggleVoiceWorks(){

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

  if(!SR){ el('worksVoiceStatus').innerHTML='⚠ Trình duyệt không hỗ trợ. Dùng Chrome/Edge.'; return; }

  if(listeningW){ worksManualStop=true; recogW.stop(); return; }

  worksManualStop=false;

  recogW=new SR(); recogW.lang='vi-VN'; recogW.continuous=true; recogW.interimResults=true; finalW='';

  recogW.onstart=()=>{ listeningW=true; el('btnVoiceWorks').textContent='⏹ Dừng & phân tích'; el('worksVoiceStatus').textContent='🎙 Đang nghe hạng mục... (tự nghe liên tục — bấm Dừng khi xong)'; };

  recogW.onresult=e=>{ let it=''; for(let i=e.resultIndex;i<e.results.length;i++){ const tr=e.results[i][0].transcript; if(e.results[i].isFinal)finalW+=tr+' '; else it+=tr; } el('worksTranscript').value=(finalW+it).trim(); };

  recogW.onerror=e=>{ if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){ worksManualStop=true; el('worksVoiceStatus').textContent='⚠ Không truy cập được micro: '+e.error; } else if(e.error!=='no-speech'&&e.error!=='aborted'){ el('worksVoiceStatus').textContent='⚠ Lỗi: '+e.error; } };

  const safeRestartW = (delay = 200) => {
    if (worksManualStop) return;
    setTimeout(() => {
      if (worksManualStop) return;
      try {
        recogW.start();
        el('worksVoiceStatus').textContent='🎙 Đang nghe... (tự nghe liên tục)';
      } catch (err) {
        console.warn("[Works Voice] Restart failed, retrying:", err.message);
        safeRestartW(Math.min(delay * 2, 2000));
      }
    }, delay);
  };

  recogW.onend=()=>{
    if(!worksManualStop){
      safeRestartW();
      return;
    }
    listeningW=false; el('btnVoiceWorks').textContent='🎤 Bắt đầu nói'; applyWorksVoice(el('worksTranscript').value);
  };

  recogW.start();

}




/* ============ AI CHỌN ẢNH ĐẸP + GÁN CÔNG TÁC (mục 03) ============ */

function fileTime(file){ const dt=new Date(file.lastModified); return ('0'+dt.getHours()).slice(-2)+':'+('0'+dt.getMinutes()).slice(-2); }

/* --- Nhận dạng ảnh TRÙNG NỘI DUNG (average hash 8x8) ---
   Thu ảnh về 8x8 xám, mỗi ô sáng hơn mức trung bình = 1, tối hơn = 0 -> "vân tay" 64 bit của nội dung.
   Hai ảnh cùng cảnh (dù khác dung lượng/giờ chụp/độ nét) sẽ có vân tay gần giống nhau.
   Cách cũ so dung lượng file + giờ chụp là SAI: ảnh khác cảnh chụp liên tiếp bị coi là trùng,
   còn ảnh trùng thật chụp cách xa nhau lại lọt lưới. */
function imageHash(img){
  const S = 8;
  try {
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, S, S);
    const d = ctx.getImageData(0, 0, S, S).data;
    const g = new Float64Array(S*S); let sum = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      g[p] = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
      sum += g[p];
    }
    const mean = sum / (S*S);
    const bits = new Uint8Array(S*S);
    for (let p = 0; p < S*S; p++) bits[p] = g[p] > mean ? 1 : 0;
    return bits;
  } catch(_) { return null; }   // ảnh chéo miền (CORS) -> không băm được
}
// Số bit khác nhau giữa 2 vân tay (0 = giống hệt, càng lớn càng khác)
function hashDistance(a, b){
  if (!a || !b || a.length !== b.length) return 999;   // không băm được -> coi như KHÁC (không lọc nhầm)
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}
const DUP_BITS = 6;   // <= 6/64 bit khác nhau -> coi là cùng một nội dung

function analyzeImage(file){
  return new Promise(resolve=>{
    const fr=new FileReader();
    fr.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const W=80,H=Math.max(1,Math.round(80*img.height/(img.width||1)));
        const c=document.createElement('canvas'); c.width=W; c.height=H;
        const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,W,H);
        let d; try{ d=ctx.getImageData(0,0,W,H).data; }
        catch(err){ resolve({score:0,dataURL:e.target.result,vi:'',cn:'',time:fileTime(file),size:file.size,lastModified:file.lastModified,name:file.name, hash:null}); return; }
        const gray=new Float64Array(W*H); let sum=0;
        for(let i=0,p=0;i<d.length;i+=4,p++){ const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; gray[p]=g; sum+=g; }
        const mean=sum/(W*H);
        let ls=0,ls2=0,cnt=0;
        for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){ const idx=y*W+x;
          const lap=4*gray[idx]-gray[idx-1]-gray[idx+1]-gray[idx-W]-gray[idx+W]; ls+=lap; ls2+=lap*lap; cnt++; }
        const lvar=cnt?(ls2/cnt-(ls/cnt)*(ls/cnt)):0;
        let expo=1; if(mean<40)expo=Math.max(0.1,mean/40); else if(mean>225)expo=Math.max(0.1,(255-mean)/30);
        const score=lvar*expo + (img.width*img.height)/1e7;
        const m=matchCongTac(file.name);
        resolve({score, dataURL:e.target.result, vi:m>=0?CONGTAC[m].vi:'', cn:m>=0?CONGTAC[m].cn:'', time:fileTime(file),size:file.size,lastModified:file.lastModified,name:file.name, hash:imageHash(img)});
      };
      img.onerror=()=>resolve({score:0,dataURL:e.target.result,vi:'',cn:'',time:fileTime(file),size:file.size,lastModified:file.lastModified,name:file.name, hash:null});
      img.src=e.target.result;
    };
    fr.readAsDataURL(file);
  });
}

function onBulkPhotos(input){
  const files=[...input.files]; if(!files.length) return;
  const N = files.length;
  el('bulkStatus').textContent='⏳ Đang phân tích '+files.length+' ảnh...';
  Promise.all(files.map(analyzeImage)).then(list=>{
    // Sắp xếp theo score (độ sắc nét & chất lượng) từ cao xuống thấp
    list.sort((a,b)=>b.score-a.score);
    
    // LỌC ẢNH TRÙNG NỘI DUNG (so vân tay 8x8, không so dung lượng/giờ chụp như bản cũ).
    // list đã sắp theo độ nét giảm dần -> ảnh giữ lại luôn là bản NÉT NHẤT của mỗi cảnh.
    const filteredList = [];
    for (const img of list) {
      const isDuplicate = filteredList.some(o => hashDistance(img.hash, o.hash) <= DUP_BITS);
      if (!isDuplicate) filteredList.push(img);
    }
    const dupCount = N - filteredList.length;

    // Số ô lưới: 9 nếu có đủ 9 ảnh KHÁC NỘI DUNG, ngược lại 6.
    const targetNum = filteredList.length >= 9 ? 9 : 6;

    // Chỉ bù thêm khi KHÔNG đủ ảnh khác nội dung để lấp lưới (ưu tiên ảnh nét nhất trong số bị loại).
    // Bản cũ bù tới Math.max(6, N) nên nhồi lại TOÀN BỘ ảnh trùng -> vô hiệu hoá việc lọc.
    const finalSelectionList = [...filteredList];
    if (finalSelectionList.length < targetNum) {
      for (const img of list) {
        if (finalSelectionList.length >= targetNum) break;
        if (!finalSelectionList.includes(img)) finalSelectionList.push(img);
      }
    }
    finalSelectionList.sort((a,b)=>b.score-a.score);
    
    // Reset mảng photos và đưa vào số lượng ảnh phù hợp
    photos = [];
    const top = finalSelectionList.slice(0, targetNum);
    for (let i = 0; i < targetNum; i++) {
      if (i < top.length) {
        photos.push({
          tm: top[i].time || "",
          vi: top[i].vi || "",
          cn: top[i].cn || (top[i].vi ? kbCN(top[i].vi) : ""),
          img: top[i].dataURL,
          auto: !!top[i].vi
        });
      } else {
        photos.push({ tm: '', vi: '', cn: '', img: null });
      }
    }
    
    const filledCount = photos.filter(p => p.img).length;
    let statusText = `✓ Đã chọn ${filledCount} ảnh khác nội dung, nét nhất, vào lưới ${targetNum} ảnh.`;
    if (dupCount > 0) {
      statusText += ` (Đã loại ${dupCount} ảnh trùng nội dung — giữ lại bản nét nhất của mỗi cảnh.)`;
    }
    if (filteredList.length < targetNum) {
      statusText += ` <span style="color:var(--red); font-weight:bold;">⚠ Chỉ có ${filteredList.length} ảnh khác nội dung, chưa đủ ${targetNum} ô. Hãy chụp thêm cảnh khác.</span>`;
    }
    
    el('bulkStatus').innerHTML = statusText;
    renderPhotoForm();
    draw();

    // Tự động gọi dịch song ngữ bằng Google Translate hoặc Gemini AI cho các ảnh tải bulk chưa có bản dịch
    const translatePromises = photos.map(async (p, idx) => {
      if (p.vi && (!p.cn || p.cn.trim() === '' || p.cn === '中文 (Trung)')) {
        try {
          const trans = await window.translateViToCn(p.vi);
          if (trans) {
            p.cn = trans;
          }
        } catch (e) {
          console.error("Lỗi dịch bulk tự động:", e);
        }
      }
    });
    
    el('bulkStatus').innerHTML = statusText + ' <span style="color:var(--navy2)">⚡ Đang dịch song ngữ tự động...</span>';
    Promise.all(translatePromises).then(() => {
      el('bulkStatus').innerHTML = statusText + ' <span style="color:var(--green)">✅ Đã dịch song ngữ hoàn tất!</span>';
      renderPhotoForm();
      draw();
    });
  });
}

window.autoGrowTextarea = (elm) => {
  if (!elm) return;
  elm.style.height = 'auto';
  elm.style.height = Math.max(24, elm.scrollHeight) + 'px';
};

window.autoGrowAllTextareas = () => {
  document.querySelectorAll('.photo-cap-textarea').forEach(ta => {
    window.autoGrowTextarea(ta);
  });
};

/* Core Translator: Từ điển offline -> Google Translate gtx (100% free, no key) -> Gemini AI (dự phòng) */
window.translateViToCn = async (text) => {
  if (!text || !text.trim()) return '';
  
  // 1. Kiểm tra từ điển offline trước
  if (typeof KB_GLOSSARY !== 'undefined') {
    const k = text.toUpperCase().replace(/\s+/g, ' ').trim();
    if (KB_GLOSSARY[k]) return KB_GLOSSARY[k];
  }
  
  // 2. Gọi Google Translate API miễn phí (client=gtx) - 100% free, không cần key, cực kỳ ổn định
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json && json[0] && json[0][0] && json[0][0][0]) {
      return json[0][0][0].trim();
    }
  } catch (e) {
    console.error("Lỗi dịch Google Translate:", e);
  }
  
  // 3. Fallback bằng Gemini AI nếu có cấu hình Key
  if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
    try {
      const prompt = `Bạn là thông dịch viên Việt - Trung chuyên ngành xây dựng. Hãy dịch cụm từ mô tả công tác thi công này sang tiếng Trung giản thể (chỉ trả về bản dịch ngắn gọn, không giải thích, không định dạng): "${text}"`;
      const res = await callGeminiAI(text, prompt);
      if (res) {
        if (typeof res === 'string') {
          return res.replace(/```[a-z]*/g, '').replace(/```/g, '').trim();
        } else if (res.translations && res.translations[0]) {
          return res.translations[0].trim();
        }
      }
    } catch (e) {
      console.error("Lỗi dịch Gemini:", e);
    }
  }
  
  return '';
};

window.translateWorkTitleDirect = async (i, val) => {
  if (!val || !val.trim()) return;
  if (val.includes('|')) return;
  
  try {
    const trans = await window.translateViToCn(val);
    if (trans) {
      works[i].t = `${val} | ${trans}`;
      renderWorkForm();
      draw();
    }
  } catch (e) {
    console.error("Lỗi dịch tên hạng mục:", e);
  }
};

window.translateWorkDescDirect = async (i, val) => {
  if (!val || !val.trim()) return;
  const lines = val.split('\n');
  let changed = false;
  try {
    const newLines = await Promise.all(lines.map(async line => {
      if (!line.trim() || line.includes('|')) return line;
      
      const o = biLineSplit(line);
      const transName = await window.translateViToCn(o.n);
      if (transName) {
        changed = true;
        return `${o.n} | ${transName}${o.q ? `: ${o.q}` : ''}`;
      }
      return line;
    }));
    
    if (changed) {
      works[i].d = newLines.join('\n');
      renderWorkForm();
      draw();
    }
  } catch (e) {
    console.error("Lỗi dịch chi tiết hạng mục:", e);
  }
};

// Dịch TẤT CẢ hạng mục 1 lần (gọi khi ĐÓNG popup 03) — tránh dịch/nhảy form khi đang gõ.
window.translateAllWorks = async () => {
  if (typeof works === 'undefined' || !works || !works.length) return;
  let changed = false;
  try {
    for (let i = 0; i < works.length; i++) {
      // Tên hạng mục (bỏ qua nếu trống hoặc đã có bản dịch "|")
      const t = (works[i].t || '').trim();
      if (t && !t.includes('|')) {
        const tr = await window.translateViToCn(t);
        if (tr) { works[i].t = `${t} | ${tr}`; changed = true; }
      }
      // Chi tiết (mỗi dòng)
      const d = works[i].d || '';
      if (d.trim()) {
        const lines = d.split('\n');
        const newLines = await Promise.all(lines.map(async line => {
          if (!line.trim() || line.includes('|')) return line;
          const o = biLineSplit(line);
          const tn = await window.translateViToCn(o.n);
          return tn ? `${o.n} | ${tn}${o.q ? `: ${o.q}` : ''}` : line;
        }));
        const nd = newLines.join('\n');
        if (nd !== d) { works[i].d = nd; changed = true; }
      }
    }
  } catch (e) { console.error("Lỗi dịch toàn bộ hạng mục:", e); }
  if (changed && typeof renderWorkForm === 'function') renderWorkForm();
  if (typeof draw === 'function') draw();
};

window.translateTextareaBilingual = async (textareaId) => {
  const textarea = el(textareaId);
  if (!textarea) return;
  const val = textarea.value;
  if (!val || !val.trim()) return;
  
  const lines = val.split('\n');
  let changed = false;
  try {
    const newLines = await Promise.all(lines.map(async line => {
      if (!line.trim() || line.includes('|')) return line;
      
      const o = biLineSplit(line);
      const transName = await window.translateViToCn(o.n);
      if (transName) {
        changed = true;
        return `${o.n} | ${transName}${o.q ? `: ${o.q}` : ''}`;
      }
      return line;
    }));
    
    if (changed) {
      textarea.value = newLines.join('\n');
      if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
      draw();
    }
  } catch (e) {
    console.error("Lỗi dịch textarea:", e);
  }
};

/* khi upload ảnh -> dò tên file -> tự gán công tác nếu khớp */

function onPhotoFile(input,i){

  const f=input.files[0]; if(!f) return;

  const m=matchCongTac(f.name);

  if(m>=0){photos[i].vi=CONGTAC[m].vi;photos[i].cn=CONGTAC[m].cn;photos[i].auto=true;}

  loadImg(input,(d)=>{photos[i].img=d;renderPhotoForm();draw();});

}

function renderPhotoForm(){
  let h = `<div class="photo-preview-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:8px;">`;

  photos.forEach((p, i) => {
    h += `
      <div class="preview-card" style="border: 1px solid var(--line); padding: 8px; border-radius: 8px; text-align: center; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-weight: 700; font-size: 12px; margin-bottom: 6px; color: var(--navy)">Hình ${i+1}</div>
        <div class="preview-im-wrap" onclick="window.triggerDirectPhotoUpload(${i})" style="width: 100%; height: 110px; border: 1px dashed var(--line); border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; background: #f8fafc;">
          ${p.img ? `<img src="${p.img}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 11px; color: var(--text-muted)">Chưa có ảnh<br>(Click để chọn)</span>`}
        </div>
      </div>
    `;
  });

  h += `</div>`;
  el('photo-list').innerHTML = h;
  if (typeof updateProgress === 'function') updateProgress();
}

window.triggerDirectPhotoUpload = (i) => {
  const fileInput = document.getElementById(`f_photo_direct_${i}`);
  if (fileInput) {
    fileInput.click();
  }
};

window.onDirectPhotoUpload = (input, i) => {
  const f = input.files[0]; if(!f) return;
  const m = matchCongTac(f.name);
  if (m >= 0) {
    photos[i].vi = CONGTAC[m].vi;
    photos[i].cn = CONGTAC[m].cn;
    photos[i].auto = true;
  }
  loadImg(input, (d) => {
    photos[i].img = d;
    renderPhotoForm(); // Cập nhật lại popup nếu đang mở
    draw(); // Vẽ lại canvas & trang chính!
  });
};

window.deletePhotoDirect = (e, i) => {
  if (e) e.stopPropagation();
  photos[i] = { tm: '', vi: '', cn: '', img: null };
  renderPhotoForm();
  draw();
};

window.updatePhotoDirect = (i, val) => {
  const lines = val.split('\n');
  const viPart = lines[0] || '';
  const cnPart = lines.slice(1).join('\n') || '';
  
  photos[i].vi = viPart;
  photos[i].cn = cnPart;
  photos[i].auto = false;
  
  // Cập nhật text in ấn (.print-only) trực tiếp để không cần gọi draw() tránh giật/mất focus
  const photoContainer = document.querySelectorAll('.photo')[i];
  if (photoContainer) {
    const capPrint = photoContainer.querySelector('.cap.print-only');
    if (capPrint) {
      capPrint.innerHTML = `${viPart}${cnPart ? `<br><span>${cnPart}</span>` : ''}`;
    }
  }
};

window.translatePhotoDirect = async (i, val) => {
  if (!val || !val.trim()) return;
  const lines = val.split('\n');
  const viPart = lines[0] || '';
  const cnPart = lines.slice(1).join('\n') || '';
  
  // Nếu đã có dòng dịch tiếng Trung rồi thì thôi không dịch tự động nữa
  if (cnPart && cnPart.trim()) return;
  
  const photoContainer = document.querySelectorAll('.photo')[i];
  let textarea = null;
  if (photoContainer) {
    textarea = photoContainer.querySelector('.no-print textarea');
    if (textarea) {
      textarea.placeholder = '⚡ Đang dịch...';
    }
  }
  try {
    const trans = await window.translateViToCn(viPart);
    if (trans) {
      photos[i].cn = trans;
      if (textarea) {
        textarea.value = `${viPart}\n${trans}`;
        textarea.placeholder = 'Nhập chú thích (Tiếng Việt)...';
        window.autoGrowTextarea(textarea);
      }
      if (photoContainer) {
        const capPrint = photoContainer.querySelector('.cap.print-only');
        if (capPrint) {
          capPrint.innerHTML = `${viPart}<br><span>${trans}</span>`;
        }
      }
    } else {
      if (textarea) textarea.placeholder = 'Nhập chú thích (Tiếng Việt)...';
    }
  } catch (e) {
    console.error("Lỗi dịch ảnh tự động:", e);
    if (textarea) textarea.placeholder = 'Nhập chú thích (Tiếng Việt)...';
  }
};

window.triggerDirectDrawUpload = (i) => {
  const fileInput = document.getElementById(`f_draw_direct_${i}`);
  if (fileInput) {
    fileInput.click();
  }
};

window.onDirectDrawUpload = (input, i) => {
  loadImg(input, (d) => {
    draws[i].img = d;
    renderDrawForm(); // Cập nhật lại popup nếu đang mở
    draw(); // Vẽ lại canvas & trang chính!
  });
};

window.deleteDrawPhotoDirect = (e, i) => {
  if (e) e.stopPropagation();
  draws[i].img = null;
  renderDrawForm();
  draw();
};

window.updateDrawTitleDirect = (i, val) => {
  const lines = val.split('\n');
  const viPart = lines[0] || '';
  const cnPart = lines.slice(1).join('\n') || '';
  
  draws[i].t = cnPart ? `${viPart} | ${cnPart}` : viPart;
  draws[i].c = '';
  
  // Cập nhật text in ấn (.print-only) trực tiếp để không cần gọi draw() tránh giật/mất focus
  const drawContainer = document.querySelectorAll('.draw-card')[i];
  if (drawContainer) {
    const dtPrint = drawContainer.querySelector('.cap.print-only .dt');
    const dcPrint = drawContainer.querySelector('.cap.print-only .dc');
    if (dtPrint) dtPrint.innerHTML = viPart;
    if (dcPrint) {
      dcPrint.innerHTML = cnPart;
      dcPrint.style.display = cnPart ? 'block' : 'none';
    } else if (cnPart) {
      const capPrint = drawContainer.querySelector('.cap.print-only');
      if (capPrint) {
        capPrint.innerHTML = `
          <div class="dt" style="font-weight: 700; color: var(--navy);">${viPart}</div>
          <div class="dc" style="color: #64748b; font-size: 10.5px; margin-top: 2px;">${cnPart}</div>
        `;
      }
    }
  }
};

window.translateDrawTitleDirect = async (i, val) => {
  if (!val || !val.trim()) return;
  const lines = val.split('\n');
  const viPart = lines[0] || '';
  const cnPart = lines.slice(1).join('\n') || '';
  
  if (cnPart && cnPart.trim()) return;
  
  const drawContainer = document.querySelectorAll('.draw-card')[i];
  let textarea = null;
  if (drawContainer) {
    textarea = drawContainer.querySelector('.no-print textarea');
    if (textarea) {
      textarea.placeholder = '⚡ Đang dịch...';
    }
  }
  try {
    const trans = await window.translateViToCn(viPart);
    if (trans) {
      draws[i].t = `${viPart} | ${trans}`;
      draws[i].c = '';
      if (textarea) {
        textarea.value = `${viPart}\n${trans}`;
        textarea.placeholder = 'Nhập chú thích bản vẽ...';
        window.autoGrowTextarea(textarea);
      }
      if (drawContainer) {
        const dtPrint = drawContainer.querySelector('.cap.print-only .dt');
        const dcPrint = drawContainer.querySelector('.cap.print-only .dc');
        if (dtPrint) dtPrint.innerHTML = viPart;
        if (dcPrint) {
          dcPrint.innerHTML = trans;
          dcPrint.style.display = 'block';
        } else {
          const capPrint = drawContainer.querySelector('.cap.print-only');
          if (capPrint) {
            capPrint.innerHTML = `
              <div class="dt" style="font-weight: 700; color: var(--navy);">${viPart}</div>
              <div class="dc" style="color: #64748b; font-size: 10.5px; margin-top: 2px;">${trans}</div>
            `;
          }
        }
      }
    } else {
      if (textarea) textarea.placeholder = 'Nhập chú thích bản vẽ...';
    }
  } catch (e) {
    console.error("Lỗi dịch bản vẽ tự động:", e);
    if (textarea) textarea.placeholder = 'Nhập chú thích bản vẽ...';
  }
};


  function renderDrawForm(){

    let h=`

      <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:6px; margin-bottom:16px;">

        <div style="font-weight:700; color:var(--green); font-size:13px; margin-bottom:6px">TẢI LÊN TỰ ĐỘNG (Nhiều ảnh bản vẽ)</div>

        <div style="font-size:12px; color:#15803d; margin-bottom:10px">Chọn nhiều ảnh cùng lúc. Hệ thống sẽ tự phân tích và chọn 4 ảnh bản vẽ rõ nét nhất.</div>

        <input type="file" multiple accept="image/*" onchange="handleDrawBulk(this.files)">

        <div id="drawBulkStatus" style="font-size:12px; color:var(--orange); font-weight:600; margin-top:8px"></div>

      </div>

      <div style="font-weight:700; color:var(--navy); font-size:13px; margin-bottom:8px; border-bottom:2px solid var(--navy); display:inline-block; padding-bottom:4px">HOẶC SỬA TỪNG Ô THỦ CÔNG:</div>

    `;

    draws.forEach((d,i)=>{
      let t_vi = d.t || '';
      if (t_vi.includes('|')) t_vi = t_vi.split('|')[0].trim();

      h+=`<div class="item-card">
        <label>Chú thích Bản vẽ ${i+1}</label>
        <input type="text" value="${t_vi.replace(/"/g,'&quot;')}" oninput="window.updateDrawTitleDirect(${i}, this.value)" onblur="window.translateDrawTitleDirect(${i}, this.value)">
        <label>Ảnh (Thay thế ô này)</label>
        <input type="file" class="imgslot" accept="image/*" onchange="loadImg(this,(v)=>{draws[${i}].img=v;renderDrawForm();draw()})">
      </div>`
    });

    el('draw-list').innerHTML=h;

  }

  

  function handleDrawBulk(filesObj){

    const files=Array.from(filesObj);

    if(!files.length) return;

    el('drawBulkStatus').textContent='⏳ Đang phân tích ảnh...';

    Promise.all(files.map(analyzeImage)).then(list=>{

      list.sort((a,b)=>b.score-a.score);

      for(let i=0; i<Math.min(4, list.length); i++){

        if(!draws[i]) draws[i] = { t:'', c:'', img:null };  // draws có thể rỗng (report chưa có bản vẽ) → khởi tạo phần tử trước khi gán, tránh crash treo

        draws[i].img = list[i].dataURL;

      }

      el('drawBulkStatus').textContent='✅ Đã chọn và chèn '+Math.min(4, list.length)+' ảnh tốt nhất!';

      setTimeout(()=>{ if(el('drawBulkStatus')) el('drawBulkStatus').textContent=''; }, 3000);

      if(typeof renderDrawForm==='function') renderDrawForm();

      draw();

    }).catch(err=>{

      console.error('handleDrawBulk lỗi:', err);

      if(el('drawBulkStatus')) el('drawBulkStatus').textContent='❌ Lỗi phân tích ảnh, thử lại.';

    });

  }



/* ---------- image loader ---------- */

function loadImg(input,cb){

  const f=input.files[0];if(!f)return;

  const r=new FileReader();r.onload=e=>cb(e.target.result);r.readAsDataURL(f);

}





/* ===== LỊCH TIẾN ĐỘ HOWELL (trích từ PDF: [bắt đầu, kết thúc, số ngày]) ===== */

const SCHED=[["15/04/26","24/04/26",10],["25/04/26","09/05/26",15],["07/05/26","21/05/26",15],["15/05/26","19/05/26",5],["20/05/26","26/05/26",7],["27/05/26","05/06/26",10],["06/06/26","15/06/26",10],["16/06/26","25/06/26",10],["25/05/26","31/05/26",7],["01/06/26","07/06/26",7],["08/06/26","14/06/26",7],["15/06/26","23/06/26",9],["24/06/26","28/06/26",5],["29/06/26","08/07/26",10],["09/07/26","16/07/26",8],["17/07/26","27/07/26",11],["28/07/26","04/08/26",8],["05/08/26","15/08/26",11],["23/08/26","29/08/26",7],["15/08/26","02/11/26",80],["25/08/26","07/11/26",75],["04/09/26","17/11/26",75],["19/09/26","17/11/26",60],["22/09/26","25/11/26",65],["15/05/26","29/05/26",15],["22/05/26","10/06/26",20],["25/05/26","13/06/26",20],["28/05/26","16/06/26",20],["30/05/26","13/06/26",15],["09/06/26","03/07/26",25],["16/06/26","10/07/26",25],["23/06/26","17/07/26",25],["01/06/26","05/08/26",66],["02/07/26","20/08/26",50],["21/08/26","04/09/26",15],["05/09/26","20/09/26",16],["21/09/26","07/10/26",17],["08/10/26","22/10/26",15],["01/07/26","10/09/26",72],["07/08/26","25/09/26",50],["26/09/26","10/10/26",15],["11/10/26","25/10/26",15],["26/10/26","09/11/26",15],["10/11/26","24/11/26",15],["15/07/26","02/10/26",80],["15/08/26","02/11/26",80],["30/08/26","17/11/26",80],["01/10/26","19/11/26",50],["20/10/26","24/11/26",36],["15/05/26","13/06/26",30],["14/06/26","28/06/26",15],["29/06/26","28/07/26",30],["01/08/26","19/10/26",80],["01/08/26","19/10/26",80],["30/09/26","29/10/26",30],["01/08/26","18/11/26",110],["01/08/26","18/11/26",110],["01/08/26","19/10/26",80],["01/08/26","19/10/26",80],["01/09/26","09/11/26",70],["10/11/26","19/11/26",10],["20/11/26","27/11/26",8],["28/11/26","30/11/26",3]];



/* Uu tien dung lich da nap tu knowledge_base; neu trong thi dung SCHED goc. */

let schedTasks=((typeof KB_SCHED!=='undefined'&&KB_SCHED.length)?KB_SCHED:SCHED).map(r=>({s:r[0],e:r[1],w:r[2]}));

function kbCN(vi){ if(!vi||typeof KB_GLOSSARY==='undefined')return ''; const k=(''+vi).toUpperCase().replace(/\s+/g,' ').trim(); if(KB_GLOSSARY[k])return KB_GLOSSARY[k]; let best='',bl=0; for(const g in KB_GLOSSARY){ if(g.length>=4 && k.indexOf(g)>=0 && g.length>bl){best=KB_GLOSSARY[g];bl=g.length;} } return best; }

function dmy(s){const p=s.split('/');return new Date(2000+(+p[2]),(+p[1])-1,(+p[0]));}

function f2(n){return ('0'+n).slice(-2);}

function fmtD(d){return f2(d.getDate())+'/'+f2(d.getMonth()+1)+'/'+d.getFullYear();}

/* % kế hoạch tới ngày báo cáo, trọng số theo thời lượng */

function plannedPct(iso){

  if(!iso||!schedTasks.length)return null;

  const ref=new Date(iso+'T00:00:00');let tot=0,acc=0;

  schedTasks.forEach(t=>{const s=dmy(t.s),e=dmy(t.e);

    const w=t.w||Math.max(1,(e-s)/86400000);

    let f=ref>=e?1:(ref<=s?0:(ref-s)/(e-s));acc+=w*f;tot+=w;});

  return tot?Math.round(acc/tot*100):null;

}

function schedRange(){let mn=null,mx=null;schedTasks.forEach(t=>{const s=dmy(t.s),e=dmy(t.e);

  if(!mn||s<mn)mn=s;if(!mx||e>mx)mx=e;});return{start:mn?fmtD(mn):'',end:mx?fmtD(mx):''};}

function parseDmy(s) {
  if (!s) return null;
  const p = s.split('/');
  if (p.length < 3) return null;
  let day = parseInt(p[0], 10);
  let month = parseInt(p[1], 10) - 1;
  let year = parseInt(p[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (year < 100) year += 2000;
  return new Date(year, month, day);
}

function recalcOverallProgress() {
  const startVal = el('f_start').value;
  const endVal = el('f_end').value;
  const dateVal = el('f_date').value; // ISO format: YYYY-MM-DD
  
  if (!startVal || !endVal || !dateVal) return null;
  
  const startDate = parseDmy(startVal);
  const endDate = parseDmy(endVal);
  const reportDate = new Date(dateVal + 'T00:00:00');
  
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(reportDate.getTime())) {
    return null;
  }
  
  const totalDays = Math.round((endDate - startDate) / 86400000);
  const elapsedDays = Math.round((reportDate - startDate) / 86400000);
  
  if (totalDays <= 0) {
    return 0;
  } else {
    return Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)));
  }
}

function recalcFromSched(force){
  // Sếp chốt 20/07: TIẾN ĐỘ TỔNG THỂ = % THỜI GIAN đã trôi (tính theo ngày Bắt đầu/Kết thúc,
  // đồng bộ Dashboard app chính). Bỏ nhánh "theo số hạng mục hoàn thành" cũ — nó gây 0% khi
  // hạng mục PDF chưa được tick, khiến báo cáo ban hành hiện 0% dù dự án đang chạy.
  const pct = recalcOverallProgress();
  if (pct !== null) {
    el('f_prog').value = pct;
    el('prog_note').textContent = '✓ % tiến độ tổng thể tự động tính = ' + pct + '% (tính theo ngày Bắt đầu - Kết thúc)';
  } else {
    const p=plannedPct(el('f_date').value);
    if(p!=null){
      el('f_prog').value=p;
      const src=(typeof KB_SCHED!=='undefined'&&KB_SCHED.length)?(' — nguồn: knowledge_base ('+KB_SCHED.length+' mốc)'):'';
      el('prog_note').textContent='✓ % kế hoạch tới ngày báo cáo = '+p+'%'+src+' (sửa tay nếu cần)';
    }
  }
  if (typeof draw === 'function') draw();
}

/* đọc PDF tiến độ tải lên -> lấy mốc ngày -> cập nhật % */

const _spdf = el('f_sched_pdf');
if (_spdf) {
  _spdf.onchange=function(){

    const f=this.files[0];if(!f)return;

    const note=el('prog_note');note.textContent='⏳ Đang đọc PDF...';

    const fr=new FileReader();

    fr.onload=async e=>{

      try{

        if(window.pdfjsLib&&pdfjsLib.GlobalWorkerOptions)

          pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const pdf=await pdfjsLib.getDocument({data:new Uint8Array(e.target.result)}).promise;

        let txt='';

        for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const c=await pg.getTextContent();txt+=c.items.map(x=>x.str).join(' ')+' ';}

        const ds=txt.match(/\d{2}\/\d{2}\/\d{2}/g)||[];

        const tasks=[];for(let i=0;i+1<ds.length;i+=2)tasks.push({s:ds[i],e:ds[i+1]});

        if(tasks.length){schedTasks=tasks;const r=schedRange();

          el('f_start').value=r.start;el('f_end').value=r.end;

          const p=plannedPct(el('f_date').value);if(p!=null)el('f_prog').value=p;

          note.textContent='✓ Đã đọc '+tasks.length+' mốc từ PDF. Bắt đầu '+r.start+' → kết thúc '+r.end+'. % ước tính theo lịch.';

          draw();

        }else note.textContent='⚠ Không tìm thấy mốc ngày dd/mm/yy trong PDF.';

      }catch(err){note.textContent='⚠ Không đọc được PDF: '+err.message;}

    };

    fr.readAsArrayBuffer(f);

  };
}




window._genericRecog = null;
function toggleGenericVoice(btnElem, inputId) {
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ btnElem.innerHTML='⚠ Lỗi trình duyệt'; return; }
  if(window._genericRecog && window._genericRecog.listening && window._genericRecog.inputId === inputId) {
    window._genericRecog.manualStop = true;
    window._genericRecog.recog.stop();
    return;
  }
  const baseText = el(inputId).value.trim();
  let finalText = '';
  const r = new SR(); r.lang='vi-VN'; r.continuous=true; r.interimResults=true;
  window._genericRecog = { recog: r, listening: true, manualStop: false, inputId: inputId };
  const oldHtml = btnElem.innerHTML;
  r.onstart = () => { btnElem.textContent='⏹ Dừng nghe...'; btnElem.style.background='var(--red)'; btnElem.style.color='#fff'; };
  r.onresult = e => {
    let it=''; for(let i=e.resultIndex;i<e.results.length;i++){
      const tr=e.results[i][0].transcript; if(e.results[i].isFinal) finalText+=tr+' '; else it+=tr;
    }
    el(inputId).value = ((baseText?baseText+'\n':'') + capFirst((finalText+it).trim())).trim();
    if(typeof draw === 'function') draw();
  };
  r.onerror = e => { if(['not-allowed','audio-capture'].includes(e.error)) { window._genericRecog.manualStop=true; btnElem.textContent='⚠ Lỗi micro'; setTimeout(()=>{btnElem.innerHTML=oldHtml; btnElem.style.background=''; btnElem.style.color='';}, 2000); } };
  const safeRestartGeneric = (delay = 200) => {
    if (window._genericRecog.manualStop) return;
    setTimeout(() => {
      if (window._genericRecog.manualStop) return;
      try {
        r.start();
      } catch (err) {
        console.warn("[Generic Voice] Restart failed, retrying:", err.message);
        safeRestartGeneric(Math.min(delay * 2, 2000));
      }
    }, delay);
  };

  r.onend = () => {
    if(!window._genericRecog.manualStop) {
      safeRestartGeneric();
      return;
    }
    window._genericRecog.listening = false;
    btnElem.innerHTML=oldHtml; btnElem.style.background=''; btnElem.style.color='';
    el(inputId).value = ((baseText?baseText+'\n':'') + capFirst(finalText.trim())).trim();
    if(typeof draw === 'function') draw();
  };
  r.start();
}



window._photoRecog = null;
function toggleVoicePhotos(btnElem) {
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ btnElem.innerHTML='⚠ Lỗi trình duyệt'; return; }
  if(window._photoRecog && window._photoRecog.listening) {
    window._photoRecog.manualStop = true;
    window._photoRecog.recog.stop();
    return;
  }
  let finalText = '';
  const r = new SR(); r.lang='vi-VN'; r.continuous=true; r.interimResults=true;
  window._photoRecog = { recog: r, listening: true, manualStop: false };
  const oldHtml = btnElem.innerHTML;
  r.onstart = () => { btnElem.textContent='⏹ Dừng nghe...'; btnElem.style.background='var(--red)'; btnElem.style.color='#fff'; el('photosVoiceStatus').textContent='🎙 Đang nghe... Đọc ví dụ: "hình 1 đổ bê tông, hình 2 ép cọc..."'; };
  r.onresult = e => {
    let it=''; for(let i=e.resultIndex;i<e.results.length;i++){
      const tr=e.results[i][0].transcript; if(e.results[i].isFinal) finalText+=tr+' '; else it+=tr;
    }
    el('photosTranscript').value = (finalText+it).trim();
  };
  r.onerror = e => { if(['not-allowed','audio-capture'].includes(e.error)) { window._photoRecog.manualStop=true; btnElem.innerHTML='⚠ Lỗi micro'; setTimeout(()=>{btnElem.innerHTML=oldHtml; btnElem.style.background=''; btnElem.style.color='';}, 2000); } };
  const safeRestartPhoto = (delay = 200) => {
    if (window._photoRecog.manualStop) return;
    setTimeout(() => {
      if (window._photoRecog.manualStop) return;
      try {
        r.start();
      } catch (err) {
        console.warn("[Photo Voice] Restart failed, retrying:", err.message);
        safeRestartPhoto(Math.min(delay * 2, 2000));
      }
    }, delay);
  };

  r.onend = () => {
    if(!window._photoRecog.manualStop) {
      safeRestartPhoto();
      return;
    }
    window._photoRecog.listening = false;
    btnElem.innerHTML=oldHtml; btnElem.style.background=''; btnElem.style.color='';
    el('photosVoiceStatus').textContent='✓ Đã dừng nghe.';
    applyPhotosVoice(el('photosTranscript').value);
  };
  r.start();
}












let recogNR=null, listeningNR=false, finalNR='', nrManualStop=false;
function toggleVoiceNoteRec(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ el('noteRecVoiceStatus').innerHTML='⚠ Trình duyệt không hỗ trợ. Dùng Chrome/Edge.'; return; }
  if(listeningNR){ nrManualStop=true; recogNR.stop(); return; }
  nrManualStop=false; finalNR='';
  recogNR=new SR(); recogNR.lang='vi-VN'; recogNR.continuous=true; recogNR.interimResults=true;
  recogNR.onstart=()=>{ listeningNR=true; el('btnVoiceNoteRec').textContent='⏹ Dừng'; el('noteRecVoiceStatus').textContent='🎙 Đang nghe... (bấm Dừng khi xong)'; };
  recogNR.onresult=e=>{ 
    let it=''; 
    for(let i=e.resultIndex;i<e.results.length;i++){ 
      const tr=e.results[i][0].transcript; 
      if(e.results[i].isFinal) finalNR+=tr+' '; else it+=tr; 
    }
    el('noteRecVoiceStatus').textContent='🎙 Đang nghe: ' + (finalNR+it).trim();
  };
  recogNR.onerror=e=>{ 
    if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){ nrManualStop=true; el('noteRecVoiceStatus').textContent='⚠ Không truy cập được micro: '+e.error; } 
    else if(e.error!=='no-speech'&&e.error!=='aborted'){ el('noteRecVoiceStatus').textContent='⚠ Lỗi: '+e.error; } 
  };
  const safeRestartNR = (delay = 200) => {
    if (nrManualStop) return;
    setTimeout(() => {
      if (nrManualStop) return;
      try {
        recogNR.start();
        el('noteRecVoiceStatus').textContent='🎙 Đang nghe... (tự nghe liên tục)';
      } catch (err) {
        console.warn("[NoteRec Voice] Restart failed, retrying:", err.message);
        safeRestartNR(Math.min(delay * 2, 2000));
      }
    }, delay);
  };

  recogNR.onend=()=>{
    if(!nrManualStop){
      safeRestartNR();
      return;
    }
    listeningNR=false; el('btnVoiceNoteRec').textContent='🎤 Nhập giọng nói'; el('noteRecVoiceStatus').textContent='⏸ Đã dừng. Đang xử lý...';
    applyVoiceNoteRec(finalNR);
  };
  recogNR.start();
}


let recogAQT=null, listeningAQT=false, finalAQT='', aqtManualStop=false;
function toggleVoiceAQT(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ el('aqtVoiceStatus').innerHTML='⚠ Trình duyệt không hỗ trợ. Dùng Chrome/Edge.'; return; }
  if(listeningAQT){ aqtManualStop=true; recogAQT.stop(); return; }
  aqtManualStop=false; finalAQT='';
  recogAQT=new SR(); recogAQT.lang='vi-VN'; recogAQT.continuous=true; recogAQT.interimResults=true;
  recogAQT.onstart=()=>{ listeningAQT=true; el('btnVoiceAQT').textContent='⏹ Dừng'; el('aqtVoiceStatus').textContent='🎙 Đang nghe... (bấm Dừng khi xong)'; };
  recogAQT.onresult=e=>{ 
    let it=''; 
    for(let i=e.resultIndex;i<e.results.length;i++){ 
      const tr=e.results[i][0].transcript; 
      if(e.results[i].isFinal) finalAQT+=tr+' '; else it+=tr; 
    }
    el('aqtVoiceStatus').textContent='🎙 Đang nghe: ' + (finalAQT+it).trim();
  };
  recogAQT.onerror=e=>{ 
    if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){ aqtManualStop=true; el('aqtVoiceStatus').textContent='⚠ Không truy cập được micro: '+e.error; } 
    else if(e.error!=='no-speech'&&e.error!=='aborted'){ el('aqtVoiceStatus').textContent='⚠ Lỗi: '+e.error; } 
  };
  const safeRestartAQT = (delay = 200) => {
    if (aqtManualStop) return;
    setTimeout(() => {
      if (aqtManualStop) return;
      try {
        recogAQT.start();
        el('aqtVoiceStatus').textContent='🎙 Đang nghe... (tự nghe liên tục)';
      } catch (err) {
        console.warn("[AQT Voice] Restart failed, retrying:", err.message);
        safeRestartAQT(Math.min(delay * 2, 2000));
      }
    }, delay);
  };

  recogAQT.onend=()=>{
    if(!aqtManualStop){
      safeRestartAQT();
      return;
    }
    listeningAQT=false; el('btnVoiceAQT').textContent='🎤 Nhập giọng nói'; el('aqtVoiceStatus').textContent='⏸ Đã dừng. Đang xử lý...';
    applyVoiceAQT(finalAQT);
  };
  recogAQT.start();
}


// Tự động lấy thời tiết ưu tiên bằng tọa độ dự án, sau đó làm dự phòng bằng GPS thiết bị và Open-Meteo API
async function fetchWeatherFromGPS(auto = false) {
  const statusEl = el('weatherStatus');
  const btn = document.getElementById('btn-weather-gps');

  if (btn) btn.disabled = true;
  if (statusEl) statusEl.style.color = "var(--navy)";

  let lat = null;
  let lon = null;
  let useProjGPS = false;

  // 1. Thử lấy tọa độ đã khai báo của dự án trước
  try {
    if (window.AppCore && window.AppCore.CUR && window.AppCore.DataService) {
      const projects = await window.AppCore.DataService.listProjects();
      const proj = projects.find(p => p.id === window.AppCore.CUR.project);
      if (proj && proj.latitude != null && proj.longitude != null) {
        lat = proj.latitude;
        lon = proj.longitude;
        useProjGPS = true;
        console.log("Đã lấy tọa độ dự án:", proj.name, lat, lon);
      }
    }
  } catch(err) { 
    console.warn("Lỗi khi đọc tọa độ dự án từ parent", err); 
  }

  try {
    if (useProjGPS) {
      if (statusEl) statusEl.innerText = "Đang lấy thời tiết theo tọa độ dự án...";
    } else if (auto) {
      // TỰ ĐỘNG: chỉ chạy khi dự án ĐÃ khai tọa độ — KHÔNG bật popup xin GPS thiết bị mỗi lần mở app.
      if (btn) btn.disabled = false;
      return;
    } else {
      // 2. Dự phòng (chỉ khi bấm tay): dùng định vị GPS thiết bị
      if (statusEl) statusEl.innerText = "Đang định vị GPS thiết bị...";
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      }).catch(e => {
        console.warn("Lỗi GPS thiết bị, dùng tọa độ mặc định", e);
        return { coords: { latitude: 11.168, longitude: 106.822 } };
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    }

    const dateStr = el('f_date').value; // YYYY-MM-DD (ngày báo cáo đang chọn)
    if (statusEl) statusEl.innerText = "Đang tải dữ liệu thời tiết...";

    // CHỈ LẤY SỐ LIỆU THỰC TẾ tới thời điểm hiện tại (giờ VN); bỏ phần DỰ BÁO các giờ chưa tới (Sếp chốt 24/07).
    const vnNow = new Date(Date.now() + 7 * 3600 * 1000); // giờ VN (UTC+7)
    const vnDateStr = vnNow.toISOString().slice(0, 10);
    const vnHour = vnNow.getUTCHours();
    let cutoffHour = 20; // ngày trong quá khứ: cả khung thi công (tới 20h) đều đã xảy ra
    if (dateStr === vnDateStr) {
      cutoffHour = vnHour;             // HÔM NAY: chỉ tính tới GIỜ HIỆN TẠI (thời điểm xem/nộp)
    } else if (dateStr > vnDateStr) {  // ngày TƯƠNG LAI: chưa có số liệu thực
      if (auto) { if (btn) btn.disabled = false; return; }
      cutoffHour = -1;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&timezone=Asia%2FBangkok&start_date=${dateStr}&end_date=${dateStr}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if(!data || !data.hourly || !data.hourly.precipitation) {
      throw new Error("Không có dữ liệu thời tiết");
    }

    const times = data.hourly.time;
    const precips = data.hourly.precipitation;
    
    let rainHoursCount = 0;
    let rainDetails = [];
    let morningRain = false;
    let afternoonRain = false;

    for(let i=0; i<times.length; i++) {
      const t = times[i];
      const hour = parseInt(t.substring(11,13));
      const p = precips[i] || 0;
      
      // Khung giờ thi công 6h00 - 20h00; chỉ tính MƯA LỚN >= 2.5mm/giờ (nước chảy khi rơi),
      // bỏ mưa phùn/mưa bay (< 2.5mm) vì vẫn thi công được. Mỗi giờ mưa lớn = 1 giờ ảnh hưởng.
      // CHỈ tính giờ ĐÃ QUA (hour <= cutoffHour) — bỏ dự báo các giờ chưa tới.
      if(hour >= 6 && hour <= 20 && hour <= cutoffHour) {
        if(p >= 2.5) {
          rainHoursCount++;
          rainDetails.push(`${hour}h (${p.toFixed(1)}mm)`);
          if(hour < 12) morningRain = true;
          else afternoonRain = true;
        }
      }
    }

    // Set dropdowns
    el('f_weather_m').value = morningRain ? "rainy" : "sunny";
    el('f_weather_a').value = afternoonRain ? "rainy" : "sunny";
    
    // Set rain hours
    if(el('f_rain_hours')) el('f_rain_hours').value = rainHoursCount;

    // Generate note — nêu rõ đây là số liệu THỰC TẾ tính đến thời điểm hiện tại (khi là hôm nay)
    const realtimeSuffix = (dateStr === vnDateStr) ? ` (số liệu thực tế đến ${cutoffHour}h)` : '';
    let note = "";
    if(rainHoursCount > 0) {
      note = `Thời gian mưa: ${rainHoursCount} giờ (mưa lớn ≥2.5mm trong khung 6h–20h: ${rainDetails.join(', ')})${realtimeSuffix}. Ảnh hưởng công tác thi công ngoài trời.`;
    } else {
      note = `Thời tiết nắng ráo, công tác thi công thuận lợi${realtimeSuffix}.`;
    }
    if (el('f_weather_note')) el('f_weather_note').value = note;

    if (statusEl) {
      statusEl.innerText = "Đã cập nhật thời tiết tự động!";
      statusEl.style.color = "var(--green)";
      setTimeout(() => { if (statusEl) statusEl.innerText = ""; }, 3000);
    }
    if (typeof draw === 'function') draw(); // Re-render preview

  } catch(e) {
    if (statusEl && !auto) { statusEl.innerText = "Lỗi: " + e.message; statusEl.style.color = "var(--red)"; }
    else console.warn("Tự động lấy thời tiết lỗi (bỏ qua):", e && e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}


// ====== TRẠNG THÁI BÁO CÁO VÀ VAI TRÒ (LPB-T7) ======
window._reportStatus = 'draft';
window.CURRENT_USER_ID = '';
window.CURRENT_USER_ROLE = 'admin'; // admin, director, pm, site_manager, engineer, viewer,...
window.CURRENT_USER_NAME = '';
window.CURRENT_COMMANDER = '';
window.CURRENT_REPORT = null;

function updateStatusBadge() {
  // Tương thích ngược với render.js
  updateActionButtons();
}
window.updateStatusBadge = updateStatusBadge;

function toggleFormLock(isLocked) {
  try {
    const container = el('leftPanel');
    if (!container) return;
    
    // Ô thời tiết LUÔN khóa nhập tay (chỉ nút "Tự động lấy GPS" điền từ vệ tinh); ô ngày luôn mở.
    const WEATHER_LOCKED = ['f_rain_hours', 'f_weather_m', 'f_weather_a', 'f_weather_note'];
    // 1. Khóa/mở input, select, textarea theo trạng thái duyệt — trừ ô ngày (luôn mở) và ô thời tiết (luôn khóa)
    container.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.id === 'f_date') return;
      if (WEATHER_LOCKED.includes(input.id)) { input.disabled = true; return; }
      input.disabled = isLocked;
    });

    // 2. Vô hiệu hóa/Mờ các nút thêm, xóa, tải lên, click kéo thả
    container.querySelectorAll('button, .btn, .delete-photo-btn, [onclick^="openModal"], #subcon-drop, #expense-drop').forEach(btn => {
      if (btn.classList && !btn.classList.contains('close') && btn.dataset && btn.dataset.pane !== 'preview' && btn.dataset.pane !== 'form') {
        btn.style.pointerEvents = isLocked ? 'none' : 'auto';
        btn.style.opacity = isLocked ? '0.5' : '1';
      }
    });

    // 3. Khóa các hành động click sửa trên bản xem trước báo cáo
    const preview = el('report');
    if (preview) {
      preview.querySelectorAll('[onclick*="editBilingualField"], [onclick*="openModal"], [onclick*="click()"]').forEach(item => {
        item.style.pointerEvents = isLocked ? 'none' : 'auto';
      });
    }
  } catch (err) {
    console.warn("Lỗi trong toggleFormLock:", err);
  }
}

function updateActionButtons() {
  const bar = el('actionBar');
  if (!bar) return;

  const role = window.CURRENT_USER_ROLE || 'admin';
  const status = window._reportStatus || 'draft'; // draft, pending, approved, rejected

  const statusLabels = {
    'draft': '🟡 Nháp (Chưa nộp)',
    'pending': '⏳ Chờ Chỉ huy trưởng duyệt',
    'approved': '✅ Đã duyệt báo cáo',
    'rejected': '❌ Bị trả lại (Cần sửa)'
  };
  const statusColors = {
    'draft': 'background:#fef3c7; color:#92400e;',
    'pending': 'background:#dbeafe; color:#1e40af;',
    'approved': 'background:#dcfce7; color:#166534;',
    'rejected': 'background:#fee2e2; color:#991b1b;'
  };

  let html = '';

  // 1. Badge trạng thái — CHỈ hiện khi đã nộp/duyệt/trả lại (bỏ nhãn "Nháp" cho gọn; nháp là mặc định).
  if (status !== 'draft') {
    html += `
      <div style="min-height:38px; border-radius:8px; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; padding:0 12px; border:1px solid rgba(0,0,0,0.05); text-align:center; box-shadow:0 2px 6px rgba(0,0,0,0.04); ${statusColors[status] || ''}">
        ${statusLabels[status] || status}
      </div>
    `;
  }

  // Kiểm tra quyền khóa sửa
  const isApprover = ['admin', 'director', 'pm', 'site_manager'].includes(role);
  const isLocked = (status === 'approved' || status === 'pending') && !isApprover;
  toggleFormLock(isLocked);

  // 2. Nút Nộp duyệt / Duyệt / Trả lại. (Bỏ nút "Lưu" — app tự lưu nháp ngầm khi có nội dung.)
  if (role === 'engineer') {
    // KỸ SƯ: chỉ được nộp khi trạng thái là draft hoặc rejected
    if (status === 'draft' || status === 'rejected') {
      html += `<button class="act" type="button" style="background:var(--hp-primary); box-shadow:0 4px 12px rgba(9,106,167,0.25)" onclick="submitReportForApproval()">🚀 Nộp duyệt</button>`;
    }
  } else {
    // CHT / ADMIN / GIÁM ĐỐC / PM
    if (status === 'pending') {
      html += `<button class="act" type="button" style="background:var(--hp-success); box-shadow:0 4px 12px rgba(96,187,70,0.25)" onclick="approveReport()">✅ Duyệt báo cáo</button>`;
      html += `<button class="act" type="button" style="background:#dc2626; box-shadow:0 4px 12px rgba(220,38,38,0.25)" onclick="rejectReport()">↩️ Trả lại</button>`;
    } else if (status === 'draft' || status === 'rejected') {
      // CHT tự lập -> bấm Nộp duyệt sẽ tự động chuyển thành approved (CHT tự duyệt)
      html += `<button class="act" type="button" style="background:var(--hp-primary); box-shadow:0 4px 12px rgba(9,106,167,0.25)" onclick="submitReportForApproval()">🚀 Nộp & Duyệt</button>`;
    }
  }

  // 3. Nút "Mẫu hôm qua" — lấy lại nhân lực + hạng mục + kế hoạch mai từ báo cáo hôm qua (chỉ khi chưa khóa).
  if (!isLocked) {
    html += `<button class="act" type="button" style="background:var(--hp-brand-primary); box-shadow:0 4px 12px rgba(9,106,167,0.25)" onclick="copyYesterdayTemplate()" title="Lấy lại nhân lực, hạng mục & kế hoạch từ báo cáo hôm qua">📋 Mẫu hôm qua</button>`;
  }

  // 4. Nút xuất ảnh 16:9 (để gửi Zalo) — luôn hiển thị. (Bỏ Xuất PNG + In/Lưu PDF: trùng/không cần trên điện thoại.)
  html += `<button class="act" type="button" style="background:var(--hp-brand-primary); box-shadow:0 4px 12px rgba(96,187,70,0.25)" onclick="exportPNG169()">📸 Xuất ảnh</button>`;

  bar.innerHTML = html;
}

async function saveReportData(targetStatus) {
  try {
    const role = window.CURRENT_USER_ROLE || 'admin';
    let finalStatus = targetStatus;
    
    // CHT nộp duyệt hoặc tự tạo -> tự duyệt luôn thành approved
    if (['admin', 'director', 'pm', 'site_manager'].includes(role) && targetStatus === 'pending') {
      finalStatus = 'approved';
    }

    window._reportStatus = finalStatus;

    const date = el('f_date').value;
    const rain_hours = parseFloat(el('f_rain_hours') ? el('f_rain_hours').value : 0) || 0;
    const total_manpower = parseInt(el('f_total') ? el('f_total').value : 0) || 0;
    const weather_m = el('f_weather_m') ? el('f_weather_m').value : '';
    const weather_a = el('f_weather_a') ? el('f_weather_a').value : '';
    const bch = parseInt(el('f_bch') ? el('f_bch').value : 0) || 0;

    const reportData = {
      date: date,
      rain_hours: rain_hours,
      total_manpower: total_manpower,
      bch: bch,
      weather_m: weather_m,
      weather_a: weather_a,
      weather_note: el('f_weather_note') ? el('f_weather_note').value : '',
      units: (typeof units !== 'undefined' ? units : []),
      works_full: (typeof works !== 'undefined' ? works : []),
      photos: (typeof photos !== 'undefined' ? photos : []),
      draws: (typeof draws !== 'undefined' ? draws : []),
      // Phần ít đổi lưu kèm báo cáo để báo cáo ngày sau tự kế thừa (logo/ảnh tổng quan 01)
      logo_cdt: (typeof logoImgCdt !== 'undefined' ? logoImgCdt : null),
      logo_ntc: (typeof logoImg !== 'undefined' ? logoImg : null),
      ov_main: (typeof ovMain !== 'undefined' ? ovMain : null),
      ov_sub1: null,
      ov_sub2: null,
      f_proj: el('f_proj') ? el('f_proj').value : '',
      f_contractor: el('f_contractor') ? el('f_contractor').value : '',
      f_prog: el('f_prog') ? el('f_prog').value : '',
      f_plan: el('f_plan') ? el('f_plan').value : '',
      status: finalStatus,
      timestamp: new Date().toISOString(),
      f_note: el('f_note') ? el('f_note').value : '',
      f_rec: el('f_rec') ? el('f_rec').value : '',
      f_safe: el('f_safe') ? el('f_safe').value : '',
      f_qual: el('f_qual') ? el('f_qual').value : '',
      f_sched: el('f_sched') ? el('f_sched').value : '',
      
      created_by: window.CURRENT_REPORT?.created_by || window.CURRENT_USER_ID || "",
      created_name: window.CURRENT_REPORT?.created_name || window.CURRENT_USER_NAME || "",
      created_role: window.CURRENT_REPORT?.created_role || window.CURRENT_USER_ROLE || "",
      approval: finalStatus,
      approved_by: window.CURRENT_REPORT?.approved_by || "",
      approved_at: window.CURRENT_REPORT?.approved_at || "",
      reject_reason: window.CURRENT_REPORT?.reject_reason || ""
    };

    if (finalStatus === 'approved') {
      reportData.approved_by = reportData.approved_by || window.CURRENT_USER_NAME || window.CURRENT_COMMANDER || "Chỉ huy trưởng";
      reportData.approved_at = reportData.approved_at || new Date().toISOString();
      reportData.reject_reason = "";
    }

    await requestParent('SAVE_REPORT', reportData);
    
    window.CURRENT_REPORT = reportData;
    updateActionButtons();
    draw();
    
    if (window.AppCore) window.AppCore.postMessage({ type: 'DAILY_REPORT_SAVED' });
    showToast("💾 Đã lưu dữ liệu báo cáo!");
  } catch (err) {
    console.error("Lỗi lưu báo cáo:", err);
    alert("❌ Lỗi lưu báo cáo: " + err.message);
  }
}

async function submitReportForApproval() {
  if (!confirm("Báo cáo sẽ được nộp cho Chỉ huy trưởng duyệt và bạn sẽ không thể tự ý sửa đổi nữa. Xác nhận nộp?")) return;
  // Chốt số liệu thời tiết THỰC TẾ tới đúng thời điểm nộp (bỏ dự báo) trước khi lưu.
  try { await fetchWeatherFromGPS(true); } catch (e) { console.warn("Chốt thời tiết khi nộp lỗi (bỏ qua):", e && e.message); }
  await saveReportData('pending');
}

async function approveReport() {
  if (!confirm("Duyệt báo cáo thi công này?")) return;
  
  if (window.CURRENT_REPORT) {
    window.CURRENT_REPORT.status = 'approved';
    window.CURRENT_REPORT.approval = 'approved';
    window.CURRENT_REPORT.approved_by = window.CURRENT_USER_NAME || window.CURRENT_COMMANDER || "Chỉ huy trưởng";
    window.CURRENT_REPORT.approved_at = new Date().toISOString();
    window.CURRENT_REPORT.reject_reason = "";
    
    window._reportStatus = 'approved';
    
    try {
      await requestParent('SAVE_REPORT', window.CURRENT_REPORT);
      updateActionButtons();
      draw();
      if (window.AppCore) window.AppCore.postMessage({ type: 'DAILY_REPORT_SAVED' });
      showToast("✅ Đã phê duyệt báo cáo thành công!");
    } catch (err) {
      alert("❌ Lỗi phê duyệt: " + err.message);
    }
  }
}

async function rejectReport() {
  const reason = prompt("Lý do trả lại báo cáo (sẽ hiển thị ở phần Ghi chú):");
  if (reason === null) return;
  
  if (window.CURRENT_REPORT) {
    window.CURRENT_REPORT.status = 'rejected';
    window.CURRENT_REPORT.approval = 'rejected';
    window.CURRENT_REPORT.reject_reason = reason.trim();
    
    if (reason.trim()) {
      const noteEl = el('f_note');
      if (noteEl) {
        noteEl.value = `[CHT TRẢ LẠI - ${new Date().toLocaleDateString('vi-VN')}]: ${reason}\n` + (noteEl.value || "");
      }
      window.CURRENT_REPORT.f_note = noteEl.value;
    }
    
    window._reportStatus = 'rejected';
    
    try {
      await requestParent('SAVE_REPORT', window.CURRENT_REPORT);
      updateActionButtons();
      draw();
      if (window.AppCore) window.AppCore.postMessage({ type: 'DAILY_REPORT_SAVED' });
      showToast("↩️ Đã trả lại báo cáo yêu cầu sửa!");
    } catch (err) {
      alert("❌ Lỗi khi trả lại báo cáo: " + err.message);
    }
  }
}

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed; bottom:20px; right:20px; background:#1e293b; color:#fff; padding:12px 20px; border-radius:8px; font-weight:600; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); z-index:9999;";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.remove(); }, 3000);
}

// Ngày dạng YYYY-MM-DD theo GIỜ ĐỊA PHƯƠNG (VN). KHÔNG dùng toISOString() cho việc lấy ngày:
// nó đổi về UTC (VN = UTC+7) nên từ 0h00-6h59 sáng sẽ ra NGÀY HÔM TRƯỚC — lỗi lệch 1 ngày.
function localISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Sao chép mẫu từ ngày hôm qua
async function copyYesterdayTemplate() {
  const dateEl = el('f_date');
  if (!dateEl || !dateEl.value) { alert('Vui lòng chọn ngày báo cáo trước.'); return; }
  const cur = new Date(dateEl.value + 'T00:00:00');
  cur.setDate(cur.getDate() - 1);
  const yest = localISODate(cur);

  try {
    // Lấy dữ liệu qua kênh postMessage chuẩn (requestParent). KHÔNG truy cập window.parent.DataService
    // trực tiếp: bên app cha nó khai báo bằng const nên không nằm trên window -> luôn undefined.
    const res = await requestParent('GET_DAILY_REPORTS');
    const reports = (res && res.reports) || [];
    const proj = res ? res.project : null;
    const report = reports.find(r => (!proj || r.project_id === proj) && r.date === yest);

    if (!report) {
      alert('Không tìm thấy báo cáo ngày ' + yest.split('-').reverse().join('/') + '.\nVui lòng nhập thủ công.');
      return;
    }

    const hasCurrent = (typeof units !== 'undefined' && units.length > 0) ||
                       (typeof works !== 'undefined' && works.length > 0);
    if (hasCurrent && !confirm('Báo cáo hôm nay đã có dữ liệu nhân lực / hạng mục.\nGhi đè bằng mẫu từ ' + yest.split('-').reverse().join('/') + '?')) return;

    // Sao chép nhân lực và hạng mục (giữ nguyên số lượng nhưng xóa ảnh/notes ngày cũ)
    if (report.units && Array.isArray(report.units)) {
      units = report.units.map(u => ({ ...u }));
      if (typeof renderUnitForm === 'function') renderUnitForm();
      if (typeof recomputeTotal === 'function') recomputeTotal();
    }
    if (report.works_full && Array.isArray(report.works_full)) {
      works = report.works_full.map(w => ({ ...w, d: '' })); // giữ tên, xóa chi tiết cũ
      if (typeof renderWorkForm === 'function') renderWorkForm();
      if (typeof draw === 'function') draw();
    }
    // Kế hoạch ngày mai: hiện lại nội dung đã khai hôm qua (KHÔNG lấy thời tiết + ảnh công trường)
    if (report.f_plan && el('f_plan')) { el('f_plan').value = report.f_plan; }
    if (typeof updateProgress === 'function') updateProgress();
    triggerAutoSave();

    // Toast thông báo
    const toast = document.createElement('div');
    toast.textContent = '✓ Đã sao chép mẫu từ ' + yest.split('-').reverse().join('/');
    Object.assign(toast.style, {
      position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
      background:'var(--green)', color:'#fff', padding:'10px 20px',
      borderRadius:'8px', fontWeight:'700', fontSize:'13px',
      zIndex:'9999', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', pointerEvents:'none'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  } catch(e) {
    alert('Lỗi: ' + e.message);
  }
}

// Lưu trữ đám mây
async function saveToCloud() {
  const btn = event.currentTarget;
  const oldText = btn.innerHTML;
  btn.innerHTML = "⏳ Đang lưu...";
  btn.disabled = true;

  try {
    // Thu thập toàn bộ dữ liệu
    const date = el('f_date').value;
    const rain_hours = parseFloat(el('f_rain_hours') ? el('f_rain_hours').value : 0) || 0;
    const total_manpower = parseInt(el('f_total') ? el('f_total').value : 0) || 0;
    const weather_m = el('f_weather_m') ? el('f_weather_m').value : '';
    const weather_a = el('f_weather_a') ? el('f_weather_a').value : '';
    const bch = parseInt(el('f_bch') ? el('f_bch').value : 0) || 0;

    // Đóng gói JSON — toàn bộ dữ liệu (nhân lực, hạng mục, ảnh, bản vẽ)
    const reportData = {
      date: date,
      rain_hours: rain_hours,
      total_manpower: total_manpower,
      bch: bch,
      weather_m: weather_m,
      weather_a: weather_a,
      weather_note: el('f_weather_note') ? el('f_weather_note').value : '',
      units: (typeof units !== 'undefined' ? units : []),
      works_full: (typeof works !== 'undefined' ? works : []),
      photos: (typeof photos !== 'undefined' ? photos : []),
      draws: (typeof draws !== 'undefined' ? draws : []),
      // Phần ít đổi lưu kèm báo cáo để báo cáo ngày sau tự kế thừa (logo/ảnh tổng quan 01)
      logo_cdt: (typeof logoImgCdt !== 'undefined' ? logoImgCdt : null),
      logo_ntc: (typeof logoImg !== 'undefined' ? logoImg : null),
      ov_main: (typeof ovMain !== 'undefined' ? ovMain : null),
      ov_sub1: null,
      ov_sub2: null,
      f_proj: el('f_proj') ? el('f_proj').value : '',
      f_contractor: el('f_contractor') ? el('f_contractor').value : '',
      f_prog: el('f_prog') ? el('f_prog').value : '',
      f_plan: el('f_plan') ? el('f_plan').value : '',
      status: window._reportStatus || 'draft',
      timestamp: new Date().toISOString(),
      f_note: el('f_note') ? el('f_note').value : '',
      f_rec: el('f_rec') ? el('f_rec').value : '',
      f_safe: el('f_safe') ? el('f_safe').value : '',
      f_qual: el('f_qual') ? el('f_qual').value : '',
      f_sched: el('f_sched') ? el('f_sched').value : ''
    };

    try {
      await requestParent('SAVE_REPORT', reportData);
      btn.innerHTML = "✅ Đã lưu thành công";
      btn.style.background = "var(--green)";
      setTimeout(() => {
        btn.innerHTML = oldText;
        btn.style.background = "#0052cc";
        btn.disabled = false;
      }, 3000);
    } catch(err) {
      throw err;   // giữ nguyên thông báo chi tiết từ requestParent (đừng nuốt mất lý do thật)
    }
  } catch(e) {
    console.error("Lỗi lưu:", e);
    btn.innerHTML = "❌ Lỗi: " + e.message;
    btn.style.background = "var(--red)";
    setTimeout(() => {
      btn.innerHTML = oldText;
      btn.style.background = "#0052cc";
      btn.disabled = false;
    }, 4000);
  }
}

// Hàm giao tiếp iframe -> parent (vượt CORS)
// Hướng sang AppCore trong app báo cáo độc lập
function requestParent(type, data = {}, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    if (window.AppCore && typeof window.AppCore.handleRequest === 'function') {
      window.AppCore.handleRequest(type, data).then(resolve).catch(reject);
      return;
    }
    reject(new Error("Chưa khởi tạo AppCore!"));
  });
}

// ====== THANH TIẾN ĐỘ HOÀN THÀNH ======
// (PROGRESS_CHECKS đã được chuyển lên đầu file để tránh lỗi TDZ khi render chạy sớm)
function updateProgress() {
  const sectEl = el('progressSections');
  const fill   = el('progressFill');
  const pctEl  = el('progressPct');
  if (!sectEl || !fill || !pctEl) return;
  const results = PROGRESS_CHECKS.map(c => ({ ...c, done: !!c.check() }));
  const done = results.filter(r => r.done).length;
  const pct  = Math.round(done / results.length * 100);
  fill.style.width = pct + '%';
  const col = pct === 100 ? 'var(--green)' : pct >= 50 ? '#f59e0b' : 'var(--red)';
  fill.style.background = col;
  pctEl.textContent = pct + '%';
  pctEl.style.color = col;
  sectEl.innerHTML = results.map(r =>
    `<span onclick="openModal('${r.id}')" title="${r.done ? 'Đã điền ✓' : 'Chưa có dữ liệu — nhấn để điền'}"
      style="cursor:pointer;font-size:10px;padding:2px 7px;border-radius:10px;font-weight:600;
        background:${r.done ? '#dcfce7' : '#fef9c3'};
        color:${r.done ? '#15803d' : '#92400e'};
        border:1px solid ${r.done ? '#86efac' : '#fcd34d'}">
      ${r.done ? '✓' : '⚠'} ${r.label}
    </span>`
  ).join('');
}
window.updateProgress = updateProgress;

// ====== AUTO-SAVE DEBOUNCE ======
let _autoSaveTimer = null;
async function _silentSave() {
  const date = el('f_date') ? el('f_date').value : '';
  if (!date) return;
  // Tự lưu nháp NGAY khi có nội dung thực (kể cả báo cáo MỚI chưa lưu tay) — nhưng KHÔNG lưu bản rỗng
  // để tránh tạo nháp rác chỉ từ mẫu mặc định (lỗi BCA-GD1). Nội dung thực = có nhân lực/hạng mục/ảnh/kế hoạch.
  const _hasContent = (typeof units !== 'undefined' && units.length)
    || (typeof works !== 'undefined' && works.length)
    || (typeof photos !== 'undefined' && photos.some(p => p && p.img))
    || ((parseInt(el('f_bch') ? el('f_bch').value : 0) || 0) > 0)
    || (el('f_plan') && el('f_plan').value.trim());
  if (!window.CURRENT_REPORT && !_hasContent) return;
  try {
    const _base = window.CURRENT_REPORT || {
      created_by: window.CURRENT_USER_ID || "",
      created_name: window.CURRENT_USER_NAME || "",
      created_role: window.CURRENT_USER_ROLE || "",
      approval: 'draft', approved_by: "", approved_at: "", reject_reason: ""
    };
    const reportData = {
      ..._base,
      date,
      rain_hours: parseFloat(el('f_rain_hours') ? el('f_rain_hours').value : 0) || 0,
      total_manpower: parseInt(el('f_total') ? el('f_total').value : 0) || 0,
      bch: parseInt(el('f_bch') ? el('f_bch').value : 0) || 0,
      weather_m: el('f_weather_m') ? el('f_weather_m').value : '',
      weather_a: el('f_weather_a') ? el('f_weather_a').value : '',
      weather_note: el('f_weather_note') ? el('f_weather_note').value : '',
      units: (typeof units !== 'undefined' ? units : []),
      works_full: (typeof works !== 'undefined' ? works : []),
      photos: (typeof photos !== 'undefined' ? photos : []),
      draws: (typeof draws !== 'undefined' ? draws : []),
      // Phần ít đổi lưu kèm báo cáo để báo cáo ngày sau tự kế thừa (logo/ảnh tổng quan 01)
      logo_cdt: (typeof logoImgCdt !== 'undefined' ? logoImgCdt : null),
      logo_ntc: (typeof logoImg !== 'undefined' ? logoImg : null),
      ov_main: (typeof ovMain !== 'undefined' ? ovMain : null),
      ov_sub1: null,
      ov_sub2: null,
      f_proj: el('f_proj') ? el('f_proj').value : '',
      f_contractor: el('f_contractor') ? el('f_contractor').value : '',
      f_prog: el('f_prog') ? el('f_prog').value : '',
      f_plan: el('f_plan') ? el('f_plan').value : '',
      status: window._reportStatus || 'draft',
      timestamp: new Date().toISOString(),
      f_note: el('f_note') ? el('f_note').value : '',
      f_rec: el('f_rec') ? el('f_rec').value : '',
      f_safe: el('f_safe') ? el('f_safe').value : '',
      f_qual: el('f_qual') ? el('f_qual').value : '',
      f_sched: el('f_sched') ? el('f_sched').value : ''
    };
    const _saved = await requestParent('SAVE_REPORT', reportData);
    // Lần tự lưu ĐẦU TIÊN của báo cáo mới: ghi nhận để lần sau cập nhật đúng bản + hiện đúng trạng thái nút
    if (!window.CURRENT_REPORT) {
      window.CURRENT_REPORT = _saved || reportData;
      if (typeof updateActionButtons === 'function') updateActionButtons();
    }
  } catch(e) {}
}
let _progressTimer = null;
function triggerAutoSave() {
  if (_progressTimer) clearTimeout(_progressTimer);
  _progressTimer = setTimeout(updateProgress, 400);
  if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(_silentSave, 2000);
}
window.triggerAutoSave = triggerAutoSave;
document.addEventListener('input', triggerAutoSave);
document.addEventListener('change', triggerAutoSave);

// Initialize date to today
if (el('f_date') && !el('f_date').getAttribute('data-init')) {
  el('f_date').value = localISODate(new Date()); // giờ VN — toISOString() cũ làm form tự điền NGÀY HÔM QUA nếu mở trước 7h sáng
  el('f_date').setAttribute('data-init', '1');
}

// Lắng nghe sự kiện từ parent (Dark Mode, chuyển hướng báo cáo, thay đổi dự án)
window.addEventListener('message', async (e) => {
  if (!e.data) return;
  if (e.data.type === 'TOGGLE_DARK_MODE') {
    if (typeof e.data.isDark === 'boolean') {
      if (e.data.isDark) document.body.classList.add('dark-mode');
      else document.body.classList.remove('dark-mode');
      localStorage.setItem('meta_dark_mode', e.data.isDark);
      if (typeof updateDarkModeBtn === 'function') updateDarkModeBtn();
    } else {
      if (typeof toggleDarkMode === 'function') toggleDarkMode();
    }
  } else if (e.data.type === 'NAVIGATE_TO_REPORT') {
    const { date, sectionId } = e.data;
    const dateEl = el('f_date');
    if (dateEl) {
      dateEl.value = date;
      if (typeof loadReportForDate === 'function') {
        await loadReportForDate(date);
      }
    }
    if (sectionId && typeof openModal === 'function') {
      setTimeout(() => {
        openModal(sectionId);
      }, 300);
    }
  } else if (e.data.type === 'PROJECT_CHANGED' || e.data.type === 'EMBED_SET_PROJECT') {
    const { projectId, projName, projInfo } = e.data;
    if (typeof window.selectProjectById === 'function') {
      await window.selectProjectById(projectId, projName, projInfo);
    } else {
      const dateEl = el('f_date');
      if (dateEl && typeof loadReportForDate === 'function') {
        await loadReportForDate(dateEl.value);
      }
      const pi = projInfo || {};
      const toDmy = (s)=>{ const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (m[3]+'/'+m[2]+'/'+m[1]) : (s||''); };
      if (el('f_proj'))  el('f_proj').value  = pi.name || projName || '';
      if (el('f_loc'))   el('f_loc').value   = pi.address || '';
      if (el('f_scale')) el('f_scale').value = pi.scale || '';
      if (el('f_start') && pi.start_date) el('f_start').value = toDmy(pi.start_date);
      if (el('f_end')   && pi.end_date)   el('f_end').value   = toDmy(pi.end_date);
      if (typeof recalcFromSched === 'function') recalcFromSched();
      if (typeof draw === 'function') draw();
      if (window.AppCore) window.AppCore.postMessage({ type: 'REQUEST_KB_SYNC' });
    }
  }
});
// Khởi tạo Dark Mode nếu đã lưu
const _sd = localStorage.getItem('meta_dark_mode');
if (_sd === null || _sd === 'true') {
  document.body.classList.add('dark-mode');
}

window.toggleDarkMode = function() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('meta_dark_mode', isDark);
  updateDarkModeBtn();
};

function updateDarkModeBtn() {
  const btn = el('dark-mode-toggle');
  if (btn) {
    btn.innerText = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  }
}

// Cập nhật icon khi khởi tạo script và khi DOM sẵn sàng
updateDarkModeBtn();
document.addEventListener('DOMContentLoaded', updateDarkModeBtn);

// =================== THƯ VIỆN HẠNG MỤC KB ===================
let _kbLibSelected = new Set();

function openKBLibrary() {
  _kbLibSelected.clear();
  const overlay = el('kbLibOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  const searchEl = el('kbLibSearch');
  if (searchEl) { searchEl.value = ''; }
  renderKBLibItems('');
  setTimeout(() => { if (searchEl) searchEl.focus(); }, 100);
}

function closeKBLibrary() {
  const overlay = el('kbLibOverlay');
  if (overlay) overlay.style.display = 'none';
  _kbLibSelected.clear();
}

function renderKBLibItems(filter) {
  const container = el('kbLibItems');
  if (!container) return;
  const q = (filter || '').trim().toUpperCase();

  // Gộp KB_GLOSSARY + KB_CATEGORIES + KB_TASKS
  const glossaryKeys = typeof KB_GLOSSARY !== 'undefined' ? Object.keys(KB_GLOSSARY) : [];
  const catKeys = (window.KB_CATEGORIES || []).filter(k => !glossaryKeys.includes(k.toUpperCase()));
  const taskKeys = (window.KB_TASKS || []).filter(k => !glossaryKeys.includes(k.toUpperCase()) && !catKeys.includes(k));
  const allItems = [...glossaryKeys, ...catKeys, ...taskKeys];

  // Lọc theo từ khóa
  const filtered = q ? allItems.filter(k => k.toUpperCase().includes(q)) : allItems;

  if (!filtered.length) {
    container.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:12px 0">Không tìm thấy hạng mục nào.</div>';
    return;
  }

  // Đánh dấu những item đã có trong works[]
  const existing = new Set((typeof works !== 'undefined' ? works : []).map(w => w.t.toUpperCase().trim()));

  container.innerHTML = filtered.map(name => {
    const isExist = existing.has(name.toUpperCase().trim());
    const isSel = _kbLibSelected.has(name);
    const cn = typeof KB_GLOSSARY !== 'undefined' && KB_GLOSSARY[name] ? `<span style="font-size:10px;color:#94a3b8;display:block;margin-top:1px">${KB_GLOSSARY[name]}</span>` : '';
    return `<div onclick="toggleKBLibItem('${name.replace(/'/g, "\\'")}')"
      style="cursor:pointer;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;
        border:1.5px solid ${isSel ? 'var(--navy2)' : isExist ? '#86efac' : '#e2e8f0'};
        background:${isSel ? '#e0e7ff' : isExist ? '#f0fdf4' : '#f8fafc'};
        color:${isSel ? 'var(--navy2)' : isExist ? '#15803d' : '#334155'};
        transition:all 0.15s;user-select:none" id="kbitem-${name.replace(/[^a-zA-Z0-9]/g,'_')}">
      ${isSel ? '✓ ' : isExist ? '↩ ' : ''}${name}${cn}
    </div>`;
  }).join('');

  _updateKBLibCount();
}

function toggleKBLibItem(name) {
  if (_kbLibSelected.has(name)) {
    _kbLibSelected.delete(name);
  } else {
    _kbLibSelected.add(name);
  }
  // Re-render just the chip to update its style
  const q = el('kbLibSearch') ? el('kbLibSearch').value : '';
  renderKBLibItems(q);
}

function _updateKBLibCount() {
  const countEl = el('kbLibCount');
  const addBtn = el('kbLibAddBtn');
  const n = _kbLibSelected.size;
  if (countEl) countEl.textContent = n ? n + ' đã chọn' : '0 đã chọn';
  if (addBtn) addBtn.disabled = (n === 0);
}

function addKBLibSelected() {
  if (!_kbLibSelected.size) return;
  const colors = ['var(--green)', 'var(--navy2)', 'var(--orange)', 'var(--teal)', 'var(--purple)', 'var(--red)'];
  let added = 0;
  _kbLibSelected.forEach(name => {
    const exists = (typeof works !== 'undefined' ? works : []).some(w => w.t.toUpperCase().trim() === name.toUpperCase().trim());
    if (!exists) {
      const c = colors[(works ? works.length : 0) % colors.length];
      works.push({ c, t: name, d: '' });
      added++;
    }
  });
  if (typeof renderWorkForm === 'function') renderWorkForm();
  if (typeof draw === 'function') draw();
  if (typeof updateProgress === 'function') updateProgress();
  triggerAutoSave();
  closeKBLibrary();
  if (added > 0) {
    const toast = document.createElement('div');
    toast.textContent = '✓ Đã thêm ' + added + ' hạng mục vào báo cáo';
    Object.assign(toast.style, {
      position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
      background:'var(--navy2)', color:'#fff', padding:'10px 20px',
      borderRadius:'8px', fontWeight:'700', fontSize:'13px',
      zIndex:'9999', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', pointerEvents:'none'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

window.openKBLibrary = openKBLibrary;
window.closeKBLibrary = closeKBLibrary;
window.renderKBLibItems = renderKBLibItems;
window.toggleKBLibItem = toggleKBLibItem;
window.addKBLibSelected = addKBLibSelected;

// =================== GEMINI AI INTEGRATION ===================
let GEMINI_API_KEY = localStorage.getItem('sys_gemini_key') || '';
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SET_GEMINI_KEY') {
    GEMINI_API_KEY = e.data.key;
    localStorage.setItem('sys_gemini_key', e.data.key);
  }
});

async function callGeminiAI(transcript, systemInstruction) {
  if (!GEMINI_API_KEY) throw new Error('Chưa cấu hình API Key. Vui lòng vào Tab Hệ Thống -> Cấu hình AI.');
  
  const configs = [
    { v: 'v1', m: 'gemini-1.5-flash' },
    { v: 'v1beta', m: 'gemini-1.5-flash' },
    { v: 'v1', m: 'gemini-2.0-flash' },
    { v: 'v1beta', m: 'gemini-2.0-flash' },
    { v: 'v1', m: 'gemini-1.5-pro' },
    { v: 'v1beta', m: 'gemini-1.5-pro' }
  ];
  let errors = [];
  
  for (const cfg of configs) {
    try {
      const url = `https://generativelanguage.googleapis.com/${cfg.v}/models/${cfg.m}:generateContent?key=${GEMINI_API_KEY}`;
      
      // Gộp systemInstruction vào contents để tương thích 100% với cả v1 và v1beta
      const combinedText = `System Instruction:\n${systemInstruction}\n\nInput Text:\n${transcript}`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: combinedText }] }]
      };
      
      const response = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      if (!response.ok) { 
        const err = await response.json(); 
        throw new Error(err.error?.message || `Lỗi từ model ${cfg.m} (${cfg.v})`); 
      }
      
      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error(`Phản hồi từ ${cfg.m} (${cfg.v}) không hợp lệ`);
      }
      
      const textRes = data.candidates[0].content.parts[0].text;
      let cleanText = textRes.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/```$/, '').trim();
      }
      return JSON.parse(cleanText);
    } catch (e) {
      console.warn(`Model ${cfg.m} (${cfg.v}) thất bại:`, e.message);
      errors.push(`[${cfg.m} (${cfg.v})]: ${e.message}`);
    }
  }
  
  throw new Error('Thử các model đều lỗi:\n' + errors.join('\n'));
}

// Helpers for Levenshtein Distance & String Similarity
function removeAccents(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Map tên đã nhận diện → tên chuẩn trong KB (exact → alias → contains → Levenshtein fuzzy)
function matchToKB(query, kb) {
  if (!query) return null;
  
  // 1. Clean and normalize query
  let cleanQuery = removeAccents(query);
  if (!cleanQuery || cleanQuery.length < 2) return query;
  
  // Strip common organizational prefixes to get the core name
  const prefixes = ['to doi', 'nha thau', 'doi', 'cong ty', 'don vi', 'anh', 'chi'];
  for (const pf of prefixes) {
    if (cleanQuery.startsWith(pf + ' ')) {
      cleanQuery = cleanQuery.substring(pf.length + 1).trim();
    }
  }
  
  let bestMatch = null;
  let bestScore = -1; // Higher similarity score is better (0 to 1)
  
  for (const c of kb) {
    // Gather all candidate names (standard name + aliases)
    const candidates = [];
    if (c.name) candidates.push(c.name);
    if (c.aliases) {
      const parts = typeof c.aliases === 'string'
        ? c.aliases.split(',').map(p => p.trim())
        : (Array.isArray(c.aliases) ? c.aliases : []);
      candidates.push(...parts);
    }
    
    for (const cand of candidates) {
      let cleanCand = removeAccents(cand);
      // Strip prefixes from candidate names for consistent comparison
      for (const pf of prefixes) {
        if (cleanCand.startsWith(pf + ' ')) {
          cleanCand = cleanCand.substring(pf.length + 1).trim();
        }
      }
      
      // A. Exact Match (highest priority)
      if (cleanQuery === cleanCand) {
        return c.name; // Instant perfect match!
      }
      
      // B. Substring Match (as intermediate fallback)
      if (cleanQuery.length > 3 && cleanCand.length > 3) {
        if (cleanCand.includes(cleanQuery) || cleanQuery.includes(cleanCand)) {
          const score = Math.min(cleanQuery.length, cleanCand.length) / Math.max(cleanQuery.length, cleanCand.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = c.name;
          }
        }
      }
      
      // C. Fuzzy Match (Levenshtein Distance)
      const dist = levenshteinDistance(cleanQuery, cleanCand);
      const maxLength = Math.max(cleanQuery.length, cleanCand.length);
      const similarity = maxLength > 0 ? (1.0 - dist / parseFloat(maxLength)) : 0;
      
      // Threshold: only accept similarity >= 0.75
      if (similarity >= 0.75 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = c.name;
      }
    }
  }
  
  return bestMatch || query; // Return query (the original name) if no match was found!
}

// ================= OVERRIDE FUNCTIONS WITH GEMINI AI =================
async function applyVoice(text) {
  const out = el('voiceResult');
  if(!text || !text.trim()){ out.innerHTML='<span style="color:var(--red)">❌ Chưa có nội dung.</span>'; return; }
  out.innerHTML='<span style="color:var(--navy2)">✨ Đang nhờ AI phân tích nhân lực...</span>';
  try {
    const kb = window.KB_CONTRACTORS || [];
    const candidateNames = kb.map(c => `- Tên chuẩn: "${c.name}", Tên gọi voice/Alias: [${(c.aliases || []).map(a => `"${a}"`).join(', ')}]`).join('\n');
    const prompt = `Phân tích số liệu nhân lực công trường từ giọng nói.
Danh sách nhà thầu/tổ đội chuẩn của dự án:
${candidateNames}

Hãy đối chiếu văn bản giọng nói với danh sách chuẩn trên. Nếu tên nghe được tương tự hoặc khớp với Tên chuẩn/Alias (ví dụ: "báo vợ" -> "Bảo vệ", "rồi tăm" -> "Nguyễn Văn Tâm", "giang nguyễn" -> "Gia Nguyễn"), hãy trả về Tên chuẩn tương ứng.
Trả về JSON định dạng sau:
{
  "bch": number | null,
  "units": [
    { "n": "Tên chuẩn của nhà thầu/tổ đội", "v": number }
  ]
}

Văn bản giọng nói: ${text}`;

    const res = await callGeminiAI(text, prompt);
    if (res.bch != null) el('f_bch').value = res.bch;
    if (res.units && res.units.length) { units = res.units; renderUnitForm(); }
    recomputeTotal(); draw();
    out.innerHTML = '<span style="color:var(--green)">✅ AI đã phân tích & điền: ' + (res.bch ? 'BCH: '+res.bch+', ' : '') + (res.units||[]).map(x=>x.n+': '+x.v).join(' | ') + '</span>';
  } catch(e) {
    const u = parseUnits(text, runtimeTerms);
    const kb = window.KB_CONTRACTORS || [];
    if(u.bch != null) el('f_bch').value = u.bch;
    if(u.units && u.units.length){
      units = u.units.map(x => ({ name: matchToKB(x.name, kb), n: x.n }));
      renderUnitForm();
    }
    recomputeTotal(); draw();
    const applied = units.length ? units.map(x => x.name+': '+x.n) : (u.recognized||[]);
    out.innerHTML = applied.length
      ? '<span style="color:var(--green)">✓ Đã nhận diện (Local): '+applied.join(' • ')+'</span>'
      : '<span style="color:orange">⚠ Không nhận diện được — hãy nói rõ tên tổ đội và số lượng.</span>';
  }
}

async function applyWorksVoice(text) {
  const out = el('worksVoiceResult');
  if(!text || !text.trim()){ out.innerHTML='<span style="color:var(--red)">❌ Chưa có nội dung.</span>'; return; }
  out.innerHTML='<span style="color:var(--navy2)">✨ Đang nhờ AI phân tích hạng mục...</span>';
  try {
    const prompt = "Phân tích hạng mục thi công. Trả về JSON: [{ t: 'tên hạng mục (viết hoa)', c: ['chi tiết 1', 'chi tiết 2'] }]. Text: " + text;
    const res = await callGeminiAI(text, prompt);
    if (res && res.length) { works = res; renderWorkForm(); draw();
      out.innerHTML='<span style="color:var(--green)">✅ AI đã nhận diện ' + res.length + ' hạng mục</span>';
    } else out.innerHTML='<span style="color:var(--red)">❌ Không tìm thấy hạng mục nào.</span>';
  } catch(e) {
    const lines = text.split(/[\n,;]/).map(l => l.trim()).filter(l => l.length > 1);
    if(lines.length) {
      works = lines.map(l => ({ t: l.charAt(0).toUpperCase() + l.slice(1), c: [] }));
      renderWorkForm(); draw();
      out.innerHTML = '<span style="color:var(--green)">✓ Đã nhận diện '+lines.length+' hạng mục</span>';
    } else {
      out.innerHTML = '<span style="color:orange">⚠ Không phân tích được — hãy đọc từng hạng mục rõ ràng.</span>';
    }
  }
}

async function applyPhotosVoice(text) {
  const out = el('photosVoiceResult');
  if(!text || !text.trim()) return;
  out.innerHTML='<span style="color:var(--navy2)">✨ Đang nhờ AI gắn tên ảnh...</span>';
  try {
    const prompt = "Gán tên công tác cho các số thứ tự ảnh. Trả về JSON: { '1': 'tên', '2': 'tên', ... } từ 1 đến 6. Dịch chuẩn xác, viết hoa chữ cái đầu. Text: " + text;
    const res = await callGeminiAI(text, prompt);
    let updated = 0;
    for(let i=1; i<=6; i++) {
      if(res[i.toString()]) {
        photos[i-1].vi = capFirst(res[i.toString()]);
        photos[i-1].cn = kbCN(photos[i-1].vi);
        photos[i-1].auto = false;
        updated++;
      }
    }
    if (updated > 0) {
      out.innerHTML = '<span style="color:var(--green)">✅ AI đã điền tên cho '+updated+' ảnh.</span>';
      renderPhotoForm(); draw();
    } else out.innerHTML = '<span style="color:var(--red)">❌ Không thể gắn tên ảnh.</span>';
  } catch(e) {
    let updated = 0;
    for(let i=1; i<=6; i++) {
      const re = new RegExp('(?:ảnh|hình|số)\\s*'+i+'[\\s:là]+([^,\\n]+)', 'i');
      const m = text.match(re);
      if(m && m[1].trim()) {
        photos[i-1].vi = capFirst(m[1].trim());
        photos[i-1].auto = false;
        updated++;
      }
    }
    if(updated) { renderPhotoForm(); draw(); out.innerHTML='<span style="color:var(--green)">✓ Đã gắn tên cho '+updated+' ảnh</span>'; }
    else out.innerHTML='<span style="color:orange">⚠ Hãy đọc: "ảnh 1 là ..., ảnh 2 là ..."</span>';
  }
}

async function applyVoiceNoteRec(text) {
  const out = el('noteRecVoiceStatus');
  if(!text || !text.trim()){ out.innerHTML='<span style="color:var(--red)">❌ Chưa có nội dung.</span>'; return; }
  out.innerHTML='<span style="color:var(--navy2)">✨ Đang phân tích và dịch bằng AI...</span>';
  
  let success = false;
  
  if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
    try {
      const prompt = `Phân tích đoạn văn tiếng Việt sau, tách thành 2 phần: Ghi chú (note) và Kiến nghị (rec).
Với mỗi phần, hãy liệt kê các ý (mỗi ý một dòng) và DỊCH từng ý sang tiếng Trung giản thể.
Bản dịch tiếng Trung phải đặt sau bản tiếng Việt của ý đó và ngăn cách bởi dấu gạch đứng " | ".
Mỗi ý bắt đầu bằng gạch đầu dòng "- ".
Bắt buộc trả về định dạng JSON như sau:
{
  "note": "- Ý ghi chú 1 | 备注1\\n- Ý ghi chú 2 | 备注2",
  "rec": "- Ý kiến nghị 1 | 建议1"
}
Trả về chuỗi rỗng cho trường nào không có nội dung. Không kèm giải thích hay khối mã markdown nào ngoài JSON.`;
      
      const res = await callGeminiAI(text, prompt);
      if (res) {
        if(res.note !== undefined) el('f_note').value = res.note;
        if(res.rec !== undefined) el('f_rec').value = res.rec;
        out.innerHTML = '<span style="color:var(--green)">✅ AI đã phân tích & dịch xong.</span>';
        success = true;
      }
    } catch(e) {
      console.warn("AI NoteRec error, falling back to local:", e);
    }
  }
  
  if (!success) {
    try {
      let noteText = '', recText = '';
      let s = text.toLowerCase();
      let iNote = s.indexOf('ghi chú');
      let iRec = Math.max(s.indexOf('kiến nghị'), s.indexOf('đề xuất'));
      
      if(iNote !== -1 && iRec !== -1) {
        if (iNote < iRec) {
          noteText = text.substring(iNote + 7, iRec);
          recText = text.substring(iRec + (s.indexOf('kiến nghị')===iRec ? 9 : 7));
        } else {
          recText = text.substring(iRec + (s.indexOf('kiến nghị')===iRec ? 9 : 7), iNote);
          noteText = text.substring(iNote + 7);
        }
      } else if (iNote !== -1) {
        noteText = text.substring(iNote + 7);
      } else if (iRec !== -1) {
        recText = text.substring(iRec + (s.indexOf('kiến nghị')===iRec ? 9 : 7));
      } else {
        noteText = text;
      }
      
      if (noteText.trim()) {
        el('f_note').value = noteText.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.startsWith('-') ? l : '- ' + l).join('\n');
      }
      if (recText.trim()) {
        el('f_rec').value = recText.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.startsWith('-') ? l : '- ' + l).join('\n');
      }
      out.innerHTML = '<span style="color:var(--green)">✓ Đã phân tách xong (Ngoại tuyến).</span>';
    } catch(err) {
      out.innerHTML = '<span style="color:var(--red)">❌ Lỗi xử lý dữ liệu: ' + err.message + '</span>';
    }
  }
  
  if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
  if (typeof draw === 'function') draw();
}

async function applyVoiceAQT(text) {
  const out = el('aqtVoiceStatus');
  if(!text || !text.trim()){ out.innerHTML='<span style="color:var(--red)">❌ Chưa có nội dung.</span>'; return; }
  out.innerHTML='<span style="color:var(--navy2)">✨ Đang phân tích và dịch bằng AI...</span>';
  
  let success = false;
  
  if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
    try {
      const prompt = `Phân tích đoạn văn tiếng Việt sau, phân tách thành 3 tiêu chí: An toàn (safe), Chất lượng (qual), Tiến độ (sched).
Với mỗi phần, hãy liệt kê các ý (mỗi ý một dòng) và DỊCH từng ý sang tiếng Trung giản thể.
Bản dịch tiếng Trung phải đặt sau bản tiếng Việt của ý đó và ngăn cách bởi dấu gạch đứng " | ".
Mỗi ý bắt đầu bằng gạch đầu dòng "- ".
Bắt buộc trả về định dạng JSON như sau:
{
  "safe": "- Ý an toàn | 安全项\\n- Ý an toàn 2 | 安全项2",
  "qual": "- Ý chất lượng | 质量项",
  "sched": "- Ý tiến độ | 进度项"
}
Trả về chuỗi rỗng cho trường nào không có nội dung. Không kèm giải thích hay khối mã markdown nào ngoài JSON.`;
      
      const res = await callGeminiAI(text, prompt);
      if (res) {
        if(res.safe !== undefined) el('f_safe').value = res.safe;
        if(res.qual !== undefined) el('f_qual').value = res.qual;
        if(res.sched !== undefined) el('f_sched').value = res.sched;
        out.innerHTML = '<span style="color:var(--green)">✅ AI đã phân tích & dịch xong.</span>';
        success = true;
      }
    } catch(e) {
      console.warn("AI AQT error, falling back to local:", e);
    }
  }
  
  if (!success) {
    try {
      let s = text.toLowerCase();
      let pos = [];
      let idxSafe = s.indexOf('an toàn');
      if(idxSafe !== -1) pos.push({id: 'f_safe', i: idxSafe, len: 7});
      
      let idxQual = s.indexOf('chất lượng');
      if(idxQual !== -1) pos.push({id: 'f_qual', i: idxQual, len: 10});
      
      let idxSched = s.indexOf('tiến độ');
      if(idxSched !== -1) pos.push({id: 'f_sched', i: idxSched, len: 7});
      
      pos.sort((a,b) => a.i - b.i);
      
      if (pos.length === 0) {
        el('f_safe').value = text.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.startsWith('-') ? l : '- ' + l).join('\n');
      } else {
        for (let k = 0; k < pos.length; k++) {
          let startPos = pos[k].i + pos[k].len;
          let endPos = (k + 1 < pos.length) ? pos[k+1].i : text.length;
          let chunk = text.substring(startPos, endPos);
          let cleanChunk = chunk.replace(/^[\s:.]+/, '').trim();
          if (cleanChunk) {
            el(pos[k].id).value = cleanChunk.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.startsWith('-') ? l : '- ' + l).join('\n');
          }
        }
      }
      out.innerHTML = '<span style="color:var(--green)">✓ Đã phân tách xong (Ngoại tuyến).</span>';
    } catch(err) {
      out.innerHTML = '<span style="color:var(--red)">❌ Lỗi xử lý dữ liệu: ' + err.message + '</span>';
    }
  }
  
  if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
  if (typeof draw === 'function') draw();
}

// ==================== BILINGUAL EDIT MODAL SYSTEM ====================
function editBilingualField(id, label) {
  const textarea = el(id);
  if (!textarea) return;
  
  const rawText = textarea.value;
  const viLines = rawText.split('\n').map(line => {
    if (line.includes('|')) {
      return line.split('|')[0].trim();
    }
    return line.trim();
  }).join('\n');

  let dialog = el('bilingual-edit-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'bilingual-edit-dialog';
    dialog.style = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
      opacity: 0; transition: opacity 0.2s ease;
    `;
    dialog.innerHTML = `
      <div style="
        background: #ffffff;
        width: 90%; max-width: 500px;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        padding: 20px;
        display: flex; flex-direction: column; gap: 16px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
          <h3 id="bledit-title" style="margin:0; font-size:16px; color:#1e3a8a; font-weight:700;">Nhập thông tin</h3>
          <button onclick="closeBilingualEdit()" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b; padding:0 4px; line-height:1;">✕</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:12px; font-weight:600; color:#475569;">Nội dung (Tiếng Việt) - Mỗi ý một dòng:</label>
          <textarea id="bledit-textarea" style="
            width: 100%; min-height: 120px;
            padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;
            font-size: 13px; line-height: 1.5; resize: vertical;
            outline: none; box-sizing: border-box;
          "></textarea>
        </div>
        <div id="bledit-status" style="font-size:12px; color:#475569; min-height:18px;"></div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button onclick="closeBilingualEdit()" style="
            background: #f1f5f9; color: #334155;
            border: none; padding: 8px 16px; border-radius: 6px;
            font-size: 13px; font-weight: 600; cursor: pointer;
            transition: 0.2s;
          " onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">Hủy</button>
          <button id="bledit-save-btn" style="
            background: #1e3a8a; color: #ffffff;
            border: none; padding: 8px 16px; border-radius: 6px;
            font-size: 13px; font-weight: 600; cursor: pointer;
            transition: 0.2s;
            display: flex; align-items: center; gap: 6px;
          " onmouseover="this.style.background='#172554'" onmouseout="this.style.background='#1e3a8a'">
            Lưu & Dịch
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  document.getElementById('bledit-title').innerText = 'Nhập ' + label;
  const ta = el('bledit-textarea');
  ta.value = viLines;
  const statusDiv = el('bledit-status');
  statusDiv.innerHTML = '';
  statusDiv.style.color = '#64748b';

  const saveBtn = el('bledit-save-btn');
  saveBtn.disabled = false;
  saveBtn.style.opacity = '1';
  saveBtn.onclick = async function() {
    const text = ta.value.trim();
    if (!text) {
      textarea.value = '';
      if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
      if (typeof draw === 'function') draw();
      closeBilingualEdit();
      return;
    }

    textarea.value = text;
    if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
    if (typeof draw === 'function') draw();
    
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';
    statusDiv.innerHTML = '⚡ Đang dịch tự động...';
    statusDiv.style.color = '#1e3a8a';

    try {
      // 1. Luồng chính: Dịch bằng Google Translate gtx (tích hợp offline dictionary qua window.translateViToCn)
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const translatedLines = await Promise.all(lines.map(async line => {
        const trans = await window.translateViToCn(line);
        return trans ? `${line} | ${trans}` : line;
      }));
      
      const merged = translatedLines.join('\n');
      textarea.value = merged;
      if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
      if (typeof draw === 'function') draw();
      
      statusDiv.innerHTML = '✅ Đã dịch thành công!';
      statusDiv.style.color = '#2E6B22';
      setTimeout(closeBilingualEdit, 800);
    } catch (err) {
      console.warn("Google Translate dịch lỗi, chuyển sang Gemini AI làm fallback:", err);
      statusDiv.innerHTML = '✨ Đang dịch dự phòng bằng Gemini AI...';
      statusDiv.style.color = '#d97706';
      
      try {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const numberedList = lines.map((line, idx) => `${idx + 1}. ${line}`).join('\n');
        const prompt = `Bạn là một thông dịch viên chuyên nghiệp Việt - Trung cho ngành xây dựng.
Hãy dịch danh sách các câu tiếng Việt được đánh số sau đây sang tiếng Trung giản thể.
Bắt buộc trả về định dạng JSON thuần túy như sau:
{
  "translations": [
    "bản dịch cho câu 1",
    "bản dịch cho câu 2"
  ]
}
Hãy dịch đúng số lượng câu và trả về đúng thứ tự trong mảng JSON.
Không kèm bất kỳ văn bản giải thích hay khối mã markdown nào ngoài JSON.`;
        
        const res = await callGeminiAI(numberedList, prompt);
        if (res && res.translations && res.translations.length === lines.length) {
          const merged = lines.map((line, idx) => {
            const trans = res.translations[idx].trim();
            return trans ? `${line} | ${trans}` : line;
          }).join('\n');
          
          textarea.value = merged;
          if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
          if (typeof draw === 'function') draw();
          
          statusDiv.innerHTML = '✅ Đã dịch thành công!';
          statusDiv.style.color = '#2E6B22';
          setTimeout(closeBilingualEdit, 800);
        } else {
          throw new Error('Dữ liệu dịch Gemini không khớp số dòng.');
        }
      } catch (geminiErr) {
        console.error("Cả Google Translate và Gemini đều dịch lỗi:", geminiErr);
        textarea.value = text;
        if (typeof saveNotesAndMetrics === 'function') saveNotesAndMetrics();
        if (typeof draw === 'function') draw();
        statusDiv.innerHTML = '✓ Đã lưu (không dịch được tiếng Trung).';
        statusDiv.style.color = '#ef4444';
        setTimeout(closeBilingualEdit, 1500);
      }
    }
  };

  dialog.style.display = 'flex';
  setTimeout(() => { dialog.style.opacity = '1'; }, 20);
}

function closeBilingualEdit() {
  const dialog = el('bilingual-edit-dialog');
  if (dialog) {
    dialog.style.opacity = '0';
    setTimeout(() => { dialog.style.display = 'none'; }, 200);
  }
}


// =================== GLOBAL KB SYNC ===================
window.KB_CONTRACTORS = [];
window.KB_CATEGORIES = [];
window.KB_TASKS = [];
window.addEventListener('message', async (e) => {
  if (!e.data || !e.data.type) return;

  if (e.data.type === 'SYNC_KB') {
    window.KB_CONTRACTORS = e.data.kb;
    window.KB_CATEGORIES = e.data.categories || [];
    window.KB_TASKS = e.data.tasks || [];
    if (typeof renderUnitForm === 'function') {
      renderUnitForm();
    }
    if (typeof renderWorkForm === 'function') {
      renderWorkForm();
    }
  } else if (e.data.type === 'SYNC_USER') {
    window.CURRENT_USER_ID = e.data.id || '';
    window.CURRENT_USER_ROLE = e.data.role;
    window.CURRENT_USER_NAME = e.data.userName;
    
    // Cập nhật các nút hành động ngay lập tức
    updateActionButtons();
    
    // Đọc thông tin CHT và vẽ lại bản in bất đồng bộ
    (async () => {
      try {
        if (window.AppCore && window.AppCore.DataService && window.AppCore.CUR.project) {
          const projs = await window.AppCore.DataService.listProjects();
          const curProj = projs.find(p => p.id === window.AppCore.CUR.project);
          if (curProj) {
            window.CURRENT_COMMANDER = curProj.commander || "";
          }
        }
      } catch (err) {
        console.warn("Lỗi đọc CHT khi sync user:", err);
      }
      if (typeof draw === 'function') draw();
    })();
  }
});
// Yêu cầu KB ngay khi load
if (window.AppCore) window.AppCore.postMessage({ type: 'REQUEST_KB_SYNC' });

// Ghi đè lại hàm applyVoice để đưa KB vào Prompt
const oldApplyVoice = applyVoice;
// =================== STRICT MANPOWER VOICE PARSING & KB MATCHING ===================
function cleanContractorName(name) {
  if (!name) return '';
  let s = ('' + name).toLowerCase();
  
  // 1. Chuyển chữ thường & Bỏ dấu tiếng Việt
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/đ/g, "d");
  
  // 2. Loại bỏ từ thừa nghiêm ngặt: nhà thầu, tổ đội, đội, anh, chị, chú, công ty, người, nhân công
  const stopWords = ['anh', 'chi', 'chu', 'doi', 'to doi', 'to', 'nha thau', 'cong ty', 'nguoi', 'nhan cong', 'va', 'cung', 'co', 'gom', 'la', 'voi', 'phu'];
  stopWords.forEach(word => {
    const re = new RegExp(`\\b${word}\\b`, 'g');
    s = s.replace(re, ' ');
  });
  
  // Loại bỏ các ký tự đặc biệt, chỉ giữ lại chữ cái, số và khoảng trắng
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function levenshtein(a, b) {
  const tmp = [];
  for (let i = 0; i <= b.length; i++) tmp[i] = [i];
  for (let j = 0; j <= a.length; j++) tmp[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      tmp[i][j] = b.charAt(i - 1) === a.charAt(j - 1) 
        ? tmp[i - 1][j - 1] 
        : Math.min(tmp[i - 1][j - 1] + 1, Math.min(tmp[i][j - 1] + 1, tmp[i - 1][j] + 1));
    }
  }
  return tmp[b.length][a.length];
}

function isWordSimilar(w1, w2) {
  if (w1 === w2) return true;
  const len = Math.max(w1.length, w2.length);
  if (len < 3) return false;
  const dist = levenshtein(w1, w2);
  if (len <= 4) return dist <= 1;
  return dist <= 2;
}

function isPhraseSimilar(phrase1, phrase2) {
  const words1 = phrase1.split(/\s+/).filter(Boolean);
  const words2 = phrase2.split(/\s+/).filter(Boolean);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  // Trùng khớp hoàn toàn hoặc chuỗi con hoàn toàn
  if (phrase1 === phrase2 || phrase1.includes(phrase2) || phrase2.includes(phrase1)) {
    return true;
  }
  
  // So khớp Levenshtein trên toàn chuỗi
  const fullDist = levenshtein(phrase1, phrase2);
  if (fullDist <= 2) return true;
  
  // So khớp tên riêng gọi tắt (ví dụ: "Nguyễn Văn Tâm" thường được gọi là "Tâm" hoặc "đội Tâm")
  const lastWord2 = words2[words2.length - 1]; // từ cuối cùng của tên chuẩn
  if (lastWord2 && lastWord2.length >= 3) {
    for (const w1 of words1) {
      if (isWordSimilar(w1, lastWord2)) {
        return true;
      }
    }
  }
  
  // So khớp từng từ tương ứng
  let matchCount = 0;
  const used2 = new Array(words2.length).fill(false);
  
  for (let i = 0; i < words1.length; i++) {
    const w1 = words1[i];
    for (let j = 0; j < words2.length; j++) {
      if (used2[j]) continue;
      if (isWordSimilar(w1, words2[j])) {
        matchCount++;
        used2[j] = true;
        break;
      }
    }
  }
  
  const ratio = matchCount / Math.max(words1.length, words2.length);
  if (ratio >= 0.6) return true;
  
  return false;
}

function fuzzyMatchContractor(spoken, kb) {
  const normSpoken = cleanContractorName(spoken);
  if (!normSpoken) return null;
  
  for (const k of kb) {
    // 1. So khớp tên chuẩn
    const normName = cleanContractorName(k.name);
    if (normName && isPhraseSimilar(normSpoken, normName)) {
      return k.name;
    }
    // 2. So khớp bí danh (aliases)
    for (const a of (k.aliases || [])) {
      const normAlias = cleanContractorName(a);
      if (normAlias && isPhraseSimilar(normSpoken, normAlias)) {
        return k.name;
      }
    }
    // 3. So khớp từ khóa voice (voiceKeywords)
    for (const kw of (k.voiceKeywords || [])) {
      const normKw = cleanContractorName(kw);
      if (normKw && isPhraseSimilar(normSpoken, normKw)) {
        return k.name;
      }
    }
  }
  return null;
}

function correctSpeechToText(text) {
  let s = text.toLowerCase();
  const corrections = [
    [/bạn chị hynam\b/g, "ban chỉ huy năm"],
    [/ban chị hynam\b/g, "ban chỉ huy năm"],
    [/bạn chị\b/g, "ban chỉ huy"],
    [/ban chị\b/g, "ban chỉ huy"],
    [/bạn chỉ\b/g, "ban chỉ huy"],
    [/bản chỉ\b/g, "ban chỉ huy"],
    [/bạn chuyền\b/g, "ban chỉ huy"],
    [/ban chuyền\b/g, "ban chỉ huy"],
    [/\bhynam\b/g, "năm"],
    [/\bhy nam\b/g, "năm"],
    [/\bdoi 8\b/g, "đội tâm"],
    [/\bđòi 8\b/g, "đội tâm"],
    [/\bđòi tám\b/g, "đội tâm"],
    [/\bmùi phạm\b/g, "bùi phận"],
    [/\bxong làm\b/g, "sông lam"],
    [/\bcha nghiện\b/g, "giang nguyễn"]
  ];
  corrections.forEach(([regex, repl]) => {
    s = s.replace(regex, repl);
  });
  return s;
}

function getPhraseSimilarityRatio(phrase1, phrase2) {
  const words1 = phrase1.split(/\s+/).filter(Boolean);
  const words2 = phrase2.split(/\s+/).filter(Boolean);
  if (words1.length === 0 || words2.length === 0) return 0;
  if (phrase1 === phrase2 || phrase1.includes(phrase2) || phrase2.includes(phrase1)) {
    return 1.0;
  }
  const fullDist = levenshtein(phrase1, phrase2);
  if (fullDist <= 2) return 0.9;
  const lastWord2 = words2[words2.length - 1];
  if (lastWord2 && lastWord2.length >= 3) {
    for (const w1 of words1) {
      if (isWordSimilar(w1, lastWord2)) {
        return 0.8;
      }
    }
  }
  let matchCount = 0;
  const used2 = new Array(words2.length).fill(false);
  for (let i = 0; i < words1.length; i++) {
    const w1 = words1[i];
    for (let j = 0; j < words2.length; j++) {
      if (used2[j]) continue;
      if (isWordSimilar(w1, words2[j])) {
        matchCount++;
        used2[j] = true;
        break;
      }
    }
  }
  return matchCount / Math.max(words1.length, words2.length);
}

function getMaxSimilarity(spoken, kb) {
  const normSpoken = cleanContractorName(spoken);
  if (!normSpoken) return 0;
  let maxRatio = 0;
  for (const k of kb) {
    const normName = cleanContractorName(k.name);
    if (normName) {
      const ratio = getPhraseSimilarityRatio(normSpoken, normName);
      if (ratio > maxRatio) maxRatio = ratio;
    }
    for (const a of (k.aliases || [])) {
      const normAlias = cleanContractorName(a);
      if (normAlias) {
        const ratio = getPhraseSimilarityRatio(normSpoken, normAlias);
        if (ratio > maxRatio) maxRatio = ratio;
      }
    }
    for (const kw of (k.voiceKeywords || [])) {
      const normKw = cleanContractorName(kw);
      if (normKw) {
        const ratio = getPhraseSimilarityRatio(normSpoken, normKw);
        if (ratio > maxRatio) maxRatio = ratio;
      }
    }
  }
  return maxRatio;
}

function testLocalManpowerMatching(parsedBch, parsedUnits) {
  const kb = window.KB_CONTRACTORS || [];
  let allMatched = true;
  let matchedUnits = [];
  let unrecognizedUnits = [];
  let recognizedList = [];
  
  if (parsedBch != null) {
    recognizedList.push(`BCH=${parsedBch}`);
  }
  
  parsedUnits.forEach(item => {
    let name = '';
    let qty = 0;
    if (item.name !== undefined && item.name !== null) {
      name = String(item.name).trim();
      qty = parseInt(item.n || item.v || item.qty || 0) || 0;
    } else if (item.n !== undefined && item.n !== null) {
      if (typeof item.n === 'number') {
        qty = item.n;
        name = String(item.name || '').trim();
      } else {
        name = String(item.n).trim();
        qty = parseInt(item.v || item.qty || 0) || 0;
      }
    }
    if (!name || qty <= 0) return;
    
    const matchedName = fuzzyMatchContractor(name, kb);
    if (matchedName) {
      matchedUnits.push({ name: matchedName, qty: qty });
      recognizedList.push(`${matchedName}=${qty}`);
    } else {
      allMatched = false;
      unrecognizedUnits.push({ name: name, qty: qty });
    }
  });
  
  return {
    allMatched: allMatched,
    bchCount: parsedBch,
    matchedUnits: matchedUnits,
    unrecognizedUnits: unrecognizedUnits,
    recognizedList: recognizedList
  };
}

function applyManpowerMatchingToForm(bchCount, matchedUnits) {
  if (bchCount != null) {
    el('f_bch').value = bchCount;
  }
  
  matchedUnits.forEach(item => {
    let existing = units.find(u => u.name === item.name);
    if (existing) {
      existing.n = item.qty;
    } else {
      units.push({ name: item.name, area: "", n: item.qty });
    }
  });
  
  renderUnitForm();
  recomputeTotal();
  draw();
}

function processManpowerVoiceResults(parsedBch, parsedUnits, isAI = false) {
  const kb = window.KB_CONTRACTORS || [];
  
  if (parsedBch != null) {
    el('f_bch').value = parsedBch;
  }
  
  let recognizedList = [];
  let unrecognizedList = [];
  
  parsedUnits.forEach(item => {
    let name = '';
    let qty = 0;
    if (item.name !== undefined && item.name !== null) {
      name = String(item.name).trim();
      qty = parseInt(item.n || item.v || item.qty || 0) || 0;
    } else if (item.n !== undefined && item.n !== null) {
      if (typeof item.n === 'number') {
        qty = item.n;
        name = String(item.name || '').trim();
      } else {
        name = String(item.n).trim();
        qty = parseInt(item.v || item.qty || 0) || 0;
      }
    }
    if (!name || qty <= 0) return;
    
    const matchedName = fuzzyMatchContractor(name, kb);
    if (matchedName) {
      let existing = units.find(u => u.name === matchedName);
      if (existing) {
        existing.n = qty;
      } else {
        units.push({ name: matchedName, area: "", n: qty });
      }
      recognizedList.push(`${matchedName}=${qty}`);
    } else {
      unrecognizedList.push({ name: name, qty: qty });
    }
  });
  
  renderUnitForm();
  recomputeTotal();
  draw();
  
  let statusHtml = '';
  if (parsedBch != null || recognizedList.length > 0) {
    let recParts = [];
    if (parsedBch != null) recParts.push(`BCH=${parsedBch}`);
    recognizedList.forEach(item => recParts.push(item));
    statusHtml += `<div style="color:var(--green);font-weight:700;margin-bottom:8px;font-size:12px;">Đã nhận diện (${isAI ? 'AI' : 'Local'}): ${recParts.join(' · ')}</div>`;
  }
  
  if (unrecognizedList.length > 0) {
    statusHtml += `<div style="background:#fff5f5; border:1px solid #fee2e2; border-radius:8px; padding:12px; margin-top:8px; display:flex; flex-direction:column; gap:10px;">`;
    unrecognizedList.forEach((item, idx) => {
      statusHtml += `
        <div id="unrecognized-item-${idx}" style="display:flex; flex-direction:column; gap:6px; border-bottom:1px dashed #fee2e2; padding-bottom:8px;">
          <span style="color:#dc2626; font-size:11.5px; font-weight:600; line-height:1.4;">
            ⚠️ Không tìm thấy [${item.name}] (số lượng: ${item.qty} người) trong danh sách nhà thầu/tổ đội của dự án.
          </span>
          <div style="display:flex; gap:8px; align-items:center;">
            <select id="voice-unrecognized-select-${idx}" style="font-size:12px; padding:4px 8px; border-radius:4px; border:1px solid #cbd5e1; outline:none; flex:1; background:#fff; color:#334155;">
              <option value="">-- Chọn nhà thầu/tổ đội chuẩn --</option>
              ${kb.map(k => `<option value="${k.name.replace(/"/g, '&quot;')}">${k.name}</option>`).join('')}
            </select>
            <button type="button" onclick="resolveUnrecognizedVoice(${idx}, '${item.name.replace(/'/g, "\\'")}', ${item.qty})" style="background:#1e3a8a; color:#fff; border:none; padding:4px 12px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">
              Áp dụng
            </button>
          </div>
        </div>
      `;
    });
    statusHtml += `<div style="color:#64748b; font-size:10.5px;">* Vui lòng kiểm tra lại hoặc thêm mới ở thẻ Nhà thầu.</div></div>`;
  }
  
  el('voiceResult').innerHTML = statusHtml;
}

window.resolveUnrecognizedVoice = function(idx, originalName, qty) {
  const select = el(`voice-unrecognized-select-${idx}`);
  if (!select || !select.value) {
    alert("Vui lòng chọn một nhà thầu/tổ đội phù hợp từ danh sách.");
    return;
  }
  const selectedName = select.value;
  
  let existing = units.find(u => u.name === selectedName);
  if (existing) {
    existing.n = qty;
  } else {
    units.push({ name: selectedName, area: "", n: qty });
  }
  
  renderUnitForm();
  recomputeTotal();
  draw();
  
  const itemDiv = el(`unrecognized-item-${idx}`);
  if (itemDiv) {
    itemDiv.style.opacity = '0.5';
    itemDiv.innerHTML = `<span style="color:#2E6B22; font-size:12px; font-weight:600;">✓ Đã gán [${originalName}] cho [${selectedName}] (${qty} người)</span>`;
  }
};

applyVoice = async function(text) {
  const out = el('voiceResult');
  if(!text || !text.trim()){ out.innerHTML='<span style="color:var(--red)">❌ Chưa có nội dung.</span>'; return; }
  
  // 1. Sửa lỗi STT trước
  const correctedText = correctSpeechToText(text);
  
  // Hiển thị lại text đã sửa lỗi trên input giao diện
  const transcriptEl = el('voiceTranscript');
  if (transcriptEl) {
    transcriptEl.value = correctedText;
  }
  
  out.innerHTML='<span style="color:var(--navy2)">✨ Đang phân tích nội bộ...</span>';
  
  // 2. Chạy Local Parser trước với text đã sửa lỗi
  const localRes = parseUnits(correctedText, runtimeTerms);
  
  // 3. Kiểm tra xem local parser có khớp chắc chắn tất cả các mục hay không
  const checkResult = testLocalManpowerMatching(localRes.bch, localRes.units || []);
  
  // Nếu tất cả các mục bóc tách được từ local đều khớp chắc chắn với nhà thầu của dự án
  if (checkResult.allMatched && (checkResult.bchCount != null || checkResult.matchedUnits.length > 0)) {
    applyManpowerMatchingToForm(checkResult.bchCount, checkResult.matchedUnits);
    out.innerHTML = `<div style="color:var(--green);font-weight:700;margin-bottom:8px;font-size:12px;">✓ Đã nhận diện lập tức (Local): ${checkResult.recognizedList.join(' · ')}</div>`;
    return;
  }
  
  // 4. Xác định xem có nên gọi AI Fallback hay không để tránh làm chậm hệ thống vô ích
  const kb = window.KB_CONTRACTORS || [];
  let shouldCallAI = false;
  
  if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
    const unrecognized = checkResult.unrecognizedUnits || [];
    
    // (a) Nếu local không bóc tách được đơn vị nào nhưng câu nói dài (> 40 ký tự) -> gọi AI để phòng sót
    if (localRes.units.length === 0 && localRes.bch === null && correctedText.length > 40) {
      shouldCallAI = true;
    }
    
    // (b) Nếu có đơn vị không khớp, kiểm tra xem có đơn vị nào có độ tương đồng "nghi ngờ" (từ 0.3 đến 0.6) không
    unrecognized.forEach(item => {
      const maxSim = getMaxSimilarity(item.name, kb);
      if (maxSim >= 0.3 && maxSim < 0.6) {
        shouldCallAI = true;
      }
    });
    
    // (c) Nếu câu voice quá dài/phức tạp (> 120 ký tự) -> gọi AI
    if (correctedText.length > 120) {
      shouldCallAI = true;
    }
  }
  
  let success = false;
  if (shouldCallAI) {
    out.innerHTML='<span style="color:var(--navy2)">✨ Local chưa khớp hoàn toàn, đang nhờ AI phân tích...</span>';
    try {
      let kbText = "";
      if (kb.length > 0) {
        kbText = "\n\nDANH SÁCH ĐƠN VỊ ĐÃ ĐĂNG KÝ CỦA DỰ ÁN:\n" + 
                 kb.map(k => `- "${k.name}" (Bí danh: ${k.aliases.join(', ')})`).join('\n') +
                 "\n*Lưu ý: Bắt buộc chỉ được nhận diện theo danh sách trên. Không tự ý tạo tên mới.*";
      }
      
      const prompt = `Phân tích số liệu nhân lực công trường. Trả về JSON: { bch: number|null, units: [{n: 'tên nhà thầu phụ/tổ đội', v: number}] }.
Lưu ý: BCH (Ban Chỉ Huy) là nhân sự công ty, KHÔNG đưa vào mảng units, chỉ xuất ra số ở trường bch.
Danh sách đơn vị trong units phải khớp với tên trong danh sách đăng ký bên dưới.
Nếu tên đơn vị được nói khác đi hoặc là viết tắt/bí danh, hãy cố gắng khớp với tên chuẩn tương ứng.
Không kèm giải thích hay khối mã markdown nào ngoài JSON.
Text cần phân tích: ` + correctedText + kbText;
      
      const res = await callGeminiAI(correctedText, prompt);
      if (res) {
        processManpowerVoiceResults(res.bch, res.units || [], true);
        success = true;
      }
    } catch(e) {
      console.warn("AI manpower parse failed, falling back to local:", e.message);
    }
  }
  
  // 5. Nếu AI lỗi, không bật AI hoặc không thỏa mãn điều kiện gọi AI, sử dụng kết quả local parser và hiển thị cảnh báo/dropdown gán thủ công
  if (!success) {
    processManpowerVoiceResults(localRes.bch, localRes.units || [], false);
  }
};

