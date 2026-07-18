// ===== modules/health.js — Điểm sức khỏe dự án (HÀM DÙNG CHUNG) =====
// Tiêu chí Sếp: 2 yếu tố = (1) gia hạn quy đổi, (2) tuân thủ báo cáo ngày ĐÃ DUYỆT.
const HEALTH_TIERS = [
  { min: 90, name: "Tốt",      token: "--hp-brand-primary" },
  { min: 75, name: "Khá",      token: "--hp-success" },
  { min: 60, name: "Cảnh báo", token: "--hp-brand-accent" },
  { min: 40, name: "Rủi ro",   token: "--hp-warning" },
  { min: 0,  name: "Nguy cấp", token: "--hp-danger" },
];
function healthTier(score){
  for (const tt of HEALTH_TIERS) if (score >= tt.min) return tt;
  return HEALTH_TIERS[HEALTH_TIERS.length - 1];
}
// chuẩn hóa: âm/null/undefined/NaN -> 0 (ghi cảnh báo console để kiểm tra)
function healthSafeNum(v, label){
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0){
    if (v !== 0 && v != null) console.warn("[health] giá trị không hợp lệ ("+label+"):", v, "-> 0");
    return 0;
  }
  return n;
}
function healthRound1(n){ return Math.round(n * 10) / 10; } // giữ tối đa 1 chữ số thập phân
// Hàm chính — CHỈ nhận 4 con số, KHÔNG đọc DB (thuần, dễ test).
function calculateProjectHealthScore(input){
  input = input || {};
  const totalTasks           = healthSafeNum(input.totalTasks, "totalTasks");
  const totalExtensionWeight = healthSafeNum(input.totalExtensionWeight, "totalExtensionWeight");
  const approvedReports      = healthSafeNum(input.approvedReports, "approvedReports");
  const requiredReportDays   = healthSafeNum(input.requiredReportDays, "requiredReportDays");
  // (1) gia hạn quy đổi — totalTasks=0 -> 0 (không chia 0); KHÔNG kẹp trần (có thể > 100%)
  const extensionWeightedRate = totalTasks > 0
    ? healthRound1(totalExtensionWeight / totalTasks * 100) : 0;
  // (2) tuân thủ báo cáo — chưa phát sinh ngày nào -> 100; kẹp trần 100
  const reportComplianceRate = requiredReportDays > 0
    ? healthRound1(Math.min(100, approvedReports / requiredReportDays * 100)) : 100;
  const reportNonComplianceRate = healthRound1(100 - reportComplianceRate);
  // (3) điểm — kẹp 0..100
  const healthScore = healthRound1(Math.max(0, Math.min(100, reportComplianceRate - extensionWeightedRate)));
  const tier = healthTier(healthScore);
  return { healthScore, healthStatus: tier.name, healthColorToken: tier.token,
    totalTasks, totalExtensionWeight, extensionWeightedRate,
    approvedReports, requiredReportDays, reportComplianceRate, reportNonComplianceRate };
}
// hiển thị: 85.0 -> "85"; 85.4 -> "85.4"
function fmtHealth(n){
  const r = healthRound1(healthSafeNum(n, "fmtHealth"));
  return (r % 1 === 0) ? String(Math.trunc(r)) : String(r);
}
// Gom dữ liệu 1 dự án rồi gọi hàm chính. proj = object dự án (có id, start_date, end_date, off_weekdays).
async function computeProjectHealth(proj){
  if (!proj) return calculateProjectHealthScore({});
  const tasks = await metaGet("progress:" + proj.id, []);
  const workTasks = (tasks || []).filter(it =>
    (typeof levelOf === 'function') ? levelOf(it.task) > 1 : true);   // chỉ công tác lá
  const totalTasks = workTasks.length;
  const totalExtensionWeight = workTasks.reduce((s, it) => s + ((it.extensions || []).length), 0);
  // báo cáo ĐÃ DUYỆT của dự án (báo cáo cũ thiếu status coi như approved — giữ tương thích)
  const approvedDates = new Set(
    (await DataService.listDailyReports())
      .filter(r => r.project_id === proj.id && ((r.approval || r.status || 'approved') === 'approved'))
      .map(r => r.date));
  // ngày BẮT BUỘC báo cáo ĐÃ PHÁT SINH: start .. min(hôm nay, end), bỏ ngày nghỉ
  const start = proj.start_date ? new Date(proj.start_date) : null;
  const end   = proj.end_date ? new Date(proj.end_date) : null;
  const today = new Date(todayISO());
  const off = new Set(proj.off_weekdays || [0]);
  let requiredReportDays = 0, approvedReports = 0;
  if (start){
    const stop = (end && end < today) ? end : today;   // KHÔNG vượt quá end, KHÔNG tính ngày tương lai
    for (let d = new Date(start); d <= stop; d.setDate(d.getDate() + 1)){
      if (off.has(d.getDay())) continue;
      requiredReportDays++;
      if (approvedDates.has(isoFromDate(d))) approvedReports++;
    }
  }
  return calculateProjectHealthScore({ totalTasks, totalExtensionWeight, approvedReports, requiredReportDays });
}
