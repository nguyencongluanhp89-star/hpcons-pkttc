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

function exportPNG169() {
  try {
    const dt = fmtDate(el('f_date').value);
    const prog = el('f_prog').value || 0;
    
    // Helper render header các phần giống báo cáo gốc (nền gradient xanh navy đặc, bo góc tròn, viền trái xanh lục)
    function secHeaderStatic(num, titleVi, titleCn) {
      return `
        <div style="background: linear-gradient(90deg, #0a2d58 0%, #1e40af 100%); color: #fff; padding: 10px 18px; font-size: 15px; font-weight: 800; display: flex; align-items: center; letter-spacing: 0.3px; border-left: 5px solid #10b981; box-shadow: 0 2px 5px rgba(10,77,148,0.08); text-transform: uppercase; border-radius: 6px; margin-bottom: 15px; line-height: 1.2; flex-shrink: 0; box-sizing: border-box;">
          <span style="background: #fff; color: #0a2d58; border-radius: 4px; padding: 2px 7px; font-size: 12.5px; font-weight: 800; line-height: 1; margin-right: 10px; font-family: 'Outfit', sans-serif;">${num}</span>
          ${titleVi} <span style="font-weight: 500; font-size: 11.5px; opacity: 0.85; font-family: Arial; text-transform: none; margin-left: 5px;">/ ${titleCn}</span>
        </div>
      `;
    }

    // Helper hiển thị ảnh tĩnh không tương tác
    function imgStatic(src, phtxt) {
      return src 
        ? `<img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; display:block;">`
        : `<div style="width:100%; height:100%; background:#f8fafc; border: 1px dashed #cbd5e1; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:12px; font-weight:600; min-height:100px; text-align:center; padding:10px; box-sizing:border-box; line-height:1.3;">${phtxt}</div>`;
    }

    // Xây dựng logo nhà thầu
    const logoHtml = logoImg 
      ? `<img src="${logoImg}" style="max-height:70px; object-fit:contain;">` 
      : `<div style="text-align:center;"><div style="font-size:28px;font-weight:900;color:#0a2d58;letter-spacing:1px;line-height:1">HP<span style="color:#10b981">CONS</span></div><div style="font-size:9px;color:#10b981;font-style:italic;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px">BEYOND - Expectation</div><div style="font-size:8px;color:#0a2d58;margin-top:1px">超越期望</div></div>`;
    
    // Xây dựng logo chủ đầu tư
    const logoCdtHtml = logoImgCdt 
      ? `<img src="${logoImgCdt}" style="max-height:70px; object-fit:contain;">` 
      : '';

    // Thời tiết
    const weatherIcons = {
      'sunny': {i:'☀️', l:'Nắng đẹp', c:'wt-sunny'},
      'cloudy': {i:'⛅', l:'Nhiều mây', c:'wt-cloudy'},
      'rainy': {i:'🌧️', l:'Có mưa', c:'wt-rainy'},
      'stormy': {i:'⛈️', l:'Giông bão', c:'wt-stormy'}
    };
    const wm = el('f_weather_m').value;
    const wa = el('f_weather_a').value;
    const wnote = el('f_weather_note').value.trim();
    
    let weatherText = '';
    let weatherIcon = '☀️';
    if (wm === wa) {
      weatherIcon = weatherIcons[wm] ? weatherIcons[wm].i : '☀️';
      weatherText = `Cả ngày: ${weatherIcons[wm] ? weatherIcons[wm].l : 'Nắng đẹp'}`;
    } else {
      weatherIcon = `${weatherIcons[wm] ? weatherIcons[wm].i : '☀️'}${weatherIcons[wa] ? weatherIcons[wa].i : '☀️'}`;
      weatherText = `Sáng: ${weatherIcons[wm] ? weatherIcons[wm].l : 'Nắng'} | Chiều: ${weatherIcons[wa] ? weatherIcons[wa].l : 'Nắng'}`;
    }
    let rh = parseFloat(el('f_rain_hours') ? el('f_rain_hours').value : 0) || 0;
    if (rh > 0) {
      weatherText += ` (Mưa ${rh}h)`;
    }
    if (wnote) {
      weatherText += ` - ${wnote}`;
    }

    // Định nghĩa wIconBox
    let wIconBox = '';
    if (wm === wa) {
      wIconBox = `<div style="font-size:42px; line-height:1; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1))">${weatherIcons[wm] ? weatherIcons[wm].i : '☀️'}</div>`;
    } else {
      wIconBox = `
        <div style="font-size:36px; line-height:1; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1))">${weatherIcons[wm] ? weatherIcons[wm].i : '☀️'}</div>
        <div style="font-size:18px; color:#cbd5e1; font-weight:300; transform:rotate(15deg)">/</div>
        <div style="font-size:36px; line-height:1; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1))">${weatherIcons[wa] ? weatherIcons[wa].i : '☀️'}</div>
      `;
    }

    // Nhân lực
    const totalManpower = el('f_total') ? el('f_total').value : 0;
    const bch = el('f_bch') ? el('f_bch').value : 0;
    
    // Tính subManpower (đề phòng units undefined)
    const activeUnits = (typeof units !== 'undefined' && Array.isArray(units)) ? units : [];
    const subManpower = activeUnits.reduce((a,u)=>a+(parseInt(u.n)||0),0);

    // Người lập, chỉ huy trưởng & con dấu
    const reportData = window.CURRENT_REPORT || {};
    const createdBy = reportData.created_name || reportData.created_by || window.CURRENT_USER_NAME || "Kỹ sư";
    const commanderName = window.CURRENT_COMMANDER || "";
    const approval = reportData.approval || reportData.status || (window._reportStatus || "draft");
    
    let approveStamp = "";
    if (approval === "approved") {
      const appBy = reportData.approved_by || commanderName || "Chỉ huy trưởng";
      let appAt = "";
      try {
        const parsedDate = reportData.approved_at ? new Date(reportData.approved_at) : null;
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          appAt = parsedDate.toLocaleDateString("vi-VN");
        } else {
          appAt = new Date().toLocaleDateString("vi-VN");
        }
      } catch (err) {
        appAt = new Date().toLocaleDateString("vi-VN");
      }
      approveStamp = `
        <div style="border: 2px dashed #10b981; color: #10b981; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 6px; display: inline-block; transform: rotate(-8deg); background: rgba(16, 185, 129, 0.03); text-align: center; font-family: 'Inter', sans-serif; position: absolute; z-index: 10; right: 15px; top: 0px; box-shadow: 0 4px 10px rgba(16,185,129,0.08); line-height: 1.3;">
          ✅ ĐÃ DUYỆT<br>
          <span style="font-size:10px; font-weight:800;">${esc(appBy)}</span><br>
          <span style="font-size:9px; font-weight:normal; opacity:0.8;">Ngày: ${appAt}</span>
        </div>
      `;
    } else if (approval === "pending") {
      approveStamp = `
        <div style="border: 1.5px dashed #ea580c; color: #ea580c; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px; display: inline-block; background: rgba(234, 88, 12, 0.03); text-align: center; position: absolute; right: 15px; top: 5px;">
          ⏳ Chờ duyệt
        </div>
      `;
    } else if (approval === "rejected") {
      const reason = reportData.reject_reason || "";
      approveStamp = `
        <div style="border: 1.5px dashed #dc2626; color: #dc2626; font-weight: bold; font-size: 10px; padding: 4px 8px; border-radius: 4px; display: inline-block; background: rgba(220, 38, 38, 0.03); text-align: center; max-width: 120px; word-break: break-word; position: absolute; right: 15px; top: 5px;">
          ↩ Trả lại${reason ? `<br><span style="font-size: 8.5px; font-weight: normal; font-style: italic;">Lý do: ${esc(reason)}</span>` : ''}
        </div>
      `;
    }

    const createdByEsc = esc(createdBy);
    const commanderEsc = esc(reportData.approved_by || commanderName);

    // --- Khối 01: Tổng quan ---
    const activeOvMain = (typeof ovMain !== 'undefined') ? ovMain : null;
    const activeOvSub1 = (typeof ovSub1 !== 'undefined') ? ovSub1 : null;
    const activeOvSub2 = (typeof ovSub2 !== 'undefined') ? ovSub2 : null;
    
    // Luôn hiển thị lưới ảnh tổng quan (placeholder khi chưa có ảnh) - khớp format dọc gốc
    const ovImgsHtml = `
      <div style="display: flex; gap: 8px; height: 180px; width: 100%; margin-bottom: 12px; flex-shrink: 0;">
        <div style="flex: 1.4; height: 100%;">${imgStatic(activeOvMain, 'Ảnh tổng quan')}</div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px; height: 100%;">
          <div style="flex: 1; height: calc(50% - 3px);">${imgStatic(activeOvSub1, 'Ảnh phụ 1')}</div>
          <div style="flex: 1; height: calc(50% - 3px);">${imgStatic(activeOvSub2, 'Ảnh phụ 2')}</div>
        </div>
      </div>
    `;
    
    const ovInfoHtml = `
      <div style="font-size: 14.5px; margin-top: 5px; line-height: 1.55; flex: 1; display: flex; flex-direction: column; justify-content: space-around;">
        <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #10b981; font-weight: bold; width: 26px; font-size: 16px;">🏗️</span><span style="font-weight: 800; color: #1e3a8a; width: 150px; font-size: 13px; letter-spacing:0.3px;">CÔNG TRÌNH / 工程</span><span style="flex: 1; color: #0a2d58; font-weight: 700;">${el('f_proj').value}</span></div>
        <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #10b981; font-weight: bold; width: 26px; font-size: 16px;">📍</span><span style="font-weight: 800; color: #1e3a8a; width: 150px; font-size: 13px; letter-spacing:0.3px;">ĐỊA ĐIỂM / 地点</span><span style="flex: 1; color: #475569; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; font-weight: 600;">${el('f_loc').value}</span></div>
        <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #10b981; font-weight: bold; width: 26px; font-size: 16px;">🏢</span><span style="font-weight: 800; color: #1e3a8a; width: 150px; font-size: 13px; letter-spacing:0.3px;">QUY MÔ / 规模</span><span style="flex: 1; color: #475569; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; font-weight: 600;">${el('f_scale').value}</span></div>
        <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #10b981; font-weight: bold; width: 26px; font-size: 16px;">📅</span><span style="font-weight: 800; color: #1e3a8a; width: 150px; font-size: 13px; letter-spacing:0.3px;">BẮT ĐẦU / 开工</span><span style="flex: 1; color: #475569; font-weight: 600;">${el('f_start').value}</span></div>
        <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #10b981; font-weight: bold; width: 26px; font-size: 16px;">🏁</span><span style="font-weight: 800; color: #1e3a8a; width: 150px; font-size: 13px; letter-spacing:0.3px;">HOÀN THÀNH / 完工</span><span style="flex: 1; color: #475569; font-weight: 600;">${el('f_end').value}</span></div>
        
        <div style="margin-top: 15px; background: #fafbfc; padding: 12px 18px; border-radius: 10px; border: 1px solid #f1f5f9; flex-shrink: 0;">
          <div style="display: flex; justify-content: space-between; font-weight: 800; color: #1e3a8a; font-size: 13px;">
            <span>TIẾN ĐỘ TỔNG THỂ / 总体进度</span>
            <span style="color: #10b981; font-size: 16px; font-weight: 900;">${prog}%</span>
          </div>
          <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 8px;">
            <div style="width: ${prog}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); border-radius: 5px;"></div>
          </div>
        </div>
      </div>
    `;

    // --- Khối 02: Nhân lực & Thời tiết ---
    const manpowerHtml = `
      <div style="flex: 1; border: 1px solid #e2e8f0; border-top: 5px solid #10b981; border-radius: 12px; padding: 15px 10px; text-align: center; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.01); display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box;">
        <div style="font-size: 13px; font-weight: 800; color: #0a2d58; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.3px;">NHÂN LỰC / 人员</div>
        <div style="font-size: 46px; font-weight: 900; color: #10b981; line-height: 1; margin-bottom: 8px; font-family: 'Outfit', sans-serif;">${totalManpower}</div>
        <div style="font-size: 12px; color: #64748b; font-weight: 700; background: #f8fafc; padding: 4px 6px; border-radius: 6px;">BCH: ${bch} | Tổ đội: ${subManpower}</div>
      </div>
    `;

    const weatherHtml = `
      <div style="flex: 1; border: 1px solid #e2e8f0; border-top: 5px solid #3b82f6; border-radius: 12px; padding: 15px 10px; text-align: center; background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.01); height: 100%; box-sizing: border-box;">
        <div style="font-size: 13px; font-weight: 800; color: #0a2d58; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.3px;">THỜI TIẾT / 天气</div>
        <div style="display: flex; gap: 8px; align-items: center; justify-content: center; margin-bottom: 4px; flex: 1;">
          ${wIconBox}
        </div>
        <div style="font-size: 12px; line-height: 1.3; color: #475569; font-weight: 700; background: #f8fafc; padding: 4px 6px; border-radius: 6px; width: 90%; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${weatherText}</div>
      </div>
    `;

    // --- Khối 03: Hạng mục thi công chi tiết (Việt-Trung) ---
    let worksHtml = '';
    const activeWorks = (typeof works !== 'undefined' && Array.isArray(works)) ? works : [];
    activeWorks.forEach((w, idx) => {
      const cleanT = stripIdx(w.t);
      const cn = stripIdx((typeof workCN === 'function') ? workCN(cleanT) : '');
      const wt = `<span style="font-weight: 800; color: #0a2d58; margin-right: 6px; font-size: 15.5px;">${idx+1}.</span> ${cleanT}` + (cn ? ` <span style="font-weight:500;color:#94a3b8; font-size:13.5px;">/ ${cn}</span>` : '');
      
      let detailsHtml = '';
      if (w.d) {
        detailsHtml = w.d.split('\n').filter(x => x.trim()).map(line => {
          let viPart = line;
          let cnPart = '';
          if (line.includes('|')) {
            const parts = line.split('|');
            viPart = parts[0].trim();
            cnPart = parts[1].trim();
          }
          const o = (typeof biLineSplit === 'function') ? biLineSplit(viPart) : {n:viPart, q:''};
          const c = cnPart || ((typeof workCN === 'function') ? workCN(o.n) : '');
          return `<div style="font-size: 14.5px; color: #334155; margin-top: 6px; padding-left: 15px; position: relative; line-height: 1.5; font-weight: 500;">
            <span style="position: absolute; left: 0; color: #94a3b8; font-weight: bold;">-</span>
            ${o.n}${o.q ? `: <strong style="color:#0f172a; font-weight: 800;">${o.q}</strong>` : ''}
            ${c ? `<span style="color:#94a3b8; font-size: 13px; font-weight: normal; margin-left: 4px;">/ ${c}</span>` : ''}
          </div>`;
        }).join('');
      }

      worksHtml += `
        <div style="border-left: 4px solid ${w.c || '#10b981'}; padding-left: 12px; margin-bottom: 18px; page-break-inside: avoid;">
          <div style="font-weight: 800; color: #0f172a; font-size: 15px; line-height: 1.4;">${wt}</div>
          <div style="margin-top: 4px;">${detailsHtml}</div>
        </div>
      `;
    });
    if (!worksHtml) {
      worksHtml = `<div style="color:#94a3b8; font-style:italic; font-size:14px; text-align:center; padding: 40px 0;">Không có hạng mục thi công chi tiết</div>`;
    }

    // --- Khối 04: Kế hoạch ngày mai ---
    let planCardHtml = '';
    const rawPlans = el('f_plan').value.split('\n').filter(x => x.trim());
    if (rawPlans.length > 0) {
      let content = '';
      rawPlans.forEach(line => {
        let viPart = line;
        let cnPart = '';
        if (line.includes('|')) {
          const parts = line.split('|');
          viPart = parts[0].trim();
          cnPart = parts[1].trim();
        }
        const o = (typeof biLineSplit === 'function') ? biLineSplit(viPart) : {n:viPart, q:''};
        const c = cnPart || ((typeof workCN === 'function') ? workCN(o.n) : '');
        content += `
          <div style="font-size: 14px; color: #1e293b; margin-bottom: 8px; padding-left: 18px; position: relative; line-height: 1.5; font-weight: 500;">
            <span style="position: absolute; left: 0; top: 0px; color: #10b981; font-weight: bold; font-size: 15px;">•</span>
            <strong style="color: #0f172a; font-weight: 700;">${o.n}</strong>${o.q ? `: ${o.q}` : ''}
            ${c ? `<span style="color: #64748b; font-size: 13px; font-weight: normal; margin-left: 6px;">/ ${c}</span>` : ''}
          </div>
        `;
      });
      
      planCardHtml = `
        <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex-shrink: 0;">
          ${secHeaderStatic('04', 'KẾ HOẠCH NGÀY MAI', '明日施工计划')}
          <div style="display: flex; flex-direction: column;">
            ${content}
          </div>
        </div>
      `;
    }

    // --- Khối 05: Bản vẽ & Tổng thể (Chỉ hiện khi có ảnh) ---
    const activeDraws = (typeof draws !== 'undefined' && Array.isArray(draws)) ? draws : [];
    let drawsCardHtml = '';
    const validDraws = activeDraws.filter(d => d && d.img);
    if (validDraws.length > 0) {
      let drawItemsHtml = '';
      validDraws.forEach((d, idx) => {
        let t_vi = d.t || '';
        let t_cn_val = '';
        if (t_vi.includes('|')) {
          const parts = t_vi.split('|');
          t_vi = parts[0].trim();
          t_cn_val = parts[1].trim();
        }
        const t_cn = t_cn_val || ((typeof workCN === 'function') ? workCN(t_vi) : '');
        
        drawItemsHtml += `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column;">
            <div style="position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden; border-radius: 6px 6px 0 0;">
              <img src="${d.img}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="padding: 4px; text-align: center; line-height: 1.25; font-size: 11px;">
              <div style="font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t_vi}</div>
              ${t_cn ? `<div style="color: #64748b; font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">${t_cn}</div>` : ''}
            </div>
          </div>
        `;
      });
      
      drawsCardHtml = `
        <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex-shrink: 0;">
          ${secHeaderStatic('05', 'BẢN VẼ & TỔNG THỂ', '图纸与总体布置图')}
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px;">
            ${drawItemsHtml}
          </div>
        </div>
      `;
    }

    // --- Khối 06: Ghi chú & Kiến nghị ---
    const noteVal = el('f_note').value.trim();
    const recVal = el('f_rec').value.trim();
    let noteRecCardHtml = '';
    if (noteVal || recVal) {
      let content = '';
      if (noteVal) {
        content += `
          <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px;">
            <div style="font-weight: 800; color: #166534; font-size: 12.5px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">📝 GHI CHÚ / 备注</div>
            <div style="font-size: 14px; color: #14532d; margin-top: 5px; line-height: 1.5; white-space: pre-line; font-weight: 500;">${noteVal}</div>
          </div>
        `;
      }
      if (recVal) {
        content += `
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px;">
            <div style="font-weight: 800; color: #b45309; font-size: 12.5px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">⚠️ KIẾN NGHỊ / 建议</div>
            <div style="font-size: 14px; color: #78350f; margin-top: 5px; line-height: 1.5; white-space: pre-line; font-weight: 500;">${recVal}</div>
          </div>
        `;
      }
      
      noteRecCardHtml = `
        <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex-shrink: 0;">
          ${secHeaderStatic('06', 'GHI CHÚ & KIẾN NGHỊ', '备注 & 建议')}
          ${content}
        </div>
      `;
    }

    // --- Khối 07: An toàn - Chất lượng - Tiến độ ---
    const safeVal = el('f_safe').value.trim();
    const qualVal = el('f_qual').value.trim();
    const schedVal = el('f_sched').value.trim();
    let safeQualCardHtml = '';
    if (safeVal || qualVal || schedVal) {
      let content = '';
      if (safeVal) {
        content += `
          <div style="border: 1px solid #dcfce7; background: #f0fdf4; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">🛡️</span>
            <div style="font-size: 13.5px; color: #166534; line-height: 1.4; font-weight: 500;">
              <strong style="text-transform: uppercase; color: #14532d; font-weight: 800;">An toàn / 安全:</strong> ${safeVal}
            </div>
          </div>
        `;
      }
      if (qualVal) {
        content += `
          <div style="border: 1px solid #dbeafe; background: #eff6ff; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">⭐</span>
            <div style="font-size: 13.5px; color: #1e40af; line-height: 1.4; font-weight: 500;">
              <strong style="text-transform: uppercase; color: #1e3a8a; font-weight: 800;">Chất lượng / 质量:</strong> ${qualVal}
            </div>
          </div>
        `;
      }
      if (schedVal) {
        content += `
          <div style="border: 1px solid #ffedd5; background: #fff7ed; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">⏱️</span>
            <div style="font-size: 13.5px; color: #c2410c; line-height: 1.4; font-weight: 500;">
              <strong style="text-transform: uppercase; color: #7c2d12; font-weight: 800;">Tiến độ / 进度:</strong> ${schedVal}
            </div>
          </div>
        `;
      }
      
      safeQualCardHtml = `
        <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex-shrink: 0;">
          ${secHeaderStatic('07', 'AN TOÀN - CHẤT LƯỢNG - TIẾN ĐỘ', '安全·质量·进度')}
          ${content}
        </div>
      `;
    }

    // --- Ảnh thi công trong ngày (inline - nằm trong phần 03, không tách thành card riêng) ---
    const activePhotos = (typeof photos !== 'undefined' && Array.isArray(photos)) ? photos : [];
    const validPhotos = activePhotos.filter(p => p && p.img);
    let photosInlineHtml = '';
    if (validPhotos.length > 0) {
      let gridCols = '1fr 1fr';
      let photoHeight = '110px';
      if (validPhotos.length === 1) {
        gridCols = '1fr';
        photoHeight = '180px';
      } else if (validPhotos.length === 3) {
        gridCols = '1fr 1fr 1fr';
        photoHeight = '90px';
      } else if (validPhotos.length > 4) {
        gridCols = '1fr 1fr 1fr';
        photoHeight = '80px';
      }
      
      photosInlineHtml = `
        <div style="flex: 1; display: grid; grid-template-columns: ${gridCols}; gap: 6px; align-content: start; overflow-y: auto;">
          ${validPhotos.map((p, idx) => `
            <div style="position: relative; height: ${photoHeight}; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
              <img src="${p.img}" style="width: 100%; height: 100%; object-fit: cover;">
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(10,45,88,0.9); color: #fff; padding: 3px 4px; font-size: 10px; text-align: center; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${p.vi || `Ảnh ${idx+1}`}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      photosInlineHtml = `<div style="flex:1; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:13px; font-style:italic; border: 1px dashed #e2e8f0; border-radius: 8px;">Chưa có ảnh thi công</div>`;
    }

    // Khối chữ ký
    const signatureHtml = `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.01); display: flex; justify-content: space-around; align-items: stretch; text-align: center; height: 130px; box-sizing: border-box; flex-shrink: 0; position: relative;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; border-right: 1px solid #f1f5f9; padding-right: 10px; box-sizing: border-box;">
          <div>
            <div style="font-weight: 800; color: #0a2d58; font-size: 13px; text-transform: uppercase; line-height: 1.1;">Người lập báo cáo</div>
            <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 1px;">报告人</div>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 40px;">
            <div style="color: #94a3b8; font-weight: bold; font-size: 13px; font-style: italic; opacity: 0.65;">(Đã ký)</div>
          </div>
          <div style="font-weight: 800; color: #1e3a8a; font-size: 14.5px; white-space: nowrap;">${createdByEsc}</div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding-left: 10px; box-sizing: border-box; position: relative;">
          <div>
            <div style="font-weight: 800; color: #0a2d58; font-size: 13px; text-transform: uppercase; line-height: 1.1;">Chỉ huy trưởng</div>
            <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 1px;">施工队长</div>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 40px; position: relative; width: 100%;">
            ${approveStamp || '<div style="color: #cbd5e1; font-size: 12px; font-style: italic;">Chưa duyệt</div>'}
          </div>
          <div style="font-weight: 800; color: #1e3a8a; font-size: 14.5px; white-space: nowrap;">${commanderEsc || "Chỉ huy trưởng"}</div>
        </div>
      </div>
    `;

    // Tạo container tạm offscreen
    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-report-169';
    tempContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: -9999px;
      width: 1920px;
      height: 1080px;
      background-color: #f8fafc;
      box-sizing: border-box;
      padding: 35px 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      z-index: -9999;
    `;

    // Thêm HTML của 3 cột
    tempContainer.innerHTML = `
      <!-- Header -->
      <div id="temp-header" style="display: flex; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; width: 100%; box-sizing: border-box; flex-shrink: 0; background: #ffffff; padding: 18px 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.01);">
        <div style="width: 320px; display: flex; align-items: center; justify-content: flex-start; height: 70px;">
          ${logoHtml}
        </div>
        <div style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 70px;">
          <div style="font-size: 34px; font-weight: 900; color: #0a2d58; letter-spacing: 0.5px; line-height: 1.1;">BÁO CÁO THI CÔNG NGÀY</div>
          <div style="font-size: 16px; color: #64748b; font-weight: 600; margin-top: 2px; letter-spacing: 0.5px;">每日施工报告</div>
          <div style="font-size: 15px; font-weight: 800; color: #10b981; margin-top: 6px; background: #f0fdf4; padding: 3px 14px; border-radius: 20px; border: 1px solid #dcfce7; display: inline-block;">
            NGÀY <span style="font-weight: 500;">/ 日期:</span> ${dt.d} (${dt.w})
          </div>
        </div>
        <div style="width: 320px; display: flex; align-items: center; justify-content: flex-end; height: 70px;">
          ${logoCdtHtml}
        </div>
      </div>

      <!-- Body Layout: 3 Columns -->
      <div id="temp-body" style="flex: 1; display: flex; gap: 20px; width: 100%; box-sizing: border-box; min-height: 0;">
        
        <!-- Cột 1 (30%): Tổng quan & Nhân lực thời tiết -->
        <div id="temp-col-1" style="width: 30%; display: flex; flex-direction: column; gap: 20px; flex-shrink: 0; box-sizing: border-box;">
          
          <!-- Khối 01: Tổng quan -->
          <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex: 1.4; min-height: 0;">
            ${secHeaderStatic('01', 'TỔNG QUAN DỰ ÁN', '项目概况')}
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
              ${ovImgsHtml}
              ${ovInfoHtml}
            </div>
          </div>

          <!-- Khối 02: Nhân lực & Thời tiết -->
          <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex: 0.6; min-height: 0;">
            ${secHeaderStatic('02', 'NHÂN LỰC & THỜI TIẾT', '人员与天气')}
            <div style="display: flex; gap: 15px; flex: 1; align-items: center; box-sizing: border-box;">
              ${manpowerHtml}
              ${weatherHtml}
            </div>
          </div>

        </div>

        <!-- Cột 2 (35%): Tiến độ chi tiết + Ảnh thi công (giống format dọc gốc) -->
        <div id="temp-col-2" style="width: 35%; display: flex; flex-direction: column; flex-shrink: 0; box-sizing: border-box;">
          
          <!-- Khối 03: TIẾN ĐỘ + ẢNH (trái: hạng mục / phải: ảnh thi công - khớp format dọc) -->
          <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; height: 100%; min-height: 0;">
            ${secHeaderStatic('03', 'TIẾN ĐỘ THI CÔNG CHI TIẾT', '详细施工进度')}
            <div style="flex: 1; display: flex; gap: 14px; min-height: 0; overflow: hidden;">
              <!-- Trái (42%): Hạng mục thi công -->
              <div style="flex: 0 0 42%; overflow-y: auto; padding-right: 5px; box-sizing: border-box;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 8px;">TỔNG HỢP CÁC HẠNG MỤC / 各项目汇总</div>
                ${worksHtml}
              </div>
              <!-- Phải: Hình ảnh thi công trong ngày -->
              <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 8px;">HÌNH ẢNH THI CÔNG TRONG NGÀY / 当日施工照片</div>
                ${photosInlineHtml}
              </div>
            </div>
          </div>

        </div>

        <!-- Cột 3 (35%): Kế hoạch, Ghi chú, Ảnh, Bản vẽ, An toàn & Chữ ký -->
        <div id="temp-col-3" style="width: 35%; display: flex; flex-direction: column; gap: 20px; flex-shrink: 0; box-sizing: border-box; justify-content: space-between;">
          
          <!-- Khối 04: Kế hoạch thi công ngày mai -->
          ${planCardHtml}

          <!-- Khối 06: Ghi chú & Kiến nghị -->
          ${noteRecCardHtml}

          <!-- Khối 05: Bản vẽ & Tổng thể -->
          ${drawsCardHtml}

          <!-- Khối 07: An toàn - Chất lượng - Tiến độ -->
          ${safeQualCardHtml}

          <!-- Chữ ký & Phê duyệt (Luôn luôn nằm đáy) -->
          ${signatureHtml}

        </div>

      </div>

      <!-- Footer -->
      <div id="temp-footer" style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; font-weight: 700; flex-shrink: 0; box-sizing: border-box; padding-left: 5px; padding-right: 5px;">
        <span>HỆ THỐNG QUẢN LÝ THI CÔNG HP CONS © 2026</span>
        <span style="font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 5px;">
          <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
          ẢNH XUẤT KHỔ NGANG 16:9 • CHUẨN TRÌNH CHIẾU BÁO CÁO CAO CẤP
        </span>
      </div>
    `;

    // Render ra DOM
    document.body.appendChild(tempContainer);

    // Tính toán chiều cao động & chiều rộng theo tỷ lệ 16:9 để chứa hết nội dung không bị tràn
    setTimeout(() => {
      const headerEl = document.getElementById('temp-header');
      const footerEl = document.getElementById('temp-footer');
      const col1El = document.getElementById('temp-col-1');
      const col2El = document.getElementById('temp-col-2');
      const col3El = document.getElementById('temp-col-3');

      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 106;
      const footerHeight = footerEl ? footerEl.getBoundingClientRect().height : 36;
      
      // Đo chiều cao tự nhiên của các cột khi không bị giới hạn height
      const col1Height = col1El ? col1El.scrollHeight : 0;
      const col2Height = col2El ? col2El.scrollHeight : 0;
      const col3Height = col3El ? col3El.scrollHeight : 0;
      
      const maxColHeight = Math.max(col1Height, col2Height, col3Height);
      
      // Tổng chiều cao cần thiết: padding-top/bottom là 35px*2 = 70px, gap giữa header-body-footer là 20px*2 = 40px -> tổng cộng cộng thêm 110px
      const totalNeededHeight = headerHeight + maxColHeight + footerHeight + 110;
      
      let finalHeight = 1080;
      if (totalNeededHeight > 1080) {
        finalHeight = Math.round(totalNeededHeight);
      }
      
      // Gán chiều cao và chiều rộng chuẩn 16:9 cho container
      tempContainer.style.height = finalHeight + 'px';
      const finalWidth = Math.round(finalHeight * 16 / 9);
      tempContainer.style.width = finalWidth + 'px';
      
      // Tính toán chiều cao thực tế của phần thân (body) sau khi container đã co giãn
      const bodyHeight = finalHeight - headerHeight - footerHeight - 110;
      
      // Set chiều cao của cả 3 cột bằng đúng bodyHeight để chúng dài bằng nhau và cột 3 đẩy chữ ký xuống sát đáy
      if (col1El) col1El.style.height = bodyHeight + 'px';
      if (col2El) col2El.style.height = bodyHeight + 'px';
      if (col3El) col3El.style.height = bodyHeight + 'px';
      
      // Chờ thêm 100ms để trình duyệt reflow layout trước khi capture
      setTimeout(captureAndDownload, 100);
    }, 400);

    function captureAndDownload() {
      const finalWidth = parseInt(tempContainer.style.width);
      const finalHeight = parseInt(tempContainer.style.height);
      
      html2canvas(tempContainer, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f8fafc',
        width: finalWidth,
        height: finalHeight
      }).then(canvas => {
        const a = document.createElement('a');
        const d = el('f_date').value || 'bao-cao';
        a.download = 'BaoCao169_' + el('f_proj').value + '_' + d + '.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
        document.body.removeChild(tempContainer);
      }).catch(err => {
        console.error("Lỗi khi xuất ảnh 16:9:", err);
        alert("Lỗi chụp canvas 16:9: " + err.message);
        document.body.removeChild(tempContainer);
      });
    }
  } catch (err) {
    console.error("Lỗi crash trong exportPNG169:", err);
    alert("Lỗi crash trong exportPNG169:\n" + err.message + "\nStack: " + err.stack);
  }
}

/* ---------- init ---------- */
/* v4: mục 02 nhập giọng nói + bóc tách + học thuật ngữ theo dự án */
el('f_proj').addEventListener('change',loadTerms);

// esc() dùng chung đã có ở features.js — không định nghĩa lại ở đây (tránh trùng tên đè nhau).

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
