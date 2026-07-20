import { computeBazi } from "./bazi";
import {
  BRANCH_ELEMENT,
  BRANCH_YIN_YANG,
  KE,
  SHENG,
  STEM_ELEMENT,
  STEM_YIN_YANG,
  type Branch,
  type Element,
  type Stem
} from "./elements";

export type FivePhaseRelation = "same" | "generates" | "generated_by" | "controls" | "controlled_by";

export interface BirthProfileInput {
  birthDate: string;
  birthTime?: string | null;
  birthLocation?: string | null;
  timezone?: string | null;
}

export interface DailyCorrespondence {
  date: string;
  weekday: string;
  solarTerm: string;
  monthBranch: Branch;
  birth: {
    dayPillar: string;
    dayStem: Stem;
    dayBranch: Branch;
    element: Element;
  };
  today: {
    dayPillar: string;
    dayStem: Stem;
    dayBranch: Branch;
    element: Element;
  };
  phaseRelation: {
    code: FivePhaseRelation;
    title: "同" | "生" | "克";
    direction: "同类" | "我生" | "生我" | "我克" | "克我";
    explanation: string;
  };
  tenGod: {
    code: string;
    name: string;
    explanation: string;
  };
  branchRelation: {
    code: string;
    name: string;
    explanation: string;
  } | null;
  calculation: string[];
  precisionNote: string;
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const SOLAR_TERMS = [
  "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
  "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑",
  "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
] as const;

// 1900 年小寒起，各节气距前一回归年基准的分钟数。用于确定北京时间中的交节日期。
const SOLAR_TERM_MINUTES = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921,
  173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033,
  353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758
] as const;

const TERM_MONTH_BRANCHES: Branch[] = [
  "丑", "丑", "寅", "寅", "卯", "卯", "辰", "辰", "巳", "巳", "午", "午",
  "未", "未", "申", "申", "酉", "酉", "戌", "戌", "亥", "亥", "子", "子"
];

const TEN_GOD_CODES: Record<string, { code: string; name: string }> = {
  same_same: { code: "bijian", name: "比肩" },
  same_opposite: { code: "jiecai", name: "劫财" },
  generates_same: { code: "shishen", name: "食神" },
  generates_opposite: { code: "shangguan", name: "伤官" },
  controls_same: { code: "piancai", name: "偏财" },
  controls_opposite: { code: "zhengcai", name: "正财" },
  controlled_by_same: { code: "qisha", name: "七杀" },
  controlled_by_opposite: { code: "zhengguan", name: "正官" },
  generated_by_same: { code: "pianyin", name: "偏印" },
  generated_by_opposite: { code: "zhengyin", name: "正印" }
};

const SIX_HARMONY: Array<[Branch, Branch]> = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]
];
const CLASHES: Array<[Branch, Branch]> = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]
];
const HARMS: Array<[Branch, Branch]> = [
  ["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]
];
const BREAKS: Array<[Branch, Branch]> = [
  ["子", "酉"], ["丑", "辰"], ["寅", "亥"], ["卯", "午"], ["巳", "申"], ["未", "戌"]
];

export function buildDailyCorrespondence(
  profile: BirthProfileInput,
  dateKey: string
): DailyCorrespondence {
  assertDateKey(profile.birthDate, "出生日期");
  assertDateKey(dateKey, "今日日期");

  const birthChart = computeBazi({
    gender: "other",
    birthDate: profile.birthDate,
    birthTime: profile.birthTime ?? "",
    birthLocation: profile.birthLocation ?? undefined,
    unknownTime: !profile.birthTime
  });
  const todayChart = computeBazi({
    gender: "other",
    birthDate: dateKey,
    birthTime: "12:00",
    unknownTime: false
  });
  const relationCode = phaseRelation(birthChart.day.stemElement, todayChart.day.stemElement);
  const samePolarity = STEM_YIN_YANG[birthChart.day.stem] === STEM_YIN_YANG[todayChart.day.stem];
  const tenGod = TEN_GOD_CODES[`${relationCode}_${samePolarity ? "same" : "opposite"}`];
  const term = currentSolarTerm(dateKey);
  const branchRelation = resolveBranchRelation(birthChart.day.branch, todayChart.day.branch);

  return {
    date: dateKey,
    weekday: WEEKDAYS[new Date(`${dateKey}T12:00:00+08:00`).getUTCDay()],
    solarTerm: term.name,
    monthBranch: term.monthBranch,
    birth: {
      dayPillar: birthChart.day.pillarLabel,
      dayStem: birthChart.day.stem,
      dayBranch: birthChart.day.branch,
      element: birthChart.day.stemElement
    },
    today: {
      dayPillar: todayChart.day.pillarLabel,
      dayStem: todayChart.day.stem,
      dayBranch: todayChart.day.branch,
      element: todayChart.day.stemElement
    },
    phaseRelation: describePhaseRelation(relationCode, birthChart.day.stemElement, todayChart.day.stemElement),
    tenGod: {
      ...tenGod,
      explanation: `以你的${birthChart.day.stem}为日主，今日${todayChart.day.stem}与它阴阳${samePolarity ? "相同" : "相异"}，对应十神中的“${tenGod.name}”。`
    },
    branchRelation,
    calculation: [
      `出生日期的日柱为${birthChart.day.pillarLabel}，取日干${birthChart.day.stem}为日主。`,
      `今日干支为${todayChart.day.pillarLabel}，日干${todayChart.day.stem}属${todayChart.day.stemElement}。`,
      `${birthChart.day.stemElement}与${todayChart.day.stemElement}形成“${describePhaseRelation(relationCode, birthChart.day.stemElement, todayChart.day.stemElement).direction}”关系。`
    ],
    precisionNote: "日柱按公历日期计算；节气在交接日按北京时间日期显示。出生时间不确定时，本页不使用时柱。"
  };
}

export function phaseRelation(subject: Element, object: Element): FivePhaseRelation {
  if (subject === object) return "same";
  if (SHENG[subject] === object) return "generates";
  if (SHENG[object] === subject) return "generated_by";
  if (KE[subject] === object) return "controls";
  return "controlled_by";
}

export function currentSolarTerm(dateKey: string): { name: string; monthBranch: Branch; date: string } {
  assertDateKey(dateKey, "日期");
  const year = Number(dateKey.slice(0, 4));
  if (year < 1900 || year > 2100) throw new Error("节气计算支持 1900–2100 年");

  const candidates = [year - 1, year].flatMap(termYear =>
    SOLAR_TERMS.map((name, index) => ({
      name,
      monthBranch: TERM_MONTH_BRANCHES[index],
      date: solarTermDate(termYear, index)
    }))
  ).filter(term => term.date <= dateKey);
  return candidates[candidates.length - 1];
}

function solarTermDate(year: number, index: number): string {
  const milliseconds = 31556925974.7 * (year - 1900) + SOLAR_TERM_MINUTES[index] * 60000;
  const instant = new Date(Date.UTC(1900, 0, 6, 2, 5) + milliseconds);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(instant);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function describePhaseRelation(code: FivePhaseRelation, birth: Element, today: Element) {
  const descriptions: Record<FivePhaseRelation, DailyCorrespondence["phaseRelation"]> = {
    same: { code, title: "同", direction: "同类", explanation: `你的日主与今日天干同属${birth}，传统五行称为同类。` },
    generates: { code, title: "生", direction: "我生", explanation: `你的日主属${birth}，${birth}生${today}，传统五行称为“我生”。` },
    generated_by: { code, title: "生", direction: "生我", explanation: `今日天干属${today}，${today}生${birth}，传统五行称为“生我”。` },
    controls: { code, title: "克", direction: "我克", explanation: `你的日主属${birth}，${birth}克${today}，传统五行称为“我克”。` },
    controlled_by: { code, title: "克", direction: "克我", explanation: `今日天干属${today}，${today}克${birth}，传统五行称为“克我”。` }
  };
  return descriptions[code];
}

function resolveBranchRelation(birth: Branch, today: Branch): DailyCorrespondence["branchRelation"] {
  if (birth === today) {
    return { code: "same", name: "同支", explanation: `你的日支与今日日支同为${birth}。` };
  }
  const relations: Array<{
    pairs: Array<[Branch, Branch]>;
    code: string;
    name: string;
  }> = [
    { pairs: SIX_HARMONY, code: "branch_six_harmony", name: "六合" },
    { pairs: CLASHES, code: "branch_clash", name: "六冲" },
    { pairs: HARMS, code: "branch_harm", name: "六害" },
    { pairs: BREAKS, code: "branch_break", name: "六破" }
  ];
  const found = relations.find(relation => relation.pairs.some(pair => pair.includes(birth) && pair.includes(today)));
  return found
    ? { code: found.code, name: found.name, explanation: `你的日支${birth}与今日日支${today}形成“${found.name}”。这是结构名称，不直接等同于现实结果。` }
    : null;
}

function assertDateKey(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label}格式错误`);
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label}不是有效日期`);
  }
}
