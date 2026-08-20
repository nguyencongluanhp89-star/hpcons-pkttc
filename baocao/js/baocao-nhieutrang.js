/* =============================================================================
   BỘ PHÂN TRANG BÁO CÁO — CHẾ ĐỘ NHIỀU TRANG            (Sếp chốt 17/08/2026)
   -----------------------------------------------------------------------------
   Đảo ngược nguyên tắc cũ. Bản 1 trang giữ khung co giãn 1440–2600px rồi BÓP nội
   dung cho vừa (thu ô bản vẽ, bóp ảnh dẹt, van chống tràn) — đó là gốc của cả
   chuỗi lỗi khối 05. Chế độ này ngược lại:

       TRANG CÓ KHỔ CỐ ĐỊNH · ẢNH GIỮ TỈ LỆ CHUẨN · THIẾU CHỖ THÌ THÊM TRANG

   Đặc tả Sếp đã chốt:
     · Khổ 15:9, chiều cao CỐ ĐỊNH (không co giãn)
     · Trang 1 luôn có khối 01 + 02; trang 2 trở đi vẫn 3 cột
     · Nội dung chảy tuần tự 03 → 04 → 05 → 06 → 07 → ký tên, tịnh tiến sang
       cột kế rồi sang trang kế
     · Khối 03 giữ 2 cột ảnh; ảnh luôn đủ CẶP, không có ảnh lẻ
     · Ảnh cùng cỡ, cùng tỉ lệ, không méo
     · Chân trang mọi trang ghi "Trang i/n"; ký tên chỉ ở trang cuối
     · Bỏ giới hạn 8 ảnh thi công / 4 bản vẽ — dư thì chảy sang trang sau

   CÁCH LÀM: không dựng lại HTML từ đầu. Bản 1 trang đã dựng sẵn mọi khối trong
   một container ẩn; bộ này ĐỌC LẠI CÁC NODE đó rồi di chuyển sang các trang mới.
   Nhờ vậy không phải viết lại phần dựng khối, rủi ro thấp.
   ========================================================================== */
(function () {
  'use strict';

  var TI_LE_TRANG = 15 / 9;     // khổ ngang Sếp đã chốt
  var CAO_TRANG   = 1900;       // CỐ ĐỊNH — không co giãn nữa
  var RONG_TRANG  = Math.round(CAO_TRANG * TI_LE_TRANG);   // 3167
  var PAD_TREN = 58, PAD_NGANG = 36, PAD_DUOI = 44, GAP = 20;

  var AN_TOAN = 16;             // dự phòng chống sai số làm tròn khi đo chiều cao
  var TI_LE_ANH_03 = 4 / 3;     // ô ảnh thi công
  var TI_LE_ANH_05 = 4 / 3;     // ô bản vẽ

  /* ---------- tiện ích ---------- */

  function tao(tag, css) {
    var e = document.createElement(tag || 'div');
    if (css) e.style.cssText = css;
    return e;
  }

  // Chiều cao thật của node kể cả margin (dùng để cộng dồn khi xếp)
  function caoNode(el) {
    var r = el.getBoundingClientRect();
    var cs = window.getComputedStyle(el);
    return r.height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
  }

  /* ---------- COVER THỦ CÔNG ----------
     html2canvas 1.4.1 KHÔNG hỗ trợ object-fit: trình duyệt vẽ đúng nhưng ảnh
     xuất bị kéo giãn -> méo. Nên tự tính width/height ảnh ra pixel sao cho phủ
     kín ô mà vẫn đúng tỉ lệ gốc; phần thừa để ô overflow:hidden cắt đều.        */
  // Dùng CHUNG hàm hình học của app (render.js): CENTER -> SCALE UNIFORM -> COVER -> CROP
  // SYMMETRIC. Trước đây bộ này giữ một bản sao công thức riêng nên dễ lệch với khối 01/05.
  function coverThuCong(im, wO, hO) {
    if (typeof window.coverTamChung === 'function') return window.coverTamChung(im, wO, hO);
    if (!im || !wO || !hO) return;                     // dự phòng nếu render.js chưa nạp
    var r = (im.naturalWidth && im.naturalHeight) ? (im.naturalWidth / im.naturalHeight) : 1.6;
    var aw = Math.max(wO, Math.round(hO * r));
    var ah = Math.round(aw / r);
    if (ah < hO) { ah = hO; aw = Math.round(ah * r); }
    im.style.width = aw + 'px'; im.style.height = ah + 'px';
    im.style.maxWidth = 'none'; im.style.flexShrink = '0';
    im.style.objectFit = 'fill'; im.style.objectPosition = 'center center';
  }

  // Ô ảnh trong lưới: chiều cao = bề rộng ô ÷ tỉ lệ chuẩn -> MỌI ô cùng cỡ, cùng tỉ lệ
  function chuanHoaLuoiAnh(luoi, tiLe) {
    if (!luoi || !luoi.children.length) return;
    var o = luoi.children[0].getBoundingClientRect();
    if (!o.width) return;
    var hO = Math.round(o.width / tiLe);
    Array.prototype.forEach.call(luoi.children, function (c) {
      var hop = c.querySelector('.draw-imbox-169') || c;
      hop.style.height = hO + 'px';
      hop.style.padding = '0';
      hop.style.overflow = 'hidden';
      hop.style.display = 'flex';
      hop.style.alignItems = 'center';
      hop.style.justifyContent = 'center';
      var im = c.querySelector('img');
      if (im) coverThuCong(im, o.width, hO);
    });
  }

  // Ảnh tổng quan khối 01 / ảnh đơn lẻ: giữ khung sẵn có, chỉ khử méo
  function chuanHoaAnhDon(goc) {
    goc.querySelectorAll('.ov-main-img img, .ov-sub-img img').forEach(function (im) {
      var hop = im.parentElement;
      if (!hop) return;
      var r = hop.getBoundingClientRect();
      if (!r.width || !r.height) return;
      hop.style.overflow = 'hidden';
      hop.style.display = 'flex';
      hop.style.alignItems = 'center';
      hop.style.justifyContent = 'center';
      coverThuCong(im, r.width, r.height);
    });
  }

  /* ---------- dựng một trang rỗng ---------- */

  function dungTrang(bg, headerGoc, footerGoc, caoTrang) {
    var CT = caoTrang || CAO_TRANG;
    var t = tao('div',
      'position:fixed; left:-9999px; top:-9999px;' +
      'width:' + Math.round(CT * TI_LE_TRANG) + 'px; height:' + CT + 'px;' +
      'background-color:' + bg.base + '; background-image:' + bg.image + '; background-size:' + bg.size + ';' +
      'box-sizing:border-box; padding:' + PAD_TREN + 'px ' + PAD_NGANG + 'px ' + PAD_DUOI + 'px ' + PAD_NGANG + 'px;' +
      'display:flex; flex-direction:column; gap:' + GAP + 'px;' +
      "font-family:'Inter', system-ui, -apple-system, sans-serif; color:#0f172a; z-index:-9999;");
    t.className = 'bc-trang-169';

    t.appendChild(headerGoc.cloneNode(true));

    var body = tao('div', 'flex:1; display:flex; gap:' + GAP + 'px; width:100%; box-sizing:border-box; min-height:0;');
    var cot = [];
    // Sep chot 18/08 (thong nhat hien thi): 3 COT CHIA DEU tren MOI trang.
    // Truoc day 30/35/35 nen o anh o cot 1 cua trang 2 tro di chi 446x325 trong khi cot 2/3
    // la 525x382 -> cung mot khoi ma anh hai co. Chia deu thi moi o anh o moi trang bang nhau,
    // va cot 1 rong them nen bieu do nhan luc trang 1 cung de doc hon.
    [1, 1, 1].forEach(function (w) {
      var c = tao('div', 'flex:' + w + ' 1 0; min-width:0; display:flex; flex-direction:column; gap:' + GAP + 'px;' +
                          'box-sizing:border-box; justify-content:flex-start; overflow:hidden;');
      body.appendChild(c); cot.push(c);
    });
    t.appendChild(body);

    var ft = footerGoc.cloneNode(true);
    t.appendChild(ft);
    document.body.appendChild(t);
    return { el: t, cot: cot, footer: ft };
  }

  /* ---------- tách một khối cho vừa cột ----------
     Bốc dần đơn vị cuối của khối ra cho tới khi khối vừa chỗ trống. Đơn vị bốc:
       · data-bc-tach="cap"  -> lưới ảnh: bốc TỪNG CẶP 2 ô (Sếp: không có ảnh lẻ)
       · data-bc-tach="dong" -> danh sách: bốc từng dòng
     Trả về mảng node đã bốc (theo đúng thứ tự) hoặc null nếu không tách được.  */
  function bocChoVua(khoi, hConLai) {
    var thungs = Array.prototype.slice.call(khoi.querySelectorAll('[data-bc-tach]'));
    if (!thungs.length) return null;
    var du = thungs.map(function () { return []; });
    var canh = 0;
    // Bốc từ thùng CUỐI lên đầu. Quan trọng: khối 03 có 2 thùng (danh sách hạng mục rồi lưới
    // ảnh); lưới ảnh ở cuối và cao nhất nên phải bốc nó trước, không thì bốc sạch hạng mục vẫn
    // không đủ chỗ (đúng lỗi bản đầu: sinh ra 13 trang, mỗi trang một khối 03).
    for (var ti = thungs.length - 1; ti >= 0; ti--) {
      var th = thungs[ti];
      var kieu = th.getAttribute('data-bc-tach');
      var buoc = (kieu === 'cap') ? 2 : 1;          // lưới ảnh: bốc TỪNG CẶP -> không có ảnh lẻ
      var giu  = (kieu === 'dong-sau-tieude') ? 1 : 0;   // giữ lại dòng tiêu đề phụ
      while (caoNode(khoi) > hConLai && th.children.length > giu && canh++ < 800) {
        for (var b = 0; b < buoc && th.children.length > giu; b++) {
          du[ti].unshift(th.removeChild(th.children[th.children.length - 1]));
        }
      }
      if (caoNode(khoi) <= hConLai) break;
    }
    var coDu = du.some(function (a) { return a.length; });
    if (!coDu) return null;
    if (caoNode(khoi) > hConLai) {                  // bốc hết vẫn không vừa -> hoàn nguyên
      du.forEach(function (ns, ti) { ns.forEach(function (n) { thungs[ti].appendChild(n); }); });
      return null;
    }
    return { du: du, rong: thungs.every(function (th, ti) {
      var giu = (th.getAttribute('data-bc-tach') === 'dong-sau-tieude') ? 1 : 0;
      return th.children.length <= giu;
    }) };
  }

  /* Khối "(tiếp)" — phần nối của một khối bị tách sang cột/trang khác.
     Sếp báo 18/08: khối 03 sang cột bị LẶP LẠI THÔNG TIN — mỗi khối tiếp mang theo cả thanh
     tiêu đề xanh "03 TIẾN ĐỘ THI CÔNG CHI TIẾT" lẫn dòng "HÌNH ẢNH THI CÔNG TRONG NGÀY",
     nhìn rối và chiếm chỗ nên lại phải tách vụn tiếp (2 khối, mỗi khối chỉ 2 ảnh).
     Nay khối tiếp:
       · BỎ thanh tiêu đề mục (không lặp số mục và tên mục nữa)
       · chỉ giữ MỘT dòng nhãn gọn của phần đang nối, kèm chữ "(tiếp)"
       · tiêu đề phụ của cụm không có nội dung thì ẩn luôn
     Nhờ gọn hơn ~90px mà mỗi khối tiếp chứa được nhiều ảnh hơn, ít lần tách hơn.        */
  function khoiTiep(khoiGoc, phanDu) {
    var moi = khoiGoc.cloneNode(true);
    moi.setAttribute('data-bc-tiep', '1');
    var thungsMoi = Array.prototype.slice.call(moi.querySelectorAll('[data-bc-tach]'));
    var thungsGoc = Array.prototype.slice.call(khoiGoc.querySelectorAll('[data-bc-tach]'));
    if (!thungsMoi.length) return null;

    thungsMoi.forEach(function (th, ti) {
      var kieu = th.getAttribute('data-bc-tach');
      while (th.firstChild) th.removeChild(th.firstChild);
      if (kieu === 'dong-sau-tieude' && thungsGoc[ti] && thungsGoc[ti].children[0]) {
        th.appendChild(thungsGoc[ti].children[0].cloneNode(true));
      }
      (phanDu.du[ti] || []).forEach(function (n) { th.appendChild(n); });
    });

    // Thùng rỗng thì ẩn CHÍNH NÓ (ẩn node cha sẽ mất cả lưới ảnh — lỗi đã gặp), và ẩn luôn
    // tiêu đề phụ đứng ngay trước nó cho khỏi trơ tiêu đề không có nội dung.
    thungsMoi.forEach(function (th) {
      var kieu = th.getAttribute('data-bc-tach');
      var giu = (kieu === 'dong-sau-tieude') ? 1 : 0;
      if (th.children.length <= giu) {
        th.style.display = 'none';
        // tiêu đề phụ đứng NGOÀI thùng (sibling)
        var truoc = th.previousElementSibling;
        if (truoc && truoc.getAttribute && truoc.getAttribute('data-bc-tieudephu') === '1') {
          truoc.style.display = 'none';
        }
        // và tiêu đề phụ nằm NGAY TRONG thùng (khối 03 giữ tiêu đề "TỔNG HỢP CÁC HẠNG MỤC"
        // bên trong thùng) — không ẩn thì bước chọn nhãn sẽ gắn "(tiếp)" vào đúng cái tiêu đề
        // của phần KHÔNG có nội dung, gây hiểu sai.
        Array.prototype.forEach.call(th.querySelectorAll('[data-bc-tieudephu="1"]'), function (x) {
          x.style.display = 'none';
        });
      }
    });

    // Không có nội dung thật nào -> KHÔNG tạo khối tiếp rỗng (từng sinh ra thẻ trống 0 ảnh)
    var coND = thungsMoi.some(function (th) {
      var giu = (th.getAttribute('data-bc-tach') === 'dong-sau-tieude') ? 1 : 0;
      return th.children.length > giu;
    });
    if (!coND) return null;

    // BỎ thanh tiêu đề mục — không lặp lại "03 TIẾN ĐỘ THI CÔNG CHI TIẾT" nữa
    var thanh = moi.querySelector('[data-bc-tieude="1"], .sec-h-169');
    if (thanh && thanh.parentNode) thanh.parentNode.removeChild(thanh);

    // Đánh dấu "(tiếp)" vào ĐÚNG MỘT nhãn: tiêu đề phụ đầu tiên còn hiện
    var nhan = null;
    var dsPhu = Array.prototype.slice.call(moi.querySelectorAll('[data-bc-tieudephu="1"]'));
    for (var k = 0; k < dsPhu.length; k++) {
      if (dsPhu[k].style.display !== 'none') { nhan = dsPhu[k]; break; }
    }
    if (nhan) {
      if (String(nhan.textContent).indexOf('(tiếp)') < 0) {
        var sp = tao('span', 'font-weight:400; opacity:.8;');
        sp.textContent = '  (tiếp)';
        nhan.appendChild(sp);
      }
    } else {
      // Khối không có tiêu đề phụ nào (ví dụ khối 04/06) -> thêm một dòng nhãn nhỏ
      var d = tao('div', 'font-size:20px; font-weight:400; color:#64748b; margin-bottom:8px;');
      d.textContent = '(tiếp)';
      moi.insertBefore(d, moi.firstChild);
    }
    return moi;
  }

  /* ---------- TRANG PHỤ LỤC: HÌNH ẢNH THI CÔNG / BẢN VẼ ----------
     Sếp chốt 18/08: sau khi thể hiện xong các thẻ 01 -> ký tên thì mới tới trang riêng cho
     Hình ảnh thi công, rồi trang riêng cho Bản vẽ.
       · Ô ảnh TỈ LỆ 3:2 — trung hòa giữa 4:3 và 16:9 nên cả hai loại chỉ bị cắt ~11%,
         không ảnh nào méo (dùng chung quy tắc CENTER -> SCALE UNIFORM -> COVER -> CROP).
       · Mọi ô trên trang CÙNG MỘT KÍCH THƯỚC.
       · Trang ảnh thi công: 3 cột × 2 hàng = 6 ô, không chú thích.
       · Trang bản vẽ: 2 cột × 2 hàng = 4 ô, dưới mỗi ô có mô tả.
     Ô của hai loại trang được giữ cùng cỡ (~1000×667) nên toàn báo cáo thống nhất; trang bản
     vẽ vì thế canh giữa và chừa lề hai bên thay vì kéo ô rộng ra thành tỉ lệ khác.          */
  var TI_LE_O_PHULUC = 3 / 2;

  function dungCacTrangPhuLuc(pl, bg, headerGoc, footerGoc, caoTrang, trangs) {
    if (!pl) return;
    var oGoc = Array.prototype.slice.call(pl.querySelectorAll('.pl-o-169'));
    if (!oGoc.length) return;

    var soCot = parseInt(pl.getAttribute('data-bc-cot'), 10) || 3;
    var soHang = parseInt(pl.getAttribute('data-bc-hang'), 10) || 2;
    var moiTrang = soCot * soHang;
    var tieuVi = pl.getAttribute('data-bc-tieu-vi') || '';
    var tieuCn = pl.getAttribute('data-bc-tieu-cn') || '';
    var GAP_O = 16;

    // Bề rộng ô CHUẨN tính theo trang ảnh 3 cột -> mọi trang phụ lục dùng đúng cỡ ô này
    var rongTrang = Math.round(caoTrang * TI_LE_TRANG);
    var rongND = rongTrang - PAD_NGANG * 2 - 44;            // trừ padding trang + padding thẻ
    var wO = Math.floor((rongND - 2 * GAP_O) / 3);
    var hO = Math.round(wO / TI_LE_O_PHULUC);

    for (var b = 0; b < oGoc.length; b += moiTrang) {
      var nhom = oGoc.slice(b, b + moiTrang);
      var tr = dungTrangPhuLucRong(bg, headerGoc, footerGoc, caoTrang);
      var the = tao('div',
        'background:#ffffff; border:1px solid #f1f5f9; border-radius:12px; padding:14px 22px 18px;' +
        'box-shadow:0 4px 20px rgba(0,0,0,0.02); display:flex; flex-direction:column;' +
        'box-sizing:border-box; flex:1; min-height:0;');

      var tieu = tao('div',
        'background:linear-gradient(90deg,#075687 0%,#096AA7 100%); color:#fff; padding:17px 26px;' +
        'font-size:34px; font-weight:800; display:flex; align-items:center; letter-spacing:0.3px;' +
        'border-left:8px solid #096AA7; border-radius:8px; margin-bottom:18px; line-height:1.2; flex-shrink:0;');
      tieu.innerHTML = tieuVi
        + (tieuCn ? ' <span style="font-weight:400; font-size:24px; opacity:.85; font-family:Arial; margin-left:9px;">/ ' + tieuCn + '</span>' : '')
        + (oGoc.length > moiTrang
            ? ' <span style="font-weight:400; font-size:22px; opacity:.85; margin-left:auto;">'
              + (Math.floor(b / moiTrang) + 1) + '/' + Math.ceil(oGoc.length / moiTrang) + '</span>'
            : '');
      the.appendChild(tieu);

      var luoi = tao('div',
        'display:grid; grid-template-columns:repeat(' + soCot + ', ' + wO + 'px);' +
        'gap:' + GAP_O + 'px; justify-content:center; align-content:start;');
      nhom.forEach(function (o) { luoi.appendChild(o); });
      the.appendChild(luoi);
      tr.than.appendChild(the);
      trangs.push(tr);

      // Chuẩn hoá ô: cùng một kích thước, ảnh cover theo tâm nên không méo
      nhom.forEach(function (o) {
        o.style.cssText = 'display:flex; flex-direction:column; border:1px solid #e2e8f0;' +
          'border-radius:8px; overflow:hidden; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.04);';
        var hop = o.querySelector('.pl-im-169');
        if (hop) {
          hop.style.cssText = 'width:' + wO + 'px; height:' + hO + 'px; overflow:hidden;' +
            'display:flex; align-items:center; justify-content:center; background:#fff;';
          coverThuCong(hop.querySelector('img'), wO, hO);
        }
        var cap = o.querySelector('.pl-cap-169');
        if (cap) {
          cap.style.cssText = 'padding:10px 12px; text-align:center; font-size:24px; font-weight:700;' +
            'color:#0f172a; text-transform:uppercase; background:#f8fafc; border-top:1px solid #f1f5f9;' +
            'line-height:1.3; flex-shrink:0;';
          var cn = cap.querySelector('.pl-cap-cn-169');
          if (cn) cn.style.cssText = 'display:block; font-weight:400; text-transform:none; color:#64748b; font-size:20px; margin-top:3px;';
        }
      });
    }
  }

  // Trang phụ lục dùng TOÀN BỘ bề rộng (không chia 3 cột như trang chính)
  function dungTrangPhuLucRong(bg, headerGoc, footerGoc, caoTrang) {
    var CT = caoTrang || CAO_TRANG;
    var t = tao('div',
      'position:fixed; left:-9999px; top:-9999px;' +
      'width:' + Math.round(CT * TI_LE_TRANG) + 'px; height:' + CT + 'px;' +
      'background-color:' + bg.base + '; background-image:' + bg.image + '; background-size:' + bg.size + ';' +
      'box-sizing:border-box; padding:' + PAD_TREN + 'px ' + PAD_NGANG + 'px ' + PAD_DUOI + 'px ' + PAD_NGANG + 'px;' +
      'display:flex; flex-direction:column; gap:' + GAP + 'px;' +
      "font-family:'Inter', system-ui, -apple-system, sans-serif; color:#0f172a; z-index:-9999;");
    t.className = 'bc-trang-169';
    t.appendChild(headerGoc.cloneNode(true));
    var than = tao('div', 'flex:1; display:flex; width:100%; box-sizing:border-box; min-height:0;');
    t.appendChild(than);
    var ft = footerGoc.cloneNode(true);
    t.appendChild(ft);
    document.body.appendChild(t);
    return { el: t, cot: [than, than, than], than: than, footer: ft, laPhuLuc: true };
  }

  /* ---------- xếp trang ---------- */

  function xepTrang(opts) {
    var goc = opts.nguon, bg = opts.bg;
    var header = goc.querySelector('#temp-header');
    var footer = goc.querySelector('#temp-footer');
    var c1 = goc.querySelector('#temp-col-1');
    var c2 = goc.querySelector('#temp-col-2');
    var c3 = goc.querySelector('#temp-col-3');
    if (!header || !footer || !c1 || !c2 || !c3) throw new Error('Không tìm thấy header/cột trong bản dựng gốc');

    // Khối 01 + 02 (cố định trang 1) và dòng chảy 03 -> ký tên
    var coDinh = Array.prototype.slice.call(c1.children);
    var dongChay = []
      .concat(Array.prototype.slice.call(c2.children))
      .concat(Array.prototype.slice.call(c3.children))
      .filter(function (n) { return n.textContent.trim() !== '' || n.querySelector('img'); }); // bỏ spacer rỗng

    // Sếp chốt 18/08: ảnh thi công có TRANG RIÊNG nên gỡ cụm ảnh ra khỏi thẻ 03; thẻ 03 chỉ
    // còn phần tiến độ hạng mục. Chỉ gỡ khi thật sự có ảnh để dựng trang riêng.
    var plAnh = goc.querySelector('[data-bc-phuluc="anh"]');
    var plVe  = goc.querySelector('[data-bc-phuluc="ve"]');
    var coAnhPL = plAnh && plAnh.querySelectorAll('.pl-o-169').length > 0;
    if (coAnhPL) {
      var cumAnh = goc.querySelector('[data-bc-goneuphuluc="1"]');
      if (cumAnh && cumAnh.parentNode) cumAnh.parentNode.removeChild(cumAnh);
    }

    var trangs = [];
    var caoTrang = CAO_TRANG;          // có thể nới lên nếu cột trái cần thêm chỗ cho khối 02
    var tr = dungTrang(bg, header, footer, caoTrang);
    trangs.push(tr);

    // Trang 1: cột 1 nhận khối 01 + 02 nguyên khối
    coDinh.forEach(function (n) {
      n.setAttribute('data-bc-codinh', '1');   // khối 01 + 02: KHOÁ ở cột 1 trang 1, không được dời
      tr.cot[0].appendChild(n);
    });
    var hCot = tr.cot[0].getBoundingClientRect().height;

    // Chia chỗ cột 1 theo nguyên tắc Sếp chốt: KHỐI 02 ĐƯỢC ƯU TIÊN DIỆN TÍCH, thiếu chỗ thì
    // giảm khối 01 trước. Việc chia do render.js quyết định (nó biết cấu trúc khối 01/02 và
    // hàm vẽ biểu đồ); ở đây chỉ đưa cột 1 và chiều cao cột thật cho nó.
    if (typeof opts.chiaCot1 === 'function' && coDinh.length >= 2) {
      try { opts.chiaCot1(tr.cot[0], hCot); } catch (e) { console.warn('chiaCot1 lỗi:', e && e.message); }
      // Sếp chốt: KHÔNG được cắt nội dung nào. Nếu khối 01 đã nén hết mức mà cột vẫn không đủ
      // chỗ cho khối 02 giữ sàn -> NỚI CHIỀU CAO TRANG cho vừa, chứ không bóp khối nào lại.
      // Đúng nguyên tắc "thiết kế bố cục để vừa khối 02", không phải ngược lại.
      for (var lanNoi = 0; lanNoi < 2; lanNoi++) {
        var doiC1 = tr.cot[0].scrollHeight - tr.cot[0].clientHeight;
        if (doiC1 <= 4) break;
        caoTrang = Math.min(2600, caoTrang + doiC1 + 10);
        tr.el.style.height = caoTrang + 'px';
        tr.el.style.width = Math.round(caoTrang * TI_LE_TRANG) + 'px';
        hCot = tr.cot[0].getBoundingClientRect().height;
        try { opts.chiaCot1(tr.cot[0], hCot); } catch (e) {}
      }
    } else if (coDinh.length) {
      var cuoi = coDinh[coDinh.length - 1];
      var daDungC1 = 0;
      coDinh.forEach(function (n, i) { if (i < coDinh.length - 1) daDungC1 += caoNode(n) + GAP; });
      cuoi.style.flex = '0 0 auto';
      cuoi.style.height = Math.max(200, Math.round(hCot - daDungC1)) + 'px';
      cuoi.style.minHeight = '0';
    }

    var iCot = 1;                       // trang 1 bắt đầu chảy từ cột 2
    var hang = dongChay.slice();
    var canh = 0;

    // Khối trong bản 1 trang có thể mang height:100% / flex:1 (để giãn lấp cột). Khi phân trang
    // thì chiều cao phải TỰ NHIÊN theo nội dung, không thì không đo được.
    function caoTuNhien(n) {
      n.style.height = 'auto';
      n.style.flex = '0 0 auto';
      n.style.minHeight = '0';
    }

    // Sang cột kế; hết cột 3 thì mở trang mới
    function sangCotKe() {
      iCot++;
      if (iCot > 2) {
        tr = dungTrang(bg, header, footer, caoTrang);
        trangs.push(tr);
        iCot = 0;
        hCot = tr.cot[0].getBoundingClientRect().height || hCot;
      }
    }

    while (hang.length && canh++ < 600) {
      var khoi = hang.shift();
      var cot = tr.cot[iCot];
      var daDung = 0;
      Array.prototype.forEach.call(cot.children, function (c) { daDung += caoNode(c) + GAP; });
      // Trừ dự phòng an toàn: sai số làm tròn / border / shadow từng làm hàng ảnh cuối của
      // khối 03 nhô quá đáy cột rồi bị cắt (Sếp báo 17/08).
      var conLai = hCot - daDung - AN_TOAN;
      var cotRong = cot.children.length === 0;

      caoTuNhien(khoi);
      cot.appendChild(khoi);
      // Lưới ảnh phải chuẩn hoá TRƯỚC khi đo, vì chiều cao ô do tỉ lệ chuẩn quyết định
      chuanHoaLuoiAnh(khoi.querySelector('#photos-grid-169'), TI_LE_ANH_03);
      chuanHoaLuoiAnh(khoi.querySelector('#draws-grid-169'), TI_LE_ANH_05);

      if (caoNode(khoi) <= conLai + 1) continue;      // vừa chỗ -> xong

      // Không vừa: thử tách
      var du = bocChoVua(khoi, conLai);
      if (du) {
        var tiep = khoiTiep(khoi, du);
        if (du.rong) cot.removeChild(khoi);           // khối gốc rỗng hẳn -> bỏ, chỉ giữ phần tiếp
        if (tiep) hang.unshift(tiep);
        sangCotKe();                                  // cột này đã đầy -> phần tiếp sang cột kế
        continue;
      }

      // Không tách được. Cột đang RỖNG mà vẫn không vừa -> đành để nguyên ở đây, nếu đẩy tiếp
      // sẽ lặp vô hạn (lỗi bản đầu: sinh 13 trang trống).
      if (cotRong) { sangCotKe(); continue; }

      cot.removeChild(khoi);
      hang.unshift(khoi);
      sangCotKe();
    }

    // ===== GỘP CÁC KHỐI "(tiếp)" LIỀN NHAU TRONG CÙNG MỘT CỘT =====
    // Sếp báo 18/08: khối 03 sang cột sinh ra HAI khối "(tiếp)" cạnh nhau, mỗi khối chỉ 2 ảnh.
    // Hai khối liền nhau thì gộp làm một: dồn nội dung thùng của khối sau vào khối trước rồi
    // bỏ khối sau. Gộp chỉ làm THẤP đi (bớt một vỏ thẻ + một nhãn) nên không thể gây tràn.
    trangs.forEach(function (t) {
      if (t.laPhuLuc) return;
      t.cot.forEach(function (c) {
        var i = 0;
        while (i < c.children.length - 1) {
          var a = c.children[i], b = c.children[i + 1];
          if (a.getAttribute('data-bc-tiep') === '1' && b.getAttribute('data-bc-tiep') === '1') {
            var thA = Array.prototype.slice.call(a.querySelectorAll('[data-bc-tach]'));
            var thB = Array.prototype.slice.call(b.querySelectorAll('[data-bc-tach]'));
            if (thA.length === thB.length && thA.length) {
              thB.forEach(function (tb, k) {
                var giu = (tb.getAttribute('data-bc-tach') === 'dong-sau-tieude') ? 1 : 0;
                while (tb.children.length > giu) thA[k].appendChild(tb.children[giu]);
                if (thA[k].children.length > 0) {
                  thA[k].style.display = '';
                  var truoc = thA[k].previousElementSibling;
                  if (truoc && truoc.getAttribute && truoc.getAttribute('data-bc-tieudephu') === '1') {
                    truoc.style.display = '';
                  }
                }
              });
              c.removeChild(b);
              continue;                       // thử gộp tiếp khối kế nếu cũng là "(tiếp)"
            }
          }
          i++;
        }
      });
    });

    // ===== VÒNG KIỂM CUỐI — KHÔNG CỘT NÀO ĐƯỢC PHÉP TRÀN =====
    // Sếp báo 17/08: hàng ảnh cuối của khối 03 bị cắt bởi giới hạn trang. Đây là mất nội dung.
    // Thay vì đoán chỗ đo sai, thêm bước kiểm tra thật: quét mọi cột của mọi trang, cột nào còn
    // tràn thì BỐC BỚT đơn vị cuối (lưới ảnh bốc theo cặp) và đưa phần dư xuống vị trí kế tiếp
    // (cột kế, hết cột thì trang mới). Không dùng overflow/crop để che.
    function viTriKeTiep(iTrang, iCot) {
      if (iCot < 2) return { t: iTrang, c: iCot + 1 };
      if (iTrang + 1 < trangs.length) return { t: iTrang + 1, c: 0 };
      trangs.push(dungTrang(bg, header, footer, caoTrang));
      return { t: trangs.length - 1, c: 0 };
    }

    for (var vong = 0; vong < 12; vong++) {
      var conTran = false;
      for (var it = 0; it < trangs.length; it++) {
        if (trangs[it].laPhuLuc) continue;   // trang phụ lục có ô chốt sẵn, không tách/bốc gì
        for (var ic = 0; ic < 3; ic++) {
          var cotK = trangs[it].cot[ic];
          if (!cotK.children.length) continue;
          var doi = cotK.scrollHeight - cotK.clientHeight;
          if (doi <= 2) continue;
          conTran = true;
          var khoiCuoi = cotK.lastElementChild;
          // Khối 01/02 bị khoá ở cột 1 trang 1 (Sếp chốt: trang 1 luôn có khối 01 + 02).
          // Cột này tràn thì NỚI CHIỀU CAO MỌI TRANG cho vừa, tuyệt đối không dời hai khối đó đi.
          if (khoiCuoi.getAttribute('data-bc-codinh') === '1') {
            caoTrang = Math.min(2600, caoTrang + doi + AN_TOAN);
            trangs.forEach(function (tt) {
              tt.el.style.height = caoTrang + 'px';
              tt.el.style.width = Math.round(caoTrang * TI_LE_TRANG) + 'px';
            });
            if (typeof opts.chiaCot1 === 'function') {
              try { opts.chiaCot1(trangs[0].cot[0], trangs[0].cot[0].getBoundingClientRect().height); } catch (e) {}
            }
            continue;
          }
          var caoKhoi = caoNode(khoiCuoi);
          var choKhoi = caoKhoi - doi - AN_TOAN;        // chỗ khối này thực sự được phép chiếm
          var duK = bocChoVua(khoiCuoi, Math.max(80, choKhoi));
          var vt = viTriKeTiep(it, ic);
          if (duK) {
            var tiepK = khoiTiep(khoiCuoi, duK);
            if (duK.rong) cotK.removeChild(khoiCuoi);
            if (tiepK) {
              trangs[vt.t].cot[vt.c].insertBefore(tiepK, trangs[vt.t].cot[vt.c].firstChild);
              tiepK.style.flex = '0 0 auto'; tiepK.style.height = 'auto'; tiepK.style.minHeight = '0';
              chuanHoaLuoiAnh(tiepK.querySelector('#photos-grid-169'), TI_LE_ANH_03);
              chuanHoaLuoiAnh(tiepK.querySelector('#draws-grid-169'), TI_LE_ANH_05);
            }
          } else if (cotK.children.length > 1) {
            // không tách được -> dời cả khối cuối xuống vị trí kế tiếp
            cotK.removeChild(khoiCuoi);
            trangs[vt.t].cot[vt.c].insertBefore(khoiCuoi, trangs[vt.t].cot[vt.c].firstChild);
          }
        }
      }
      if (!conTran) break;
    }

    // ===== HAI TRANG PHỤ LỤC (sau khi đã hết dòng chảy chính, tức sau vùng ký tên) =====
    // Sếp chốt 18/08: "sau khi thể hiện các trường thông tin từ thẻ 1 đến ký tên thì đến mục
    // hình ảnh thi công ở trang mới", rồi tới trang Bản vẽ.
    try { dungCacTrangPhuLuc(plAnh, bg, header, footer, caoTrang, trangs); } catch (e) { console.warn('trang ảnh lỗi:', e && e.message); }
    try { dungCacTrangPhuLuc(plVe,  bg, header, footer, caoTrang, trangs); } catch (e) { console.warn('trang bản vẽ lỗi:', e && e.message); }

    // Chân trang: ghi "Trang i/n"
    trangs.forEach(function (t, i) {
      var o = t.footer.querySelector('span:last-child') || t.footer.lastElementChild;
      if (o) {
        var nhan = tao('span', 'font-weight:400;');
        nhan.textContent = '  •  TRANG ' + (i + 1) + '/' + trangs.length;
        o.appendChild(nhan);
      }
    });

    // Ảnh đơn lẻ (khối 01) khử méo sau khi đã vào trang thật
    trangs.forEach(function (t) { if (!t.laPhuLuc) chuanHoaAnhDon(t.el); });

    // Khối 02 (số nhân lực + biểu đồ tuần) phải vẽ lại theo kích thước THẬT của trang mới.
    // Không làm bước này thì SVG biểu đồ giữ khổ cũ -> bị cắt, và số nhân lực tràn khỏi ô.
    if (typeof opts.hieuChinh === 'function') {
      trangs.forEach(function (t) { try { opts.hieuChinh(t.el); } catch (e) {} });
    }

    return trangs;
  }

  function don(trangs) {
    trangs.forEach(function (t) { if (t.el && t.el.parentNode) t.el.parentNode.removeChild(t.el); });
  }

  /* ---------- chụp từng trang thành PNG ---------- */

  function chupCacTrang(trangs, bgBase, scale) {
    var ds = [];
    return trangs.reduce(function (p, t) {
      return p.then(function () {
        return html2canvas(t.el, {
          scale: scale || 1.25,
          useCORS: true,
          backgroundColor: bgBase,
          width: parseInt(t.el.style.width) || RONG_TRANG,   // trang có thể đã được nới -> lấy khổ THẬT
          height: parseInt(t.el.style.height) || CAO_TRANG
        }).then(function (cv) { ds.push(cv.toDataURL('image/png')); });
      });
    }, Promise.resolve()).then(function () { return ds; });
  }

  /* ---------- xem trước nhiều trang trong app ---------- */

  function xemTruocNhieuTrang(anhs, tenGoc) {
    var cu = document.getElementById('exportPreviewOverlay');
    if (cu) cu.remove();
    var ov = tao('div',
      'position:fixed; inset:0; z-index:100000; background:rgba(0,0,0,.92); display:flex;' +
      'flex-direction:column; align-items:center; padding:16px; overflow:auto; -webkit-overflow-scrolling:touch;');
    ov.id = 'exportPreviewOverlay';

    var ten = anhs.map(function (_, i) { return tenGoc + '_trang' + (i + 1) + '.png'; });
    var anhHtml = anhs.map(function (d, i) {
      return '<div style="width:100%; display:flex; flex-direction:column; gap:6px; align-items:center;">' +
             '<div style="color:#93c5fd; font-size:13px; font-weight:700;">TRANG ' + (i + 1) + '/' + anhs.length + '</div>' +
             '<img src="' + d + '" style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 8px 30px rgba(0,0,0,.5);"></div>';
    }).join('');

    ov.innerHTML =
      '<div style="width:100%; max-width:900px; display:flex; flex-direction:column; gap:14px; align-items:center; padding-bottom:24px">' +
        '<div style="color:#fff; font-weight:700; font-size:15px; text-align:center; line-height:1.4">' +
          'Báo cáo ' + anhs.length + ' trang<br>' +
          '<span style="font-weight:400; font-size:13px; color:#cbd5e1">Gửi cả ' + anhs.length +
          ' ảnh qua Zalo/Telegram, hoặc tải về từng ảnh</span></div>' +
        anhHtml +
        '<div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:420px; position:sticky; bottom:0">' +
          '<button id="bcShareAll" style="min-height:54px; background:#096AA7; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(9,106,167,.45)">📤 Gửi cả ' + anhs.length + ' ảnh</button>' +
          '<div style="display:flex; gap:12px">' +
            '<button id="bcDlAll" style="flex:1; min-height:48px; background:#334155; color:#fff; border:1px solid #64748b; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer">⬇ Tải tất cả</button>' +
            '<button id="bcClose" style="flex:1; min-height:48px; background:#475569; color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer">✕ Đóng</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    document.getElementById('bcClose').onclick = function () { ov.remove(); };

    document.getElementById('bcShareAll').onclick = function () {
      try {
        var files = anhs.map(function (d, i) {
          return (typeof dataURLtoFile === 'function') ? dataURLtoFile(d, ten[i]) : null;
        }).filter(Boolean);
        if (files.length && navigator.canShare && navigator.canShare({ files: files })) {
          navigator.share({ files: files, title: 'Báo cáo thi công ngày', text: 'Báo cáo thi công ngày' })
            .catch(function () {});
        } else {
          alert('Thiết bị chưa hỗ trợ gửi nhiều ảnh một lượt.\nHãy bấm "Tải tất cả" rồi gửi, hoặc mở app bằng Chrome/Safari.');
        }
      } catch (e) {}
    };

    document.getElementById('bcDlAll').onclick = function () {
      anhs.forEach(function (d, i) {
        setTimeout(function () {
          var a = document.createElement('a');
          a.href = d; a.download = ten[i];
          document.body.appendChild(a); a.click(); a.remove();
        }, i * 350);   // giãn nhịp để trình duyệt không chặn loạt tải
      });
    };
  }

  window.BCNhieuTrang = {
    chupCacTrang: chupCacTrang,
    xemTruocNhieuTrang: xemTruocNhieuTrang,
    xepTrang: xepTrang,
    don: don,
    CAO_TRANG: CAO_TRANG,
    RONG_TRANG: RONG_TRANG,
    _coverThuCong: coverThuCong,
    _chuanHoaLuoiAnh: chuanHoaLuoiAnh
  };
})();
