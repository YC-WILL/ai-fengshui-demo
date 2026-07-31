import { buildBaziMonthReadingFromFacts } from "./baziStructure";
import { ALL_ELEMENTS, type Element } from "./elements";
import type {
  ProfessionalBaziFact,
  ProfessionalBaziFactsV1,
  ProfessionalBaziPillarFacts
} from "./professionalBaziFacts";

export const BAZI_ANALYSIS_THEME_IDS = [
  "day-master-month-command",
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

export interface ReadyBaziAnalysisTheme {
  status: "ready";
  id: BaziAnalysisThemeId;
  title: string;
  scope: string;
  professionalAnalysis: {
    title: string;
    text: string;
    factIds: string[];
  };
  imagery: {
    title: string;
    text: string;
    disclaimer: string;
    factIds: string[];
  };
  plainReading: {
    title: string;
    text: string;
    boundary: string;
    factIds: string[];
  };
  evidence: BaziMainlineEvidence[];
  limitation: string | null;
  elementSummary?: BaziElementSummary;
  tenGodPositions?: BaziTenGodPositionSummary[];
  branchRelationPositions?: BaziBranchRelationPositionSummary[];
}

export interface BaziMainlineNarrative {
  title: string;
  introduction: string;
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

function listOrNone(values: readonly string[], none = "无") {
  return values.length ? values.join("、") : none;
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
      professionalAnalysis: {
        title: "日主已确认，月令暂不选取",
        text: `你的日主为${stem.value}${element.value}（${yinYang.value}）。月柱当前${monthCandidates.length ? `存在${monthCandidates.join("、")}候选` : "缺少可确认事实"}，因此不继续生成月令、本气或本气十神解释。`,
        factIds
      },
      imagery: {
        title: "先保留一个稳定坐标",
        text: `可以先把${stem.value}${element.value}日主看作阅读这张盘的固定坐标；月令位置暂时保留候选，不把任何一个候选涂成更可能的答案。`,
        disclaimer: "这是蟾先森为了帮助理解采用的现代意象，不是古籍原句，也不是传统定论。",
        factIds: ["dayMaster.stem", "dayMaster.element"]
      },
      plainReading: {
        title: "目前可以读到哪里",
        text: `现在只能确认以${stem.value}为日主；出生时节及其本气与日主的关系仍待月柱确定。候选确认前，不用通用性格文案补齐这一段。`,
        boundary: "这是对资料边界的说明，不构成人格、经历或命运判断。",
        factIds
      },
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
  const monthReading = buildBaziMonthReadingFromFacts({
    dayStem: stem.value,
    monthBranch,
    mainStem: monthMainStem,
    mainTenGod: monthMainTenGod
  });

  return {
    status: "ready",
    id: "day-master-month-command",
    title: "日主与月令",
    scope: "日主、出生时节与月令本气",
    professionalAnalysis: {
      title: "先确认日主与月令",
      text: `你的日主为${stem.value}${element.value}（${yinYang.value}），月令为${monthBranch}${monthElement}。月令本气是${monthMainStem}，相对日主形成${monthMainTenGod}。这里只确认结构，不据此判断旺衰、格局或喜用神。`,
      factIds
    },
    imagery: {
      title: "把日主放进出生时节",
      text: monthReading.image,
      disclaimer: "这是蟾先森为了帮助理解采用的现代意象，不是古籍原句，也不是传统定论。",
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
  const countText = ALL_ELEMENTS.map(element => `${element}${counts[element]}`).join("、");

  return {
    status: "ready",
    id: "five-elements",
    title: "五行构成",
    scope: `明字统计覆盖${coverageCount}个已确认位置`,
    professionalAnalysis: {
      title: "先整理明字与藏干中的五行",
      text: `当前已确认明字共${coverageCount}个，统计为：${countText}。明字出现：${listOrNone(visibleElements)}；只在藏干出现：${listOrNone(hiddenOnlyElements)}；当前已确认范围内未见：${listOrNone(notSeenElements)}。`,
      factIds
    },
    imagery: {
      title: "把表层与内部结构分开看",
      text: `可以把${coverageCount}个已确认明字位置看作展开在桌面的分类格：${listOrNone(visibleElements)}直接出现在表层；${hiddenOnlyElements.length ? `${hiddenOnlyElements.join("、")}只在藏干的内部结构中出现` : "当前没有只在藏干出现、未在明字显露的五行"}。`,
      disclaimer: "这是蟾先森为了帮助阅读显隐位置采用的现代意象，不是古籍原句，也不表示五行力量大小。",
      factIds
    },
    plainReading: {
      title: "数量先用于整理，不用于判强弱",
      text: `这组数字回答的是“哪些五行出现在当前可确认的明字位置、出现几次”。“当前未见”只表示在本次已确认的明字和藏干范围内没有找到，不等于命里绝对缺失，也不能直接推出旺衰、喜用或吉凶。`,
      boundary: "明字数量不等于力量或能量，不据此提供补五行、颜色、饰品、方位或改运建议。",
      factIds
    },
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
    hidden: pillar.hiddenStems.value.map(item => `${item.stem}·${item.tenGod}·${item.qiLevel}`)
  }));
  const visibleNames = positions
    .filter(item => item.position !== "日柱")
    .map(item => `${item.position}${item.visible}`);
  const hiddenNames = positions.flatMap(item => (
    item.hidden.map(value => `${item.position}${value}`)
  ));
  const visibleTenGodSet = new Set(
    available
      .filter(({ pillar }) => pillar.position.value !== "日柱")
      .map(({ pillar }) => String(pillar.visibleTenGod.value))
  );
  const hiddenTenGodSet = new Set(
    available.flatMap(({ pillar }) => pillar.hiddenStems.value.map(item => item.tenGod))
  );
  const hiddenOnly = [...hiddenTenGodSet].filter(name => !visibleTenGodSet.has(name));
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
  const monthMainText = isConfirmedValue(facts.monthCommand.mainTenGod)
    ? `月令本气相对日主形成${facts.monthCommand.mainTenGod.value}，在本主题中单独标出，但不称为唯一主导结构。`
    : "月令当前未确认，因此不使用本气十神继续解释。";

  return {
    status: "ready",
    id: "ten-gods-pillars",
    title: "十神与四柱",
    scope: "以日主为参照，按柱位整理明干与藏干",
    professionalAnalysis: {
      title: "看各位置与日主形成什么关系",
      text: `已确认明干关系：${listOrNone(visibleNames, "除日主外暂无可确认项")}。日柱天干只标记为“日主”。藏干中可确认：${listOrNone(hiddenNames)}。${monthMainText}`,
      factIds
    },
    imagery: {
      title: "把十神放回它所在的位置",
      text: `可以把四柱理解为带有位置标签的栏位：${positions.map(item => `${item.position}明干为${item.visible}`).join("；")}。藏干关系收在各自地支内部，不与明干显露混为一层。`,
      disclaimer: "这是蟾先森为了帮助阅读位置与显隐采用的现代意象，不是古籍原句，也不把十神标签等同于现实身份。",
      factIds
    },
    plainReading: {
      title: "十神是相对日主的结构名称",
      text: `这一主题是在整理盘中不同位置怎样以日主为参照形成关系名称。明干可直接看到${listOrNone([...visibleTenGodSet])}；${hiddenOnly.length ? `${hiddenOnly.join("、")}目前只在藏干中出现` : "当前未增加只藏不显的十神名称"}。这些名称不能单独证明人格、职业、婚姻、财富或已经发生的经历。`,
      boundary: "十神数量和显隐位置不构成主导性、评分、格局、旺衰、喜用或吉凶判断；现实是否符合仍需用户自行核对。",
      factIds
    },
    evidence: allEvidence,
    limitation: omitted.length
      ? `${omitted.join("、")}尚未确认，相关明干十神与藏干均未参与本主题。`
      : null,
    tenGodPositions: positions
  };
}

const BRANCH_RELATION_IMAGES = {
  同支: "同一枚地支标签",
  六合: "一条六合连线",
  六冲: "一条方向相对的连线",
  六害: "一处需要复核的错位",
  六破: "一处连接松动的记号",
  刑: "一处反复校正的记号"
} as const;

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
  const relationText = positions
    .map(item => `${item.firstPillar}${item.firstBranch}与${item.secondPillar}${item.secondBranch}形成${item.relations.join("、")}`)
    .join("；");
  const imageryText = positions
    .map(item => `${item.firstPillar}${item.firstBranch}与${item.secondPillar}${item.secondBranch}像在盘面上同时标出${item.relations.map(name => BRANCH_RELATION_IMAGES[name as keyof typeof BRANCH_RELATION_IMAGES]).join("、")}`)
    .join("；");
  const omitted = omittedPillarNames(facts);
  const multipleNames = positions.some(item => item.relations.length > 1);

  return {
    status: "ready",
    id: "natal-branch-relations",
    title: "本命地支关系",
    scope: `${positions.length}组已确认柱位关系 · ${confirmedRelations.length}项登记名称`,
    professionalAnalysis: {
      title: "按柱位核对地支之间的登记关系",
      text: `当前合同中已确认：${relationText}。这里只列出本版已经登记的同支、六合、六冲、六害、六破与刑，不把关系名称转换为吉凶、强弱或现实事件。`,
      factIds
    },
    imagery: {
      title: "把关系名称看成盘面连线",
      text: `${imageryText}。这些连线只是帮助记住“哪两个柱位命中了什么名称”，不表示人生中的具体人、事或结果。`,
      disclaimer: "这是蟾先森为了帮助阅读柱位关系采用的现代意象，不是古籍原句，也不是传统关系结论。",
      factIds
    },
    plainReading: {
      title: "同一对地支可以并列多个名称",
      text: `${multipleNames ? "同一对地支可能同时命中多个已登记名称；这些名称来自不同规则条件，当前只并列保存，不自动互相抵消或合并评分。" : "当前每组已确认地支关系只命中一个登记名称；名称本身仍不等于现实中的顺利、冲突或伤害。"} 本主题回答的是“盘内哪些柱位之间存在已登记关系”，不能据此证明性格、家庭、感情、事业或已经发生的经历。`,
      boundary: "合不等于一定顺利，冲、害、破、刑也不等于一定不好；本轮不判断作用强弱，不加入旺衰、喜忌、格局或事件预测。",
      factIds
    },
    evidence: relationEvidence,
    limitation: omitted.length
      ? `${omitted.join("、")}尚未确认，涉及这些柱位的地支关系已经由事实合同排除；当前主题只覆盖其余已确认柱位。`
      : null,
    branchRelationPositions: positions
  };
}

/**
 * 只从同一份 ProfessionalBaziFactsV1 整理四个普通分析主题。
 * 本函数不计算新命理事实，不接收独立解释文本，也不会用不确定柱位继续推导。
 */
export function buildBaziMainlineNarrative(
  facts: ProfessionalBaziFactsV1 | null
): BaziMainlineNarrative | null {
  if (!facts) return null;

  const themes = [
    buildDayMasterMonthTheme(facts),
    buildFiveElementTheme(facts),
    buildTenGodTheme(facts),
    buildNatalBranchRelationTheme(facts)
  ].filter((theme): theme is ReadyBaziAnalysisTheme => theme !== null);

  if (!themes.length) return null;
  const countLabels = ["零", "一", "二", "三", "四"];
  const hasBranchRelations = themes.some(theme => theme.id === "natal-branch-relations");

  return {
    title: `${countLabels[themes.length] ?? themes.length}项基础命盘分析`,
    introduction: `以下内容只整理当前已确认的日主与月令、五行构成、十神与四柱${hasBranchRelations ? "、本命地支关系" : ""}。盘面事实可以复算；形象和白话部分属于蟾先森的现代解释，不用于预测人生结果。`,
    themes
  };
}
