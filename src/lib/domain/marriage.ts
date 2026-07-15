// ============================================================
// 关系匹配规则（基础版）
//
// MVP 设计原则：
//   · 只输出"沟通风格、潜在摩擦点、相处建议"，不下"必合/必分"判断
//   · 五行生克 + 日柱组合 + 简单生肖关系（六合 / 三合 / 相冲）
//   · 不使用"正缘 / 孽缘 / 烂桃花"等情绪化标签
// ============================================================

import { computeBazi, type BaziChart } from "./bazi";
import { SHENG, KE, type Element, BRANCH_ELEMENT } from "./elements";
import type { MarriageInput } from "../types";

export interface MarriageMatch {
  partyA: BaziChart;
  partyB: BaziChart;
  dayMasterRelation: ElementRelation;
  zodiacRelation: ZodiacRelation;
  elementBalance: ElementBalanceComment;
  communicationStyle: string;
  strengths: string[];
  frictionPoints: string[];
  suggestions: string[];
  notes: string[];
}

type ElementRelation =
  | { kind: "same"; element: Element; note: string }
  | { kind: "sheng"; from: Element; to: Element; direction: "A→B" | "B→A"; note: string }
  | { kind: "ke";    from: Element; to: Element; direction: "A→B" | "B→A"; note: string };

interface ZodiacRelation {
  pair: string;            // 如 "鼠 / 牛"
  relationLabel: string;   // 六合 / 三合 / 相冲 / 一般
  note: string;
}

interface ElementBalanceComment {
  combinedDistribution: Record<Element, number>;
  comment: string;
}

// 六合 / 三合 / 相冲（按 branch 索引 0-11，子=0...亥=11）
const LIUHE: Record<number, number> = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
const SANHE: Record<number, number[]> = {
  0: [4, 8], 4: [0, 8], 8: [0, 4],   // 申子辰 (8,0,4)
  2: [6, 10], 6: [2, 10], 10: [2, 6], // 寅午戌
  3: [7, 11], 7: [3, 11], 11: [3, 7], // 亥卯未
  5: [1, 9], 1: [5, 9], 9: [1, 5]     // 巳酉丑
};
const CHONG: Record<number, number> = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };

function dayMasterRelation(a: BaziChart, b: BaziChart): ElementRelation {
  const ea = a.day.stemElement;
  const eb = b.day.stemElement;
  if (ea === eb) {
    return {
      kind: "same",
      element: ea,
      note: `双方日主同属${ea}，气质相近、节奏接近，常常"懂彼此"，但容易因相似而少互补。`
    };
  }
  if (SHENG[ea] === eb) {
    return {
      kind: "sheng", from: ea, to: eb, direction: "A→B",
      note: `日主上 A(${ea}) 生 B(${eb})：A 在关系中常处于"付出/支持"位，需注意双方付出与回应的平衡。`
    };
  }
  if (SHENG[eb] === ea) {
    return {
      kind: "sheng", from: eb, to: ea, direction: "B→A",
      note: `日主上 B(${eb}) 生 A(${ea})：B 在关系中常处于"付出/支持"位，需注意双方付出与回应的平衡。`
    };
  }
  if (KE[ea] === eb) {
    return {
      kind: "ke", from: ea, to: eb, direction: "A→B",
      note: `日主上 A(${ea}) 克 B(${eb})：双方在节奏与决策风格上易出现张力，建议建立明确的边界与对话规则。`
    };
  }
  if (KE[eb] === ea) {
    return {
      kind: "ke", from: eb, to: ea, direction: "B→A",
      note: `日主上 B(${eb}) 克 A(${ea})：B 的节奏更偏强势，A 需要更主动表达需求。`
    };
  }
  // 兜底（理论上五行二元关系一定落入上述其一）
  return {
    kind: "same", element: ea,
    note: "双方五行关系较中性，可结合具体性格互相磨合。"
  };
}

function zodiacRelation(a: BaziChart, b: BaziChart): ZodiacRelation {
  const ai = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].indexOf(a.year.branch);
  const bi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].indexOf(b.year.branch);
  const pair = `${a.zodiac} / ${b.zodiac}`;

  if (LIUHE[ai] === bi) {
    return { pair, relationLabel: "六合", note: "传统认为属六合，相处节奏易同步，沟通偏顺畅。" };
  }
  if (SANHE[ai]?.includes(bi)) {
    return { pair, relationLabel: "三合", note: "属三合关系，传统视角认为合作意识较强，适合共同推进事项。" };
  }
  if (CHONG[ai] === bi) {
    return { pair, relationLabel: "相冲", note: "属相冲，传统视角下节奏差异较大；现实中表现多为意见分歧，**并非注定不合**，关键在于建立沟通机制。" };
  }
  return { pair, relationLabel: "一般", note: "生肖关系较为中性，差异更多由个人性格与生活习惯决定。" };
}

function elementBalance(a: BaziChart, b: BaziChart): ElementBalanceComment {
  const combined: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const e of ["木", "火", "土", "金", "水"] as Element[]) {
    combined[e] = a.elementDistribution.counts[e] + b.elementDistribution.counts[e];
  }
  const max = (Object.keys(combined) as Element[]).reduce((x, y) => combined[x] >= combined[y] ? x : y);
  const min = (Object.keys(combined) as Element[]).reduce((x, y) => combined[x] <= combined[y] ? x : y);
  return {
    combinedDistribution: combined,
    comment: `合并五行偏${max}、相对弱${min}。在共同决策上，建议有意识地补充${min}相关情境（节制 / 行动 / 表达 / 反思 / 整理）。`
  };
}

const STYLE_BY_DM_PAIR: Record<string, string> = {
  "甲乙": "双方都偏行动派，建议明确分工避免重复推动。",
  "丙丁": "双方都偏热情外向，注意情绪叠加时的降温机制。",
  "戊己": "双方都偏稳重，节奏可能偏慢，需共同设节点推进。",
  "庚辛": "双方都偏理性原则，注意为彼此预留弹性空间。",
  "壬癸": "双方都偏内敛善感，重要事项建议白纸黑字写明，减少误读。",
  "甲庚": "一个进取一个克制，意见容易快速分歧，务必先听完再回应。",
  "乙辛": "一个柔韧一个精致，注意「小事不让步」的累积效应。",
  "丙壬": "一个外放一个内敛，需要为对方预留缓冲时间。",
  "丁癸": "都偏敏感，沟通时建议先复述对方意思再表达自己。"
};

function communicationStyle(a: BaziChart, b: BaziChart): string {
  const key1 = `${a.dayMaster}${b.dayMaster}`;
  const key2 = `${b.dayMaster}${a.dayMaster}`;
  return STYLE_BY_DM_PAIR[key1] ?? STYLE_BY_DM_PAIR[key2] ??
    `日主组合 ${a.dayMaster}/${b.dayMaster}：建议建立每周固定的"对齐时间"，把可能的分歧前置沟通。`;
}

export function matchMarriage(input: MarriageInput): MarriageMatch {
  const a = computeBazi(input.partyA);
  const b = computeBazi(input.partyB);
  const rel = dayMasterRelation(a, b);
  const zod = zodiacRelation(a, b);
  const bal = elementBalance(a, b);

  const strengths: string[] = [];
  const frictionPoints: string[] = [];
  const suggestions: string[] = [];
  const notes: string[] = [
    "本结果基于传统命理结构 + 心理学常见沟通模式，仅供参考；",
    "关系是动态的，不存在「绝对相合」或「绝对不合」的判断，关键在于双方对沟通节奏的协商。"
  ];

  if (rel.kind === "same") {
    strengths.push("彼此能「懂」，处事节奏相近");
    frictionPoints.push("缺少互补，遇到陌生情境时容易共同盲点");
    suggestions.push("碰到重要决定时，先各自写下一个不同方案，再一起比较，避免两个人顺着同一个惯性往前走。");
  } else if (rel.kind === "sheng") {
    strengths.push("有自然的「扶持—被扶持」动力");
    frictionPoints.push("付出方长期承担容易耗竭，需要主动表达");
    suggestions.push("每周找十分钟互相问一句「这周有什么是我能帮你的」，让付出和回应都被看见。");
  } else if (rel.kind === "ke") {
    strengths.push("对彼此有真实的反馈，容易把对方「拽出舒适区」");
    frictionPoints.push("观点冲突时升级较快，需要冷静机制");
    suggestions.push("意见顶在一起时，先暂停二十分钟，再各自用一句话说清最在意的事，不急着争出输赢。");
  }

  if (zod.relationLabel === "六合" || zod.relationLabel === "三合") {
    strengths.push(`生肖关系传统认为${zod.relationLabel}，节奏更易同步`);
    suggestions.push("你们容易很快达成共识，重要安排仍可以轮流做一次“反方”，把容易忽略的细节补齐。");
  } else if (zod.relationLabel === "相冲") {
    frictionPoints.push("生肖相冲，遇到节奏不同步时易表面冲突，建议先约好「24h 不决定」原则");
    suggestions.push("行程、支出或家庭安排尽量提前一天确认；若意见不同，先保留两个选择，隔一晚再决定。");
  } else {
    suggestions.push("把彼此习以为常的生活习惯说出来，例如作息、花钱和独处时间，别让“我以为你知道”变成误会。");
  }

  const combined = bal.combinedDistribution;
  const weakest = (Object.keys(combined) as Element[]).reduce((x, y) => combined[x] <= combined[y] ? x : y);
  const balanceSuggestion: Record<Element, string> = {
    木: "共同计划不妨留一点成长空间：每月选一件新鲜小事一起尝试，再聊聊各自真实的感受。",
    火: "日常里可以多给明确回应：一句感谢、一个拥抱或一次及时肯定，都比等对方猜更有效。",
    土: "遇到变化时先把时间、预算和分工写下来，让两个人都知道下一步该做什么。",
    金: "重要边界最好说得具体，例如哪些事要共同决定、哪些时间各自保留，清楚反而更轻松。",
    水: "每周留一次不解决问题的聊天，只听彼此最近在想什么，让情绪有地方慢慢流动。"
  };
  suggestions.push(balanceSuggestion[weakest]);

  return {
    partyA: a,
    partyB: b,
    dayMasterRelation: rel,
    zodiacRelation: zod,
    elementBalance: bal,
    communicationStyle: communicationStyle(a, b),
    strengths,
    frictionPoints,
    suggestions,
    notes
  };
}
