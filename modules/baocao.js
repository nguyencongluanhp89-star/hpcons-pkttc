// ---------- TIỆN ÍCH DÙNG CHUNG ----------
// LƯU Ý: Toàn bộ bộ render/xuất báo cáo cũ đọc nguồn "submissions" (tab Nhật ký đã gỡ)
// đã được XÓA vì là code chết:
//   - viewReport()/renderReport()/renderPeriodReport(): app.js định nghĩa lại viewReport()
//     (load sau, ghi đè) và render #report-dashboard từ nguồn daily_reports.
//   - exportReportPDF() + các helper (milestoneTableHTML, weekManpowerTableHTML,
//     weekTasksTableHTML, projectContractorTotalHTML, drawWeekChart, aiAssessProgress,
//     aiSummarize, valueLabelsPlugin, mondayOf): không còn được gọi. Việc in PDF tổng hợp
//     nay do printDashboard() trong app.js đảm nhiệm (đọc daily_reports).
// Các hàm bên dưới được GIỮ vì còn dùng chung ở nơi khác:
//   - openLightbox/closeLightbox: index.html (#img-lightbox) và modules/nhatky.js
//   - blobToDataURL: modules/hethong.js
//   - fileToBase64 / stripCJK: modules/tiendo.js

function openLightbox(src){ $("lb-img").src=src; $("img-lightbox").classList.remove("hide"); }
function closeLightbox(){ $("img-lightbox").classList.add("hide"); }
function blobToDataURL(blob){ return new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(blob); }); }
function fileToBase64(file){ return new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(String(r.result).split(",")[1]||""); r.readAsDataURL(file); }); }
function stripCJK(s){ return String(s||"").replace(/[　-〿぀-ヿ㄰-㆏ㇰ-ㇿ㐀-䶿一-鿿가-힯豈-﫿＀-￯]/g,"").replace(/[ \t]{2,}/g," "); }
