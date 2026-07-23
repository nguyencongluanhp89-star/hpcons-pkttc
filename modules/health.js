// ===== modules/health.js — Điểm sức khỏe dự án (HÀM DÙNG CHUNG) =====
// Tiêu chí Sếp (23/07 - V3): 3 TRỤ trọng số BẰNG NHAU (mỗi trụ 1/3, tiêu chí null thì chia đều tiêu chí hợp lệ):
//   (1) TIẾN ĐỘ: tính phạt theo tỷ lệ số ngày trễ / thời lượng kế hoạch (đang trễ hệ số 1,0; hoàn thành trễ hệ số 0,5).
//   (2) BÁO CÁO = tỷ lệ ngày báo cáo ĐÃ DUYỆT / số ngày bắt buộc.
//   (3) GIA HẠN = 100 − tỷ lệ lần gia hạn / tổng công tác.

const HEALTH_TIERS = [
  { min: 90, name: "Rất tốt",       token: "--hp-brand-primary" },
  { min: 80, name: "Tốt",           token: "--hp-success" },
  { min: 65, name: "Cần theo dõi", token: "--hp-brand-accent" },
  { min: 50, name: "Cảnh báo",      token: "--hp-warning" },
  { min: 0,  name: "Nguy hiểm",     token: "--hp-danger" },
];

function healthTier(score) {
  for (const tt of HEALTH_TIERS) {
    if (score >= tt.min) return tt;
  }
  return HEALTH_TIERS[HEALTH_TIERS.length - 1];
}

// Chuẩn hóa số: âm/null/undefined/NaN -> 0 (ghi cảnh báo console)
function healthSafeNum(v, label) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) {
    if (v !== 0 && v != null) console.warn("[health] giá trị không hợp lệ (" + label + "):", v, "-> 0");
    return 0;
  }
  return n;
}

function healthRound1(n) {
  return Math.round(n * 10) / 10;
}

// Hiển thị: 85.0 -> "85"; 85.4 -> "85.4"
function fmtHealth(n) {
  if (n == null || isNaN(n)) return "--";
  const r = healthRound1(healthSafeNum(n, "fmtHealth"));
  return (r % 1 === 0) ? String(Math.trunc(r)) : String(r);
}

// Helper chuyển ngày local sang YYYY-MM-DD (tránh lệch UTC)
function isoFromDateLocal(d) {
  if (!d) return null;
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    d = new Date(d);
  }
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper tính khoảng cách số ngày nguyên giữa 2 ngày YYYY-MM-DD
function daysBetweenDates(aISO, bISO) {
  if (!aISO || !bISO) return 0;
  const da = new Date(aISO + "T00:00:00");
  const db = new Date(bISO + "T00:00:00");
  return Math.round((db - da) / 86400000);
}

// Lấy ngày kết thúc có hiệu lực (gồm gia hạn nếu có)
function getEffectiveEndTask(it) {
  if (!it) return null;
  if (typeof getEffectiveEnd === 'function') {
    const eff = getEffectiveEnd(it);
    if (eff) return eff;
  }
  if (it.extensions && Array.isArray(it.extensions) && it.extensions.length > 0) {
    const last = it.extensions[it.extensions.length - 1];
    if (last && last.toEnd) return last.toEnd;
  }
  return it.end || null;
}

// --- HÀM THUẦN 1: Tính phạt tiến độ 1 công tác lá
function calcTaskDelayPenalty(it, todayIso) {
  if (!it) return { penalty: 0, isOverdue: false, isLate: false, delayDays: 0, plannedDuration: 1, warn: null };

  const startISO = it.start;
  const effEndISO = getEffectiveEndTask(it);

  if (!startISO || !effEndISO) {
    return {
      penalty: 0,
      isOverdue: false,
      isLate: false,
      delayDays: 0,
      plannedDuration: 1,
      warn: `Công tác "${it.task || it.id}" thiếu ngày start/end hợp lệ`
    };
  }

  const plannedDuration = Math.max(1, daysBetweenDates(startISO, effEndISO) + 1);

  if (it.status === 'done') {
    if (!it.completedAt) {
      return {
        penalty: 0,
        isOverdue: false,
        isLate: false,
        delayDays: 0,
        plannedDuration,
        warn: `Công tác đã hoàn thành "${it.task || it.id}" thiếu completedAt -> penalty = 0`
      };
    }
    const doneISO = isoFromDateLocal(it.completedAt);
    if (!doneISO) {
      return {
        penalty: 0,
        isOverdue: false,
        isLate: false,
        delayDays: 0,
        plannedDuration,
        warn: `Công tác "${it.task || it.id}" completedAt không hợp lệ: ${it.completedAt}`
      };
    }

    const delayDays = Math.max(0, daysBetweenDates(effEndISO, doneISO));
    if (delayDays > 0) {
      const delayRatio = Math.min(1, delayDays / plannedDuration);
      const penalty = delayRatio * 0.5;
      return { penalty, isOverdue: false, isLate: true, delayDays, plannedDuration, warn: null };
    } else {
      // Completed on time (completedAt <= effEnd) -> penalty = 0
      return { penalty: 0, isOverdue: false, isLate: false, delayDays: 0, plannedDuration, warn: null };
    }
  } else {
    // Active (chưa hoàn thành)
    const delayDays = Math.max(0, daysBetweenDates(effEndISO, todayIso));
    if (delayDays > 0) {
      const delayRatio = Math.min(1, delayDays / plannedDuration);
      const penalty = delayRatio * 1.0;
      return { penalty, isOverdue: true, isLate: false, delayDays, plannedDuration, warn: null };
    } else {
      // Chưa tới hạn
      return { penalty: 0, isOverdue: false, isLate: false, delayDays: 0, plannedDuration, warn: null };
    }
  }
}

// --- HÀM THUẦN 2: Tính điểm Trụ Tiến độ cho danh sách công tác
function calcScheduleScore(tasks, todayIso) {
  tasks = tasks || [];
  const workTasks = tasks.filter(it => (typeof levelOf === 'function' ? levelOf(it.task) > 1 : true));
  const totalTasks = workTasks.length;

  if (totalTasks === 0) {
    return {
      scheduleScore: null,
      totalTasks: 0,
      activeOverdueTasks: 0,
      completedLateTasks: 0,
      totalDelayPenalty: 0
    };
  }

  let totalDelayPenalty = 0;
  let activeOverdueTasks = 0;
  let completedLateTasks = 0;

  workTasks.forEach(it => {
    const res = calcTaskDelayPenalty(it, todayIso);
    if (res.warn) {
      console.warn("[health]", res.warn);
    }
    totalDelayPenalty += res.penalty;
    if (res.isOverdue) activeOverdueTasks++;
    if (res.isLate) completedLateTasks++;
  });

  const tyLeViPham = totalDelayPenalty / totalTasks;
  const scheduleScoreRaw = 100 * (1 - tyLeViPham);
  const scheduleScore = Math.max(0, Math.min(100, scheduleScoreRaw));

  return {
    scheduleScore,
    totalTasks,
    activeOverdueTasks,
    completedLateTasks,
    totalDelayPenalty
  };
}

// --- HÀM THUẦN 3: Tính điểm tổng hợp Sức khỏe dự án từ các thông số
function calculateProjectHealthScore(input) {
  input = input || {};

  const totalTasks = healthSafeNum(input.totalTasks, "totalTasks");
  const activeOverdueTasks = healthSafeNum(input.activeOverdueTasks, "activeOverdueTasks");
  const completedLateTasks = healthSafeNum(input.completedLateTasks, "completedLateTasks");
  const totalDelayPenalty = healthSafeNum(input.totalDelayPenalty, "totalDelayPenalty");

  const approvedReports = healthSafeNum(input.approvedReports, "approvedReports");
  const requiredReportDays = healthSafeNum(input.requiredReportDays, "requiredReportDays");
  const approvedExtensionCount = healthSafeNum(input.approvedExtensionCount, "approvedExtensionCount");

  // --- TRỤ 1: TIẾN ĐỘ (scheduleScore)
  let scheduleScore = null;
  if (input.scheduleScore !== undefined && input.scheduleScore !== null) {
    scheduleScore = Math.max(0, Math.min(100, Number(input.scheduleScore)));
  } else if (totalTasks > 0) {
    const tyLeViPham = totalDelayPenalty / totalTasks;
    scheduleScore = Math.max(0, Math.min(100, 100 * (1 - tyLeViPham)));
  }

  // --- TRỤ 2: BÁO CÁO (reportScore)
  let reportScore = 100;
  if (requiredReportDays > 0) {
    reportScore = Math.max(0, Math.min(100, (approvedReports / requiredReportDays) * 100));
  }

  // --- TRỤ 3: GIA HẠN (extensionScore)
  let extensionScore = null;
  if (totalTasks > 0) {
    const tyLeGiaHan = Math.min(1, approvedExtensionCount / totalTasks);
    extensionScore = Math.max(0, Math.min(100, 100 * (1 - tyLeGiaHan)));
  }

  // --- ĐIỂM TỔNG HỢP: Trung bình các tiêu chí HỢP LỆ (khác null)
  const validScores = [];
  if (scheduleScore !== null && !isNaN(scheduleScore)) validScores.push(scheduleScore);
  if (reportScore !== null && !isNaN(reportScore)) validScores.push(reportScore);
  if (extensionScore !== null && !isNaN(extensionScore)) validScores.push(extensionScore);

  let healthScoreRaw = 100;
  if (validScores.length > 0) {
    healthScoreRaw = validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
    healthScoreRaw = Math.max(0, Math.min(100, healthScoreRaw));
  }

  const healthScore = Math.round(healthScoreRaw);
  const tier = healthTier(healthScore);

  return {
    healthScore,
    healthScoreRaw,
    healthStatus: tier.name,
    healthColorToken: tier.token,
    scheduleScore,
    reportScore,
    extensionScore,
    totalTasks,
    activeOverdueTasks,
    overdueTasks: activeOverdueTasks, // alias tương thích ngược (CHỈ đếm đang trễ)
    completedLateTasks,
    totalDelayPenalty,
    approvedReports,
    approvedReportDays: approvedReports,
    requiredReportDays,
    approvedExtensionCount
  };
}

// Xác định 1 công tác có ĐANG TRỄ HẠN không: CHƯA bấm hoàn thành & quá hạn cuối
function healthIsOverdue(it, todayIso) {
  if (!it || it.status === 'done') return false;
  const eff = getEffectiveEndTask(it);
  return !!(eff && todayIso > eff);
}

// Gom dữ liệu 1 dự án rồi gọi hàm chính. proj = object dự án (id, start_date, end_date, off_weekdays).
async function computeProjectHealth(proj) {
  if (!proj) return calculateProjectHealthScore({});

  const tasks = await metaGet("progress:" + proj.id, []);
  const todayStr = typeof todayISO === 'function' ? todayISO() : isoFromDateLocal(new Date());

  const schedRes = calcScheduleScore(tasks, todayStr);

  const workTasks = (tasks || []).filter(it => (typeof levelOf === 'function' ? levelOf(it.task) > 1 : true));
  const approvedExtensionCount = workTasks.reduce((s, it) => s + ((it.extensions || []).length), 0);

  let approvedReports = 0, requiredReportDays = 0;
  try {
    const reports = typeof DataService !== 'undefined' ? await DataService.listDailyReports() : [];
    const approvedDates = new Set(
      reports
        .filter(r => r.project_id === proj.id && ((r.approval || r.status || 'approved') === 'approved'))
        .map(r => r.date)
    );

    const start = proj.start_date ? new Date(proj.start_date) : null;
    const end   = proj.end_date ? new Date(proj.end_date) : null;
    const today = new Date(todayStr);
    const off = new Set(proj.off_weekdays || [0]);

    if (start && !isNaN(start.getTime())) {
      const stop = (end && !isNaN(end.getTime()) && end < today) ? end : today;
      for (let d = new Date(start); d <= stop; d.setDate(d.getDate() + 1)) {
        if (off.has(d.getDay())) continue;
        requiredReportDays++;
        if (approvedDates.has(isoFromDateLocal(d))) approvedReports++;
      }
    }
  } catch (e) {
    console.warn("[health] Error calculating report score:", e);
  }

  return calculateProjectHealthScore({
    scheduleScore: schedRes.scheduleScore,
    totalTasks: schedRes.totalTasks,
    activeOverdueTasks: schedRes.activeOverdueTasks,
    completedLateTasks: schedRes.completedLateTasks,
    totalDelayPenalty: schedRes.totalDelayPenalty,
    approvedReports,
    requiredReportDays,
    approvedExtensionCount
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HEALTH_TIERS,
    healthTier,
    healthSafeNum,
    healthRound1,
    fmtHealth,
    isoFromDateLocal,
    daysBetweenDates,
    getEffectiveEndTask,
    calcTaskDelayPenalty,
    calcScheduleScore,
    calculateProjectHealthScore,
    healthIsOverdue,
    computeProjectHealth
  };
}
