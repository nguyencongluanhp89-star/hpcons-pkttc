/* === js/utils.js (helper + form nhan luc/thiet bi + xu ly so) === Tu dong tach tu app goc. Cac file nap theo thu tu: data -> utils -> features -> render === */
function el(id){return document.getElementById(id)}
function renderEquipForm(){
  let h="";
  equips.forEach((e,i)=>{h+=`<div class="item-card"><div class="row">
    <div style="flex:0 0 70px"><label>SL</label><input type="text" value="${e.q}" oninput="equips[${i}].q=this.value;draw()"></div>
    <div><label>Tên thiết bị</label><input type="text" value="${e.t.replace(/"/g,'&quot;')}" oninput="equips[${i}].t=this.value;draw()"></div></div>
    <button class="delbtn" type="button" onclick="equips.splice(${i},1);renderEquipForm();draw()">Xóa</button></div>`});
  el('equip-list').innerHTML=h;
}
function addEquip(){equips.push({q:"01",t:"Thiết bị mới"});renderEquipForm();draw()}

/* Popup 02 — DANH SÁCH NHÀ THẦU THI CÔNG TRONG NGÀY   (Sếp chốt 20/08/2026)
   · Danh sách lấy từ danh mục Nhà thầu của DỰ ÁN (ALL_PROJECT_CONTRACTORS) — không phải gõ lại
     tên mỗi ngày, không tạo danh mục độc lập mới.
   · Mỗi dòng: tên nhà thầu + số nhân lực trong ngày + nút bỏ khỏi báo cáo ngày.
     Bỏ ở đây CHỈ bỏ khỏi báo cáo ngày, KHÔNG xóa khỏi danh mục dự án.
   · Danh sách dài thì thu gọn lại, bấm mới mở rộng, để popup không bị kéo quá dài trên điện thoại.
   · Tổng nhân lực do hệ thống cộng, không nhập tay.                                          */
/* Sếp báo 20/08: "đã bấm nhưng không thu các nhà thầu gọn lại". Gốc: "thu gọn" trước đây nghĩa là
   bớt từ 6 dòng xuống còn 5 dòng — mà khung danh sách nay chỉ cao ~3 dòng và tự cuộn, nên bớt 1
   dòng KHÔNG thấy khác gì, chỉ thấy nhãn nút đổi. Nay "thu gọn" = ẩn hẳn khung dòng, chỉ còn một
   dòng tóm tắt (bao nhiêu đơn vị · bao nhiêu người); bấm lại thì mở ra khung cuộn đầy đủ.
   Mặc định để MỞ vì khung đã có trần chiều cao, không còn chiếm chỗ như trước. */
var _unitMoRong = true;
function toggleUnitMoRong(){ _unitMoRong = !_unitMoRong; renderUnitForm(); }
window.toggleUnitMoRong = toggleUnitMoRong;

function renderUnitForm(){
  const el2 = el('unit-list');
  if (!el2) return;
  const listContractors = window.ALL_PROJECT_CONTRACTORS || [];
  const NGUONG_THU_GON = 5;                 // quá số này thì thu gọn cho gọn màn hình
  const nhieu = units.length > NGUONG_THU_GON;
  const hienHet = _unitMoRong || !nhieu;
  const danhSach = hienHet ? units : [];    // thu gọn = ẩn hẳn khung dòng, không phải bớt vài dòng
  /* Sếp yêu cầu 20/08: nút cuộn (thu gọn / mở rộng) bố trí Ở TRÊN cho thuận tiện khai báo —
     trước đây nút nằm dưới cùng nên danh sách dài phải cuộn xuống hết mới bấm được. */
  let h = "";
  if (nhieu) {
    const tongTruoc = units.reduce((a, u) => a + (parseInt(u.n) || 0), 0);
    h += `<button class="addbtn" type="button" onclick="toggleUnitMoRong()" style="width:100%;text-align:left;margin-bottom:6px">
      ${hienHet ? '▲ Thu gọn danh sách' : `▼ Nhà thầu thi công hôm nay: ${units.length} đơn vị · ${tongTruoc} người`}
    </button>`;
  }

  /* Sếp chốt 20/08: các dòng nhà thầu nằm trong KHUNG CUỘN RIÊNG. Trước đây popup 02 cuộn toàn
     bộ, khai nhiều nhà thầu là ô "Tổng nhân lực" và nút "+ Thêm nhà thầu" bị đẩy xuống xa, phải
     cuộn lên xuống liên tục mới khai xong. Nay chỉ khung này cuộn, mọi thứ quanh nó đứng yên. */
  if (danhSach.length) h += '<div class="unit-rows">';

  danhSach.forEach((u, i) => {
    let opt = `<option value="">-- Chọn nhà thầu --</option>`;
    listContractors.forEach(c => {
      opt += `<option value="${c}" ${u.name === c ? 'selected' : ''}>${c}</option>`;
    });
    // Nhà thầu có trong báo cáo nhưng không còn trong danh mục dự án -> vẫn giữ để không mất dữ liệu
    if (u.name && !listContractors.includes(u.name)) {
      opt += `<option value="${u.name}" selected>${u.name} (ngoài danh mục)</option>`;
    }
    h += `<div class="item-card" style="padding:8px 10px">
      <div class="row" style="align-items:flex-end">
        <div style="flex:2">
          <label style="margin:0 0 3px">Nhà thầu</label>
          <select onchange="units[${i}].name=this.value; if (typeof draw === 'function') draw();"
            style="width:100%;height:38px;font-size:14px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;padding:0 8px;box-sizing:border-box">
            ${opt}
          </select>
        </div>
        <div style="flex:0 0 86px">
          <label style="margin:0 0 3px">Nhân lực</label>
          <input type="number" min="0" step="1" value="${u.n}" inputmode="numeric"
            oninput="units[${i}].n=Math.max(0,parseInt(this.value)||0);recomputeTotal()">
        </div>
        <div style="flex:0 0 auto">
          <button class="delbtn" type="button" title="Bỏ nhà thầu này khỏi báo cáo hôm nay (không xóa khỏi danh mục dự án)"
            onclick="units.splice(${i},1);renderUnitForm();recomputeTotal()">Bỏ</button>
        </div>
      </div></div>`;
  });

  if (danhSach.length) h += '</div>';

  el2.innerHTML = h;
  if (typeof updateProgress === 'function') updateProgress();
}

function addUnit(){
  units.push({name:"",area:"",n:0});
  /* Danh sách đang thu gọn (chỉ hiện 5 dòng đầu) thì dòng vừa thêm KHÔNG được dựng ra -> bấm
     "+ Thêm nhà thầu" mà không thấy gì. Nay tự mở rộng và cuộn khung xuống cuối cho thấy ngay
     dòng mới. */
  _unitMoRong = true;
  renderUnitForm();
  recomputeTotal();
  var khung = document.querySelector('#unit-list .unit-rows');
  // đợi trình duyệt dựng xong các ô chọn rồi mới cuộn, không thì cuộn thiếu vài chục pixel
  if (khung) setTimeout(function () { khung.scrollTop = khung.scrollHeight; }, 0);
}

/* ====================== GIỌNG NÓI + BÓC TÁCH (mục 02) ====================== */
const UNIT={'không':0,'một':1,'mốt':1,'hai':2,'ba':3,'bốn':4,'tư':4,'năm':5,'lăm':5,'nhăm':5,'sáu':6,'bảy':7,'bẩy':7,'tám':8,'chín':9};
const NUMW=new Set(Object.keys(UNIT).concat(['mười','mươi','trăm','linh','lẻ']));
const LABELS={total:'Tổng số',eng:'Kỹ sư',tech:'CN kỹ thuật',labor:'LĐ phổ thông'};
function digitWord(w){ if(w==null)return null; if(/^\d+$/.test(w))return +w; return (w in UNIT)?UNIT[w]:null; }
function vnToNum(s){
  s=(''+s).toLowerCase().trim();
  if(/^\d+$/.test(s)) return parseInt(s,10);
  let toks=s.split(/\s+/).filter(Boolean).filter(t=>NUMW.has(t));
  if(!toks.length) return null;
  let h=0; const ti=toks.indexOf('trăm'); let post;
  if(ti>=0){ h=(ti>0?(digitWord(toks[ti-1])??1):1); post=toks.slice(ti+1); } else post=toks;
  post=post.filter(x=>x!=='linh'&&x!=='lẻ');
  let t=0,o=0;
  if(post.includes('mười')){ const j=post.indexOf('mười'); t=1; o=digitWord(post[j+1])||0; }
  else if(post.includes('mươi')){ const j=post.indexOf('mươi'); t=(j>0?(digitWord(post[j-1])??0):0); o=digitWord(post[j+1])||0; }
  else { o=(post.length?(digitWord(post[post.length-1])||0):0); }
  return h*100+t*10+o;
}
function leadingQtyBefore(before){
  const re=/(\d+|((?:không|một|mốt|hai|ba|bốn|tư|năm|lăm|nhăm|sáu|bảy|bẩy|tám|chín|mười|mươi|trăm|linh|lẻ)\s*)+)\s*$/;
  const m=before.match(re); if(!m) return null;
  const n=vnToNum(m[1].trim()); return (n==null)?null:n;
}
/* Thư viện thuật ngữ thiết bị (học từ dữ liệu thi công) */
const EQUIP_TERMS=[
 {name:'Cẩu bánh xích', aliases:['cẩu bánh xích','cẩu xích']},
 {name:'Cẩu bánh lốp', aliases:['cẩu bánh lốp','cẩu lốp']},
 {name:'Cẩu tháp', aliases:['cẩu tháp']},
 {name:'Xe cẩu / cần cẩu', aliases:['xe cẩu','cần cẩu','cẩu']},
 {name:'Máy trộn bê tông', aliases:['máy trộn bê tông','trộn bê tông','máy trộn']},
 {name:'Xe bơm bê tông', aliases:['xe bơm bê tông','bơm bê tông','xe bơm']},
 {name:'Xe bồn / xe trộn bê tông', aliases:['xe bồn bê tông','bồn bê tông','xe bồn','xe trộn']},
 {name:'Máy đào', aliases:['máy đào','máy xúc đào','xe đào']},
 {name:'Máy xúc', aliases:['máy xúc','xe xúc']},
 {name:'Máy ủi', aliases:['máy ủi','xe ủi']},
 {name:'Xe lu', aliases:['xe lu','máy lu','lu rung']},
 {name:'Máy ép cọc', aliases:['máy ép cọc','máy ép','ép cọc']},
 {name:'Búa rung', aliases:['búa rung']},
 {name:'Máy khoan cọc nhồi', aliases:['máy khoan cọc nhồi','khoan cọc nhồi','máy khoan cọc']},
 {name:'Máy đầm dùi', aliases:['máy đầm dùi','đầm dùi']},
 {name:'Máy đầm bàn', aliases:['máy đầm bàn','đầm bàn']},
 {name:'Đầm cóc', aliases:['đầm cóc','máy đầm cóc']},
 {name:'Máy phát điện', aliases:['máy phát điện','máy phát','phát điện']},
 {name:'Máy bơm nước', aliases:['máy bơm nước','bơm nước']},
 {name:'Máy hàn', aliases:['máy hàn']},
 {name:'Máy cắt uốn thép', aliases:['máy cắt uốn thép','cắt uốn thép','máy uốn thép','máy uốn']},
 {name:'Máy cắt', aliases:['máy cắt']},
 {name:'Máy khoan', aliases:['máy khoan']},
 {name:'Xe ben', aliases:['xe ben','xe tải ben']},
 {name:'Xe tải', aliases:['xe tải','xe vận chuyển']},
 {name:'Máy toàn đạc', aliases:['máy toàn đạc','toàn đạc']},
 {name:'Máy thủy bình', aliases:['máy thủy bình','thủy bình']},
 {name:'Giàn giáo', aliases:['giàn giáo','dàn giáo']},
 {name:'Máy nén khí', aliases:['máy nén khí','nén khí']},
];
let runtimeTerms=EQUIP_TERMS.slice();
function parseEquip(text, terms){
  let t=' '+text.toLowerCase()+' ';
  const pairs=[]; terms.forEach(e=>e.aliases.forEach(a=>pairs.push({a:a.toLowerCase(),name:e.name})));
  pairs.sort((x,y)=>y.a.length-x.a.length);
  const found=[]; const seen={};
  pairs.forEach(p=>{ let idx;
    while((idx=t.indexOf(p.a))>=0){
      let qty=leadingQtyBefore(t.slice(0,idx)); if(qty==null) qty=1;
      if(seen[p.name]==null){ seen[p.name]=1; found.push({name:p.name,qty}); }
      t=t.slice(0,idx)+' '.repeat(p.a.length)+t.slice(idx+p.a.length);
    }});
  return found;
}
function parseCrew(text){
  let s=' '+text.toLowerCase().replace(/[.,;]/g,' ').replace(/\s+/g,' ')+' ';
  const KW=[['tổng số công nhân','total'],['tổng công nhân','total'],['tổng nhân lực','total'],['tổng số người','total'],['tổng cộng','total'],['tổng số','total'],['tổng','total'],
    ['công nhân kỹ thuật','tech'],['kỹ thuật','tech'],['thợ','tech'],
    ['lao động phổ thông','labor'],['phổ thông','labor'],['lao động','labor'],
    ['kỹ sư','eng'],['kĩ sư','eng'],['ki sư','eng']];
  KW.forEach(([p,f])=>{ s=s.split(' '+p+' ').join(' ⟦'+f+'⟧ '); });
  const toks=s.split(' ').filter(Boolean);
  const isNum=w=>/^\d+$/.test(w)||NUMW.has(w);
  const events=[]; let buf=[];
  const flush=()=>{ if(buf.length){const v=vnToNum(buf.join(' ')); if(v!=null)events.push({t:'num',v}); buf=[];} };
  toks.forEach(w=>{ if(w[0]==='⟦'){ flush(); events.push({t:'kw',f:w.replace(/[⟦⟧]/g,'')}); }
    else if(isNum(w)) buf.push(w); else flush(); });
  flush();
  const res={}; const recognized=[];
  for(let i=0;i<events.length;i++){
    if(events[i].t!=='kw') continue; const f=events[i].f; if(res[f]!=null) continue;
    if(i>0 && events[i-1].t==='num' && !events[i-1].used){ res[f]=events[i-1].v; events[i-1].used=true; }
    else { for(let j=i+1;j<events.length;j++){ if(events[j].t==='kw') break; if(events[j].t==='num'&&!events[j].used){ res[f]=events[j].v; events[j].used=true; break; } } }
    if(res[f]!=null) recognized.push(LABELS[f]+'='+res[f]);
  }
  return {res,recognized};
}
function fmtQty(n){ return n<100?('0'+n).slice(-2):String(n); }
/* Tổng số nhân sự = BCH + tất cả tổ đội / nhà thầu phụ (tự cộng) */
function recomputeTotal(){
  const bch=parseInt(el('f_bch').value)||0;
  const su=units.reduce((a,u)=>a+(parseInt(u.n)||0),0);
  el('f_total').value=bch+su;
  draw();
}
function capFirst(s){ s=(s||'').trim(); return s? s.charAt(0).toUpperCase()+s.slice(1):s; }
/* Bóc tách bố trí nhân sự theo đơn vị từ giọng nói.
   Vd: "BCH 5 người, tổ đội a tèo 5, nhà thầu b 7, bảo vệ 1, công nhật 9"
   -> BCH=5; còn lại là các tổ đội/NTP. Không bịa: bỏ đoạn không có số hoặc không có nhãn. */
function parseUnits(text, terms){
  let t=' '+text.toLowerCase().replace(/[()]/g,' ').replace(/\s+/g,' ')+' ';
  t=t.replace(/[,:\-–]\s*(?=\d|\b(không|một|mốt|hai|ba|bốn|tư|năm|lăm|nhăm|sáu|bảy|bẩy|tám|chín|mười|mươi)\b)/gi, ' ');
  t=t.replace(/\b(người|nhân sự|nhân công|công nhân)\b/g,'|');
  const segs=t.split(/[|,;.\n]|(?:\bvà\b)|(?:\bcùng\b)/).map(s=>s.trim()).filter(Boolean);
  const eqset=new Set(); terms.forEach(e=>e.aliases.forEach(a=>eqset.add(normTxt(a))));
  let bch=null; const us=[]; const recognized=[];
  const numre=/(\d+|(?:(?:không|một|mốt|hai|ba|bốn|tư|năm|lăm|nhăm|sáu|bảy|bẩy|tám|chín|mười|mươi|trăm|linh|lẻ)\s*)+)/g;
  segs.forEach(seg=>{
    let m,last=null; numre.lastIndex=0;
    while((m=numre.exec(seg))!==null){ if(m[0].trim()) last=m; }
    if(!last) return;
    const count=vnToNum(last[0].trim()); if(count==null) return;
    let name=seg.slice(0,last.index).trim().replace(/[:\-–]+$/,'').trim();
    name=name.replace(/\b(có|gồm|là|với|cho|bố trí|bố|trí|được|khoảng|tầm|đội ngũ|nhóm)\b/g,'').replace(/^(và|cùng)\s+/,'').replace(/\s+/g,' ').trim();
    if(!name) return;                 // số không có nhãn -> bỏ (gồm cả thiết bị nói "một máy đào")
    const nn=normTxt(name);
    if(eqset.has(nn)) return;          // trùng thiết bị -> bỏ
    if(nn==='bch'||nn.includes('banchihuy')||nn.includes('chihuy')||nn.includes('kysu')||nn.includes('banchuyen')){
      bch=(bch||0)+count; recognized.push('BCH='+count);
    } else {
      us.push({name:capFirst(name), n:count}); recognized.push(capFirst(name)+'='+count);
    }
  });
  return {bch, units:us, recognized};
}
/* áp dụng kết quả giọng nói -> chỉ điền cái nghe được, không bịa */

