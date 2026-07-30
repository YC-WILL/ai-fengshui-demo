import { buildBaziMonthReadingFromFacts } from "./baziStructure";
import type {
  ProfessionalBaziFact,
  ProfessionalBaziFactsV1
} from "./professionalBaziFacts";

export const BAZI_MAINLINE_FACT_IDS = [
  "dayMaster.stem",
  "dayMaster.element",
  "dayMaster.yinYang",
  "monthCommand.branch",
  "monthCommand.element",
  "monthCommand.mainStem",
  "monthCommand.mainTenGod"
] as const;

export type BaziMainlineFactId = (typeof BAZI_MAINLINE_FACT_IDS)[number];

export interface BaziMainlineEvidence {
  id: BaziMainlineFactId;
  label: string;
  displayValue: string;
  fact: ProfessionalBaziFact<unknown>;
  sourceKind: "traditional-catalog" | "project-code";
}

export interface ReadyBaziMainlineNarrative {
  status: "ready";
  professionalAnalysis: {
    title: string;
    text: string;
    factIds: BaziMainlineFactId[];
  };
  imagery: {
    title: string;
    text: string;
    disclaimer: string;
    factIds: BaziMainlineFactId[];
  };
  plainReading: {
    title: string;
    text: string;
    boundary: string;
    factIds: BaziMainlineFactId[];
  };
  evidence: BaziMainlineEvidence[];
  limitation: string | null;
}

export interface UncertainBaziMainlineNarrative {
  status: "uncertain";
  title: string;
  message: string;
  candidates: string[];
}

export type BaziMainlineNarrative =
  | ReadyBaziMainlineNarrative
  | UncertainBaziMainlineNarrative;

function isConfirmedValue<T>(
  fact: ProfessionalBaziFact<T | null>
): fact is ProfessionalBaziFact<T> {
  return fact.certainty === "confirmed" && fact.value !== null;
}

function sourceKind(
  fact: ProfessionalBaziFact<unknown>
): BaziMainlineEvidence["sourceKind"] {
  return fact.sourceRuleId.startsWith("catalog:")
    ? "traditional-catalog"
    : "project-code";
}

function evidence(
  id: BaziMainlineFactId,
  label: string,
  displayValue: string,
  fact: ProfessionalBaziFact<unknown>
): BaziMainlineEvidence {
  return { id, label, displayValue, fact, sourceKind: sourceKind(fact) };
}

/**
 * 把现有专业事实合同与现有项目解释模板组合成一条最小阅读主线。
 * 本函数不计算新命理事实；缺少月令核心事实时不生成意象或白话解释。
 */
export function buildBaziMainlineNarrative(
  facts: ProfessionalBaziFactsV1 | null
): BaziMainlineNarrative | null {
  if (!facts) return null;

  const monthCandidates = facts.uncertainty.monthPillarCandidates.value;
  if (
    facts.monthCommand.branch.certainty !== "confirmed"
    || monthCandidates.length > 0
  ) {
    return {
      status: "uncertain",
      title: "月令当前存在候选，命盘主线暂不继续解释",
      message: "月柱会随出生时刻候选变化。候选确认前，不选择其中一个继续生成形象解释或白话解读。",
      candidates: monthCandidates
    };
  }
  const {
    stem: dayStem,
    element: dayElement,
    yinYang: dayYinYang
  } = facts.dayMaster;
  const {
    branch: monthBranch,
    element: monthElement,
    mainStem,
    mainTenGod
  } = facts.monthCommand;

  if (
    !isConfirmedValue(dayStem)
    || !isConfirmedValue(dayElement)
    || !isConfirmedValue(dayYinYang)
    || !isConfirmedValue(monthBranch)
    || !isConfirmedValue(monthElement)
    || !isConfirmedValue(mainStem)
    || !isConfirmedValue(mainTenGod)
  ) {
    return null;
  }

  const factIds: BaziMainlineFactId[] = [
    "dayMaster.stem",
    "dayMaster.element",
    "dayMaster.yinYang",
    "monthCommand.branch",
    "monthCommand.element",
    "monthCommand.mainStem",
    "monthCommand.mainTenGod"
  ];
  const evidenceItems: BaziMainlineEvidence[] = [
    evidence("dayMaster.stem", "日主", dayStem.value, dayStem),
    evidence("dayMaster.element", "日主五行", dayElement.value, dayElement),
    evidence("dayMaster.yinYang", "日主阴阳", dayYinYang.value, dayYinYang),
    evidence("monthCommand.branch", "月令", monthBranch.value, monthBranch),
    evidence("monthCommand.element", "月令五行", monthElement.value, monthElement),
    evidence("monthCommand.mainStem", "月令本气", mainStem.value, mainStem),
    evidence("monthCommand.mainTenGod", "本气十神", mainTenGod.value, mainTenGod)
  ];
  const yearCandidates = facts.uncertainty.yearPillarCandidates.value;
  const limitations = [
    facts.input.timeKnown.value
      ? ""
      : "出生时间未知：本主线没有使用时柱、时柱藏干或由时柱产生的关系。",
    yearCandidates.length
      ? `年柱存在${yearCandidates.join("、")}两个候选；本主线不使用年柱，所以只解释已确认的日主与月令。`
      : ""
  ].filter(Boolean);
  const monthReading = buildBaziMonthReadingFromFacts({
    dayStem: dayStem.value,
    monthBranch: monthBranch.value,
    mainStem: mainStem.value,
    mainTenGod: mainTenGod.value
  });

  return {
    status: "ready",
    professionalAnalysis: {
      title: "先确认日主与月令",
      text: `你的日主为${dayStem.value}${dayElement.value}（${dayYinYang.value}），月令为${monthBranch.value}${monthElement.value}。月令本气是${mainStem.value}，相对日主形成${mainTenGod.value}。本轮只确认这组结构，不据此判断旺衰、格局或喜用神。`,
      factIds
    },
    imagery: {
      title: "把日主放进出生时节",
      text: monthReading.image,
      disclaimer: "下面是蟾先森为了帮助理解采用的现代意象，不是古籍原句，也不是传统定论。",
      factIds: [
        "dayMaster.stem",
        "dayMaster.element",
        "monthCommand.branch",
        "monthCommand.mainTenGod"
      ]
    },
    plainReading: {
      title: "这组结构可以怎样理解",
      text: monthReading.interpretation,
      boundary: "这是项目基于上述结构提供的条件性白话解释。它不证明某段现实经历已经发生，也不构成固定性格判断。",
      factIds: [
        "dayMaster.stem",
        "monthCommand.branch",
        "monthCommand.mainStem",
        "monthCommand.mainTenGod"
      ]
    },
    evidence: evidenceItems,
    limitation: limitations.length ? limitations.join(" ") : null
  };
}
