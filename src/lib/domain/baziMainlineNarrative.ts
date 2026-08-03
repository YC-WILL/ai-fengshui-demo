import {
  selectBaziDirectNarrative,
  type BaziDirectNarrativeSelection
} from "./baziDirectNarratives";
import type { BaziBirthSolarTermFactsV1 } from "./baziBirthSolarTermFacts";
import type { BaziBirthMoonPhaseFactsV1 } from "./baziBirthMoonPhaseFacts";
import {
  selectBaziMoonPhaseNarrative,
  type BaziMoonPhaseNarrativeSelection
} from "./baziMoonPhaseNarratives";
import {
  selectBaziSolarTermNarrative,
  type BaziSolarTermNarrativeSelection
} from "./baziSolarTermNarratives";
import { ALL_ELEMENTS, type Element, type YinYang } from "./elements";
import type {
  ProfessionalBaziFact,
  ProfessionalBaziFactsV1,
  ProfessionalBaziPillarFacts
} from "./professionalBaziFacts";

export const BAZI_ANALYSIS_THEME_IDS = [
  "day-master-month-command",
  "yin-yang",
  "five-elements",
  "ten-gods-pillars",
  "natal-branch-relations"
] as const;

export const BAZI_MAINLINE_FACT_IDS = [
  "dayMaster.stem",
  "dayMaster.element",
  "dayMaster.yinYang",
  "monthCommand.branch",
  "monthCommand.element",
  "monthCommand.mainStem",
  "monthCommand.mainTenGod"
] as const;

export type BaziAnalysisThemeId = (typeof BAZI_ANALYSIS_THEME_IDS)[number];
export type BaziMainlineFactId = (typeof BAZI_MAINLINE_FACT_IDS)[number];

export interface BaziMainlineEvidence {
  id: string;
  label: string;
  displayValue: string;
  fact: ProfessionalBaziFact<unknown>;
  sourceKind: "traditional-catalog" | "project-code";
}

export interface BaziElementSummary {
  coverageCount: number;
  counts: Record<Element, number>;
  visibleElements: Element[];
  hiddenOnlyElements: Element[];
  notSeenElements: Element[];
}

export interface BaziYinYangSummary {
  coverageCount: number;
  counts: Record<YinYang, number>;
  ratios: Record<YinYang, number>;
}

export interface BaziTenGodPositionSummary {
  position: string;
  visible: string;
  hidden: string[];
}

export interface BaziBranchRelationPositionSummary {
  firstPillar: string;
  firstBranch: string;
  secondPillar: string;
  secondBranch: string;
  relations: string[];
}

export interface BaziFoundationSummary {
  dayMaster: {
    stem: string;
    element: Element;
    yinYang: string;
  } | null;
  monthCommand: {
    branch: string;
    element: Element;
    mainStem: string;
    mainTenGod: string;
  } | null;
  monthCandidates: string[];
  evidence: BaziMainlineEvidence[];
  limitation: string | null;
}

export interface ReadyBaziAnalysisTheme {
  status: "ready";
  id: BaziAnalysisThemeId;
  title: string;
  scope: string;
  factIds: string[];
  evidence: BaziMainlineEvidence[];
  limitation: string | null;
  yinYangSummary?: BaziYinYangSummary;
  elementSummary?: BaziElementSummary;
  tenGodPositions?: BaziTenGodPositionSummary[];
  branchRelationPositions?: BaziBranchRelationPositionSummary[];
}

export interface BaziMainlineNarrative {
  title: string;
  foundation: BaziFoundationSummary;
  directNarrative: BaziDirectNarrativeSelection;
  solarTermNarrative: BaziSolarTermNarrativeSelection;
  moonPhaseNarrative: BaziMoonPhaseNarrativeSelection;
  themes: ReadyBaziAnalysisTheme[];
}

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
  id: string,
  label: string,
  displayValue: string,
  fact: ProfessionalBaziFact<unknown>
): BaziMainlineEvidence {
  return { id, label, displayValue, fact, sourceKind: sourceKind(fact) };
}

function uniqueEvidence(items: BaziMainlineEvidence[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function confirmedPillars(facts: ProfessionalBaziFactsV1) {
  return facts.pillars
    .map((pillar, index) => ({ pillar, index }))
    .filter(({ pillar }) => (
      pillar.ganzhi.certainty === "confirmed"
      && isConfirmedValue(pillar.stemElement)
      && isConfirmedValue(pillar.branchElement)
    ));
}

function omittedPillarNames(facts: ProfessionalBaziFactsV1) {
  return facts.pillars
    .filter(pillar => pillar.ganzhi.certainty !== "confirmed")
    .map(pillar => pillar.position.value);
}

function buildFoundationSummary(
  facts: ProfessionalBaziFactsV1
): BaziFoundationSummary {
  const { stem, element, yinYang } = facts.dayMaster;
  const dayMasterReady = (
    isConfirmedValue(stem)
    && isConfirmedValue(element)
    && isConfirmedValue(yinYang)
  );
  const monthCandidates = facts.uncertainty.monthPillarCandidates.value;
  const month = facts.monthCommand;
  const monthReady = (
    monthCandidates.length === 0
    && isConfirmedValue(month.branch)
    && isConfirmedValue(month.element)
    && isConfirmedValue(month.mainStem)
    && isConfirmedValue(month.mainTenGod)
  );
  const foundationEvidence = [
    ...(dayMasterReady ? [
      evidence("dayMaster.stem", "日主", stem.value, stem),
      evidence("dayMaster.element", "日主五行", element.value, element),
      evidence("dayMaster.yinYang", "日主阴阳", yinYang.value, yinYang)
    ] : []),
    ...(monthReady ? [
      evidence("monthCommand.branch", "月令", month.branch.value!, month.branch),
      evidence("monthCommand.element", "月令五行", month.element.value!, month.element),
      evidence("monthCommand.mainStem", "月令本气", month.mainStem.value!, month.mainStem),
      evidence("monthCommand.mainTenGod", "本气十神", month.mainTenGod.value!, month.mainTenGod)
    ] : []),
    ...(!monthReady && monthCandidates.length ? [
      evidence(
        "uncertainty.monthPillarCandidates",
        "月柱候选",
        monthCandidates.join(" 或 "),
        facts.uncertainty.monthPillarCandidates
      )
    ] : [])
  ];

  return {
    dayMaster: dayMasterReady ? {
      stem: stem.value,
      element: element.value,
      yinYang: yinYang.value
    } : null,
    monthCommand: monthReady ? {
      branch: month.branch.value!,
      element: month.element.value!,
      mainStem: month.mainStem.value!,
      mainTenGod: month.mainTenGod.value!
    } : null,
    monthCandidates,
    evidence: foundationEvidence,
    limitation: monthReady
      ? null
      : monthCandidates.length
        ? `月柱存在${monthCandidates.join("、")}候选，当前不选取月令，也不继续展示依赖月令的物象。`
        : "月令必要事实尚未确认，当前不继续展示依赖月令的物象。"
  };
}

function buildDayMasterMonthTheme(
  facts: ProfessionalBaziFactsV1
): ReadyBaziAnalysisTheme | null {
  const { stem, element, yinYang } = facts.dayMaster;
  if (
    !isConfirmedValue(stem)
    || !isConfirmedValue(element)
    || !isConfirmedValue(yinYang)
  ) {
    return null;
  }

  const monthCandidates = facts.uncertainty.monthPillarCandidates.value;
  const monthFacts = facts.monthCommand;
  const monthConfirmed = (
    monthCandidates.length === 0
    && isConfirmedValue(monthFacts.branch)
    && isConfirmedValue(monthFacts.element)
    && isConfirmedValue(monthFacts.mainStem)
    && isConfirmedValue(monthFacts.mainTenGod)
  );
  const baseEvidence = [
    evidence("dayMaster.stem", "日主", stem.value, stem),
    evidence("dayMaster.element", "日主五行", element.value, element),
    evidence("dayMaster.yinYang", "日主阴阳", yinYang.value, yinYang)
  ];
  const yearCandidates = facts.uncertainty.yearPillarCandidates.value;
  const commonLimitations = [
    facts.input.timeKnown.value
      ? ""
      : "出生时间未知：本主题没有使用时柱及其下级事实。",
    yearCandidates.length
      ? `年柱存在${yearCandidates.join("、")}候选；本主题不使用年柱候选继续解释。`
      : ""
  ].filter(Boolean);

  if (!monthConfirmed) {
    const candidateEvidence = monthCandidates.length
      ? [evidence(
          "uncertainty.monthPillarCandidates",
          "月柱候选",
          monthCandidates.join(" 或 "),
          facts.uncertainty.monthPillarCandidates
        )]
      : [];
    const factIds = [...baseEvidence, ...candidateEvidence].map(item => item.id);

    return {
      status: "ready",
      id: "day-master-month-command",
      title: "日主与月令",
      scope: "先确认稳定坐标，候选部分暂不推导",
      factIds,
      evidence: [...baseEvidence, ...candidateEvidence],
      limitation: [
        "月令依赖月柱，当前存在候选或必要事实不足；本气与本气十神均未参与下级解释。",
        ...commonLimitations
      ].join(" ")
    };
  }

  const monthBranch = monthFacts.branch.value!;
  const monthElement = monthFacts.element.value!;
  const monthMainStem = monthFacts.mainStem.value!;
  const monthMainTenGod = monthFacts.mainTenGod.value!;
  const monthEvidence = [
    evidence("monthCommand.branch", "月令", monthBranch, monthFacts.branch),
    evidence("monthCommand.element", "月令五行", monthElement, monthFacts.element),
    evidence("monthCommand.mainStem", "月令本气", monthMainStem, monthFacts.mainStem),
    evidence("monthCommand.mainTenGod", "本气十神", monthMainTenGod, monthFacts.mainTenGod)
  ];
  const allEvidence = [...baseEvidence, ...monthEvidence];
  const factIds = allEvidence.map(item => item.id);
  return {
    status: "ready",
    id: "day-master-month-command",
    title: "日主与月令",
    scope: "日主、出生时节与月令本气",
    factIds,
    evidence: allEvidence,
    limitation: commonLimitations.length ? commonLimitations.join(" ") : null
  };
}

function buildFiveElementTheme(
  facts: ProfessionalBaziFactsV1
): ReadyBaziAnalysisTheme | null {
  const available = confirmedPillars(facts);
  if (!available.length) return null;

  const derivedCounts: Record<Element, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0
  };
  available.forEach(({ pillar }) => {
    if (pillar.stemElement.value) derivedCounts[pillar.stemElement.value] += 1;
    if (pillar.branchElement.value) derivedCounts[pillar.branchElement.value] += 1;
  });
  const contractCountsReady = ALL_ELEMENTS.every(element => (
    facts.visibleElementCounts[element].certainty === "confirmed"
    && facts.visibleElementCounts[element].value !== null
  ));
  const counts = contractCountsReady
    ? Object.fromEntries(ALL_ELEMENTS.map(element => [
        element,
        facts.visibleElementCounts[element].value as number
      ])) as Record<Element, number>
    : derivedCounts;
  const coverageCount = Object.values(counts).reduce((total, count) => total + count, 0);
  if (coverageCount === 0) return null;

  const visibleElements = ALL_ELEMENTS.filter(element => counts[element] > 0);
  const hiddenElements = new Set<Element>();
  available.forEach(({ pillar }) => {
    if (pillar.hiddenStems.certainty !== "confirmed") return;
    pillar.hiddenStems.value.forEach(item => hiddenElements.add(item.element));
  });
  const hiddenOnlyElements = ALL_ELEMENTS.filter(
    element => counts[element] === 0 && hiddenElements.has(element)
  );
  const notSeenElements = ALL_ELEMENTS.filter(
    element => counts[element] === 0 && !hiddenElements.has(element)
  );
  const omitted = omittedPillarNames(facts);
  const countEvidence = contractCountsReady
    ? ALL_ELEMENTS.map(element => evidence(
        `visibleElementCounts.${element}`,
        `${element}·明字数量`,
        String(counts[element]),
        facts.visibleElementCounts[element]
      ))
    : available.flatMap(({ pillar, index }) => [
        evidence(
          `pillars.${index}.stemElement`,
          `${pillar.position.value}天干五行`,
          pillar.stemElement.value!,
          pillar.stemElement
        ),
        evidence(
          `pillars.${index}.branchElement`,
          `${pillar.position.value}地支五行`,
          pillar.branchElement.value!,
          pillar.branchElement
        )
      ]);
  const hiddenEvidence = available
    .filter(({ pillar }) => pillar.hiddenStems.certainty === "confirmed")
    .map(({ pillar, index }) => evidence(
      `pillars.${index}.hiddenStems`,
      `${pillar.position.value}藏干五行`,
      pillar.hiddenStems.value.map(item => `${item.stem}${item.element}`).join("、"),
      pillar.hiddenStems
    ));
  const allEvidence = uniqueEvidence([...countEvidence, ...hiddenEvidence]);
  const factIds = allEvidence.map(item => item.id);
  return {
    status: "ready",
    id: "five-elements",
    title: "五行构成",
    scope: `明字统计覆盖${coverageCount}个已确认位置`,
    factIds,
    evidence: allEvidence,
    limitation: omitted.length
      ? `${omitted.join("、")}未参与本次统计，覆盖范围已相应减少；当前结果不是完整八字八个明字的统计。`
      : null,
    elementSummary: {
      coverageCount,
      counts,
      visibleElements,
      hiddenOnlyElements,
      notSeenElements
    }
  };
}

function buildYinYangTheme(
  facts: ProfessionalBaziFactsV1
): ReadyBaziAnalysisTheme | null {
  const available = facts.pillars
    .map((pillar, index) => ({ pillar, index }))
    .filter(({ pillar }) => (
      pillar.ganzhi.certainty === "confirmed"
      && isConfirmedValue(pillar.stemYinYang)
      && isConfirmedValue(pillar.branchYinYang)
    ));
  if (!available.length) return null;

  const counts: Record<YinYang, number> = { 阳: 0, 阴: 0 };
  available.forEach(({ pillar }) => {
    counts[pillar.stemYinYang.value!] += 1;
    counts[pillar.branchYinYang.value!] += 1;
  });
  const coverageCount = counts.阳 + counts.阴;
  if (coverageCount === 0) return null;
  const yangRatio = Math.round((counts.阳 / coverageCount) * 100);

  const pillarEvidence = available.flatMap(({ pillar, index }) => [
    evidence(
      `pillars.${index}.stemYinYang`,
      `${pillar.position.value}天干阴阳`,
      pillar.stemYinYang.value!,
      pillar.stemYinYang
    ),
    evidence(
      `pillars.${index}.branchYinYang`,
      `${pillar.position.value}地支阴阳`,
      pillar.branchYinYang.value!,
      pillar.branchYinYang
    )
  ]);

  return {
    status: "ready",
    id: "yin-yang",
    title: "阴阳",
    scope: `明字统计覆盖${coverageCount}个已确认位置`,
    factIds: pillarEvidence.map(item => item.id),
    evidence: pillarEvidence,
    limitation: null,
    yinYangSummary: {
      coverageCount,
      counts,
      ratios: {
        阳: yangRatio,
        阴: 100 - yangRatio
      }
    }
  };
}

function buildTenGodTheme(
  facts: ProfessionalBaziFactsV1
): ReadyBaziAnalysisTheme | null {
  if (!isConfirmedValue(facts.dayMaster.stem)) return null;
  const available = facts.pillars
    .map((pillar, index) => ({ pillar, index }))
    .filter(({ pillar }) => (
      pillar.ganzhi.certainty === "confirmed"
      && pillar.visibleTenGod.certainty === "confirmed"
      && pillar.visibleTenGod.value !== null
      && pillar.hiddenStems.certainty === "confirmed"
    ));
  if (!available.length) return null;

  const positions: BaziTenGodPositionSummary[] = available.map(({ pillar }) => ({
    position: pillar.position.value,
    visible: pillar.position.value === "日柱"
      ? "日主"
      : String(pillar.visibleTenGod.value),
    hidden: pillar.hiddenStems.value.map(item => `${item.stem}·${item.tenGod}`)
  }));
  const pillarEvidence = available.flatMap(({ pillar, index }) => [
    evidence(
      `pillars.${index}.visibleTenGod`,
      `${pillar.position.value}明干关系`,
      pillar.position.value === "日柱" ? "日主" : String(pillar.visibleTenGod.value),
      pillar.visibleTenGod
    ),
    evidence(
      `pillars.${index}.hiddenStems`,
      `${pillar.position.value}藏干十神`,
      pillar.hiddenStems.value.map(item => `${item.stem}·${item.tenGod}·${item.qiLevel}`).join("、"),
      pillar.hiddenStems
    )
  ]);
  const monthMainEvidence = isConfirmedValue(facts.monthCommand.mainTenGod)
    ? [evidence(
        "monthCommand.mainTenGod",
        "月令本气十神",
        facts.monthCommand.mainTenGod.value,
        facts.monthCommand.mainTenGod
      )]
    : [];
  const allEvidence = uniqueEvidence([...pillarEvidence, ...monthMainEvidence]);
  const factIds = allEvidence.map(item => item.id);
  const omitted = omittedPillarNames(facts);
  return {
    status: "ready",
    id: "ten-gods-pillars",
    title: "十神与四柱",
    scope: "以日主为参照，按柱位整理明干与藏干",
    factIds,
    evidence: allEvidence,
    limitation: omitted.length
      ? `${omitted.join("、")}尚未确认，相关明干十神与藏干均未参与本主题。`
      : null,
    tenGodPositions: positions
  };
}

function buildNatalBranchRelationTheme(
  facts: ProfessionalBaziFactsV1
): ReadyBaziAnalysisTheme | null {
  const confirmedRelations = facts.natalBranchRelations
    .map((relation, index) => ({ relation, index }))
    .filter(({ relation }) => relation.certainty === "confirmed");
  if (!confirmedRelations.length) return null;

  const grouped = new Map<string, BaziBranchRelationPositionSummary>();
  confirmedRelations.forEach(({ relation }) => {
    const value = relation.value;
    const key = `${value.firstPillar}:${value.firstBranch}|${value.secondPillar}:${value.secondBranch}`;
    const current = grouped.get(key) ?? {
      firstPillar: value.firstPillar,
      firstBranch: value.firstBranch,
      secondPillar: value.secondPillar,
      secondBranch: value.secondBranch,
      relations: []
    };
    current.relations.push(value.name);
    grouped.set(key, current);
  });
  const positions = [...grouped.values()];
  const relationEvidence = confirmedRelations.map(({ relation, index }) => evidence(
    `natalBranchRelations.${index}`,
    `${relation.value.firstPillar}${relation.value.firstBranch}与${relation.value.secondPillar}${relation.value.secondBranch}`,
    relation.value.name,
    relation
  ));
  const factIds = relationEvidence.map(item => item.id);
  const omitted = omittedPillarNames(facts);

  return {
    status: "ready",
    id: "natal-branch-relations",
    title: "本命地支关系",
    scope: `${positions.length}组已确认柱位关系 · ${confirmedRelations.length}项登记名称`,
    factIds,
    evidence: relationEvidence,
    limitation: omitted.length
      ? `${omitted.join("、")}尚未确认，涉及这些柱位的地支关系已经由事实合同排除；当前主题只覆盖其余已确认柱位。`
      : null,
    branchRelationPositions: positions
  };
}

/**
 * 只整理 ProfessionalBaziFactsV1、独立出生节气事实合同与出生月相事实合同已准入的内容。
 * 本函数不计算新命理事实，不生成解释文本，也不会用不确定事实继续推导。
 */
export function buildBaziMainlineNarrative(
  facts: ProfessionalBaziFactsV1 | null,
  birthSolarTermFacts: BaziBirthSolarTermFactsV1 | null = null,
  birthMoonPhaseFacts: BaziBirthMoonPhaseFactsV1 | null = null
): BaziMainlineNarrative | null {
  if (!facts) return null;

  const themes = [
    buildDayMasterMonthTheme(facts),
    buildYinYangTheme(facts),
    buildFiveElementTheme(facts),
    buildTenGodTheme(facts),
    buildNatalBranchRelationTheme(facts)
  ].filter((theme): theme is ReadyBaziAnalysisTheme => theme !== null);

  if (!themes.length) return null;

  return {
    title: "命盘解读",
    foundation: buildFoundationSummary(facts),
    directNarrative: selectBaziDirectNarrative(facts),
    solarTermNarrative: selectBaziSolarTermNarrative(birthSolarTermFacts),
    moonPhaseNarrative: selectBaziMoonPhaseNarrative(birthMoonPhaseFacts),
    themes
  };
}
