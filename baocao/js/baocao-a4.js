/* =============================================================================
   BỘ KHỔ A4 ĐỨNG — BẢN XEM CHÍNH LÀ BẢN XUẤT        (Sếp duyệt 20/08/2026)
   -----------------------------------------------------------------------------
   Sếp chốt: đổi cả trang nhập và ảnh xuất sang khổ A4 đứng; nội dung nhiều thì tự
   thêm trang; người dùng nhập xong thấy ngay kết quả; các khối nối tiếp nhau.

   Vì sao phải gộp: app đang có HAI bộ dựng riêng — một cho bản xem trên màn hình
   (một cột dọc) và một cho ảnh xuất khổ ngang 15:9 (ba cột). Hai bộ khác nhau thì
   không thể "nhập xong thấy đúng cái sẽ xuất". Bộ này lấy CHÍNH bản xem rồi cắt
   thành từng tờ A4, và ảnh xuất sẽ chụp lại đúng những tờ đó.

   Cách làm: đọc #report (bản xem đã dựng sẵn), nhóm mỗi tiêu đề mục với phần thân
   ngay sau nó thành MỘT KHỐI, rồi xếp lần lượt vào các tờ A4. Khối cao quá một tờ
   thì tách theo từng phần tử con — không cắt ngang nội dung.
   ========================================================================== */
(function () {
  'use strict';

  // A4 đứng ở 96dpi: 210mm × 297mm = 794 × 1123 px. Giữ đúng tỉ lệ 1 : 1.4142.
  var W = 794, H = 1123;
  var PAD = 34;                 // lề trong của tờ giấy
  var AN_TOAN = 8;              // dự phòng sai số làm tròn khi đo

  function tao(tag, cls, css) {
    var e = document.createElement(tag || 'div');
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    return e;
  }

  function cao(el) {
    var r = el.getBoundingClientRect();
    var cs = window.getComputedStyle(el);
    return r.height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
  }

  /* ---------- gom bản xem thành danh sách KHỐI ----------
     Bản xem là chuỗi phẳng: r-head, rồi (sec-h, pad) xen kẽ, sign-block, divider.
     Mỗi tiêu đề mục phải đi liền phần thân của nó, không được rơi cuối trang một mình. */
  // Khối có nội dung thật hay không: có chữ, có ảnh, hoặc có ô nhập (nút chọn ảnh, textarea).
  // Sếp báo 20/08: "ô trắng trước khối HÌNH ẢNH THI CÔNG, KHỐI BẢN VẼ vẫn chưa xóa" — đó chính
  // là phần thân RỖNG của khối phía trên (ví dụ khối 04 khi chưa nhập kế hoạch) vẫn dựng ra một
  // khung trắng. Cũng khớp yêu cầu: trường nào không có thông tin thì tự ẩn.
  function coNoiDung(el) {
    if (!el) return false;
    // Khối ẢNH THI CÔNG / BẢN VẼ: chỉ tính là có nội dung khi CÓ ẢNH THẬT. Các ô "Chọn ảnh N"
    // chỉ là chỗ để bấm nhập nên không được coi là nội dung — Sếp chốt 20/08: bản vẽ không khai
    // báo hình nào thì khi XUẤT phải ẩn cả khối.
    var luoi = el.querySelector('.photos, .draw');
    if (luoi) return !!luoi.querySelector('img');
    if (String(el.textContent || '').trim() !== '') return true;
    return !!el.querySelector('img, input, textarea, select, button, canvas, svg, table');
  }

  function gomKhoi(nguon) {
    var con = Array.prototype.slice.call(nguon.children);
    var khoi = [], i = 0;
    while (i < con.length) {
      var n = con[i];
      if (n.classList.contains('r-head')) { i++; continue; }        // đầu trang dựng riêng
      if (n.classList.contains('divider')) { i++; continue; }        // đường kẻ trang trí
      if (n.classList.contains('sec-h')) {
        var than = (con[i + 1] && !con[i + 1].classList.contains('sec-h')) ? con[i + 1] : null;
        i += than ? 2 : 1;
        if (!than) continue;
        var g = tao('div', 'a4-khoi');
        g.appendChild(n);
        g.appendChild(than);
        // Sếp báo 20/08: khối 04 bị ẩn nên KHÔNG NHẬP ĐƯỢC. Bản trước em bỏ hẳn khối rỗng để
        // hết "ô trắng" — nhưng nhiều khối nhập liệu bằng cách BẤM VÀO CHÍNH NÓ, ẩn đi là mất
        // luôn đường nhập. Nay: khối rỗng VẪN HIỆN trên màn hình (kèm dòng nhắc mờ để biết là
        // chưa có nội dung), chỉ bị ẩn LÚC CHỤP ẢNH -> vừa nhập được, vừa đúng yêu cầu
        // "trường nào không có thông tin thì tự ẩn khi xuất báo cáo".
        if (!coNoiDung(than)) {
          g.setAttribute('data-a4-rong', '1');
          var nhac = tao('div', 'a4-nhac-nhap');
          nhac.textContent = 'Chưa có nội dung — nhấn vào đây để nhập';
          than.appendChild(nhac);
        }
        khoi.push(g);
        continue;
      }
      var g2 = tao('div', 'a4-khoi');
      g2.appendChild(n);
      khoi.push(g2);
      i++;
    }
    return khoi;
  }

  /* ---------- dựng một tờ A4 rỗng ---------- */
  function dungTo(headerGoc, soTo) {
    var to = tao('div', 'a4-page');
    to.setAttribute('data-a4-so', String(soTo));
    if (headerGoc) {
      var hd = headerGoc.cloneNode(true);
      hd.classList.add('a4-head');
      to.appendChild(hd);
    }
    var than = tao('div', 'a4-than');
    to.appendChild(than);
    var ft = tao('div', 'a4-foot');
    to.appendChild(ft);
    return { el: to, than: than, foot: ft };
  }

  /* ---------- tách một khối cho vừa chỗ còn lại ----------
     Bốc dần phần tử con CUỐI của phần thân ra, cho tới khi khối vừa chỗ. Phần bốc ra
     tạo thành khối "(tiếp)" — tiêu đề mục KHÔNG lặp lại, chỉ ghi một nhãn nhỏ. */
  function tach(khoi, conLai) {
    var than = khoi.querySelector('.pad') || khoi.lastElementChild;
    if (!than) return null;

    /* Sếp báo 20/08: "phần ảnh cuối bị cắt ở cuối trang". Nguyên do: lưới ảnh là MỘT node duy
       nhất nên vòng tách không bốc được gì bên trong, khối cứ thế tràn qua đáy tờ rồi bị cắt.
       Nay nếu phần thân là LƯỚI ẢNH thì bốc theo TỪNG CẶP 2 ô (đúng 2 cột) — hàng cuối không bao
       giờ bị cắt và ảnh luôn đủ cặp như Sếp yêu cầu. Ảnh dư tự sang tờ sau đến khi hết. */
    var luoi = than.querySelector('.photos, .draw');
    if (luoi && luoi.children.length > 2) {
      var duA = [], canhA = 0;
      while (cao(khoi) > conLai && luoi.children.length > 2 && canhA++ < 600) {
        for (var b = 0; b < 2 && luoi.children.length > 2; b++) {
          duA.unshift(luoi.removeChild(luoi.children[luoi.children.length - 1]));
        }
      }
      if (!duA.length) return null;
      if (cao(khoi) > conLai) {                 // bốc hết vẫn không vừa -> hoàn nguyên
        duA.forEach(function (n) { luoi.appendChild(n); });
        return null;
      }
      var moiA = tao('div', 'a4-khoi');
      var tieuA = khoi.querySelector('.sec-h');
      if (tieuA) {
        var nhanA = tieuA.cloneNode(true);
        nhanA.classList.add('a4-tiep-head');
        nhanA.removeAttribute('onclick');
        nhanA.style.cursor = 'default';
        // bỏ nút bấm trong tiêu đề (nút chọn nhiều ảnh) ở phần tiếp
        Array.prototype.slice.call(nhanA.querySelectorAll('button, input')).forEach(function (x) {
          if (x.parentNode) x.parentNode.removeChild(x);
        });
        var spA = document.createElement('span');
        spA.className = 'a4-tiep-nhan';
        spA.textContent = ' (TIẾP)';
        nhanA.appendChild(spA);
        moiA.appendChild(nhanA);
      }
      var thanA = tao('div', than.className || 'pad');
      thanA.setAttribute('style', than.getAttribute('style') || '');
      var luoiA = tao('div', luoi.className);
      luoiA.setAttribute('style', luoi.getAttribute('style') || '');
      duA.forEach(function (n) { luoiA.appendChild(n); });
      thanA.appendChild(luoiA);
      moiA.appendChild(thanA);
      return moiA;
    }

    if (than.children.length < 2) return null;
    var du = [], canh = 0;
    while (cao(khoi) > conLai && than.children.length > 1 && canh++ < 600) {
      du.unshift(than.removeChild(than.children[than.children.length - 1]));
    }
    if (!du.length) return null;
    if (cao(khoi) > conLai) {                       // bốc hết vẫn không vừa -> hoàn nguyên
      du.forEach(function (n) { than.appendChild(n); });
      return null;
    }
    var moi = tao('div', 'a4-khoi');
    // Sếp báo 20/08: khối 03 sang trang "bị mất định dạng". Trước đây nhãn tiếp là một dải xám
    // nhạt nên trông khác hẳn thanh tiêu đề mục. Nay nhãn tiếp DÙNG ĐÚNG KIỂU thanh tiêu đề
    // (nền xanh, chữ trắng), chỉ thấp hơn một chút và có thêm chữ "(TIẾP)" để biết là phần nối.
    var tieu = khoi.querySelector('.sec-h');
    var nhan;
    if (tieu) {
      nhan = tieu.cloneNode(true);
      nhan.classList.add('a4-tiep-head');
      nhan.removeAttribute('onclick');
      nhan.style.cursor = 'default';
      var sp = document.createElement('span');
      sp.className = 'a4-tiep-nhan';
      sp.textContent = ' (TIẾP)';
      nhan.appendChild(sp);
    } else {
      nhan = tao('div', 'a4-tiep');
      nhan.textContent = '(tiếp)';
    }
    moi.appendChild(nhan);
    var thanMoi = tao('div', than.className || 'pad');
    thanMoi.setAttribute('style', than.getAttribute('style') || '');
    du.forEach(function (n) { thanMoi.appendChild(n); });
    moi.appendChild(thanMoi);
    return moi;
  }

  /* ---------- phân trang ---------- */
  function phanTrang(opts) {
    opts = opts || {};
    var nguon = document.getElementById(opts.nguon || 'report');
    var dich = document.getElementById(opts.dich || 'report-a4');
    if (!nguon || !dich) return [];

    var header = nguon.querySelector('.r-head');
    var khoi = gomKhoi(nguon);
    dich.innerHTML = '';

    var tos = [];
    var to = dungTo(header, 1);
    dich.appendChild(to.el);
    tos.push(to);

    var hKhaDung = to.than.clientHeight;
    var hang = khoi.slice(), canh = 0;

    /* Sếp chốt 20/08: "Trang 1 LUÔN LUÔN thể hiện thông tin khối 1 và khối 2 — trang 2 trở đi
       bắt đầu là khối 3...". Nên tờ đầu chỉ nhận khối 01 + 02 (và biểu đồ nhân lực tuần đi kèm
       khối 02), sau đó NGẮT TRANG bắt buộc rồi mới xếp tiếp từ khối 03.
       Nhận diện khối 01/02 qua số mục in trên thanh tiêu đề, không dựa vào thứ tự để khỏi sai
       khi có khối bị ẩn. */
    function laKhoiTrang1(k) {
      if (k.querySelector('[data-a4-bieudo="1"]')) return true;      // biểu đồ thuộc khối 02
      var num = k.querySelector('.sec-h .num');
      var t = num ? String(num.textContent || '').trim() : '';
      return t === '01' || t === '02';
    }
    var daNgatTrang1 = false;

    while (hang.length && canh++ < 800) {
      var k = hang.shift();

      // Hết phần của trang 1 -> mở tờ mới, khối 03 bắt đầu ở trang 2
      if (!daNgatTrang1 && !laKhoiTrang1(k) && to.than.children.length) {
        daNgatTrang1 = true;
        to = dungTo(header, tos.length + 1);
        dich.appendChild(to.el);
        tos.push(to);
        hKhaDung = to.than.clientHeight;
      }
      var daDung = 0;
      Array.prototype.forEach.call(to.than.children, function (x) { daDung += cao(x); });
      var conLai = hKhaDung - daDung - AN_TOAN;
      var toRong = to.than.children.length === 0;

      to.than.appendChild(k);
      if (cao(k) <= conLai) continue;                       // vừa chỗ

      var tiep = tach(k, conLai);
      if (tiep) { hang.unshift(tiep); continue; }

      if (toRong) continue;      // tờ đang rỗng mà vẫn không vừa -> đành để, không lặp vô ích

      to.than.removeChild(k);
      hang.unshift(k);
      to = dungTo(header, tos.length + 1);
      dich.appendChild(to.el);
      tos.push(to);
      hKhaDung = to.than.clientHeight;
    }

    /* ===== GIÃN CÁC KHỐI LẤP HẾT TỜ (Sếp duyệt 20/08) =====
       Trang 1 nay chỉ có khối 01 + 02 nên còn chỗ trống ở đáy; các tờ khác cũng có thể dôi ra.
       Cho mỗi khối trên tờ nhận thêm một phần chỗ dư (chia đều) để các khối liền mạch từ trên
       xuống, thay vì dồn thành một mảng trắng cuối tờ.
       Ba điều đã học được từ lần làm ở bộ khổ ngang, áp dụng luôn ở đây:
         · ĐO TRƯỚC toàn bộ rồi mới gán — gán xen kẽ với đo thì mỗi lần gán layout đổi, các khối
           sau đo ra số khác nên cộng dồn quá tay và làm TRÀN.
         · Ép box-sizing:border-box — không ép thì chiều cao cộng thêm phần đệm rồi cũng tràn.
         · Chốt an toàn: nếu vẫn tràn thì hoàn nguyên cả tờ — thà còn khoảng trống chứ không
           được cắt mất nội dung.
       Không giãn khi tờ còn quá rỗng (dư hơn 55% thân tờ), vì kéo một thẻ nhỏ cao gấp mấy lần
       nhìn còn xấu hơn để trống. */
    tos.forEach(function (t) {
      var n = t.than.children.length;
      if (!n) return;
      var dung = 0;
      Array.prototype.forEach.call(t.than.children, function (x) { dung += cao(x); });
      var hThan = t.than.clientHeight;
      var du = hThan - dung;
      if (du < 40 || du > hThan * 0.55) return;
      var ds = Array.prototype.slice.call(t.than.children);
      var caoTruoc = ds.map(function (x) { return cao(x); });
      var them = Math.floor((du - AN_TOAN) / n);
      if (them <= 0) return;
      ds.forEach(function (x, k) {
        x.style.boxSizing = 'border-box';
        x.style.height = Math.round(caoTruoc[k] + them) + 'px';
      });
      if (t.than.scrollHeight - t.than.clientHeight > 2) {
        ds.forEach(function (x) { x.style.height = 'auto'; });   // tràn -> hoàn nguyên cả tờ
      }
    });

    // Chân trang: số trang
    tos.forEach(function (t, i) {
      t.foot.innerHTML = '<span>HỆ THỐNG QUẢN LÝ THI CÔNG HP CONS © 2026</span>'
        + '<span>TRANG ' + (i + 1) + '/' + tos.length + '</span>';
    });

    dich.setAttribute('data-a4-tong', String(tos.length));
    return tos;
  }

  /* ---------- XUẤT ẢNH: chụp CHÍNH các tờ A4 đang hiển thị ----------
     Đây là điểm khác căn bản so với trước: app không dựng lại một bản khổ ngang nữa, mà chụp
     đúng những tờ người dùng vừa nhìn thấy. Nhờ vậy "nhập xong thấy đúng cái sẽ xuất ra".
     Trước khi chụp thì ẩn các thành phần chỉ dùng để nhập liệu (nút xóa, ô nhập chú thích) —
     chúng mang class .no-print sẵn có của app.                                              */
  function xuatAnh(opts) {
    opts = opts || {};
    var dich = document.getElementById(opts.dich || 'report-a4');
    if (!dich) return Promise.reject(new Error('Chưa có vùng chứa tờ A4'));
    var tos = Array.prototype.slice.call(dich.querySelectorAll('.a4-page'));
    if (!tos.length) return Promise.reject(new Error('Chưa có tờ A4 nào để chụp'));
    if (typeof html2canvas !== 'function') return Promise.reject(new Error('Thiếu html2canvas'));

    document.body.classList.add('dang-chup-a4');     // ẩn phần nhập liệu, không lên ảnh
    var anhs = [];
    return tos.reduce(function (p, to) {
      return p.then(function () {
        return html2canvas(to, {
          scale: opts.scale || 2.5,                  // 794 x 2.5 ≈ 1985px, in/zoom vẫn nét
          useCORS: true,
          backgroundColor: '#ffffff',
          width: to.offsetWidth,
          height: to.offsetHeight,
          windowWidth: to.offsetWidth,
          scrollX: 0, scrollY: 0
        }).then(function (cv) { anhs.push(cv.toDataURL('image/png')); });
      });
    }, Promise.resolve()).then(function () {
      document.body.classList.remove('dang-chup-a4');
      return anhs;
    }).catch(function (e) {
      document.body.classList.remove('dang-chup-a4');
      throw e;
    });
  }

  window.BCA4 = {
    phanTrang: phanTrang,
    xuatAnh: xuatAnh,
    KHO: { W: W, H: H, PAD: PAD }
  };
})();
