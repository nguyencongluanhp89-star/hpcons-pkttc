/* === js/render.js (dung bao cao + tab + khoi tao) === Tu dong tach tu app goc. Cac file nap theo thu tu: data -> utils -> features -> render === */
function fmtDate(v){
  if(!v)return{d:"",w:""};
  const dt=new Date(v+'T00:00:00');
  const dd=String(dt.getDate()).padStart(2,'0');
  const mm=String(dt.getMonth()+1).padStart(2,'0');
  const yy=dt.getFullYear();
  const wd=["CHỦ NHẬT","THỨ HAI","THỨ BA","THỨ TƯ","THỨ NĂM","THỨ SÁU","THỨ BẢY"][dt.getDay()];
  const wdcn=["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][dt.getDay()];
  return{d:`${dd}/${mm}/${yy}`,w:wd+" / "+wdcn};
}
function imgOrPh(src,cls,phtxt,id){return src?`<img class="${cls}" src="${src}" style="cursor:pointer;transition:0.2s" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1" onclick="if('${id}')el('${id}').click()" title="Nhấn để đổi ảnh">`:`<div class="${cls} ph" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'" onclick="if('${id}')el('${id}').click()" title="Nhấn để tải ảnh lên">${phtxt||'Ảnh'}</div>`}

/* ---------- draw có debounce (tránh lag khi gõ liên tục) ---------- */
let _drawTimer = null;
function drawDebounced(){
  if (_drawTimer) clearTimeout(_drawTimer);
  _drawTimer = setTimeout(() => { if (typeof draw === 'function') draw(); }, 220);
}
window.drawDebounced = drawDebounced;

/* Bỏ tiền tố đánh số có sẵn ở đầu tên hạng mục (số Ả Rập, La Mã hoa, hoặc số chữ Trung)
   để render đánh số lại cho thống nhất. VD: "II. NHÀ XƯỞNG 4" -> "NHÀ XƯỞNG 4", "二.工厂4" -> "工厂4" */
function stripIdx(name){
  return (name||'').replace(/^\s*([IVXLCDM]+|\d+|[一二三四五六七八九十]+)\s*[.。、)\-:：]\s*/, '').trim();
}
window.stripIdx = stripIdx;

/* Tự động co giãn (scale) thẻ báo cáo vừa với chiều ngang màn hình di động */
function adjustReportScale() {
  const report = document.getElementById('report');
  const wrap = document.querySelector('.preview-wrap');
  if (!report || !wrap) return;
  
  let clientWidth = document.documentElement.clientWidth;
  
  // Vượt qua lỗi phình iframe bằng cách tham chiếu chiều rộng của window cha (trang chính index.html)
  try {
    if (window.parent && window.parent.innerWidth) {
      if (window.parent.innerWidth < clientWidth) {
        clientWidth = window.parent.innerWidth;
      }
    }
  } catch (e) {
    console.warn("Không thể truy cập window.parent:", e);
  }

  if (clientWidth <= 860) {
    // Trừ đi 16px (padding 8px mỗi bên của preview-wrap trên mobile) để không sát mép quá
    const scale = (clientWidth - 16) / 1000;
    if (scale > 0) {
      report.style.transform = `scale(${scale})`;
      report.style.transformOrigin = 'top left';
      
      const scaledHeight = report.offsetHeight * scale;
      report.style.marginBottom = `-${report.offsetHeight - scaledHeight}px`;
    }
  } else {
    report.style.transform = '';
    report.style.transformOrigin = '';
    report.style.marginBottom = '';
  }
}
window.adjustReportScale = adjustReportScale;
window.addEventListener('resize', adjustReportScale);

/* ---------- main render ---------- */
function draw(){
  const dt=fmtDate(el('f_date').value);
  const prog=el('f_prog').value||0;
  const logoHtml=logoImg?`<img src="${logoImg}" style="max-height:80px;cursor:pointer" onclick="el('f_logo').click()" title="Nhấn để đổi logo nhà thầu">`:`<div style="cursor:pointer" onclick="el('f_logo').click()" title="Nhấn để tải logo nhà thầu"><div class="lg">HP<span class="c2">CONS</span></div><div class="slogan">BEYOND - Expectation</div><div class="slogan-cn">超越期望</div></div>`;
  const logoCdtHtml=logoImgCdt?`<img src="${logoImgCdt}" style="max-height:80px;cursor:pointer" onclick="el('f_logo_cdt').click()" title="Nhấn để đổi logo chủ đầu tư">`:'<div style="cursor:pointer;border:1.5px dashed #cbd5e1;border-radius:8px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;min-width:140px;background:#f8fafc" onclick="el(\'f_logo_cdt\').click()" title="Nhấn để tải logo chủ đầu tư"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:6px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><div style="font-size:11px;font-weight:700">LOGO CHỦ ĐẦU TƯ</div><div style="font-size:10px;font-weight:400">(Nhấn để tải lên)</div></div>';

  const weatherIcons = {
    'sunny': {i:'☀️', l:'Nắng đẹp', c:'wt-sunny'},
    'cloudy': {i:'⛅', l:'Nhiều mây', c:'wt-cloudy'},
    'rainy': {i:'🌧️', l:'Có mưa', c:'wt-rainy'},
    'stormy': {i:'⛈️', l:'Giông bão', c:'wt-stormy'}
  };
  const wm = el('f_weather_m').value;
  const wa = el('f_weather_a').value;
  const wnote = el('f_weather_note').value.trim();
  
  let wIconBox = '';
  let wTextBox = '';
  if (wm === wa) {
    wIconBox = `<div style="font-size:60px; line-height:1; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))">${weatherIcons[wm].i}</div>`;
    wTextBox = `<div class="kv" style="justify-content:center; font-weight:700; text-transform:uppercase; letter-spacing:0.5px" class="${weatherIcons[wm].c}">
      <span class="${weatherIcons[wm].c}">CẢ NGÀY: ${weatherIcons[wm].l}</span>
    </div>`;
  } else {
    wIconBox = `
      <div style="font-size:52px; line-height:1; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))">${weatherIcons[wm].i}</div>
      <div style="font-size:52px; line-height:1; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))">${weatherIcons[wa].i}</div>
    `;
    wTextBox = `<div class="kv" style="justify-content:space-around; font-weight:700; text-transform:uppercase; letter-spacing:0.5px">
      <span class="${weatherIcons[wm].c}">SÁNG: ${weatherIcons[wm].l}</span>
      <span class="${weatherIcons[wa].c}">CHIỀU: ${weatherIcons[wa].l}</span>
    </div>`;
  }
  
  let rh = parseFloat(el('f_rain_hours') ? el('f_rain_hours').value : 0) || 0;
  if (rh > 0) {
    wTextBox += `<div style="text-align:center;font-weight:700;color:var(--red);font-size:var(--fs-body);margin-top:6px;background:#fdeaea;padding:4px 8px;border-radius:4px;display:inline-block">Mưa ảnh hưởng thi công: ${rh} giờ</div><div style="text-align:center"></div>`;
  }
  
  let wNoteCls = 'good';
  if (wm.includes('storm') || wa.includes('storm')) wNoteCls = 'alert';
  else if (wm.includes('rain') || wa.includes('rain')) wNoteCls = '';
  
  const weatherNoteBox = wnote 
    ? `<div class="kv" style="border-bottom:0; justify-content:center"><div class="w-note ${wNoteCls}">${wnote}</div></div>`
    : `<div class="kv" style="border-bottom:0; justify-content:center"><div class="w-note" style="opacity:0">&nbsp;</div></div>`;
  let workHtml=works.map((w,i)=>{
    const cleanT = stripIdx(w.t);
    const cn = stripIdx((typeof workCN==='function') ? workCN(cleanT) : '');
    const wt = `<span class="wt-num">${i+1}.</span> ${cleanT}` + (cn ? ` <span style="font-weight:400;color:var(--grey)">/ ${cn}</span>` : '');
    return `<div class="work-item" style="--card-color:${w.c}">
    <div><div class="wt">${wt}</div>${w.d?`<div class="wd">${biDetail(w.d)}</div>`:''}</div></div>`;
  }).join('');
  
  let numPhotos = (photos.length > 6) ? 9 : 6;
  let displayPhotos = photos.slice(0, numPhotos);
  while(displayPhotos.length < numPhotos) displayPhotos.push({tm:'',vi:'',cn:'',img:null});


  let photoHtml=displayPhotos.map((p,i)=>{
    const gộpVal = (p.vi || '') + (p.cn ? `\n${p.cn}` : '');
    const deleteBtn = p.img ? `<button type="button" onclick="window.deletePhotoDirect(event, ${i})" class="no-print delete-photo-btn" title="Xóa ảnh này" style="position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; border-radius: 50%; border: none; background: rgba(239, 68, 68, 0.9); color: white; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: background 0.2s; z-index: 10;">×</button>` : '';
    
    return `<div class="photo">
      <div class="im-wrap" onclick="window.triggerDirectPhotoUpload(${i})" style="cursor:pointer; position:relative;" title="Click để tải ảnh lên">
        ${p.img?`<img class="im" src="${p.img}">`:`<div class="im ph" style="border:1px dashed var(--line); border-radius:4px; height:120px; display:flex; align-items:center; justify-content:center; background:#f8fafc; font-size:var(--fs-micro);">Chọn ảnh ${i+1}</div>`}
        ${deleteBtn}
      </div>
      <input type="file" id="f_photo_direct_${i}" accept="image/*" style="display:none" onchange="window.onDirectPhotoUpload(this, ${i})">
      
      <div class="no-print" style="margin-top:6px; text-align:left;">
        <textarea class="photo-cap-textarea" oninput="window.updatePhotoDirect(${i}, this.value); window.autoGrowTextarea(this);" onblur="window.translatePhotoDirect(${i}, this.value)" placeholder="Nhập chú thích..." style="height: auto; min-height: 38px;">${gộpVal}</textarea>
      </div>
      
      <div class="cap print-only">${p.vi||''}${p.cn?`<br><span>${p.cn}</span>`:''}</div>
    </div>`;
  }).join('');
  let drawHtml=draws.map((d,i)=>{
    let t_vi = d.t || '';
    let t_cn_val = '';
    if (t_vi.includes('|')) {
      const parts = t_vi.split('|');
      t_vi = parts[0].trim();
      t_cn_val = parts[1].trim();
    }
    const t_cn = t_cn_val || ((typeof workCN==='function') ? workCN(t_vi) : '');
    const gộpTitle = t_vi + (t_cn ? `\n${t_cn}` : '');

    const deleteBtn = d.img ? `<button type="button" onclick="window.deleteDrawPhotoDirect(event, ${i})" class="no-print delete-photo-btn" title="Xóa bản vẽ" style="position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; border-radius: 50%; border: none; background: rgba(239, 68, 68, 0.9); color: white; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: background 0.2s; z-index: 10;">×</button>` : '';

    return `<div class="draw-card" style="position:relative;">
      <div class="im-wrap" onclick="window.triggerDirectDrawUpload(${i})" style="cursor:pointer; position:relative;" title="Click để tải bản vẽ lên">
        ${d.img?`<img class="im" src="${d.img}">`:`<div class="im ph grid-pattern" style="border:1px dashed var(--line); border-radius:4px; height:120px; display:flex; align-items:center; justify-content:center; background:#f8fafc; font-size:var(--fs-micro); color:var(--text-muted)">Chọn bản vẽ ${i+1}</div>`}
        ${deleteBtn}
      </div>
      <input type="file" id="f_draw_direct_${i}" accept="image/*" style="display:none" onchange="window.onDirectDrawUpload(this, ${i})">
      
      <div class="no-print" style="margin-top:6px; text-align:left;">
        <textarea class="photo-cap-textarea" oninput="window.updateDrawTitleDirect(${i}, this.value); window.autoGrowTextarea(this);" onblur="window.translateDrawTitleDirect(${i}, this.value)" placeholder="Nhập chú thích bản vẽ..." style="height: auto; min-height: 32px;">${gộpTitle}</textarea>
      </div>
      
      <div class="cap print-only" style="padding: 6px 4px; text-align: center; line-height: 1.35;">
        <div class="dt">${t_vi}</div>
        ${t_cn ? `<div class="dc" style="margin-top: 2px;">${t_cn}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  let planHtml=el('f_plan').value.split('\n').filter(x=>x.trim()).map(line=>{
    let viPart = line;
    let cnPart = '';
    if (line.includes('|')) {
      const parts = line.split('|');
      viPart = parts[0].trim();
      cnPart = parts[1].trim();
    }
    const o = (typeof biLineSplit==='function') ? biLineSplit(viPart) : {n:viPart, q:''};
    const c = cnPart || ((typeof workCN==='function') ? workCN(o.n) : '');
    const nm = o.n + (c && !o.n.includes(c) ? (`<br><span style="color:#64748b;font-weight:400;font-size:var(--fs-caption);margin-top:3px;display:inline-block">${c}</span>`) : '');
    return `<div class="plan-card">${nm+(o.q?(': '+o.q):'')}</div>`;
  }).join('');
  if (planHtml) planHtml = `<div class="plan-grid">${planHtml}</div>`;
  
  const transLines = (id) => {
    const textarea = el(id);
    if (!textarea) return '';
    return textarea.value.split('\n').filter(x=>x.trim()).map(line => {
      let viPart = line;
      let cnPart = '';
      if (line.includes('|')) {
        const parts = line.split('|');
        viPart = parts[0].trim();
        cnPart = parts[1].trim();
      }
      const o = (typeof biLineSplit==='function') ? biLineSplit(viPart) : {n:viPart, q:''};
      const c = cnPart || ((typeof workCN==='function') ? workCN(o.n) : '');
      const nm = o.n + (c && !o.n.includes(c) ? `<br><span style="color:#64748b;font-weight:400;font-size:var(--fs-caption);margin-top:2px;display:inline-block">${c}</span>` : '');
      return nm+(o.q?(': '+o.q):'');
    }).join('<div style="margin-bottom:6px"></div>');
  };


  const svgNote = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--navy)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
  const svgWarn = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#d97706"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  const svgSafe = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green);margin-bottom:8px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
  const svgQual = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#2563eb;margin-bottom:8px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  const svgTime = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ea580c;margin-bottom:8px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

  const report = window.CURRENT_REPORT || {};
  const createdBy = report.created_name || report.created_by || window.CURRENT_USER_NAME || "Kỹ sư";
  const commanderName = window.CURRENT_COMMANDER || "";
  const approval = report.approval || report.status || (window._reportStatus || "draft");
  
  let approveStamp = "";
  if (approval === "approved") {
    const appBy = report.approved_by || commanderName || "Chỉ huy trưởng";
    let appAt = "";
    try {
      const parsedDate = report.approved_at ? new Date(report.approved_at) : null;
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        appAt = parsedDate.toLocaleDateString("vi-VN");
      } else {
        appAt = new Date().toLocaleDateString("vi-VN");
      }
    } catch (err) {
      appAt = new Date().toLocaleDateString("vi-VN");
    }
    approveStamp = `
      <div class="approve-stamp" style="border: 2.5px dashed #16a34a; color: #16a34a; font-weight: 800; font-size: 11px; padding: 5px 8px; border-radius: 6px; display: inline-block; margin-bottom: 0px; transform: rotate(-5deg); background: rgba(22, 163, 74, 0.03); font-family: var(--font-sans); text-align: center;">
        ✅ ĐÃ DUYỆT<br>
        <span style="font-size:10px; font-weight:700;">${esc(appBy)}</span><br>
        <span style="font-size:9px; font-weight:normal; opacity:0.8;">Ngày: ${appAt}</span>
      </div>
    `;
  } else if (approval === "pending") {
    approveStamp = `
      <div style="border: 1.5px dashed #ea580c; color: #ea580c; font-weight: bold; font-size: 12px; padding: 4px 8px; border-radius: 4px; display: inline-block; background: rgba(234, 88, 12, 0.03); text-align: center;">
        ⏳ Chờ duyệt
      </div>
    `;
  } else if (approval === "rejected") {
    const reason = report.reject_reason || "";
    approveStamp = `
      <div style="border: 1.5px dashed #dc2626; color: #dc2626; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px; display: inline-block; background: rgba(220, 38, 38, 0.03); text-align: center; max-width: 140px; word-break: break-word;">
        ↩ Trả lại${reason ? `<br><span style="font-size: 9px; font-weight: normal; font-style: italic;">Lý do: ${esc(reason)}</span>` : ''}
      </div>
    `;
  }

  el('report').innerHTML=`
  ${logoHtml ? '' : ''}
  <div class="r-head">
    <div class="r-logo">${logoHtml}</div>
      <div class="r-title">
        <div class="t1">BÁO CÁO THI CÔNG NGÀY</div>
        <div class="t2" style="margin-bottom:8px">每日施工报告</div>
        <div style="position:relative;display:inline-block;cursor:pointer;font-size:14px;font-weight:700;color:var(--navy);letter-spacing:0.5px;padding:4px 12px;margin-left:-12px;border-radius:6px;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" title="Nhấn để đổi ngày">
          <input type="date" class="date-overlay" value="${el('f_date').value}" onchange="el('f_date').value=this.value;draw()">
          NGÀY <span style="font-weight:400">/ 日期:</span> <span style="color:var(--green);font-size:16px;font-weight:800;margin-left:4px">${dt.d}</span>
        </div>
      </div>
    <div class="r-logo-cdt">${logoCdtHtml}</div>
  </div>

  <div class="sec-h" onclick="openModal('grp-01')"><span class="num">01</span> TỔNG QUAN DỰ ÁN <span class="cn">/ 项目概况</span></div>
  <div class="pad two">
    <div class="ov-imgs">
      ${imgOrPh(ovMain,'ov-main','Ảnh tổng quan dự án', 'f_ovmain')}
      <div class="ov-sub">${imgOrPh(ovSub1,'','Ảnh phụ', 'f_ovsub1')}${imgOrPh(ovSub2,'','Ảnh phụ', 'f_ovsub2')}</div>
    </div>
    <div class="ov-info">
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('CÔNG TRÌNH / 工程:', el('f_proj').value); if(v!==null){el('f_proj').value=v;draw()}" title="Nhấn để sửa"><span class="ic">🏗️</span><span class="k">CÔNG TRÌNH / 工程</span><span class="v">${el('f_proj').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('ĐỊA ĐIỂM / 地点:', el('f_loc').value); if(v!==null){el('f_loc').value=v;draw()}" title="Nhấn để sửa"><span class="ic">📍</span><span class="k">ĐỊA ĐIỂM / 地点</span><span class="v">${el('f_loc').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('QUY MÔ / 规模:', el('f_scale').value); if(v!==null){el('f_scale').value=v;draw()}" title="Nhấn để sửa"><span class="ic">🏢</span><span class="k">QUY MÔ / 规模</span><span class="v">${el('f_scale').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('BẮT ĐẦU / 开工:', el('f_start').value); if(v!==null){el('f_start').value=v;recalcFromSched()}" title="Nhấn để sửa"><span class="ic">📅</span><span class="k">BẮT ĐẦU / 开工</span><span class="v">${el('f_start').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('HOÀN THÀNH (DK) / 完工:', el('f_end').value); if(v!==null){el('f_end').value=v;recalcFromSched()}" title="Nhấn để sửa"><span class="ic">🏁</span><span class="k">HOÀN THÀNH (DK) / 完工</span><span class="v">${el('f_end').value}</span></div>
      <div class="prog" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('TIẾN ĐỘ TỔNG THỂ (%):', el('f_prog').value); if(v!==null){el('f_prog').value=v;draw()}" title="Nhấn để sửa % tiến độ"><span class="k" style="color:var(--navy);font-weight:700">TIẾN ĐỘ TỔNG THỂ / 总体进度</span>
        <div class="pv">${prog}%</div><div class="bar"><i style="width:${prog}%"></i></div></div>
    </div>
  </div>

  <div class="sec-h" onclick="openModal('grp-02')"><span class="num">02</span> NHÂN LỰC & THỜI TIẾT <span class="cn">/ 人员与天气</span></div>
  <div class="pad two">
    <div style="flex:1">
      <div class="card2">
        <div class="ch">NHÂN LỰC / 人员资源</div>
        <div style="height:70px; display:flex; align-items:center; justify-content:center; margin-bottom:12px">
          <div style="font-size:64px; font-weight:800; color:var(--green); letter-spacing:-2px; line-height:1">${el('f_total').value}</div>
        </div>
        <div class="kv"><span class="k"><span style="opacity:0.6;margin-right:6px">👷</span>BCH / 指挥部</span><span class="v">${String(el('f_bch').value).padStart(2,'0')}</span></div>
        <div class="kv" style="border-bottom:0"><span class="k"><span style="opacity:0.6;margin-right:6px">👥</span>Tổ đội / Nhà thầu phụ / 班组·分包商</span><span class="v">${units.reduce((a,u)=>a+(parseInt(u.n)||0),0)}</span></div>
      </div>
    </div>
    <div style="flex:1">
      <div class="card2">
        <div class="ch">THỜI TIẾT / 天气</div>
        <div style="height:70px; display:flex; align-items:center; justify-content:center; gap:48px; margin-bottom:12px">
          ${wIconBox}
        </div>
        ${wTextBox}
        ${weatherNoteBox}
      </div>
    </div>
  </div>

  <div class="sec-h" onclick="openModal('grp-03')"><span class="num">03</span> TIẾN ĐỘ THI CÔNG CHI TIẾT <span class="cn">/ 详细施工进度</span></div>
  <div class="pad two">
    <div style="flex:0 0 38%"><div style="font-weight:700;color:var(--navy);margin-bottom:8px">TỔNG HỢP CÁC HẠNG MỤC / 各项目汇总</div>${workHtml}</div>
    <div style="flex:1"><div style="font-weight:700;color:var(--navy);margin-bottom:8px">HÌNH ẢNH THI CÔNG TRONG NGÀY / 当日施工照片</div><div class="photos">${photoHtml}</div></div>
  </div>

  <div class="sec-h" onclick="editBilingualField('f_plan', 'KẾ HOẠCH / 计划')" title="Nhấn để nhập thủ công và tự dịch"><span class="num">04</span> KẾ HOẠCH THI CÔNG NGÀY MAI <span class="cn">/ 明日施工计划</span></div>
  <div class="pad" style="cursor:pointer;transition:0.2s" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'" onclick="editBilingualField('f_plan', 'KẾ HOẠCH / 计划')" title="Nhấn để nhập thủ công và tự dịch">${planHtml}</div>

  <div class="sec-h" onclick="openModal('grp-05')"><span class="num">05</span> BẢN VẼ & TỔNG THỂ <span class="cn">/ 图纸与总体布置图</span></div>
  <div class="pad"><div class="draw">${drawHtml}</div></div>

  <div class="sec-h" onclick="openModal('grp-06')"><span class="num">06</span> GHI CHÚ & KIẾN NGHỊ <span class="cn">/ 备注与建议</span></div>
  <div class="pad notes">
    <div class="alert-info" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9';this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='#f8fafc';this.style.borderColor='#e2e8f0'" onclick="editBilingualField('f_note', 'GHI CHÚ / 备注')" title="Nhấn để nhập thủ công và tự dịch"><div class="nh" style="display:flex;align-items:center;gap:6px">${svgNote} GHI CHÚ <span class="cn">/ 备注</span></div><div class="nt">${transLines('f_note')}</div></div>
    <div class="alert-warn" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#fef3c7';this.style.borderColor='#fcd34d'" onmouseout="this.style.background='#fffbeb';this.style.borderColor='#fde68a'" onclick="editBilingualField('f_rec', 'KIẾN NGHỊ / 建议')" title="Nhấn để nhập thủ công và tự dịch"><div class="nh" style="display:flex;align-items:center;gap:6px;color:#d97706">${svgWarn} KIẾN NGHỊ <span class="cn">/ 建议</span></div><div class="nt">${transLines('f_rec')}</div></div>
  </div>

  <div class="sec-h" onclick="openModal('grp-07')"><span class="num">07</span> AN TOÀN - CHẤT LƯỢNG - TIẾN ĐỘ <span class="cn">/ 安全·质量·进度</span></div>
  <div class="pad sq">
    <div class="s1" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f8fafc';this.style.borderColor='#cbd5e1';this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'" onmouseout="this.style.background='#fff';this.style.borderColor='var(--line)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'" onclick="editBilingualField('f_safe', 'AN TOÀN / 安全')" title="Nhấn để nhập thủ công và tự dịch"><div class="scenter">${svgSafe}</div><div class="h" style="text-align:center">AN TOÀN <span class="cn">/ 安全</span></div><div class="desc">${transLines('f_safe')}</div></div>
    <div class="s2" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f8fafc';this.style.borderColor='#cbd5e1';this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'" onmouseout="this.style.background='#fff';this.style.borderColor='var(--line)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'" onclick="editBilingualField('f_qual', 'CHẤT LƯỢNG / 质量')" title="Nhấn để nhập thủ công và tự dịch"><div class="scenter">${svgQual}</div><div class="h" style="text-align:center">CHẤT LƯỢNG <span class="cn">/ 质量</span></div><div class="desc">${transLines('f_qual')}</div></div>
    <div class="s3" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f8fafc';this.style.borderColor='#cbd5e1';this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'" onmouseout="this.style.background='#fff';this.style.borderColor='var(--line)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'" onclick="editBilingualField('f_sched', 'TIẾN ĐỘ / 进度')" title="Nhấn để nhập thủ công và tự dịch"><div class="scenter">${svgTime}</div><div class="h" style="text-align:center">TIẾN ĐỘ <span class="cn">/ 进度</span></div><div class="desc">${transLines('f_sched')}</div></div>
  </div>

  <div class="sign-block" style="display:flex;justify-content:space-around;padding:10px 20px 12px;text-align:center;page-break-inside:avoid;margin-top:8px;background:#fff">
    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
      <div style="font-weight:700;color:var(--navy);font-size:var(--fs-body);margin-bottom:2px">NGƯỜI LẬP BÁO CÁO</div>
      <div style="font-size:var(--fs-caption-cn);color:#64748b;margin-bottom:8px">报告人</div>
      <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:48px;">
        <div style="color:var(--primary-dark); font-weight:bold; font-size:13px; font-style:italic;">(Đã ký)</div>
      </div>
      <div style="font-weight:700; color:var(--navy); font-size:13px; margin-top:4px;">${esc(createdBy)}</div>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
      <div style="font-weight:700;color:var(--navy);font-size:var(--fs-body);margin-bottom:2px">CHỈ HUY TRƯỞNG</div>
      <div style="font-size:var(--fs-caption-cn);color:#64748b;margin-bottom:8px">施工队长</div>
      <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:48px;">
        ${approveStamp}
      </div>
      <div style="font-weight:700; color:var(--navy); font-size:13px; margin-top:4px;">${esc(report.approved_by || commanderName)}</div>
    </div>
  </div>
  <div class="divider"></div>`;

  if (typeof window.autoGrowAllTextareas === 'function') {
    window.autoGrowAllTextareas();
  }
  adjustReportScale();
}

/* ---------- export PNG ---------- */
function exportPNG(){
  const node=el('report');
  html2canvas(node,{scale:2,useCORS:true,backgroundColor:'#ffffff'}).then(canvas=>{
    const a=document.createElement('a');
    const d=el('f_date').value||'bao-cao';
    a.download='BaoCaoThiCong_'+el('f_proj').value+'_'+d+'.png';
    a.href=canvas.toDataURL('image/png');a.click();
  });
}

/* ---------- init ---------- */
/* v4: mục 02 nhập giọng nói + bóc tách + học thuật ngữ theo dự án */
el('f_proj').addEventListener('change',loadTerms);

function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}



/* ===== MODAL SYSTEM ===== */
let logoImgCdt = null;

function setPane(mode){ const app=document.querySelector('.app'); if(!app)return;
  app.classList.toggle('show-form',mode==='form'); app.classList.toggle('show-preview',mode==='preview');
  [...document.querySelectorAll('.paneToggle button')].forEach(b=>b.classList.toggle('active',b.dataset.pane===mode));
  if(mode==='preview'&&typeof draw==='function')draw(); }

function openModal(id) {
  const modal = el(id);
  const overlay = el('modalOverlay');
    if(modal && overlay) {
      document.querySelectorAll('.grp').forEach(g => {
        if(g.id !== 'grp-00' && g.id !== 'grp-01') {
          g.classList.remove('is-modal');
          g.open = false;
        }
      });
      modal.classList.add('is-modal');
      modal.open = true;
      overlay.classList.remove('hide');
    }
}
function closeModal() {
  const overlay = el('modalOverlay');
  if(overlay) overlay.classList.add('hide');
  document.querySelectorAll('.grp').forEach(g => {
    if(g.id !== 'grp-00' && g.id !== 'grp-01') g.classList.remove('is-modal');
  });
}

/* ==== gan su kien DOM ==== */
['f_logo','f_logo_cdt','logoImg','logoImgCdt'];
el('f_logo').onchange=function(){loadImg(this,d=>{logoImg=d;draw()})};
el('f_logo_cdt').onchange=function(){loadImg(this,d=>{logoImgCdt=d;draw()})};
el('f_ovmain').onchange=function(){loadImg(this,d=>{ovMain=d;draw()})};
el('f_ovsub1').onchange=function(){loadImg(this,d=>{ovSub1=d;draw()})};
el('f_ovsub2').onchange=function(){loadImg(this,d=>{ovSub2=d;draw()})};
['f_proj','f_contractor','f_date','f_loc','f_scale','f_start','f_end','f_prog',
 'f_total','f_bch','f_safe','f_qual','f_sched','f_plan','f_note','f_rec']
 .forEach(id=>el(id).addEventListener('input',draw));
/* đổi NGÀY BÁO CÁO -> tự tính lại % theo lịch */
el('f_date').addEventListener('change',recalcFromSched);
/* đổi ngày BẮT ĐẦU/KẾT THÚC -> tự tính lại % tiến độ tổng thể */
el('f_start').addEventListener('change',recalcFromSched);
el('f_end').addEventListener('change',recalcFromSched);
/* đổi BCH -> tự cộng Tổng số */
el('f_bch').addEventListener('input',recomputeTotal);

renderUnitForm();renderWorkForm();renderPhotoForm();renderDrawForm();loadTerms();recomputeTotal();recalcFromSched();
['f_weather_m','f_weather_a','f_weather_note'].forEach(id=>{
  const elm = el(id);
  if(elm) elm.addEventListener('change', draw);
  if(elm && elm.tagName === 'TEXTAREA') elm.addEventListener('input', draw);
});

/* --- LƯU TRỮ DỮ LIỆU MỤC 6 & 7 TỰ ĐỘNG --- */
function loadNotesAndMetrics() {
  try {
    const raw = localStorage.getItem('daily_report_notes_metrics');
    if(raw) {
      const data = JSON.parse(raw);
      ['f_note','f_rec','f_safe','f_qual','f_sched'].forEach(id => {
        if(data[id]) el(id).value = data[id];
      });
    }
  } catch(e){}
}
function saveNotesAndMetrics() {
  const data = {};
  ['f_note','f_rec','f_safe','f_qual','f_sched'].forEach(id => {
    if(el(id)) data[id] = el(id).value;
  });
  localStorage.setItem('daily_report_notes_metrics', JSON.stringify(data));
}
loadNotesAndMetrics();
['f_note','f_rec','f_safe','f_qual','f_sched'].forEach(id => {
  const elm = el(id);
  if(elm) elm.addEventListener('input', saveNotesAndMetrics);
});

// Tự động dịch song ngữ dạng Việt | Trung khi rời khỏi ô nhập (blur)
['f_plan','f_note','f_rec','f_safe','f_qual','f_sched'].forEach(id => {
  const elm = el(id);
  if(elm) {
    elm.addEventListener('blur', function() {
      if(typeof window.translateTextareaBilingual === 'function') {
        window.translateTextareaBilingual(id);
      }
    });
  }
});

/* --- TỰ ĐỘNG NẠP VÀ ĐỒNG BỘ DỮ LIỆU BÁO CÁO NGÀY --- */
async function loadReportForDate(date) {
  try {
    if (window.parent && window.parent.DataService) {
      const reports = await window.parent.DataService.listDailyReports();
      const report = reports.find(r => r.project_id === window.parent.CUR.project && r.date === date);
      if (report) {
        // Trường văn bản + thời tiết
        if (el('f_note')) el('f_note').value = report.f_note || '';
        if (el('f_rec')) el('f_rec').value = report.f_rec || '';
        if (el('f_safe')) el('f_safe').value = report.f_safe || '';
        if (el('f_qual')) el('f_qual').value = report.f_qual || '';
        if (el('f_sched')) el('f_sched').value = report.f_sched || '';
        if (el('f_rain_hours')) el('f_rain_hours').value = report.rain_hours || 0;
        if (el('f_total')) el('f_total').value = report.total_manpower || 0;
        if (el('f_bch')) el('f_bch').value = report.bch || 0;
        if (el('f_weather_m')) el('f_weather_m').value = report.weather_m || 'sunny';
        if (el('f_weather_a')) el('f_weather_a').value = report.weather_a || 'sunny';
        if (el('f_weather_note')) el('f_weather_note').value = report.weather_note || '';
        if (el('f_prog') && report.f_prog) el('f_prog').value = report.f_prog;
        if (el('f_plan') && report.f_plan) el('f_plan').value = report.f_plan;

        // Phục hồi nhân lực (units)
        if (report.units && Array.isArray(report.units)) {
          units = report.units;
          if (typeof renderUnitForm === 'function') renderUnitForm();
          if (typeof recomputeTotal === 'function') recomputeTotal();
        }
        // Phục hồi hạng mục thi công (works)
        if (report.works_full && Array.isArray(report.works_full)) {
          works = report.works_full;
          if (typeof renderWorkForm === 'function') renderWorkForm();
        }
        // Phục hồi ảnh công trường (photos)
        if (report.photos && Array.isArray(report.photos)) {
          photos = report.photos;
          if (typeof renderPhotoForm === 'function') renderPhotoForm();
        }
        // Phục hồi bản vẽ (draws)
        if (report.draws && Array.isArray(report.draws)) {
          draws = report.draws;
          if (typeof renderDrawForm === 'function') renderDrawForm();
        }

        // Phục hồi trạng thái nháp/đã nộp
        window.CURRENT_REPORT = report || null;
        window._reportStatus = report.approval || report.status || 'approved'; // Báo cáo cũ coi như đã duyệt
        if (typeof updateStatusBadge === 'function') updateStatusBadge();

        saveNotesAndMetrics();
        if (typeof draw === 'function') draw();
        if (typeof updateProgress === 'function') updateProgress();
      } else {
        // Làm trống toàn bộ khi không có báo cáo cho ngày này
        if (el('f_note')) el('f_note').value = '';
        if (el('f_rec')) el('f_rec').value = '';
        if (el('f_safe')) el('f_safe').value = '';
        if (el('f_qual')) el('f_qual').value = '';
        if (el('f_sched')) el('f_sched').value = '';
        if (el('f_rain_hours')) el('f_rain_hours').value = 0;
        if (el('f_weather_m')) el('f_weather_m').value = 'sunny';
        if (el('f_weather_a')) el('f_weather_a').value = 'sunny';
        if (el('f_weather_note')) el('f_weather_note').value = '';
        if (el('f_prog')) el('f_prog').value = '';

        window.CURRENT_REPORT = null;
        window._reportStatus = 'draft';
        if (typeof updateStatusBadge === 'function') updateStatusBadge();
        units = []; works = []; photos = []; draws = [];
        if (typeof renderUnitForm === 'function') renderUnitForm();
        if (typeof renderWorkForm === 'function') renderWorkForm();
        if (typeof renderPhotoForm === 'function') renderPhotoForm();
        if (typeof renderDrawForm === 'function') renderDrawForm();
        if (typeof recomputeTotal === 'function') recomputeTotal();

        saveNotesAndMetrics();
        if (typeof draw === 'function') draw();
        if (typeof updateProgress === 'function') updateProgress();
      }
    }
  } catch (e) {
    console.error("Lỗi khi tải báo cáo ngày:", e);
  }
}
window.loadReportForDate = loadReportForDate;

// Lắng nghe sự kiện đổi ngày báo cáo
if (el('f_date')) {
  el('f_date').addEventListener('change', async () => {
    const newDate = el('f_date').value;
    await loadReportForDate(newDate);
  });
}

// Kiểm tra chuyển hướng chờ từ parent
setTimeout(async () => {
  if (window.parent && window.parent.PENDING_REPORT_NAV) {
    const nav = window.parent.PENDING_REPORT_NAV;
    window.parent.PENDING_REPORT_NAV = null; // Xóa cờ chờ
    
    const dateEl = el('f_date');
    if (dateEl) {
      dateEl.value = nav.date;
      await loadReportForDate(nav.date);
    }
    if (nav.sectionId && typeof openModal === 'function') {
      setTimeout(() => {
        openModal(nav.sectionId);
      }, 300);
    }
  } else {
    // Nếu không có điều hướng chờ, tự nạp báo cáo cho ngày mặc định khi load xong
    const dateEl = el('f_date');
    if (dateEl) {
      await loadReportForDate(dateEl.value);
    }
  }
}, 500);
