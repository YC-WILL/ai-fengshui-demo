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
// 使用日主、五行相对强弱与隐性生日行为侧重生成观察性描述，避免固定人格标签。
const GIFT_BY_ELEMENT: Record<Element, string> = {
  木: "生长和尝试",
  火: "表达和行动",
  土: "稳定和落实",
  金: "取舍和边界",
  水: "观察和转圜"
};

interface DayMasterPattern {
  strength: string;
  tradeoff: string;
  decision: string;
  pressure: string;
  action: string;
}

const DAY_MASTER_PATTERN: Record<Stem, DayMasterPattern> = {
  甲: { strength: "认准方向后，你通常愿意主动开路，把模糊的想法推到可以行动的位置", tradeoff: "目标同时出现时，也可能把精力铺得太开，难以及时收拢", decision: "你会先判断这件事值不值得长期投入，再决定从哪里开始", pressure: "压力上来时容易继续往前顶，不太愿意中途示弱", action: "同时出现多个目标时，只保留一个本周必须推进的主任务" },
  乙: { strength: "你善于看见关系中的细节，也较会用柔和方式让事情继续向前", tradeoff: "为了顾全关系，有时会把自己的真实选择说得太晚", decision: "你常先衡量不同人的位置，再寻找既能推进又不伤和气的做法", pressure: "压力上来时可能反复调整表达，希望找到所有人都能接受的版本", action: "讨论超过十分钟仍没有结论时，分别写下一项不可退让和一项可以协商的条件" },
  丙: { strength: "你较容易把态度和热情传递出去，也能带动身边的人进入状态", tradeoff: "反应很快时，可能还没听完整件事就已经给出方向", decision: "你会先确认自己是否认同，再用行动和表达推动结果", pressure: "压力上来时语速和节奏容易一起变快", action: "重要回应前先复述一次对方的重点，再表达自己的看法" },
  丁: { strength: "你对细微变化较敏感，愿意在真正重要的事情上持续投入注意力", tradeoff: "在意越深时，越可能把许多判断留在心里反复推敲", decision: "你通常要先确认内心是否认同，才愿意给出明确承诺", pressure: "压力上来时容易缩小交流范围，独自消化很多细节", action: "犹豫超过一天的事情，写下事实、担心和需要分别是什么" },
  戊: { strength: "你面对复杂局面时较能稳住秩序，也愿意承担看得见的责任", tradeoff: "一旦把自己放在支撑位置，就可能低估调整方向的必要", decision: "你会优先考虑现实条件、责任归属和结果能否落地", pressure: "压力上来时容易继续加码承担，以为多做一点就能把局面稳住", action: "接下新责任前，先明确哪些部分不属于自己，以及何时需要别人接手" },
  己: { strength: "你较会照顾具体细节和身边人的感受，能让熟悉的生活保持安稳", tradeoff: "习惯先接住别人时，自己的负担可能直到累积后才被看见", decision: "你常从熟悉程度、现实影响和身边人的感受开始判断", pressure: "压力上来时容易继续处理琐事，却不急着说明自己已经疲惫", action: "答应帮忙前，先说清自己能做到的范围和需要对方承担的部分" },
  庚: { strength: "你面对问题时较容易抓住关键，也愿意把标准和边界说清楚", tradeoff: "判断明确是优势，但信息不足时也可能过早把选择关掉", decision: "你倾向先确定原则和底线，再比较哪种方案最有效", pressure: "压力上来时表达可能更直接，让他人只听见结论而没听见理由", action: "给出明确结论时，同时补充一条依据和一个仍可商量的部分" },
  辛: { strength: "你对分寸、品质和细节有较清楚的感受，也善于发现需要修整之处", tradeoff: "标准放得很近时，容易先看到不足，晚一点才承认已经做得不错", decision: "你通常会比较细节与长期影响，不愿只凭一时冲动决定", pressure: "压力上来时可能反复检查，担心一个小疏漏影响整体", action: "每次复盘同时写下一项需调整之处和一项已经有效的做法" },
  壬: { strength: "你能较快吸收新信息，也常能在变化中找到新的连接和路径", tradeoff: "可能性太多时，注意力容易不断转向，难以稳定在一个选择上", decision: "你会先搜集不同信息，再寻找弹性最大、可继续调整的方案", pressure: "压力上来时容易继续增加信息，希望用更多比较换来确定感", action: "资料搜集前先写下两个决策条件，满足后就停止继续扩展选项" },
  癸: { strength: "你对环境和他人的细微反应较敏锐，安静观察时常能看见被忽略的部分", tradeoff: "接收到的信息太多时，自己的需要可能被放到最后才辨认", decision: "你倾向先观察变化和后果，确认内心感受后再表态", pressure: "压力上来时可能把真实想法藏得更深，让外界误以为你没有意见", action: "重要讨论前先写下一句自己的判断，交流时不要等到最后才说" }
};

const REMINDER_BY_DAY_MASTER: Record<Stem, string> = {
  甲: "当待办不断增加却没有一件进入收尾时，先停下来判断自己是在推进，还是只是在不断开新头",
  乙: "一场讨论如果有了共同方案，却没有人知道你的真实偏好，可能是协调已经盖过了表达",
  丙: "当别人开始解释第二遍时，可以先检查自己是否太早回应，遗漏了对方真正想说的部分",
  丁: "重要事情在心里推演很多遍却没有开口时，沉默本身也可能让对方误判你的态度",
  戊: "当一件事越来越依赖你亲自托住时，要检查这是责任感，还是已经缺少合理分工",
  己: "发现自己不断替别人补细节时，先确认对方是否真的需要帮助，以及这是否属于你的责任",
  庚: "一个结论很快变得明确时，仍要检查是否还有一条重要信息尚未进入判断",
  辛: "反复修改同一个细节之前，先确认它是否真的影响结果，而不是只影响心里的完成感",
  壬: "当资料越查越多却更难决定时，问题通常不是信息不够，而是选择条件还没有被写清",
  癸: "当你已经察觉气氛变化却一直没有表态时，别人可能会把安静误解为同意或不在意"
};

export function friendlyCoreConclusion(chart: BaziChart): string {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  return `遇到重要事情时，你可能会${accent.response}。${pattern.strength}；不过，${pattern.tradeoff}。`;
}

export function friendlyElementNote(chart: BaziChart): string {
  const { strongest, weakest } = chart.elementDistribution;
  return `从传统五行角度看，${strongest}的侧重让你较容易把${GIFT_BY_ELEMENT[strongest]}放在前面；${weakest}相对不显眼时，${GIFT_BY_ELEMENT[weakest]}可能较晚才进入考虑。它只解释行为的一部分，真正需要留意的仍是你在具体事情中怎样选择。`;
}

export function personalityProfile(chart: BaziChart): string {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  return `从日常互动看，你可能${accent.profile}。做决定时，${pattern.decision}。${pattern.pressure}。这些线索更适合用来观察你在真实选择中的反应，而不是给性格下一个固定结论。`;
}

export function lifeReminders(chart: BaziChart): string[] {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  return [
    `${REMINDER_BY_DAY_MASTER[chart.dayMaster]}。`,
    `${accent.watchFor}。`
  ];
}

const ACTION_FOR_WEAKEST_ELEMENT: Record<Element, string> = {
  木: "每周安排一次不超过三十分钟的小尝试，例如学习新工具或调整工作方法，逐步增加面对变化的主动性。",
  火: "在安全的关系中练习直接表达感受和需要，可以从一句具体事实开始，不必等到想法完全整理好。",
  土: "为睡眠、饮食或工作收尾设置一个可重复的小仪式，用稳定线索帮助自己从忙乱切换到休整。",
  金: "遇到边界模糊的任务时，先写清完成标准和截止时间，再与相关人确认，减少后续反复修改。",
  水: "日程中保留一段不安排具体产出的空白时间，用散步、记录或安静独处观察自己的真实需要。"
};

export function lifeSuggestions(chart: BaziChart): string[] {
  const { weakest } = chart.elementDistribution;
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  return [
    `${accent.action}。`,
    `${pattern.action}。`,
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
