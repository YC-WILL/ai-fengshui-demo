import type { BaziChart, Pillar } from "./bazi";
import {
  buildBaziStructure,
  type PillarName,
  type QiLevel,
  type TenGodName,
  type TenGodRelation
} from "./baziStructure";
import { buildBaziTemporalFacts, type NatalBranchRelation } from "./baziTemporalFacts";
import type { BaziTimeLayer, BaziTimeLayerId } from "./baziTimeComparison";
import {
  BRANCH_YIN_YANG,
  STEM_YIN_YANG,
  type Branch,
  type Element,
  type Stem,
  type YinYang
} from "./elements";
import type { Gender } from "../types";
import { TRADITIONAL_CALENDAR_VERSION } from "../knowledge/traditionalCalendarCatalog";

export const PROFESSIONAL_BAZI_FACTS_VERSION = "professional-bazi-facts-v1" as const;

export const PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY = {
  catalog: {
    yearBoundary: "catalog:bazi-year-boundary",
    monthBoundary: "catalog:bazi-month-boundary",
    dayMaster: "catalog:bazi-day-master",
    timezone: "catalog:bazi-timezone",
    hourBranch: "catalog:bazi-hour-branch",
    trueSolarTime: "catalog:bazi-true-solar-time",
    ziDayBoundary: "catalog:bazi-zi-day-boundary",
    dailyFacts: "catalog:daily-fact-layer"
  },
  code: {
    factsVersion: "code:professionalBaziFacts:PROFESSIONAL_BAZI_FACTS_VERSION",
    protocolVersion: "code:plateVersions:PLATE_PROTOCOL_VERSION",
    engineVersion: "code:plateVersions:PLATE_ENGINE_VERSIONS.BAZI",
    calculationClock: "code:professionalBaziServer:buildProfessionalBaziFactsOnServer",
    pillarNames: "code:baziStructure:PILLAR_NAMES",
    tenGod: "code:baziStructure:tenGodFor",
    hiddenStems: "code:baziStructure:HIDDEN_STEM_REFERENCE",
    stemElement: "code:elements:STEM_ELEMENT",
    branchElement: "code:elements:BRANCH_ELEMENT",
    stemYinYang: "code:elements:STEM_YIN_YANG",
    branchYinYang: "code:elements:BRANCH_YIN_YANG",
    elementDistribution: "code:elements:elementDistribution",
    inputSnapshot: "code:bazi:inputSnapshot",
    timeKnown: "code:bazi:timeKnown",
    uncertainty: "code:bazi:uncertainty",
    natalBranchRelations: "code:baziTemporalFacts:relationNames",
    timeLayerId: "code:baziTimeComparison:BaziTimeLayerId",
    timeBranchRelations: "code:baziTimeComparison:BRANCH_RELATIONS"
  }
} as const;

type RegistryValue<T> = T[keyof T];
export type ProfessionalBaziCatalogRuleId = RegistryValue<typeof PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.catalog>;
export type ProfessionalBaziCodeRuleId = RegistryValue<typeof PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.code>;
export type ProfessionalBaziSourceRuleId = ProfessionalBaziCatalogRuleId | ProfessionalBaziCodeRuleId;

export type ProfessionalBaziCertainty = "confirmed" | "uncertain" | "unavailable";

export interface ProfessionalBaziFact<T> {
  value: T;
  sourcePosition: string;
  calculationConvention: string;
  ruleVersion: string;
  sourceRuleId: ProfessionalBaziSourceRuleId;
  certainty: ProfessionalBaziCertainty;
}

export interface ProfessionalBaziBuildContext {
  protocolVersion: string;
  engineVersion: string;
  calculatedAt: string;
  timeLayers: BaziTimeLayer[];
}

export interface ProfessionalBaziHiddenStemValue {
  stem: Stem;
  element: Element;
  qiLevel: QiLevel;
  tenGod: TenGodName;
  relation: TenGodRelation;
  polarity: "同阴阳" | "异阴阳";
}

export interface ProfessionalBaziPillarFacts {
  position: ProfessionalBaziFact<PillarName>;
  ganzhi: ProfessionalBaziFact<string | null>;
  stem: ProfessionalBaziFact<Stem | null>;
  branch: ProfessionalBaziFact<Branch | null>;
  stemElement: ProfessionalBaziFact<Element | null>;
  branchElement: ProfessionalBaziFact<Element | null>;
  stemYinYang: ProfessionalBaziFact<YinYang | null>;
  branchYinYang: ProfessionalBaziFact<YinYang | null>;
  visibleTenGod: ProfessionalBaziFact<TenGodName | "日主" | null>;
  hiddenStems: ProfessionalBaziFact<ProfessionalBaziHiddenStemValue[]>;
}

export interface ProfessionalBaziTimeFacts {
  id: ProfessionalBaziFact<BaziTimeLayerId>;
  period: ProfessionalBaziFact<string>;
  ganzhi: ProfessionalBaziFact<string>;
  stemTenGod: ProfessionalBaziFact<TenGodName>;
  natalBranchLinks: ProfessionalBaziFact<BaziTimeLayer["branchLinks"]>;
}

export interface ProfessionalBaziFactsV1 {
  schemaVersion: ProfessionalBaziFact<typeof PROFESSIONAL_BAZI_FACTS_VERSION>;
  versions: {
    protocolVersion: ProfessionalBaziFact<string>;
    engineVersion: ProfessionalBaziFact<string>;
    calculatedAt: ProfessionalBaziFact<string>;
  };
  input: {
    gender: ProfessionalBaziFact<Gender>;
    birthDate: ProfessionalBaziFact<string>;
    birthTime: ProfessionalBaziFact<string | null>;
    birthLocation: ProfessionalBaziFact<string | null>;
    timezone: ProfessionalBaziFact<string>;
    timeKnown: ProfessionalBaziFact<boolean>;
  };
  calculation: {
    yearBoundary: ProfessionalBaziFact<string>;
    monthBoundary: ProfessionalBaziFact<string>;
    dayBoundary: ProfessionalBaziFact<string>;
    trueSolarTimeApplied: ProfessionalBaziFact<boolean>;
  };
  pillars: ProfessionalBaziPillarFacts[];
  dayMaster: {
    stem: ProfessionalBaziFact<Stem>;
    element: ProfessionalBaziFact<Element>;
    yinYang: ProfessionalBaziFact<YinYang>;
  };
  monthCommand: {
    branch: ProfessionalBaziFact<Branch | null>;
    element: ProfessionalBaziFact<Element | null>;
    mainStem: ProfessionalBaziFact<Stem | null>;
    mainTenGod: ProfessionalBaziFact<TenGodName | null>;
  };
  visibleElementCounts: Record<Element, ProfessionalBaziFact<number | null>>;
  natalBranchRelations: Array<ProfessionalBaziFact<NatalBranchRelation>>;
  timeFacts: ProfessionalBaziTimeFacts[];
  uncertainty: {
    yearPillarCandidates: ProfessionalBaziFact<string[]>;
    monthPillarCandidates: ProfessionalBaziFact<string[]>;
    reason: ProfessionalBaziFact<string | null>;
  };
}

interface FactOptions<T> {
  value: T;
  sourcePosition: string;
  calculationConvention: string;
  ruleVersion: string;
  sourceRuleId: ProfessionalBaziSourceRuleId;
  certainty?: ProfessionalBaziCertainty;
}

function fact<T>(options: FactOptions<T>): ProfessionalBaziFact<T> {
  return {
    value: options.value,
    sourcePosition: options.sourcePosition,
    calculationConvention: options.calculationConvention,
    ruleVersion: options.ruleVersion,
    sourceRuleId: options.sourceRuleId,
    certainty: options.certainty ?? "confirmed"
  };
}

const PILLAR_RULE: Record<PillarName, { sourceRuleId: ProfessionalBaziCatalogRuleId; convention: string }> = {
  年柱: {
    sourceRuleId: "catalog:bazi-year-boundary",
    convention: "年柱以立春实际交接时刻切换"
  },
  月柱: {
    sourceRuleId: "catalog:bazi-month-boundary",
    convention: "月柱以十二节实际交接时刻切换"
  },
  日柱: {
    sourceRuleId: "catalog:bazi-zi-day-boundary",
    convention: "日柱按出生地民用日期 00:00 换日"
  },
  时柱: {
    sourceRuleId: "catalog:bazi-hour-branch",
    convention: "时柱按出生地法定时区的民用钟表时间归入十二时辰"
  }
};

function pillarFacts(
  chart: BaziChart,
  name: PillarName,
  pillar: Pillar | null,
  engineVersion: string
): ProfessionalBaziPillarFacts {
  const structure = buildBaziStructure(chart).pillars.find(item => item.name === name)!;
  const ambiguous = name === "年柱"
    ? Boolean(chart.calculation.uncertainty?.yearCandidates)
    : name === "月柱"
      ? Boolean(chart.calculation.uncertainty?.monthCandidates)
      : false;
  const unavailable = !pillar;
  const certainty: ProfessionalBaziCertainty = ambiguous
    ? "uncertain"
    : unavailable
      ? "unavailable"
      : "confirmed";
  const exposedPillar = ambiguous ? null : pillar;
  const rule = PILLAR_RULE[name];
  const position = `${name}`;
  const structuralConvention = "天干、地支及五行阴阳采用项目固定映射表";

  return {
    position: fact({
      value: name,
      sourcePosition: position,
      calculationConvention: "四柱固定按年、月、日、时排列",
      ruleVersion: engineVersion,
      sourceRuleId: "code:baziStructure:PILLAR_NAMES"
    }),
    ganzhi: fact({
      value: exposedPillar?.pillarLabel ?? null,
      sourcePosition: position,
      calculationConvention: rule.convention,
      ruleVersion: TRADITIONAL_CALENDAR_VERSION,
      sourceRuleId: rule.sourceRuleId,
      certainty
    }),
    stem: fact({
      value: exposedPillar?.stem ?? null,
      sourcePosition: `${position}天干`,
      calculationConvention: rule.convention,
      ruleVersion: TRADITIONAL_CALENDAR_VERSION,
      sourceRuleId: rule.sourceRuleId,
      certainty
    }),
    branch: fact({
      value: exposedPillar?.branch ?? null,
      sourcePosition: `${position}地支`,
      calculationConvention: rule.convention,
      ruleVersion: TRADITIONAL_CALENDAR_VERSION,
      sourceRuleId: rule.sourceRuleId,
      certainty
    }),
    stemElement: fact({
      value: exposedPillar?.stemElement ?? null,
      sourcePosition: `${position}天干`,
      calculationConvention: structuralConvention,
      ruleVersion: engineVersion,
      sourceRuleId: "code:elements:STEM_ELEMENT",
      certainty
    }),
    branchElement: fact({
      value: exposedPillar?.branchElement ?? null,
      sourcePosition: `${position}地支`,
      calculationConvention: structuralConvention,
      ruleVersion: engineVersion,
      sourceRuleId: "code:elements:BRANCH_ELEMENT",
      certainty
    }),
    stemYinYang: fact({
      value: exposedPillar ? STEM_YIN_YANG[exposedPillar.stem] : null,
      sourcePosition: `${position}天干`,
      calculationConvention: structuralConvention,
      ruleVersion: engineVersion,
      sourceRuleId: "code:elements:STEM_YIN_YANG",
      certainty
    }),
    branchYinYang: fact({
      value: exposedPillar ? BRANCH_YIN_YANG[exposedPillar.branch] : null,
      sourcePosition: `${position}地支`,
      calculationConvention: structuralConvention,
      ruleVersion: engineVersion,
      sourceRuleId: "code:elements:BRANCH_YIN_YANG",
      certainty
    }),
    visibleTenGod: fact({
      value: ambiguous ? null : structure.visibleStem?.role ?? null,
      sourcePosition: `${position}天干`,
      calculationConvention: "以日柱天干为日主，按五行生克与阴阳同异确定十神",
      ruleVersion: engineVersion,
      sourceRuleId: "code:baziStructure:tenGodFor",
      certainty
    }),
    hiddenStems: fact({
      value: ambiguous
        ? []
        : structure.hiddenStems.map(item => ({
            stem: item.stem,
            element: item.element,
            qiLevel: item.qiLevel,
            tenGod: item.name,
            relation: item.relation,
            polarity: item.polarity
          })),
      sourcePosition: `${position}地支`,
      calculationConvention: "按项目固定地支藏干表以本气、中气、余气展开，再相对日主计算十神",
      ruleVersion: engineVersion,
      sourceRuleId: "code:baziStructure:HIDDEN_STEM_REFERENCE",
      certainty
    })
  };
}

function timeFacts(
  layer: BaziTimeLayer,
  engineVersion: string,
  uncertainPositions: ReadonlySet<PillarName>
): ProfessionalBaziTimeFacts {
  const sourceRuleId = layer.id === "today"
    ? "catalog:daily-fact-layer"
    : layer.id === "month"
      ? "catalog:bazi-month-boundary"
      : "catalog:bazi-year-boundary";
  const filteredBranchLinks = layer.branchLinks.filter(link => !uncertainPositions.has(link.position));
  const branchLinkCertainty: ProfessionalBaziCertainty = uncertainPositions.size
    ? "uncertain"
    : "confirmed";

  return {
    id: fact({
      value: layer.id,
      sourcePosition: `${layer.label}时间层`,
      calculationConvention: "时间事实固定分为今日、当月和流年三层",
      ruleVersion: engineVersion,
      sourceRuleId: "code:baziTimeComparison:BaziTimeLayerId"
    }),
    period: fact({
      value: layer.period,
      sourcePosition: `${layer.label}观察区间`,
      calculationConvention: layer.precision,
      ruleVersion: TRADITIONAL_CALENDAR_VERSION,
      sourceRuleId
    }),
    ganzhi: fact({
      value: layer.pillar.pillarLabel,
      sourcePosition: `${layer.label}干支`,
      calculationConvention: layer.precision,
      ruleVersion: TRADITIONAL_CALENDAR_VERSION,
      sourceRuleId
    }),
    stemTenGod: fact({
      value: layer.stemRole,
      sourcePosition: `${layer.label}天干`,
      calculationConvention: "时间层天干相对本命日主按五行生克与阴阳同异计算十神",
      ruleVersion: engineVersion,
      sourceRuleId: "code:baziStructure:tenGodFor"
    }),
    natalBranchLinks: fact({
      value: filteredBranchLinks,
      sourcePosition: `${layer.label}地支与本命地支`,
      calculationConvention: uncertainPositions.size
        ? `仅记录当前时间层已实现的同支、六合、六冲、六害、六破关系；已排除尚未确定的${[...uncertainPositions].join("、")}`
        : "仅记录当前时间层已实现的同支、六合、六冲、六害、六破关系",
      ruleVersion: engineVersion,
      sourceRuleId: "code:baziTimeComparison:BRANCH_RELATIONS",
      certainty: branchLinkCertainty
    })
  };
}

export function buildProfessionalBaziFactsV1(
  chart: BaziChart,
  context: ProfessionalBaziBuildContext
): ProfessionalBaziFactsV1 {
  const structure = buildBaziStructure(chart);
  const temporal = buildBaziTemporalFacts(chart);
  const uncertainty = chart.calculation.uncertainty;
  const uncertainPositions = new Set<PillarName>([
    ...(uncertainty?.yearCandidates ? ["年柱" as const] : []),
    ...(uncertainty?.monthCandidates ? ["月柱" as const] : [])
  ]);
  const monthConfirmed = !uncertainPositions.has("月柱");
  const monthMain = monthConfirmed ? structure.monthCommand.hiddenStems[0] : undefined;
  const elementCertainty: ProfessionalBaziCertainty = uncertainPositions.size ? "uncertain" : "confirmed";
  const elements: Element[] = ["木", "火", "土", "金", "水"];

  return {
    schemaVersion: fact({
      value: PROFESSIONAL_BAZI_FACTS_VERSION,
      sourcePosition: "resultSnapshot.professionalFacts.schemaVersion",
      calculationConvention: "专业八字事实合同使用独立版本，不代替快照协议版本",
      ruleVersion: PROFESSIONAL_BAZI_FACTS_VERSION,
      sourceRuleId: "code:professionalBaziFacts:PROFESSIONAL_BAZI_FACTS_VERSION"
    }),
    versions: {
      protocolVersion: fact({
        value: context.protocolVersion,
        sourcePosition: "versions.protocolVersion",
        calculationConvention: "随事实合同记录协议版本；保存快照时保持原值",
        ruleVersion: context.protocolVersion,
        sourceRuleId: "code:plateVersions:PLATE_PROTOCOL_VERSION"
      }),
      engineVersion: fact({
        value: context.engineVersion,
        sourcePosition: "versions.engineVersion",
        calculationConvention: "随事实合同记录确定性八字引擎版本",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:plateVersions:PLATE_ENGINE_VERSIONS.BAZI"
      }),
      calculatedAt: fact({
        value: context.calculatedAt,
        sourcePosition: "versions.calculatedAt",
        calculationConvention: "使用 ISO 8601 绝对时刻记录本次计算时间",
        ruleVersion: context.protocolVersion,
        sourceRuleId: "code:professionalBaziServer:buildProfessionalBaziFactsOnServer"
      })
    },
    input: {
      gender: fact({
        value: chart.inputSnapshot.gender,
        sourcePosition: "inputSnapshot.gender",
        calculationConvention: "仅保存用户输入；当前八字事实计算不使用性别",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:bazi:inputSnapshot"
      }),
      birthDate: fact({
        value: chart.inputSnapshot.birthDate,
        sourcePosition: "inputSnapshot.birthDate",
        calculationConvention: "公历 YYYY-MM-DD，按出生地民用日期解释",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-timezone"
      }),
      birthTime: fact({
        value: chart.calculation.timeKnown ? chart.inputSnapshot.birthTime : null,
        sourcePosition: "inputSnapshot.birthTime",
        calculationConvention: "出生时间未知时保持空值，不以中午或其他时刻代填",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:bazi:timeKnown",
        certainty: chart.calculation.timeKnown ? "confirmed" : "unavailable"
      }),
      birthLocation: fact({
        value: chart.calculation.birthLocation ?? null,
        sourcePosition: "inputSnapshot.birthLocation",
        calculationConvention: "仅保留用户提供的地点文本，不据地点推断人格",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:bazi:inputSnapshot",
        certainty: chart.calculation.birthLocation ? "confirmed" : "unavailable"
      }),
      timezone: fact({
        value: chart.calculation.timezone,
        sourcePosition: "calculation.timezone",
        calculationConvention: "出生地当时采用的 IANA 法定时区",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-timezone"
      }),
      timeKnown: fact({
        value: chart.calculation.timeKnown,
        sourcePosition: "calculation.timeKnown",
        calculationConvention: "只有提供有效出生时间且未标记未知时才为真",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:bazi:timeKnown"
      })
    },
    calculation: {
      yearBoundary: fact({
        value: chart.calculation.yearBoundary,
        sourcePosition: "calculation.yearBoundary",
        calculationConvention: chart.calculation.yearBoundary,
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-year-boundary"
      }),
      monthBoundary: fact({
        value: chart.calculation.monthBoundary,
        sourcePosition: "calculation.monthBoundary",
        calculationConvention: chart.calculation.monthBoundary,
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-month-boundary"
      }),
      dayBoundary: fact({
        value: chart.calculation.dayBoundary,
        sourcePosition: "calculation.dayBoundary",
        calculationConvention: chart.calculation.dayBoundary,
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-zi-day-boundary"
      }),
      trueSolarTimeApplied: fact({
        value: false,
        sourcePosition: "calculation.notes",
        calculationConvention: "当前不做经度真太阳时校正",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-true-solar-time"
      })
    },
    pillars: [
      pillarFacts(chart, "年柱", chart.year, context.engineVersion),
      pillarFacts(chart, "月柱", chart.month, context.engineVersion),
      pillarFacts(chart, "日柱", chart.day, context.engineVersion),
      pillarFacts(chart, "时柱", chart.hour, context.engineVersion)
    ],
    dayMaster: {
      stem: fact({
        value: structure.dayMaster.stem,
        sourcePosition: structure.dayMaster.source,
        calculationConvention: "取日柱天干为日主",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-day-master"
      }),
      element: fact({
        value: structure.dayMaster.element,
        sourcePosition: structure.dayMaster.source,
        calculationConvention: "日主五行采用项目固定天干五行映射",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:elements:STEM_ELEMENT"
      }),
      yinYang: fact({
        value: structure.dayMaster.yinYang,
        sourcePosition: structure.dayMaster.source,
        calculationConvention: "日主阴阳采用项目固定天干阴阳映射",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:elements:STEM_YIN_YANG"
      })
    },
    monthCommand: {
      branch: fact({
        value: monthConfirmed ? structure.monthCommand.branch : null,
        sourcePosition: structure.monthCommand.source,
        calculationConvention: "月令取月柱地支；交节日时刻未知时不唯一确定",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-month-boundary",
        certainty: monthConfirmed ? "confirmed" : "uncertain"
      }),
      element: fact({
        value: monthConfirmed ? structure.monthCommand.element : null,
        sourcePosition: structure.monthCommand.source,
        calculationConvention: "月令五行采用项目固定地支五行映射",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:elements:BRANCH_ELEMENT",
        certainty: monthConfirmed ? "confirmed" : "uncertain"
      }),
      mainStem: fact({
        value: monthMain?.stem ?? null,
        sourcePosition: "月柱地支·本气",
        calculationConvention: "月令本气取项目固定藏干表第一项",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:baziStructure:HIDDEN_STEM_REFERENCE",
        certainty: monthConfirmed ? "confirmed" : "uncertain"
      }),
      mainTenGod: fact({
        value: monthMain?.name ?? null,
        sourcePosition: "月柱地支·本气",
        calculationConvention: "月令本气天干相对日主计算十神",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:baziStructure:tenGodFor",
        certainty: monthConfirmed ? "confirmed" : "uncertain"
      })
    },
    visibleElementCounts: Object.fromEntries(elements.map(element => [
      element,
      fact({
        value: elementCertainty === "confirmed" ? chart.elementDistribution.counts[element] : null,
        sourcePosition: "已确认四柱天干与地支",
        calculationConvention: "只统计已知四柱明字，不含藏干，不表示旺衰、喜忌或格局",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:elements:elementDistribution",
        certainty: elementCertainty
      })
    ])) as Record<Element, ProfessionalBaziFact<number | null>>,
    natalBranchRelations: temporal.branchRelations
      .filter(relation => !uncertainPositions.has(relation.firstPillar) && !uncertainPositions.has(relation.secondPillar))
      .map(relation => fact({
        value: relation,
        sourcePosition: `${relation.firstPillar}地支与${relation.secondPillar}地支`,
        calculationConvention: "仅记录当前已实现的同支、六合、六冲、六害、六破与刑，不生成吉凶结论",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:baziTemporalFacts:relationNames"
      })),
    timeFacts: context.timeLayers.map(layer => timeFacts(layer, context.engineVersion, uncertainPositions)),
    uncertainty: {
      yearPillarCandidates: fact({
        value: uncertainty?.yearCandidates?.map(item => item.pillarLabel) ?? [],
        sourcePosition: "calculation.uncertainty.yearCandidates",
        calculationConvention: "未知时辰且出生当天发生立春时保留日初与日末候选",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-year-boundary",
        certainty: uncertainty?.yearCandidates ? "uncertain" : "confirmed"
      }),
      monthPillarCandidates: fact({
        value: uncertainty?.monthCandidates?.map(item => item.pillarLabel) ?? [],
        sourcePosition: "calculation.uncertainty.monthCandidates",
        calculationConvention: "未知时辰且出生当天发生交节时保留日初与日末候选",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId: "catalog:bazi-month-boundary",
        certainty: uncertainty?.monthCandidates ? "uncertain" : "confirmed"
      }),
      reason: fact({
        value: uncertainty?.reason ?? null,
        sourcePosition: "calculation.uncertainty.reason",
        calculationConvention: "只有年柱或月柱候选不唯一时记录原因",
        ruleVersion: context.engineVersion,
        sourceRuleId: "code:bazi:uncertainty",
        certainty: uncertainty ? "uncertain" : "confirmed"
      })
    }
  };
}
