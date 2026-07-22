// ============================================================
// 择日规则（基础版）
//
// MVP 算法：
//   · 在用户指定区间内按天迭代
//   · 每天计算简化"宜忌评分"：用户日干—当日日干生克 + 是否相冲生肖
//   · 结合事项类型给出推荐 / 不推荐
//   · 输出明确的"民俗参考，不作为唯一决策依据"
// ============================================================

import { computeBazi } from "./bazi";
import { ZODIAC_BY_BRANCH, SHENG, KE, type Element } from "./elements";
import type { DateSelectionInput, DateSelectionEvent } from "../types";

interface DayCandidate {
  date: string;
  ganzhiDay: string;
  zodiacOfDay: string;
  score: number;          // 越高越推荐
  reasons: string[];
  cautions: string[];
  /** 现实硬限制是否允许；民俗评分不得覆盖它。 */
  realityEligible?: boolean;
}

interface RealityConstraints {
  weekendsOnly: boolean;
  weekdaysOnly: boolean;
  weekendsPreferred: boolean;
  weekdaysPreferred: boolean;
  unavailable: Set<string>;
  latestDate?: string;
  summary: string[];
}

export interface DateSelectionResult {
  event: DateSelectionEvent;
  eventLabel: string;
  dateRange: { start: string; end: string };
  personalPlanningHint: string;
  recommended: DayCandidate[];
  notRecommended: DayCandidate[];
  preparationChecklist: string[];
  warnings: string[];
  realityConstraints?: string[];
}

const EVENT_LABEL: Record<DateSelectionEvent, string> = {
  wedding: "结婚",
  moving: "搬家",
  opening: "开业",
  signing: "签约",
  travel: "出行",
  renovation_start: "装修动工"
};

const EVENT_PREP: Record<DateSelectionEvent, string[]> = {
  wedding: [
    "提前与双方家庭沟通日期与流程",
    "婚宴酒店、摄影、司仪至少提前 30–60 天确认",
    "婚检与登记预约时间",
    "酒店退房、行李、礼金登记等流程清单"
  ],
  moving: [
    "提前 7 天联系搬家公司",
    "新居清洁、家具到位、宽带与水电气接通",
    "户口/快递/外卖地址变更",
    "易碎与贵重物品单独打包标记"
  ],
  opening: [
    "营业执照、消防、卫生等手续是否齐全",
    "员工到岗、收银/小程序/外卖渠道测试",
    "宣传物料与开业活动方案",
    "首日应急预案：客流、断电、退款"
  ],
  signing: [
    "合同条款逐条确认（金额/期限/违约/退出）",
    "双方主体资质核对",
    "建议律师 review 一次",
    "保留所有沟通与版本记录"
  ],
  travel: [
    "目的地天气、签证、保险确认",
    "证件、充电、药品、备用衣物",
    "返程安排留出冗余时间",
    "重要事项不要安排在归来当天"
  ],
  renovation_start: [
    "施工方资质与合同确认",
    "邻里通知，避免噪音纠纷",
    "材料进场顺序排期",
    "水电主材建议自购或共同采购"
  ]
};

export function selectDates(input: DateSelectionInput): DateSelectionResult {
  const userChart = computeBazi(input.user);
  const constraints = parseRealityConstraints(input.notes);
  const start = new Date(input.dateRangeStart);
  const end = new Date(input.dateRangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("日期范围格式错误，请使用 YYYY-MM-DD");
  }
  if (start > end) {
    throw new Error("起始日期不能晚于结束日期");
  }
  const maxDays = 90;
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (days > maxDays) {
    throw new Error(`查询区间最长 ${maxDays} 天，请缩小范围`);
  }

  const candidates: DayCandidate[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const c = scoreDay(dateStr, userChart.day.stem, userChart.year.branch, input.event);
    c.realityEligible = isRealityEligible(dateStr, constraints);
    candidates.push(c);
  }

  // 现实条件是硬限制：先过滤/排序可执行日期，再参考民俗评分。
  candidates.sort((a, b) => Number(b.realityEligible) - Number(a.realityEligible)
    || realityPreferenceScore(b.date, constraints) - realityPreferenceScore(a.date, constraints)
    || b.score - a.score);
  const recommended = candidates.filter(c => c.realityEligible && c.score >= 60).slice(0, 5);
  // 已被现实硬限制排除的日期不再展示为“绕开日期”，避免让用户误以为仍需二次筛选。
  const notRecommended = candidates.filter(c => c.realityEligible && c.score <= 30).slice(0, 3);

  return {
    event: input.event,
    eventLabel: EVENT_LABEL[input.event],
    dateRange: { start: input.dateRangeStart, end: input.dateRangeEnd },
    personalPlanningHint: `先确认${EVENT_LABEL[input.event]}的现实限制，再从可执行日期中参考传统结构。`,
    recommended,
    notRecommended,
    preparationChecklist: EVENT_PREP[input.event] ?? [],
    warnings: [
      `本结果为「民俗参考」，不作为${EVENT_LABEL[input.event]}的唯一决策依据。`,
      "实际选定日期请综合考虑家庭、合同、签证、天气、节假日等现实条件。",
      ...(recommended.length === 0 && constraints.summary.length > 0
        ? ["在你写下的现实限制内暂时没有达到民俗参考阈值的日期；可以优先从可执行日期中选择，或适度放宽偏好。"]
        : [])
    ],
    realityConstraints: constraints.summary
  };
}

/**
 * 从用户的自然语言备注提取少量明确的硬限制。
 * 这些只用于现实可执行性排序，不会把用户的偏好伪装成民俗结论。
 */
function parseRealityConstraints(notes?: string): RealityConstraints {
  const text = notes?.trim() ?? "";
  const weekends = /(周末|周六日|星期六日|礼拜六日)/.test(text);
  const weekdays = /(工作日|周一到周五|星期一至五)/.test(text);
  const hardMarker = /只能|仅限|必须|不得|不能/.test(text);
  const preferenceMarker = /优先|尽量|最好|方便/.test(text);
  const weekendsOnly = hardMarker && weekends;
  const weekdaysOnly = hardMarker && weekdays;
  const weekendsPreferred = weekends && preferenceMarker;
  const weekdaysPreferred = weekdays && preferenceMarker;
  const unavailable = new Set<string>();
  const dateMatches = text.match(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g) ?? [];
  const latestMatch = text.match(/(?:截止|最晚|不晚于|之前|前完成|前办完)[^\d]{0,8}(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
  const latestDate = latestMatch ? normalizeDate(latestMatch[1]) : undefined;
  // “避开/不能/不方便”等语句中的明确日期视为不可用；普通日期仅作为截止日期候选。
  if (/(避开|不能|不行|不方便|不可用|排除)/.test(text)) {
    for (const value of dateMatches) unavailable.add(normalizeDate(value));
  } else if (latestDate) {
    unavailable.delete(latestDate);
  }
  const summary: string[] = [];
  if (weekendsOnly) summary.push("已按备注限制为周末");
  if (weekdaysOnly) summary.push("已按备注限制为工作日");
  if (!weekendsOnly && weekendsPreferred) summary.push("已将周末作为偏好优先排序");
  if (!weekdaysOnly && weekdaysPreferred) summary.push("已将工作日作为偏好优先排序");
  if (latestDate) summary.push(`已按备注限制在 ${latestDate} 前完成`);
  if (unavailable.size) summary.push(`已排除备注中不可用日期（${[...unavailable].join("、")}）`);
  return { weekendsOnly, weekdaysOnly, weekendsPreferred, weekdaysPreferred, unavailable, latestDate, summary };
}

function normalizeDate(value: string): string {
  const [year, month, day] = value.replaceAll("/", "-").split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isRealityEligible(date: string, constraints: RealityConstraints): boolean {
  if (constraints.unavailable.has(date)) return false;
  if (constraints.latestDate && date > constraints.latestDate) return false;
  const day = new Date(`${date}T12:00:00`).getDay();
  if (constraints.weekendsOnly && day !== 0 && day !== 6) return false;
  if (constraints.weekdaysOnly && (day === 0 || day === 6)) return false;
  return true;
}

function realityPreferenceScore(date: string, constraints: RealityConstraints): number {
  const day = new Date(`${date}T12:00:00`).getDay();
  const weekend = day === 0 || day === 6;
  if (constraints.weekendsPreferred && weekend) return 1;
  if (constraints.weekdaysPreferred && !weekend) return 1;
  return 0;
}

function scoreDay(date: string, userDayStem: string, userYearBranch: string, event: DateSelectionEvent): DayCandidate {
  const chart = computeBazi({
    gender: "other",
    birthDate: date,
    birthTime: "12:00",
    unknownTime: false
  });
  const reasons: string[] = [];
  const cautions: string[] = [];
  let score = 50;

  // 生克关系
  const ud = chart.day.stemElement;
  const ue = elementOf(userDayStem);
  if (ud === ue) {
    score += 5; reasons.push("当日日干与本人日干同元素，节奏相对一致。");
  } else if (SHENG[ue] === ud) {
    score += 10; reasons.push("本人日干生当日日干，做事相对顺势。");
  } else if (SHENG[ud] === ue) {
    score += 5; reasons.push("当日日干生本人日干，能量偏支援。");
  } else if (KE[ue] === ud) {
    score -= 10; cautions.push("本人日干克当日日干，传统视角下偏耗，需更细致准备。");
  } else if (KE[ud] === ue) {
    score -= 15; cautions.push("当日日干克本人日干，传统视角下偏受阻，重要事项请预留缓冲。");
  }

  // 生肖相冲
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const ai = branches.indexOf(userYearBranch);
  const bi = branches.indexOf(chart.day.branch);
  if (Math.abs(ai - bi) === 6) {
    score -= 15; cautions.push("当日地支与本人年支相冲，传统视角下不宜大事，可视情况微调或避开。");
  }

  // 事项加权
  if (event === "wedding") {
    if (chart.day.branch === "卯" || chart.day.branch === "酉") {
      score += 5; reasons.push("传统认为卯/酉日适合「礼仪、约定」类事项。");
    }
  } else if (event === "moving") {
    if (chart.day.branch === "寅" || chart.day.branch === "午") {
      score += 5; reasons.push("寅/午日传统认为利于动迁、整理。");
    }
  } else if (event === "opening") {
    if (chart.day.stem === "甲" || chart.day.stem === "丙") {
      score += 5; reasons.push("甲/丙日传统视角下「始动」之力较强，适合开业。");
    }
  }

  // 周末加成（现实考虑）
  const dow = new Date(date).getDay();
  if ((event === "wedding" || event === "opening") && (dow === 0 || dow === 6)) {
    score += 8; reasons.push("周末时段宾客出席率更高，现实层面更合适。");
  }
  if (event === "signing" && (dow === 0 || dow === 6)) {
    score -= 5; cautions.push("周末签约需确认对方主体在岗，避免拖延。");
  }

  return {
    date,
    ganzhiDay: chart.day.pillarLabel,
    zodiacOfDay: ZODIAC_BY_BRANCH[chart.day.branch],
    score: Math.max(0, Math.min(100, score)),
    reasons,
    cautions
  };
}

function elementOf(stem: string): Element {
  const map: Record<string, Element> = {
    甲: "木", 乙: "木", 丙: "火", 丁: "火",
    戊: "土", 己: "土", 庚: "金", 辛: "金",
    壬: "水", 癸: "水"
  };
  return map[stem];
}
