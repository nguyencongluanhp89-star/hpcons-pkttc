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
  
  // Vượt qua lỗi phình iframe bằng cách tham chiếu chiều rộng của window (trang chính)
  try {
    if (window.innerWidth < clientWidth) {
      clientWidth = window.innerWidth;
    }
  } catch (e) {
    console.warn("Không thể truy cập window.innerWidth:", e);
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
  const logoHtml=`<img src="${logoImg||window.HPCONS_REPORT_LOGO||''}" style="max-height:80px;cursor:pointer" onclick="el('f_logo').click()" title="Nhấn để đổi logo nhà thầu">`;
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
    wTextBox += `<div style="text-align:center;font-weight:700;color:var(--red);font-size:var(--fs-body);margin-top:6px;background:#fdeaea;padding:4px 8px;border-radius:4px;display:inline-block">Thời gian mưa: ${rh} giờ</div><div style="text-align:center"></div>`;
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
      <div class="approve-stamp" style="border: 2.5px dashed var(--green-d); color: var(--green-d); font-weight: 800; font-size: 11px; padding: 5px 8px; border-radius: 6px; display: inline-block; margin-bottom: 0px; transform: rotate(-5deg); background: rgba(46, 107, 34, 0.03); font-family: var(--font-sans); text-align: center;">
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
    </div>
    <div class="ov-info">
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('CÔNG TRÌNH / 工程:', el('f_proj').value); if(v!==null){el('f_proj').value=v;draw()}" title="Nhấn để sửa"><span class="ic">🏗️</span><span class="k">CÔNG TRÌNH / 工程</span><span class="v">${el('f_proj').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('ĐỊA ĐIỂM / 地点:', el('f_loc').value); if(v!==null){el('f_loc').value=v;draw()}" title="Nhấn để sửa"><span class="ic">📍</span><span class="k">ĐỊA ĐIỂM / 地点</span><span class="v">${el('f_loc').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('QUY MÔ / 规模:', el('f_scale').value); if(v!==null){el('f_scale').value=v;draw()}" title="Nhấn để sửa"><span class="ic">🏢</span><span class="k">QUY MÔ / 规模</span><span class="v">${el('f_scale').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('BẮT ĐẦU / 开工:', el('f_start').value); if(v!==null){el('f_start').value=v;recalcFromSched(true)}" title="Nhấn để sửa"><span class="ic">📅</span><span class="k">BẮT ĐẦU / 开工</span><span class="v">${el('f_start').value}</span></div>
      <div class="line" style="cursor:pointer;transition:0.2s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="let v=prompt('HOÀN THÀNH (DK) / 完工:', el('f_end').value); if(v!==null){el('f_end').value=v;recalcFromSched(true)}" title="Nhấn để sửa"><span class="ic">🏁</span><span class="k">HOÀN THÀNH (DK) / 完工</span><span class="v">${el('f_end').value}</span></div>
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

// QUY TẮC khối 03 trong thẻ xuất khổ ngang (Sếp chốt): khu ảnh thi công GIỮ CHỖ CỐ ĐỊNH đủ 8 hình
// (2 cột × 4 hàng) — KHÔNG co lại khi nhiều hạng mục, KHÔNG phình to khi hôm đó ít ảnh. Phần chữ ở
// trên chỉ dùng chỗ còn lại, nhiều thì tự tách 2 cột. Khổ thẻ xuất giữ nguyên, không đổi.
const PHOTO_AREA_PCT = 64;   // % chiều cao khối 03 dành cho khu ảnh

async function exportPNG169() {
  try {
    // RÀNG BUỘC (Sếp 23/07): PHẢI bấm "Nộp duyệt" TRƯỚC khi Xuất ảnh — đảm bảo dữ liệu đã đẩy lên hệ
    // thống. Chưa nộp (draft/rejected) -> KHÓA, không xuất ảnh, báo cho người dùng.
    const _st = window._reportStatus || 'draft';
    if (_st === 'draft' || _st === 'rejected') {
      alert("⚠️ Báo cáo CHƯA được nộp duyệt.\n\nVui lòng bấm nút \"🚀 Nộp duyệt\" để đưa dữ liệu lên hệ thống trước, sau đó mới Xuất ảnh báo cáo.");
      return;
    }
    const dt = fmtDate(el('f_date').value);
    const prog = el('f_prog').value || 0;
    
    // Tải báo cáo tuần cho biểu đồ nhân lực
    let reports = [], curProject = null;
    try {
      const res = await requestParent('GET_DAILY_REPORTS');
      reports = (res && res.reports) || [];
      curProject = res ? res.project : null;
    } catch (e) { console.warn('Không lấy được daily reports cho biểu đồ tuần:', e); }
    
    // Bảng cỡ chữ tập trung (sửa gốc bệnh chữ không đồng đều)
    // V12: chữ nội dung TĂNG +2px mỗi level (Sếp: "tăng thêm 2px"); header trang GIỮ NGUYÊN 54.
    const FS = {
      pageTitle: 54,   // header trang "BÁO CÁO THI CÔNG NGÀY" — GIỮ NGUYÊN size hiện tại
      pageSub:   26,   // phụ đề 每日施工报告 + dòng NGÀY/日期 (24 → 26)
      secTitle:  25,   // tiêu đề khối 01-07 trong secHeaderStatic (23 → 25)
      secNum:    20.5, // ô số hiệu khối 01/02/... (18.5 → 20.5)
      secCn:     18.5, // chữ Trung cạnh tiêu đề khối (16.5 → 18.5)
      body:      22,   // nội dung chính: info khối 01, hạng mục 03, kế hoạch 04, ghi chú 06, ATCLTĐ 07 (20 → 22)
      bodySmall: 18,   // caption ảnh, chữ Trung phụ, dòng BCH/Tổ đội, tên chức danh chữ ký (16 → 18)
      tiny:      15,   // footer, watermark, chữ nhỏ nhất (13 → 15)
      manpower:  120,  // số nhân lực khối 02
      weatherIc: 120   // icon thời tiết khối 02
    };
    // Đồng nhất kiểu chữ theo LEVEL (Sếp yêu cầu): tiêu đề + header = IN ĐẬM, nội dung = IN THƯỜNG.
    const FW = { title: 800, body: 400 };

    // Helper render header các phần giống báo cáo gốc (nền gradient xanh navy đặc, bo góc tròn, viền trái xanh lục)
    function secHeaderStatic(num, titleVi, titleCn) {
      return `
        <div style="background: linear-gradient(90deg, var(--navy) 0%, var(--navy2) 100%); color: #fff; padding: 17px 26px; font-size: ${FS.secTitle}px; font-weight: ${FW.title}; display: flex; align-items: center; letter-spacing: 0.3px; border-left: 8px solid var(--navy2); box-shadow: 0 2px 5px rgba(0,0,0,0.08); text-transform: uppercase; border-radius: 8px; margin-bottom: 20px; line-height: 1.2; flex-shrink: 0; box-sizing: border-box;">
          <span style="background: #fff; color: var(--navy); border-radius: 5px; padding: 6px 12px; font-size: ${FS.secNum}px; font-weight: ${FW.title}; line-height: 1; margin-right: 13px; font-family: 'Outfit', sans-serif;">${num}</span>
          ${titleVi} <span style="font-weight: 400; font-size: ${FS.secCn}px; opacity: 0.85; font-family: Arial; text-transform: none; margin-left: 7px;">/ ${titleCn}</span>
        </div>
      `;
    }

    // Helper hiển thị ảnh tĩnh không tương tác
    function imgStatic(src, phtxt) {
      return src 
        ? `<img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; display:block;">`
        : `<div style="width:100%; height:100%; background:#f8fafc; border: 1px dashed #cbd5e1; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:${FS.bodySmall}px; font-weight: 400; min-height:100px; text-align:center; padding:10px; box-sizing:border-box; line-height:1.3;">${phtxt}</div>`;
    }

    // Xây dựng logo nhà thầu
    // Logo: chiều cao được ÉP BẰNG chiều cao cột giữa (đo bằng JS sau khi render — xem #temp-head-center).
    // KHÔNG dùng align-self:stretch: trong flexbox ảnh vẫn góp chiều cao tự nhiên -> header phình theo ảnh gốc.
    const logoHtml = `<img src="${logoImg||window.HPCONS_REPORT_LOGO||''}" class="hdr-logo" style="width:auto; max-width:100%; object-fit:contain; display:block;">`;
    
    // Xây dựng logo chủ đầu tư
    const logoCdtHtml = logoImgCdt
      ? `<img src="${logoImgCdt}" class="hdr-logo" style="width:auto; max-width:100%; object-fit:contain; display:block;">`
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
      wIconBox = `<div style="font-size: ${FS.weatherIc}px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${weatherIcons[wm] ? weatherIcons[wm].i : '☀️'}</div>`;
    } else {
      wIconBox = `
        <div style="font-size: 90px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${weatherIcons[wm] ? weatherIcons[wm].i : '☀️'}</div>
        <div style="font-size: 28px; color: #cbd5e1; font-weight: 400; transform: rotate(15deg)">/</div>
        <div style="font-size: 90px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${weatherIcons[wa] ? weatherIcons[wa].i : '☀️'}</div>
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
        <div style="border: 2px dashed var(--green-d); color: var(--green-d); font-weight: 400; font-size: ${FS.bodySmall}px; padding: 6px 12px; border-radius: 6px; display: inline-block; transform: rotate(-6deg); background: rgba(46, 107, 34, 0.03); text-align: center; font-family: 'Inter', sans-serif; box-shadow: 0 4px 10px rgba(0,0,0,0.08); line-height: 1.35;">
          ✅ ĐÃ DUYỆT<br>
          <span style="font-size:${FS.bodySmall}px; font-weight: 400;">${esc(appBy)}</span><br>
          <span style="font-size:${FS.tiny}px; font-weight:normal; opacity:0.8;">Ngày: ${appAt}</span>
        </div>
      `;
    } else if (approval === "pending") {
      approveStamp = `
        <div style="border: 1.5px dashed #ea580c; color: #ea580c; font-weight: 400; font-size: ${FS.tiny}px; padding: 4px 8px; border-radius: 4px; display: inline-block; background: rgba(234, 88, 12, 0.03); text-align: center;">
          ⏳ Chờ duyệt
        </div>
      `;
    } else if (approval === "rejected") {
      const reason = reportData.reject_reason || "";
      approveStamp = `
        <div style="border: 1.5px dashed #dc2626; color: #dc2626; font-weight: 400; font-size: ${FS.tiny}px; padding: 4px 8px; border-radius: 4px; display: inline-block; background: rgba(220, 38, 38, 0.03); text-align: center; max-width: 160px; word-break: break-word;">
          ↩ Trả lại${reason ? `<br><span style="font-size: ${FS.tiny}px; font-weight: normal; font-style: italic;">Lý do: ${esc(reason)}</span>` : ''}
        </div>
      `;
    }

    const createdByEsc = esc(createdBy);
    const commanderEsc = esc(reportData.approved_by || commanderName);

    // --- Khối 01: Tổng quan ---
    const activeOvMain = (typeof ovMain !== 'undefined') ? ovMain : null;
    
    // Lưới ảnh tổng quan (chiều cao co lại 240px và 120px để nhường chỗ cho khối 02):
    // ảnh chính full-width bên trên, 2 ảnh phụ chia đôi bên dưới; chiều cao do applyLayout
    // đo bề rộng thực rồi ép = width × 240/532 và width * 120/262.
    const ovImgsHtml = `
      <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; margin-bottom: 14px; flex-shrink: 0;">
        <div class="ov-main-img" style="width: 100%; height: 240px;">${imgStatic(activeOvMain, 'Ảnh tổng quan')}</div>
      </div>
    `;

    const ovInfoHtml = `
      <div style="font-size: ${FS.body}px; margin-top: 5px; line-height: 1.55; flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; min-height: 0;">
        <div style="display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: var(--navy2); font-weight: 400; width: 38px; font-size: ${FS.pageSub}px;">🏗️</span><span style="font-weight: 400; color: var(--navy); width: 225px; font-size: ${FS.bodySmall}px; letter-spacing:0.3px;">CÔNG TRÌNH / 工程</span><span style="flex: 1; color: var(--navy); font-weight: 400; font-size: ${FS.body}px;">${el('f_proj').value}</span></div>
        <div style="display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: var(--navy2); font-weight: 400; width: 38px; font-size: ${FS.pageSub}px;">📍</span><span style="font-weight: 400; color: var(--navy); width: 225px; font-size: ${FS.bodySmall}px; letter-spacing:0.3px;">ĐỊA ĐIỂM / 地点</span><span style="flex: 1; color: #475569; font-weight: 400; font-size: ${FS.body}px; line-height: 1.35;">${el('f_loc').value}</span></div>
        <div style="display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: var(--navy2); font-weight: 400; width: 38px; font-size: ${FS.pageSub}px;">🏢</span><span style="font-weight: 400; color: var(--navy); width: 225px; font-size: ${FS.bodySmall}px; letter-spacing:0.3px;">QUY MÔ / 规模</span><span style="flex: 1; color: #475569; font-weight: 400; font-size: ${FS.body}px; line-height: 1.35;">${el('f_scale').value}</span></div>
        <div style="display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: var(--navy2); font-weight: 400; width: 38px; font-size: ${FS.pageSub}px;">📅</span><span style="font-weight: 400; color: var(--navy); width: 225px; font-size: ${FS.bodySmall}px; letter-spacing:0.3px;">BẮT ĐẦU / 开工</span><span style="flex: 1; color: #475569; font-weight: 400; font-size: ${FS.body}px;">${el('f_start').value}</span></div>
        <div style="display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: var(--navy2); font-weight: 400; width: 38px; font-size: ${FS.pageSub}px;">🏁</span><span style="font-weight: 400; color: var(--navy); width: 225px; font-size: ${FS.bodySmall}px; letter-spacing:0.3px;">HOÀN THÀNH / 完工</span><span style="flex: 1; color: #475569; font-weight: 400; font-size: ${FS.body}px;">${el('f_end').value}</span></div>

        <div style="margin-top: 14px; background: #fafbfc; padding: 16px 20px; border-radius: 10px; border: 1px solid #f1f5f9; flex-shrink: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 400; color: var(--navy); font-size: ${FS.bodySmall}px;">
            <span>TIẾN ĐỘ TỔNG THỂ / 总体进度</span>
            <span style="color: var(--navy2); font-size: ${FS.pageSub}px; font-weight: 400;">${prog}%</span>
          </div>
          <div style="height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 9px;">
            <div style="width: ${prog}%; height: 100%; background: linear-gradient(90deg, var(--navy2) 0%, var(--navy) 100%); border-radius: 8px;"></div>
          </div>
        </div>
      </div>
    `;

    // --- Khối 02: Nhân lực & Thời tiết (khớp mẫu trên màn hình: 2 dòng BCH/Tổ đội + nhãn thời tiết nổi bật) ---
    // Tính toán biểu đồ nhân lực tuần từ Thứ 2 đến Chủ nhật
    const currentDateStr = el('f_date').value;
    const dateParts = currentDateStr.split('-');
    const currDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const dayOfWeek = currDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayDate = new Date(currDate);
    mondayDate.setDate(currDate.getDate() - daysToMonday);

    const weekDays = [];
    const weekDayLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const formatted = `${y}-${m}-${dateVal}`;
      weekDays.push({
        dateStr: formatted,
        label: weekDayLabels[i],
        isFuture: formatted > currentDateStr,
        isCurrent: formatted === currentDateStr
      });
    }

    const currentProj = curProject ? (curProject.id || curProject) : "";
    const projReports = (reports || []).filter(r => r.project_id === currentProj || r.project === currentProj);

    const manpowerData = [];
    for (const day of weekDays) {
      if (day.isFuture) {
        manpowerData.push({ val: null, dateStr: day.dateStr, label: day.label });
      } else if (day.isCurrent) {
        const currentVal = parseInt(el('f_total') ? el('f_total').value : 0) || 0;
        manpowerData.push({ val: currentVal, dateStr: day.dateStr, label: day.label });
      } else {
        const r = projReports.find(x => x.date === day.dateStr);
        const val = r ? (parseInt(r.total_manpower) || 0) : 0;
        manpowerData.push({ val: val, dateStr: day.dateStr, label: day.label });
      }
    }

    // Dữ liệu tuần Gom vào weekData để vẽ bằng toạ độ pixel thật trong layout()
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const day = weekDays[i];
      const data = manpowerData[i];
      weekData.push({
        label: day.label,
        val: data.val,
        isToday: day.isCurrent,
        isFuture: day.isFuture
      });
    }

    function buildWeeklyChart(wPx, hPx, weekData) {
      // Cỡ chữ NEO CỐ ĐỊNH theo hệ FS của báo cáo (KHÔNG tính theo hPx):
      // khung chart cao/thấp theo nội dung từng ngày, nên tỷ lệ hóa theo hPx
      // gây dao động to-nhỏ giữa các lần xuất (đã lặp lỗi 5 vòng V15-V19).
      const fsDay  = 26; // nhãn Thứ 2..CN + số trên điểm (nhỉnh hơn FS.body=22 để nổi trên nền lưới)
      const fsAxis = 26; // số trục Y (Sếp duyệt V21: 22 còn nhỏ, tăng bằng fsDay)
      const fsUnit = 22; // riêng nhãn "(NGƯỜI)" — Sếp chỉnh nhỏ lại bằng FS.body=22 cho khớp chữ toàn báo cáo

      const padLeft = 70;
      const padRight = 64;                // đủ nửa bề rộng chữ "Chủ Nhật" ở 26px, không bị cắt mép phải
      const padTop = fsDay + 36;          // đủ chỗ cho "(NGƯỜI)" đứng TÁCH KHỎI số đỉnh trục Y, không dính
      const padBottom = fsDay + 18;

      const chartW = wPx - padLeft - padRight;
      const chartH = hPx - padTop - padBottom;

      const validVals = weekData.filter(d => d.val !== null).map(d => d.val);
      // Sếp chốt 20/07: đỉnh trục Y cao hơn giá trị max một chút (cột KHÔNG chạm nóc, cao ~67-88%)
      // và mốc trục luôn TRÒN đẹp. Chọn "nice step" (bội 1/1.5/2/2.5/3/5/10 × 10^k) rồi yLimit = step×3.
      const rawMax = Math.max(3, ...validVals);
      const roughStep = (rawMax / 0.9) / 3; // cột cao nhất ~90% khi rawMax chạm mốc chia
      const _pow = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const _n = roughStep / _pow;
      const _nice = _n <= 1 ? 1 : _n <= 1.5 ? 1.5 : _n <= 2 ? 2 : _n <= 2.5 ? 2.5 : _n <= 3 ? 3 : _n <= 5 ? 5 : 10;
      const step = _nice * _pow;
      const yLimit = step * 3;

      const activePoints = [];
      for (let i = 0; i < 7; i++) {
        const d = weekData[i];
        if (d.val !== null) {
          const x = padLeft + i * (chartW / 6);
          const y = padTop + chartH - (d.val / yLimit) * chartH;
          activePoints.push({ x, y, val: d.val, isToday: d.isToday });
        }
      }

      const pathD = activePoints.map((p, idx) => (idx === 0 ? 'M' : 'L') + ` ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const areaD = activePoints.length > 0 
        ? `${pathD} L ${activePoints[activePoints.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${activePoints[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z` 
        : '';

      let verticalGridHtml = '';
      for (let i = 1; i < 7; i++) {
        const x = padLeft + i * (chartW / 6);
        verticalGridHtml += `<line x1="${x.toFixed(1)}" y1="${padTop}" x2="${x.toFixed(1)}" y2="${padTop + chartH}" stroke="#cbd5e1" stroke-width="0.75" stroke-dasharray="3 3" opacity="0.6" />`;
      }

      let horizontalGridHtml = '';
      for (let i = 0; i <= 3; i++) {
        const y = padTop + i * (chartH / 3);
        if (i < 3) {
          horizontalGridHtml += `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${wPx - padRight}" y2="${y.toFixed(1)}" stroke="#cbd5e1" stroke-width="0.75" stroke-dasharray="3 3" opacity="0.6" />`;
        }
      }

      let pathHtml = '';
      if (areaD) {
        pathHtml += `<path d="${areaD}" fill="url(#chart-grad-real)" />`;
      }
      if (pathD) {
        pathHtml += `<path d="${pathD}" fill="none" stroke="#60BB46" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />`;
      }

      let pointsHtml = '';
      activePoints.forEach(p => {
        pointsHtml += `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#60BB46" stroke="none" />
          <text x="${p.x.toFixed(1)}" y="${Math.max(padTop - 4, p.y - Math.round(fsDay * 0.6)).toFixed(1)}" text-anchor="middle" font-size="${fsDay}px" font-weight="700" fill="#0F172A">${p.val}</text>
        `;
      });

      let dayLabelsHtml = '';
      for (let i = 0; i < 7; i++) {
        const x = padLeft + i * (chartW / 6);
        const d = weekData[i];
        let textColor = '#0F172A';
        let fontWeight = '400';
        if (d.isToday) {
          textColor = '#60BB46';
          fontWeight = '700';
        } else if (d.isFuture) {
          textColor = '#94A3B8';
          fontWeight = '400';
        }
        dayLabelsHtml += `
          <text x="${x.toFixed(1)}" y="${hPx - 8}" text-anchor="middle" font-size="${fsDay}px" font-weight="${fontWeight}" fill="${textColor}">${d.label}</text>
        `;
      }

      // Số trục Y kèm vạch đánh dấu "-" tại đúng mốc trên trục (Sếp yêu cầu V21)
      let yLabelsHtml = '';
      let yTicksHtml = '';
      const yMarks = [yLimit, step * 2, step, 0];
      yMarks.forEach((v, i) => {
        const y = padTop + (chartH / 3) * i;
        yLabelsHtml += `<text x="${padLeft - 16}" y="${(y + 8).toFixed(1)}" text-anchor="end" font-size="${fsAxis}px" fill="#0F172A" font-weight="700">${v}</text>`;
        yTicksHtml += `<line x1="${padLeft - 9}" y1="${y.toFixed(1)}" x2="${padLeft}" y2="${y.toFixed(1)}" stroke="#0F172A" stroke-width="2.5" />`;
      });

      // "(NGƯỜI)" nâng cao hẳn, cách số đỉnh trục Y một khoảng rõ (không dính số 12)
      const unitHtml = `<text x="${padLeft}" y="${padTop - fsAxis - 10}" text-anchor="middle" font-size="${fsUnit}px" font-weight="700" fill="#475569">(NGƯỜI)</text>`;

      return `
        <svg width="${wPx}" height="${hPx}" style="font-family: 'Inter', system-ui, sans-serif; overflow: visible;">
          <defs>
            <linearGradient id="chart-grad-real" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#60BB46" stop-opacity="0.22" />
              <stop offset="100%" stop-color="#60BB46" stop-opacity="0.00" />
            </linearGradient>
          </defs>
          <!-- Lưới ngang -->
          ${horizontalGridHtml}
          <!-- Lưới dọc -->
          ${verticalGridHtml}
          
          <!-- Trục tọa độ màu đen tối đậm sắc nét -->
          <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + chartH}" stroke="#0F172A" stroke-width="2.5" />
          <line x1="${padLeft}" y1="${padTop + chartH}" x2="${wPx - padRight}" y2="${padTop + chartH}" stroke="#0F172A" stroke-width="2.5" />

          <!-- Nhãn đơn vị (NGƯỜI) -->
          ${unitHtml}

          <!-- Nhãn trục Y + vạch mốc trên trục -->
          ${yLabelsHtml}
          ${yTicksHtml}
          
          <!-- Đường dữ liệu và vùng gradient -->
          ${pathHtml}
          
          <!-- Các điểm tròn & số trên đỉnh -->
          ${pointsHtml}
          
          <!-- Tên Thứ 2..Chủ Nhật -->
          ${dayLabelsHtml}
        </svg>
      `;
    }

    let weeklyChartSvg = '';

    const wColorMap = { sunny:'#d97706', cloudy:'#475569', rainy:'#2563eb', stormy:'#dc2626' };
    const wColor = wColorMap[wm] || '#d97706';
    let statusText1 = '';
    if (wm === wa) {
      statusText1 = `CẢ NGÀY: ${(weatherIcons[wm] ? weatherIcons[wm].l : 'Nắng đẹp').toUpperCase()}`;
    } else {
      statusText1 = `SÁNG: ${(weatherIcons[wm] ? weatherIcons[wm].l : 'Nắng').toUpperCase()} | CHIỀU: ${(weatherIcons[wa] ? weatherIcons[wa].l : 'Nắng').toUpperCase()}`;
    }

    const isRainy = (wm === 'rainy' || wm === 'stormy' || wa === 'rainy' || wa === 'stormy' || rh > 0);
    let statusText2 = '';
    if (isRainy) {
      if (wnote) {
        statusText2 = wnote;
        const hasHours = wnote.toLowerCase().includes('giờ') || wnote.toLowerCase().includes('h');
        if (rh > 0 && !hasHours) {
          statusText2 += ` · MƯA ẢNH HƯỞNG: ${rh} GIỜ`;
        }
      } else if (rh > 0) {
        statusText2 = `MƯA ẢNH HƯỞNG THI CÔNG: ${rh} GIỜ`;
      }
    }

    const manpowerHtml = `
      <div class="card" style="flex: 1; border: 1px solid #e2e8f0; border-top: 6px solid var(--navy2); border-radius: 12px; padding: 12px 20px; background: rgba(9,106,167,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.01); display: grid; grid-template-rows: auto 1fr 44px 44px; height: 100%; box-sizing: border-box; justify-content: stretch; align-content: stretch; overflow: hidden;">
        <!-- Hàng 1 (Tiêu đề) -->
        <div style="grid-row: 1; font-size: ${FS.body}px; font-weight: 700; color: var(--navy); text-transform: uppercase; text-align: center; letter-spacing: 0.3px; display: flex; align-items: center; justify-content: center; height: 24px;">NHÂN LỰC <span style="font-size: ${FS.bodySmall}px; font-weight: 400; opacity: 0.85; font-family: Arial; text-transform: none; margin-left: 5px;">/ 人员资源</span></div>
        
        <!-- Hàng 2 (Vùng nội dung chính) -->
        <div style="grid-row: 2; display: flex; align-items: center; justify-content: center; min-height: 0;">
          <div style="font-size: ${FS.manpower}px; font-weight: 800; color: var(--navy2); line-height: 1; font-family: 'Outfit', sans-serif; text-align: center; transform: translateY(4px);">${totalManpower}</div>
        </div>
        
        <!-- Hàng 3 (Hàng thông tin 1) -->
        <div style="grid-row: 3; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; font-size: ${FS.body}px; color: #475569; font-weight: 400; padding: 0 12px; box-sizing: border-box; height: 44px;">
          <span><span style="opacity:0.6; margin-right:6px;">👷</span>BCH / 指挥部</span>
          <span style="color: var(--navy); font-weight: 800; font-size: ${FS.body}px;">${String(bch).padStart(2, '0')}</span>
        </div>
        
        <!-- Hàng 4 (Hàng thông tin 2) -->
        <div style="grid-row: 4; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; font-size: ${FS.body}px; color: #475569; font-weight: 400; padding: 0 12px; box-sizing: border-box; height: 44px;">
          <span><span style="opacity:0.6; margin-right:6px;">👥</span>Tổ đội / Nhà thầu phụ</span>
          <span style="color: var(--navy); font-weight: 800; font-size: ${FS.body}px;">${subManpower}</span>
        </div>
      </div>
    `;

    const weatherHtml = `
      <div class="card" style="flex: 1; border: 1px solid #e2e8f0; border-top: 6px solid #3b82f6; border-radius: 12px; padding: 12px 20px; background: #eff6ff; box-shadow: 0 2px 8px rgba(0,0,0,0.01); display: grid; grid-template-rows: auto 1fr 44px 44px; height: 100%; box-sizing: border-box; justify-content: stretch; align-content: stretch; overflow: hidden;">
        <!-- Hàng 1 (Tiêu đề) -->
        <div style="grid-row: 1; font-size: ${FS.body}px; font-weight: 700; color: var(--navy); text-transform: uppercase; text-align: center; letter-spacing: 0.3px; display: flex; align-items: center; justify-content: center; height: 24px;">THỜI TIẾT <span style="font-size: ${FS.bodySmall}px; font-weight: 400; opacity: 0.85; font-family: Arial; text-transform: none; margin-left: 5px;">/ 天气</span></div>
        
        <!-- Hàng 2 (Vùng nội dung chính) -->
        <div style="grid-row: 2; display: flex; align-items: center; justify-content: center; min-height: 0; transform: translateY(-10px);">
          ${wIconBox}
        </div>
        
        <!-- Hàng 3 (Hàng thông tin 1) -->
        <div style="grid-row: 3; display: flex; justify-content: center; align-items: center; border-top: 1px solid #e2e8f0; font-size: ${FS.body}px; font-weight: 800; color: ${wColor}; text-transform: uppercase; padding: 0 12px; box-sizing: border-box; text-align: center; letter-spacing: 0.5px; height: 44px;">
          ${statusText1}
        </div>
        
        <!-- Hàng 4 (Hàng thông tin 2) -->
        <div style="grid-row: 4; display: flex; justify-content: center; align-items: center; border-top: 1px solid ${statusText2 ? '#e2e8f0' : 'transparent'}; font-size: ${FS.body}px; color: #475569; font-weight: 400; padding: 0 12px; box-sizing: border-box; text-align: center; height: 44px; ${statusText2 ? '' : 'visibility: hidden;'}">
          ${statusText2 || 'Ẩn giữ chỗ'}
        </div>
      </div>
    `;

    // --- Khối 03: Hạng mục thi công chi tiết (Việt-Trung) ---
    let worksHtml = '';
    const workBlocks = []; // {lines, html} — để tách 2 cột cân bằng khi hạng mục nhiều
    const activeWorks = (typeof works !== 'undefined' && Array.isArray(works)) ? works : [];
    activeWorks.forEach((w, idx) => {
      const cleanT = stripIdx(w.t);
      const cn = stripIdx((typeof workCN === 'function') ? workCN(cleanT) : '');
      const wt = `<span style="font-weight: 400; color: var(--navy2); margin-right: 7px; font-size: ${FS.body}px;">${idx+1}.</span> ${cleanT}` + (cn ? ` <span style="font-weight: 400;color:#94a3b8; font-size:${FS.bodySmall}px;">/ ${cn}</span>` : '');
      
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
          return `<div style="font-size: ${FS.body}px; color: #334155; margin-top: 8px; padding-left: 19px; position: relative; line-height: 1.5; font-weight: 400;">
            <span style="position: absolute; left: 0; color: #94a3b8; font-weight: 400;">-</span>
            ${o.n}${o.q ? `: <strong style="color:#0f172a; font-weight: 400;">${o.q}</strong>` : ''}
            ${c ? `<span style="color:#94a3b8; font-size: ${FS.bodySmall}px; font-weight: normal; margin-left: 5px;">/ ${c}</span>` : ''}
          </div>`;
        }).join('');
      }

      const nLines = 1 + (w.d ? w.d.split('\n').filter(x => x.trim()).length : 0);
      workBlocks.push({ lines: nLines, html: `
        <div style="border-left: 5px solid ${w.c || '#096AA7'}; padding-left: 16px; margin-bottom: 22px; page-break-inside: avoid;">
          <div style="font-weight: 400; color: #0f172a; font-size: ${FS.body}px; line-height: 1.4;">${wt}</div>
          <div style="margin-top: 6px;">${detailsHtml}</div>
        </div>
      `});
    });
    // QUY TẮC khối 03 (Sếp chốt): khu ẢNH thi công GIỮ NGUYÊN không gian — hạng mục nhiều (>=4)
    // thì danh sách tự tách 1 cột -> 2 CỘT cân bằng (chia theo tổng SỐ DÒNG để 2 cột cao đều),
    // không xếp 1 cột dọc dài chiếm chỗ ảnh.
    if (workBlocks.length >= 4) {
      const totalLines = workBlocks.reduce((s, b) => s + b.lines, 0);
      const left = [], right = []; let acc = 0;
      workBlocks.forEach(b => { if (acc < totalLines / 2) { left.push(b.html); acc += b.lines; } else { right.push(b.html); } });
      if (!right.length && left.length > 1) right.push(left.pop()); // luôn đủ 2 cột
      worksHtml = `<div style="display:flex; gap:20px; align-items:flex-start;">
        <div style="flex:1 1 0; min-width:0;">${left.join('')}</div>
        <div style="flex:1 1 0; min-width:0;">${right.join('')}</div>
      </div>`;
    } else {
      worksHtml = workBlocks.map(b => b.html).join('');
    }
    if (!workBlocks.length) {
      worksHtml = `<div style="color:#94a3b8; font-style:italic; font-size:${FS.bodySmall}px; text-align:center; padding: 40px 0;">Không có hạng mục thi công chi tiết</div>`;
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
          <div style="font-size: ${FS.body}px; color: #1e293b; margin-bottom: 11px; padding-left: 25px; position: relative; line-height: 1.5; font-weight: 400;">
            <span style="position: absolute; left: 0; top: 0px; color: #096AA7; font-weight: 400; font-size: ${FS.body}px;">•</span>
            <strong style="color: #0f172a; font-weight: 400;">${o.n}</strong>${o.q ? `: ${o.q}` : ''}
            ${c ? `<span style="color: #64748b; font-size: ${FS.bodySmall}px; font-weight: normal; margin-left: 7px;">/ ${c}</span>` : ''}
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
        
        const ROW_H = 210;
        drawItemsHtml += `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column; box-shadow: 0 1px 4px rgba(0,0,0,0.04); height: 100%;">
            <div style="flex: 1 1 auto; min-height: 0; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;">
              <img src="${d.img}" class="draw-im-169" style="width: 100%; height: 100%; object-fit: contain; background: #ffffff; display: block;">
            </div>
            <div style="padding: 6px 8px; text-align: center; line-height: 1.3; font-size: ${FS.bodySmall}px; background: #f8fafc; border-top: 1px solid #f1f5f9; flex-shrink: 0;">
              <div style="font-weight: ${FW.body}; color: #0f172a; text-transform: uppercase; line-height: 1.25;">${t_vi}</div>
              ${t_cn ? `<div style="color: #64748b; font-size: ${FS.tiny}px; line-height: 1.25; margin-top: 2px;">${t_cn}</div>` : ''}
            </div>
          </div>
        `;
      });
      
      const ROW_H = 210;
      drawsCardHtml = `
        <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex: 0 0 auto;">
          ${secHeaderStatic('05', 'BẢN VẼ & TỔNG THỂ', '图纸与总体布置图')}
          <div id="draws-grid-169" style="display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: ${ROW_H}px; gap: 10px;">
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
          <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
            <div style="font-weight: 400; color: #166534; font-size: ${FS.bodySmall}px; text-transform: uppercase; display: flex; align-items: center; gap: 7px;">📝 GHI CHÚ / 备注</div>
            <div style="font-size: ${FS.body}px; color: #14532d; margin-top: 7px; line-height: 1.5; white-space: pre-line; font-weight: 400;">${noteVal}</div>
          </div>
        `;
      }
      if (recVal) {
        content += `
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px;">
            <div style="font-weight: 400; color: #b45309; font-size: ${FS.bodySmall}px; text-transform: uppercase; display: flex; align-items: center; gap: 7px;">⚠️ KIẾN NGHỊ / 建议</div>
            <div style="font-size: ${FS.body}px; color: #78350f; margin-top: 7px; line-height: 1.5; white-space: pre-line; font-weight: 400;">${recVal}</div>
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
          <div style="border: 1px solid #dcfce7; background: #f0fdf4; padding: 10px 14px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: ${FS.pageSub}px;">🛡️</span>
            <div style="font-size: ${FS.body}px; color: #166534; line-height: 1.4; font-weight: 400;">
              <strong style="text-transform: uppercase; color: #14532d; font-weight: 400;">An toàn / 安全:</strong> ${safeVal}
            </div>
          </div>
        `;
      }
      if (qualVal) {
        content += `
          <div style="border: 1px solid #dcfce7; background: #f0fdf4; padding: 10px 14px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: ${FS.pageSub}px;">⭐</span>
            <div style="font-size: ${FS.body}px; color: #2E6B22; line-height: 1.4; font-weight: 400;">
              <strong style="text-transform: uppercase; color: #2E6B22; font-weight: 400;">Chất lượng / 质量:</strong> ${qualVal}
            </div>
          </div>
        `;
      }
      if (schedVal) {
        content += `
          <div style="border: 1px solid #ffedd5; background: #fff7ed; padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: ${FS.pageSub}px;">⏱️</span>
            <div style="font-size: ${FS.body}px; color: #c2410c; line-height: 1.4; font-weight: 400;">
              <strong style="text-transform: uppercase; color: #7c2d12; font-weight: 400;">Tiến độ / 进度:</strong> ${schedVal}
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
      const photoGridCols = `repeat(2, 1fr)`;
      // Sếp chốt: giữ 2 CỘT, tối đa 8 ảnh (2×4) — KHÔNG bao giờ 5 hàng. Ảnh thứ 9+ hiện ghi chú "+N".
      const MAX_PHOTOS = 8;
      const shownPhotos = validPhotos.slice(0, MAX_PHOTOS);
      const extraCount  = validPhotos.length - shownPhotos.length;

      photosInlineHtml = `
        <div id="photos-grid-169" style="display: grid; grid-template-columns: ${photoGridCols}; gap: 10px; align-content: start; flex: 1; min-height: 0;">
          ${shownPhotos.map(p => `
            <div style="border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width: 100%;">
              <img src="${p.img}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            </div>
          `).join('')}
        </div>
      `;
    } else {
      photosInlineHtml = `<div style="display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:${FS.bodySmall}px; font-style:italic; border: 1px dashed #e2e8f0; border-radius: 8px; min-height: 80px;">Chưa có ảnh thi công</div>`;
    }

    // Khối chữ ký
    const signatureHtml = `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.01); display: flex; justify-content: space-around; align-items: stretch; text-align: center; min-height: 210px; box-sizing: border-box; flex-shrink: 0; position: relative;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; border-right: 1px solid #f1f5f9; padding-right: 10px; box-sizing: border-box;">
          <div>
            <div style="font-weight: 400; color: #2E6B22; font-size: ${FS.body}px; text-transform: uppercase; line-height: 1.1;">Người lập báo cáo</div>
            <div style="font-size: ${FS.bodySmall}px; color: #94a3b8; font-style: italic; margin-top: 3px;">报告人</div>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 40px;">
            <div style="color: #94a3b8; font-weight: 400; font-size: ${FS.bodySmall}px; font-style: italic; opacity: 0.65;">(Đã ký)</div>
          </div>
          <div style="font-weight: 400; color: #2E6B22; font-size: ${FS.pageSub}px; white-space: nowrap;">${createdByEsc}</div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding-left: 10px; box-sizing: border-box; position: relative;">
          <div>
            <div style="font-weight: 400; color: #2E6B22; font-size: ${FS.body}px; text-transform: uppercase; line-height: 1.1;">Chỉ huy trưởng</div>
            <div style="font-size: ${FS.bodySmall}px; color: #94a3b8; font-style: italic; margin-top: 3px;">施工队长</div>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 40px; position: relative; width: 100%;">
            ${approveStamp || `<div style="color: #cbd5e1; font-size: ${FS.bodySmall}px; font-style: italic;">Chưa duyệt</div>`}
          </div>
          <div style="font-weight: 400; color: #2E6B22; font-size: ${FS.pageSub}px; white-space: nowrap;">${commanderEsc || "Chỉ huy trưởng"}</div>
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
      padding: 58px 36px 44px 36px;
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
      <div id="temp-header" style="display: flex; align-items: flex-start; border-bottom: 3px solid #2E6B22; padding-bottom: 15px; width: 100%; box-sizing: border-box; flex-shrink: 0; background: #ffffff; padding: 18px 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.01);">
        <div style="width: 340px; display: flex; align-items: flex-start; justify-content: flex-start;">
          ${logoHtml}
        </div>
        <div id="temp-head-center" style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
          <div style="font-size: ${FS.pageTitle}px; font-weight: ${FW.title}; color: #2E6B22; letter-spacing: 0.5px; line-height: 1.1;">BÁO CÁO THI CÔNG NGÀY</div>
          <div style="font-size: ${FS.pageSub}px; color: #64748b; font-weight: 400; margin-top: 4px; letter-spacing: 0.5px;">每日施工报告</div>
          <div style="font-size: ${FS.pageSub}px; font-weight: 400; color: #2E6B22; margin-top: 8px; background: #f0fdf4; padding: 5px 18px; border-radius: 22px; border: 1px solid #dcfce7; display: inline-block;">
            NGÀY <span style="font-weight: 400;">/ 日期:</span> ${dt.d} (${dt.w})
          </div>
        </div>
        <div style="width: 340px; display: flex; align-items: flex-start; justify-content: flex-end;">
          ${logoCdtHtml}
        </div>
      </div>

      <!-- Body Layout: 3 Columns -->
      <div id="temp-body" style="flex: 1; display: flex; gap: 20px; width: 100%; box-sizing: border-box; min-height: 0;">
        
        <!-- Cột 1 (30%): Tổng quan & Nhân lực thời tiết. Dồn nội dung lên trên (flex-start), khối 02 giãn lấp đáy. -->
        <div id="temp-col-1" style="flex: 30 1 0; min-width: 0; display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; justify-content: flex-start;">

          <!-- Khối 01: Tổng quan — cao TỰ NHIÊN theo nội dung, thông tin dồn sát trên (không hở giữa, không cắt) -->
          <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex: 0 0 auto;">
            ${secHeaderStatic('01', 'TỔNG QUAN DỰ ÁN', '项目概况')}
            <div style="display: flex; flex-direction: column; justify-content: flex-start;">
              ${ovImgsHtml}
              ${ovInfoHtml}
            </div>
          </div>

          <!-- Khối 02: Nhân lực & Thời tiết — GIÃN lấp hết phần dưới còn lại của cột 1 (to nổi bật, hiển thị trọn vẹn) -->
          <div class="block-02-169" style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 22px 22px 8px 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; flex: 1; min-height: 0;">
            <style>
              .block-02-169 {
                display: flex;
                flex-direction: column;
                flex: 1;
                min-height: 0;
              }
              .content-wrapper-169 {
                display: flex;
                flex-direction: column;
                flex: 1;
                min-height: 0;
              }
              .weather-manpower-section {
                flex: 0 0 45%;
                min-height: 0;
                margin-bottom: 12px;
                display: flex;
                flex-direction: column;
              }
              .weather-manpower-cards-169 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                flex: 1;
                min-height: 0;
                height: 100%;
              }
              .weather-manpower-cards-169 > .card {
                height: 100%;
              }
              .chart-section {
                flex: 0 0 55%;
                min-height: 0;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
              }
              .chart-container-169 {
                flex: 1;
                min-height: 0;
                display: block;
              }
              .chart-container-169 svg {
                width: 100% !important;
                height: 100% !important;
                display: block;
              }
            </style>
            ${secHeaderStatic('02', 'NHÂN LỰC & THỜI TIẾT', '人员与天气')}
            
            <div class="content-wrapper-169">
              <!-- Trên: Card thông tin (Nhân lực & Thời tiết) - chiếm 45% -->
              <div class="weather-manpower-section">
                <div class="weather-manpower-cards-169">
                  ${manpowerHtml}
                  ${weatherHtml}
                </div>
              </div>
              
              <!-- Dưới: Biểu đồ tuần (Biểu đồ nhân lực tuần) - chiếm 55% -->
              <div class="chart-section">
                <div style="font-size: ${FS.body}px; font-weight: 700; color: #2E6B22; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; flex-shrink: 0; padding-left: 4px;">
                  📈 BIỂU ĐỒ NHÂN LỰC TRONG TUẦN / 本周人员图表
                </div>
                <div class="chart-container-169">
                  ${weeklyChartSvg}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Cột 2 (35%): Tiến độ chi tiết + Ảnh thi công (giống format dọc gốc) -->
        <div id="temp-col-2" style="flex: 35 1 0; min-width: 0; display: flex; flex-direction: column; box-sizing: border-box;">
          
          <!-- Khối 03: TIẾN ĐỘ + ẢNH (trái: hạng mục / phải: ảnh thi công - khớp format dọc) -->
          <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; height: 100%; min-height: 0;">
            ${secHeaderStatic('03', 'TIẾN ĐỘ THI CÔNG CHI TIẾT', '详细施工进度')}
            <div style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
              <!-- Trên: Hạng mục — chỉ dùng chỗ CÒN LẠI sau khi khu ảnh đã giữ chỗ; nhiều thì tự tách 2 cột -->
              <div id="works-text-169" style="flex: 1 1 auto; min-height: 0; padding-right: 5px; box-sizing: border-box;">
                <div style="font-size: ${FS.body}px; font-weight: 700; color: #2E6B22; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 11px;">TỔNG HỢP CÁC HẠNG MỤC / 各项目汇总</div>
                ${worksHtml}
              </div>
              <!-- Dưới: Khu ảnh GIỮ CHỖ CỐ ĐỊNH đủ 8 hình (2×4) — không co theo chữ, không phình khi ít ảnh -->
              <div id="photos-sec-169" style="flex: 0 0 ${PHOTO_AREA_PCT}%; min-height: 0; display: flex; flex-direction: column; border-top: 1.5px solid #e8edf5; padding-top: 14px; margin-top: 14px;">
                <div style="font-size: ${FS.body}px; font-weight: 700; color: #2E6B22; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 11px; flex-shrink: 0;">HÌNH ẢNH THI CÔNG TRONG NGÀY / 当日施工照片</div>
                ${photosInlineHtml}
              </div>
            </div>
          </div>

        </div>

        <!-- Cột 3 (35%): Kế hoạch, Ghi chú, Ảnh, Bản vẽ, An toàn & Chữ ký -->
        <div id="temp-col-3" style="flex: 35 1 0; min-width: 0; display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; justify-content: flex-start;">
          
          <!-- Khối 04: Kế hoạch thi công ngày mai -->
          ${planCardHtml}

          <!-- Khối 05: Bản vẽ & Tổng thể -->
          ${drawsCardHtml}

          <!-- Khối 06: Ghi chú & Kiến nghị -->
          ${noteRecCardHtml}

          <!-- Khối 07: An toàn - Chất lượng - Tiến độ -->
          ${safeQualCardHtml}

          <!-- Spacer dồn khoảng trống dư của Cột 3 xuống dưới -->
          <div style="flex: 1 1 auto; min-height: 0;"></div>

          <!-- Chữ ký & Phê duyệt (Luôn luôn nằm đáy) -->
          ${signatureHtml}

        </div>

      </div>

      <!-- Footer -->
      <div id="temp-footer" style="border-top: 3px solid var(--navy); padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: ${FS.tiny}px; color: #94a3b8; font-weight: 400; flex-shrink: 0; box-sizing: border-box; padding-left: 5px; padding-right: 5px;">
        <span>HỆ THỐNG QUẢN LÝ THI CÔNG HP CONS © 2026</span>
        <span style="font-weight: 400; color: var(--navy); display: flex; align-items: center; gap: 6px;">
          <span style="width: 9px; height: 9px; background: var(--navy2); border-radius: 50%;"></span>
          ẢNH XUẤT KHỔ NGANG • CHUẨN TRÌNH CHIẾU BÁO CÁO CAO CẤP
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

      // ÉP chiều cao 2 logo = chiều cao cột giữa (tiêu đề -> hết dòng "NGÀY ...").
      // Làm TRƯỚC khi đo headerHeight, nếu không header sẽ cao theo kích thước gốc của ảnh logo.
      const headCenterEl = document.getElementById('temp-head-center');
      if (headCenterEl) {
        const hcH = Math.round(headCenterEl.getBoundingClientRect().height);
        if (hcH > 0) {
          tempContainer.querySelectorAll('.hdr-logo').forEach(im => { im.style.height = hcH + 'px'; });
        }
      }

      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 106;
      const footerHeight = footerEl ? footerEl.getBoundingClientRect().height : 36;
      
      // V10 — TỈ LỆ NGANG THẬT (hết vuông): chiều RỘNG = chiều CAO × RATIO. Chiều cao chốt theo cột 3.
      // Chống phân kỳ: MỌI ảnh đều LẤP ĐẦY ô (khối 03 + khối 05 chia đều chiều cao còn lại; ảnh tổng
      // quan 01 do khối 02 flex hấp thụ) → không ảnh nào tự tính chiều cao theo bề rộng → an toàn.
      const RATIO = 15 / 9;              // rộng : cao = 15 : 9 (ảnh ngang cân đối)
      const ROW_H = 210;                 // chiều cao cố định mỗi hàng bản vẽ
      const drawRows = validDraws.length > 0 ? Math.ceil(validDraws.length / 2) : 0;
      const DRAW_ALLOWANCE = drawRows > 0 ? (drawRows * ROW_H + (drawRows - 1) * 10) : 0;
      const PHOTO_ROWS = 4;              // khối 03: LUÔN giữ chỗ 4 hàng × 2 cột = đủ 8 hình
      const CHROME = () => headerHeight + footerHeight + 142; // padding dọc 58+44 + 2 gap 20 = 142

      // forceRows: ép số hàng thay vì tính theo số ảnh thực tế (khối 03 luôn giữ chỗ đủ 8 hình).
      function fillGrid(id, forceRows) {
        const g = document.getElementById(id);
        if (!g || !g.children.length) return;
        const gH = g.getBoundingClientRect().height;
        const nrows = forceRows || Math.ceil(g.children.length / 2);   // luôn 2 cột
        const rowH = Math.max(80, Math.floor((gH - (nrows - 1) * 10) / nrows));
        Array.from(g.children).forEach(c => { c.style.height = rowH + 'px'; });
      }

      // Xếp khung cho 1 chiều cao: TỰ đặt width = fh×RATIO rồi lấp đầy ảnh theo bề rộng thực.
      function layout(fh) {
        const fw = Math.round(fh * RATIO);
        tempContainer.style.width = fw + 'px';
        tempContainer.style.height = fh + 'px';
        const bh = fh - CHROME();
        [col1El, col2El, col3El].forEach(c => { if (c) c.style.height = bh + 'px'; });
        // ảnh tổng quan 01 (khối 02 flex hấp thụ nên không lái chiều cao)
        tempContainer.querySelectorAll('.ov-main-img').forEach(b => { const w=b.getBoundingClientRect().width; if(w>0) b.style.height=Math.round(w*240/532)+'px'; });
        tempContainer.querySelectorAll('.ov-sub-img').forEach(b => { const w=b.getBoundingClientRect().width; if(w>0) b.style.height=Math.round(w*120/262)+'px'; });
        // ảnh khối 03 (cột 2): LUÔN chia đủ 4 hàng — ít ảnh cũng không phình to, chỗ vẫn giữ cho đủ 8 hình
        fillGrid('photos-grid-169', PHOTO_ROWS);

        // Đo khung biểu đồ rồi vẽ lại bằng toạ độ pixel thật
        const chartBox = tempContainer.querySelector('.chart-container-169');
        if (chartBox) {
          const r = chartBox.getBoundingClientRect();
          if (r.width > 50 && r.height > 50) {
            chartBox.innerHTML = buildWeeklyChart(Math.round(r.width), Math.round(r.height), weekData);
          }
        }

        return bh;
      }

      // Đo chiều cao PHẦN CHỮ của cột 3 (tạm thu lưới bản vẽ về 0) — để chốt khung không cắt, không phình.
      function col3TextNeed() {
        const dg = document.getElementById('draws-grid-169');
        let savedDisplay = null;
        if (dg) { savedDisplay = dg.style.display; dg.style.display = 'none'; }
        const prev = col3El.style.height; col3El.style.height = 'auto';
        const need = col3El.scrollHeight;
        col3El.style.height = prev;
        if (dg && savedDisplay !== null) { dg.style.display = savedDisplay; }
        return need;
      }

      // Hội tụ: chiều cao = chữ cột 3 + chỗ bản vẽ + khung. Đổi width theo RATIO mỗi lượt.
      let finalH = 1900;                 // seed cho ~15:9
      for (let i = 0; i < 4; i++) {
        layout(finalH);
        const textNeed = col3TextNeed();
        const newH = Math.max(1440, Math.round(textNeed + DRAW_ALLOWANCE + CHROME()));
        if (Math.abs(newH - finalH) < 15) { finalH = newH; break; }
        finalH = newH;
      }
      finalH = Math.min(finalH, 2600);   // chốt an toàn tuyệt đối
      layout(finalH);

      console.log("exportPNG169 completed. finalH:", finalH);

      // Chờ reflow 100ms RỒI đợi TẤT CẢ ảnh (Storage URL) tải xong mới chụp — tránh ảnh trống (vd phần 05).
      setTimeout(() => waitAllImages(tempContainer).then(captureAndDownload), 100);
    }, 400);

    // Đợi mọi <img> trong container tải xong; lỗi/timeout vẫn tiếp để không treo.
    function waitAllImages(container) {
      const imgs = Array.from(container.querySelectorAll('img'));
      return Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(res => {
          img.addEventListener('load', () => res(), { once: true });
          img.addEventListener('error', () => res(), { once: true });
          setTimeout(res, 10000);
        });
      }));
    }

    function captureAndDownload() {
      const finalWidth = parseInt(tempContainer.style.width);
      const finalHeight = parseInt(tempContainer.style.height);
      
      html2canvas(tempContainer, {
        scale: 1.25,
        useCORS: true,
        backgroundColor: '#f8fafc',
        width: finalWidth,
        height: finalHeight
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        window.LAST_EXPORTED_PNG = imgData;
        if (window.AppCore) {
          window.AppCore.LAST_EXPORTED_PNG = imgData;
        }
        const d = el('f_date').value || 'bao-cao';
        const fname = 'BaoCao169_' + el('f_proj').value + '_' + d + '.png';
        document.body.removeChild(tempContainer);
        showExportPreview(imgData, fname);   // xem trước trong app + nút tải về
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

// Chuyển ảnh dataURL -> File để chia sẻ qua Web Share (Zalo/Telegram...).
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new File([u8], filename, { type: mime });
}

// Xem trước ảnh báo cáo 16:9 NGAY TRONG APP + nút Chia sẻ (Zalo/Telegram) + Tải về (không phụ thuộc dialog hệ thống).
function showExportPreview(imgData, filename) {
  const old = document.getElementById('exportPreviewOverlay');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'exportPreviewOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;padding:16px;overflow:auto;-webkit-overflow-scrolling:touch;';
  ov.innerHTML = `
    <div style="width:100%;max-width:900px;display:flex;flex-direction:column;gap:12px;align-items:center;padding-bottom:24px">
      <div style="color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:1.4">Ảnh báo cáo 16:9<br><span style="font-weight:400;font-size:13px;color:#cbd5e1">Gửi thẳng qua Zalo/Telegram, hoặc Tải về / nhấn giữ ảnh để lưu</span></div>
      <img src="${imgData}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.5)">
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:420px;position:sticky;bottom:0">
        <button id="expShareBtn" style="min-height:54px;background:var(--hp-primary,#096AA7);color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(9,106,167,0.45)">📤 Gửi Zalo / Telegram</button>
        <div style="display:flex;gap:12px">
          <button id="expDlBtn" style="flex:1;min-height:48px;background:#334155;color:#fff;border:1px solid #64748b;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer">⬇ Tải về</button>
          <button id="expCloseBtn" style="flex:1;min-height:48px;background:#475569;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer">✕ Đóng</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  document.getElementById('expCloseBtn').onclick = () => ov.remove();

  // Gửi thẳng ảnh qua Zalo/Telegram bằng bảng chia sẻ hệ thống (Web Share) — không phải tải rồi mở app.
  document.getElementById('expShareBtn').onclick = async () => {
    try {
      const file = dataURLtoFile(imgData, filename);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Báo cáo thi công ngày', text: 'Báo cáo thi công ngày' });
      } else {
        alert('Thiết bị chưa hỗ trợ chia sẻ ảnh trực tiếp.\nHãy bấm "Tải về" rồi gửi, hoặc mở app bằng Safari/Chrome (thay vì trong Zalo) để chia sẻ nhanh.');
      }
    } catch (e) { /* người dùng đóng bảng chia sẻ — bỏ qua */ }
  };

  document.getElementById('expDlBtn').onclick = () => {
    const a = document.createElement('a');
    a.download = filename;
    a.href = imgData;
    a.click();
    // Thông báo đã tải
    const t = document.createElement('div');
    t.textContent = '✅ Đã lưu ảnh. Kiểm tra trong Ảnh/Tệp tải về của máy.';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--hp-primary,#096AA7);color:#fff;padding:12px 20px;border-radius:10px;font-weight:700;font-size:13px;z-index:100001;box-shadow:0 4px 14px rgba(0,0,0,0.3);text-align:center;max-width:90vw';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  };
}
window.showExportPreview = showExportPreview;

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
    // Nếu đang mở popup 03 (Hạng mục) mà chuyển sang popup khác -> dịch song ngữ hạng mục trước (liền mạch).
    const grp03 = el('grp-03');
    if (grp03 && grp03.classList.contains('is-modal') && id !== 'grp-03' && typeof window.translateAllWorks === 'function') {
      window.translateAllWorks();
    }
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
  // Nếu đang đóng popup 03 (Hạng mục) -> dịch song ngữ TẤT CẢ hạng mục 1 lần (chạy nền sau khi đóng),
  // tránh dịch/nhảy form khi kỹ sư đang gõ.
  const grp03 = el('grp-03');
  if (grp03 && grp03.classList.contains('is-modal') && typeof window.translateAllWorks === 'function') {
    window.translateAllWorks();
  }
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
['f_proj','f_contractor','f_date','f_loc','f_scale','f_start','f_end','f_prog',
 'f_total','f_bch','f_safe','f_qual','f_sched','f_plan','f_note','f_rec']
 .forEach(id=>el(id).addEventListener('input',draw));
/* đổi NGÀY BÁO CÁO -> tự tính lại % theo lịch */
el('f_date').addEventListener('change', () => recalcFromSched(true));
/* đổi ngày BẮT ĐẦU/KẾT THÚC -> tự tính lại % tiến độ tổng thể */
el('f_start').addEventListener('change', () => recalcFromSched(true));
el('f_end').addEventListener('change', () => recalcFromSched(true));
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

// Kế thừa các phần ÍT ĐỔI (logo/ảnh 01/bản vẽ 05/mẫu 06-07) từ BÁO CÁO GẦN NHẤT của dự án.
// Chỉ điền khi ô/biến đang trống → không đè dữ liệu kỹ sư đang nhập cho ngày hiện tại.
async function applyProjectDefaults() {
  if (!window.AppCore || !window.AppCore.DataService) return;
  try {
    const reports = await window.AppCore.DataService.listDailyReports();
    if (!reports || !reports.length) return;

    const curDate = el('f_date') ? el('f_date').value : '';
    // Báo cáo gần nhất KHÁC ngày đang mở (sắp theo ngày giảm dần)
    const prev = reports
      .filter(r => r && r.date && r.date !== curDate)
      .sort((a, b) => (a.date < b.date ? 1 : (a.date > b.date ? -1 : 0)))[0];
    if (!prev) return;

    if (prev.logo_cdt && !logoImgCdt) logoImgCdt = prev.logo_cdt;
    if (prev.logo_ntc && !logoImg) logoImg = prev.logo_ntc;
    if (prev.ov_main && !ovMain) ovMain = prev.ov_main;
    if (Array.isArray(prev.draws) && prev.draws.length && (!draws || draws.length === 0)) {
      draws = prev.draws.map(d => ({ ...d }));
    }

    // Sếp chốt 22/07: HẠNG MỤC 03 tự lặp lại từ hôm trước — GIỮ TÊN, XÓA chi tiết cũ (nhập mới mỗi
    // ngày, giống nút "Mẫu hôm qua"). Chỉ khi hạng mục đang trống -> không đè dữ liệu đang nhập.
    if (Array.isArray(prev.works_full) && prev.works_full.length && (typeof works !== 'undefined') && (!works || works.length === 0)) {
      works = prev.works_full.map(w => ({ ...w, d: '' }));
      if (typeof renderWorkForm === 'function') renderWorkForm();
    }

    if (prev.f_note && el('f_note') && !el('f_note').value) el('f_note').value = prev.f_note;
    if (prev.f_rec && el('f_rec') && !el('f_rec').value) el('f_rec').value = prev.f_rec;
    if (prev.f_safe && el('f_safe') && !el('f_safe').value) el('f_safe').value = prev.f_safe;
    if (prev.f_qual && el('f_qual') && !el('f_qual').value) el('f_qual').value = prev.f_qual;
    if (prev.f_sched && el('f_sched') && !el('f_sched').value) el('f_sched').value = prev.f_sched;

    if (typeof renderDrawForm === 'function') renderDrawForm();
    saveNotesAndMetrics();
    if (typeof draw === 'function') draw();
  } catch (e) {
    console.warn("applyProjectDefaults lỗi:", e);
  }
}
window.applyProjectDefaults = applyProjectDefaults;

/* --- TỰ ĐỘNG NẠP VÀ ĐỒNG BỘ DỮ LIỆU BÁO CÁO NGÀY --- */
async function loadReportForDate(date) {
  try {
    if (window.AppCore && window.AppCore.DataService) {
      const reports = await window.AppCore.DataService.listDailyReports();
      const report = reports.find(r => r.project_id === window.AppCore.CUR.project && r.date === date);
      // Logo/ảnh tổng quan/bản vẽ là THUỘC TÍNH DỰ ÁN (không lưu trong report) → reset mỗi lần tải
      // để không dính giá trị của dự án trước; sẽ nạp lại theo dự án hiện tại qua applyProjectDefaults().
      logoImg = null; logoImgCdt = null; ovMain = null; ovSub1 = null; ovSub2 = null;
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
        // TIẾN ĐỘ TỔNG THỂ: KHÔNG nạp từ report — luôn tự tính % THỜI GIAN theo ngày báo cáo (Sếp chốt 20/07).
        if (typeof recalcFromSched === 'function') recalcFromSched(true);
        if (el('f_plan') && report.f_plan) el('f_plan').value = report.f_plan;

        // Ảnh tổng quan 01 + logo: nạp từ CHÍNH báo cáo này (đồng bộ giống hệt app chính)
        if (report.logo_cdt) logoImgCdt = report.logo_cdt;
        if (report.logo_ntc) logoImg = report.logo_ntc;
        if (report.ov_main) ovMain = report.ov_main;

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

        // Nạp logo/ảnh mặc định của dự án (báo cáo cũ không lưu logo/ảnh; chỉ điền khi đang trống → không đè dữ liệu report)
        await applyProjectDefaults();

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

        // Nạp các giá trị mặc định của dự án
        await applyProjectDefaults();

        // GĐ2.3: Tự động đồng bộ tiến độ từ app chính
        await syncProgressFromMain();

        if (typeof renderUnitForm === 'function') renderUnitForm();
        if (typeof renderWorkForm === 'function') renderWorkForm();
        if (typeof renderPhotoForm === 'function') renderPhotoForm();
        if (typeof renderDrawForm === 'function') renderDrawForm();
        if (typeof recomputeTotal === 'function') recomputeTotal();

        saveNotesAndMetrics();
        if (typeof draw === 'function') draw();
        if (typeof updateProgress === 'function') updateProgress();
      }

      // TỰ ĐỘNG lấy thời tiết thực tế (tới giờ hiện tại) khi mở app / đổi ngày — CHỈ khi báo cáo
      // còn NHÁP (draft/rejected). Báo cáo đã nộp (pending/approved) giữ nguyên số liệu đã chốt
      // tại thời điểm nộp. Hàm tự bỏ qua nếu dự án chưa khai tọa độ GPS.
      try {
        const _st = window._reportStatus || 'draft';
        if ((_st === 'draft' || _st === 'rejected') && typeof fetchWeatherFromGPS === 'function') {
          await fetchWeatherFromGPS(true);
        }
      } catch (e) { console.warn("Tự động lấy thời tiết khi mở báo cáo lỗi (bỏ qua):", e && e.message); }
    }
  } catch (e) {
    console.error("Lỗi khi tải báo cáo ngày:", e);
  }
}
window.loadReportForDate = loadReportForDate;

// GĐ2.3: Tự động đồng bộ tiến độ dự án từ app chính
async function syncProgressFromMain() {
  // Sếp chốt 20/07: TIẾN ĐỘ TỔNG THỂ = % THỜI GIAN đã trôi tới ngày báo cáo (tính theo ngày
  // Bắt đầu/Kết thúc dự án), đồng bộ Dashboard app chính — KHÔNG theo số hạng mục hoàn thành.
  if (typeof recalcFromSched === 'function') recalcFromSched(true);
}
window.syncProgressFromMain = syncProgressFromMain;

// Lắng nghe sự kiện đổi ngày báo cáo
if (el('f_date')) {
  el('f_date').addEventListener('change', async () => {
    const newDate = el('f_date').value;
    await loadReportForDate(newDate);
  });
}

// Kiểm tra chuyển hướng chờ từ parent
setTimeout(async () => {
  if (window.AppCore && window.AppCore.PENDING_REPORT_NAV) {
    const nav = window.AppCore.PENDING_REPORT_NAV;
    window.AppCore.PENDING_REPORT_NAV = null; // Xóa cờ chờ
    
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
