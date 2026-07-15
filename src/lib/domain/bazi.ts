// ============================================================
// 八字（四柱）简化计算
//
// ⚠️ MVP 注意：本实现采用简化算法 ——
//   · 年柱按公历年份近似（未严格按立春切换）
//   · 月柱按公历月份近似（未按节气切换）
//   · 日柱使用儒略日法，结果较准确
//   · 时柱按 24 小时区间近似（未按真太阳时）
//
// 正式上线请替换为成熟农历/节气库（如 lunar-typescript），
// 本文件已尽量隔离接口，便于无痛替换。
// ============================================================

import {
  STEMS, BRANCHES, STEM_ELEMENT, BRANCH_ELEMENT,
  STEM_YIN_YANG, ZODIAC_BY_BRANCH, elementDistribution,
  type Stem, type Branch, type Element
} from "./elements";
import type { BaziInput } from "../types";
import { behavioralAccent } from "./behavioralAccent";

export interface Pillar {
  stem: Stem;
  branch: Branch;
  stemElement: Element;
  branchElement: Element;
  pillarLabel: string; // e.g. "甲子"
}

export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 出生时间未知时为 null
  dayMaster: Stem;
  zodiac: string;
  elementDistribution: ReturnType<typeof elementDistribution>;
  notes: string[];
  inputSnapshot: BaziInput;
}

// ---------- 儒略日 ----------
function toJulianDay(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

// 1900-01-01 (Gregorian) 是 甲戌日：stem=0(甲), branch=10(戌)
// JD(1900-01-01) = 2415021
function dayPillarFromJD(jd: number): Pillar {
  const stemIdx = ((jd - 1) % 10 + 10) % 10;
  const branchIdx = ((jd + 1) % 12 + 12) % 12;
  return makePillar(stemIdx, branchIdx);
}

function makePillar(stemIdx: number, branchIdx: number): Pillar {
  const stem = STEMS[stemIdx];
  const branch = BRANCHES[branchIdx];
  return {
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    pillarLabel: `${stem}${branch}`
  };
}

// ---------- 年柱（简化：按公历年份） ----------
function yearPillar(year: number): Pillar {
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  return makePillar(stemIdx, branchIdx);
}

// ---------- 月柱（简化：按公历月份）----------
// 五虎遁：年干 → 寅月起干
const FIVE_TIGER: Record<Stem, Stem> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲"
};
function monthPillar(yearStem: Stem, month: number): Pillar {
  // Gregorian month → branch： Feb→寅(2), …, Dec→子(0), Jan→丑(1)
  const branchIdx = month % 12;
  // 寅月起干 = FIVE_TIGER[yearStem]，然后按 (branchIdx - 2) 偏移
  const startStem = FIVE_TIGER[yearStem];
  const startStemIdx = STEMS.indexOf(startStem);
  // 从寅(2)开始按月推进
  const offsetFromYin = ((branchIdx - 2) % 12 + 12) % 12;
  const stemIdx = (startStemIdx + offsetFromYin) % 10;
  return makePillar(stemIdx, branchIdx);
}

// ---------- 时柱（简化：按 24 小时区间）----------
// 五鼠遁：日干 → 子时起干
const FIVE_RAT: Record<Stem, Stem> = {
  甲: "甲", 己: "甲",
  乙: "丙", 庚: "丙",
  丙: "戊", 辛: "戊",
  丁: "庚", 壬: "庚",
  戊: "壬", 癸: "壬"
};
function hourBranchIndex(hour: number): number {
  // 23-1=子(0), 1-3=丑(1), ..., 21-23=亥(11)
  return Math.floor(((hour + 1) % 24) / 2);
}
function hourPillar(dayStem: Stem, hour: number): Pillar {
  const branchIdx = hourBranchIndex(hour);
  const startStem = FIVE_RAT[dayStem];
  const startStemIdx = STEMS.indexOf(startStem);
  const stemIdx = (startStemIdx + branchIdx) % 10;
  return makePillar(stemIdx, branchIdx);
}

// ---------- 主函数 ----------
export function computeBazi(input: BaziInput): BaziChart {
  const notes: string[] = [];
  const [yStr, mStr, dStr] = input.birthDate.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  if (!y || !m || !d) {
    throw new Error("出生日期格式错误，应为 YYYY-MM-DD");
  }

  const yp = yearPillar(y);
  const mp = monthPillar(yp.stem, m);
  const jd = toJulianDay(y, m, d);
  const dp = dayPillarFromJD(jd);

  let hp: Pillar | null = null;
  if (input.unknownTime) {
    notes.push("出生时间未知，时柱已省略，相关结论仅参考。");
  } else if (input.birthTime) {
    const [hh] = input.birthTime.split(":").map(n => parseInt(n, 10));
    if (Number.isFinite(hh)) {
      hp = hourPillar(dp.stem, hh);
    } else {
      notes.push("出生时间解析失败，时柱已省略。");
    }
  } else {
    notes.push("未填写出生时间，时柱已省略。");
  }

  const allElements: Element[] = [
    yp.stemElement, yp.branchElement,
    mp.stemElement, mp.branchElement,
    dp.stemElement, dp.branchElement,
    ...(hp ? [hp.stemElement, hp.branchElement] : [])
  ];

  notes.push("本计算为简化版：年/月柱未严格按立春与节气切换，仅供参考。");

  return {
    year: yp,
    month: mp,
    day: dp,
    hour: hp,
    dayMaster: dp.stem,
    zodiac: ZODIAC_BY_BRANCH[yp.branch],
    elementDistribution: elementDistribution(allElements),
    notes,
    inputSnapshot: input
  };
}

// ---------- 简化"性格画像"与生活建议派生 ----------
// 使用日主与五行相对强弱生成观察性描述，避免把传统结构写成固定人格标签。
const TRAITS_BY_DAY_MASTER: Record<Stem, string[]> = {
  甲: ["主动", "进取", "坚定"],
  乙: ["温和", "柔韧", "细腻"],
  丙: ["开朗", "热忱", "外向"],
  丁: ["敏感", "专注", "内省"],
  戊: ["稳重", "包容", "务实"],
  己: ["细致", "适应", "包容"],
  庚: ["果决", "条理", "原则"],
  辛: ["精致", "克制", "审美"],
  壬: ["流动", "灵活", "广博"],
  癸: ["敏锐", "细腻", "深思"]
};

const IMAGE_BY_ELEMENT: Record<Element, string> = {
  木: "一棵慢慢舒展枝叶的树",
  火: "一盏愿意照亮身边的灯",
  土: "一块让人感到踏实的土地",
  金: "一件经过细细打磨的器物",
  水: "一条会顺势寻找方向的河流"
};

const GIFT_BY_ELEMENT: Record<Element, string> = {
  木: "生长和尝试",
  火: "表达和行动",
  土: "稳定和落实",
  金: "取舍和边界",
  水: "观察和转圜"
};

export function friendlyCoreConclusion(chart: BaziChart): string {
  const dayMasterElement = STEM_ELEMENT[chart.dayMaster];
  const { strongest, weakest } = chart.elementDistribution;
  return `先给你一个整体印象：你有点像${IMAGE_BY_ELEMENT[dayMasterElement]}，有自己的生长方式，也有自己的步调。${strongest}的力量让你在熟悉的事情上更容易站稳脚跟；${weakest}相对少一些时，也提醒你遇到变化不必急着给出答案，给自己留一点转身的余地。`;
}

export function friendlyElementNote(chart: BaziChart): string {
  const { strongest, weakest } = chart.elementDistribution;
  return `你的五行里${strongest}比较显眼，${weakest}相对少一些。简单说，你较容易从${GIFT_BY_ELEMENT[strongest]}中找到熟悉的节奏，也可以有意识地为${GIFT_BY_ELEMENT[weakest]}多留一点空间。`;
}

export function personalityProfile(chart: BaziChart): string {
  const traits = TRAITS_BY_DAY_MASTER[chart.dayMaster].join("、");
  const { strongest, weakest } = chart.elementDistribution;
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  return `你身上可能有${traits}的一面，像${IMAGE_BY_ELEMENT[STEM_ELEMENT[chart.dayMaster]]}，有自己的方向。从行为节奏看，你${accent.profile}。${strongest}较明显，让你容易沿用有效的方法；${weakest}相对少一些，则提醒你多给自己一点调整空间。这不是给你贴标签，只是一面小镜子，不妨对照真实经历，看看哪些地方像你。`;
}

const REMINDER_FOR_STRONGEST_ELEMENT: Record<Element, string> = {
  木: "想做的事情一多，枝叶容易伸得太开；记得先照顾好眼前最重要的一件事。",
  火: "状态上来时，你可能走得很快；重要回应不妨慢半拍，听清自己也听清对方。",
  土: "熟悉的安排会让人安心，也可能让改变来得慢一些；偶尔换个角度，会看到新的路。",
  金: "标准清楚是长处，只是别把尺子一直对着自己；做得不错的地方，也值得被看见。",
  水: "想法多时容易来回比较；先抓住两件最重要的事，心里会清爽一些。"
};

const REMINDER_FOR_WEAKEST_ELEMENT: Record<Element, string> = {
  木: "遇到陌生选择时，可以从一个很小的尝试开始，不必等到万事齐备才行动。",
  火: "有些感受若一直放在心里，别人未必猜得到；可以试着用一句具体的话说出来。",
  土: "忙起来时更要记得照顾作息和收尾，让身体知道什么时候该停下来休息。",
  金: "边界不清的事情容易反复消耗；答应之前，先问清标准、时间和彼此的责任。",
  水: "日程排得太满时，判断也会变得拥挤；给自己留一点散步或安静独处的空白。"
};

export function lifeReminders(chart: BaziChart): string[] {
  const { strongest, weakest } = chart.elementDistribution;
  return [
    REMINDER_FOR_STRONGEST_ELEMENT[strongest],
    REMINDER_FOR_WEAKEST_ELEMENT[weakest]
  ];
}

const ACTION_BY_DAY_MASTER_ELEMENT: Record<Element, string> = {
  木: "为当前最想推进的一件事写下本周最小行动，并在完成后再增加下一步，减少目标过多带来的分散。",
  火: "重要表达前先区分“我想传达什么”和“对方需要听见什么”，可以尝试放慢回应速度，给沟通留出确认空间。",
  土: "每周检查一次自己承担的事项，把可以协商或延后的部分明确说出来，避免习惯性包揽消耗精力。",
  金: "做决定时除了列标准，也补写一个“仍需了解的信息”，帮助自己在坚持原则和保持弹性之间找到平衡。",
  水: "把新想法先记入清单，隔一天再选择其中一项试行，用小规模行动检验灵感，避免同时开启过多方向。"
};

const ACTION_FOR_STRONGEST_ELEMENT: Record<Element, string> = {
  木: "当计划不断扩展时，可以设定清晰的停止点，优先完成已经开始的任务，再评估是否继续增加目标。",
  火: "在节奏较快或情绪较强时，可以先做几分钟低刺激活动，再处理需要判断或回应的事项。",
  土: "面对熟悉流程时，尝试邀请一位信任的人提供不同看法，避免只因稳定而忽略更合适的选择。",
  金: "复盘时不只记录问题，也写下一个已经有效的做法，让自我要求同时包含修正和肯定。",
  水: "信息较多时先确定本次决定的两个核心条件，把其余内容放入待观察清单，降低反复比较的负担。"
};

const ACTION_FOR_WEAKEST_ELEMENT: Record<Element, string> = {
  木: "每周安排一次不超过三十分钟的小尝试，例如学习新工具或调整工作方法，逐步增加面对变化的主动性。",
  火: "在安全的关系中练习直接表达感受和需要，可以从一句具体事实开始，不必等到想法完全整理好。",
  土: "为睡眠、饮食或工作收尾设置一个可重复的小仪式，用稳定线索帮助自己从忙乱切换到休整。",
  金: "遇到边界模糊的任务时，先写清完成标准和截止时间，再与相关人确认，减少后续反复修改。",
  水: "日程中保留一段不安排具体产出的空白时间，用散步、记录或安静独处观察自己的真实需要。"
};

export function lifeSuggestions(chart: BaziChart): string[] {
  const { strongest, weakest } = chart.elementDistribution;
  const dayMasterElement = STEM_ELEMENT[chart.dayMaster];
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  return [
    `${ACTION_BY_DAY_MASTER_ELEMENT[dayMasterElement]}也可以尝试：${accent.action}。`,
    ACTION_FOR_STRONGEST_ELEMENT[strongest],
    ACTION_FOR_WEAKEST_ELEMENT[weakest]
  ];
}

export function elementSummary(chart: BaziChart): string {
  const dist = chart.elementDistribution;
  const parts: string[] = [];
  for (const e of ["木", "火", "土", "金", "水"] as Element[]) {
    parts.push(`${e}${dist.counts[e]}`);
  }
  return parts.join(" ");
}

export function dayMasterDescription(chart: BaziChart): string {
  const dm = chart.dayMaster;
  const yy = STEM_YIN_YANG[dm];
  const ele = STEM_ELEMENT[dm];
  return `日主为${yy}${ele}（${dm}），五行结构整体${describeBalance(chart)}。`;
}

function describeBalance(chart: BaziChart): string {
  const { strongest, weakest, missing } = chart.elementDistribution;
  if (missing.length >= 2) return `偏${strongest}，缺${missing.join("/")}`;
  if (missing.length === 1) return `偏${strongest}，缺${missing[0]}`;
  return `偏${strongest}，相对弱${weakest}`;
}
