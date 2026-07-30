import type {
  ProfessionalBaziFactsV1,
  ProfessionalBaziPillarFacts,
  ProfessionalBaziSourceRuleId
} from "./professionalBaziFacts";
import type { PillarName } from "./baziStructure";
import type { Branch, Element, Stem, YinYang } from "./elements";
import type { TenGodName } from "./baziStructure";
import {
  TRADITIONAL_CALENDAR_VERSION,
  TRADITIONAL_RELATIONS
} from "../knowledge/traditionalCalendarCatalog";

export const PROFESSIONAL_RELATIONSHIP_FACTS_VERSION =
  "professional-relationship-facts-v1" as const;
export const PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION =
  "professional-relationship-deterministic-v1" as const;

export const PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY = {
  code: {
    factsVersion:
      "code:professionalRelationshipFacts:PROFESSIONAL_RELATIONSHIP_FACTS_VERSION",
    engineVersion:
      "code:professionalRelationshipFacts:PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION",
    traditionalCatalogVersion:
      "code:traditionalCalendarCatalog:TRADITIONAL_CALENDAR_VERSION",
    calculationClock:
      "code:professionalRelationshipFacts:buildProfessionalRelationshipFactsV1",
    participantProjection:
      "code:professionalRelationshipFacts:projectNatalFacts",
    inputAssumption:
      "code:professionalRelationshipFacts:participantInputAssumptions",
    visibleElementComparison:
      "code:professionalRelationshipFacts:visibleElementComparison",
    elementPresence:
      "code:professionalRelationshipFacts:elementPresence",
    visibleDistributionComparison:
      "code:professionalRelationshipFacts:visibleDistributionComparison",
    yinYangComparison:
      "code:professionalRelationshipFacts:dayMasterYinYangComparison",
    sameDayBranch:
      "code:professionalRelationshipFacts:sameDayBranch",
    dayBranchLookup:
      "code:professionalRelationshipFacts:dayBranchCatalogLookup",
    uncertainty:
      "code:professionalRelationshipFacts:participantUncertainty"
  }
} as const;

type RegistryValue<T> = T[keyof T];
export type ProfessionalRelationshipCodeRuleId = RegistryValue<
  typeof PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
>;

declare const relationshipCatalogRuleBrand: unique symbol;
export type ProfessionalRelationshipCatalogRuleId =
  `catalog:${string}` & { readonly [relationshipCatalogRuleBrand]: true };
export type ProfessionalRelationshipSourceRuleId =
  | ProfessionalRelationshipCodeRuleId
  | ProfessionalRelationshipCatalogRuleId
  | ProfessionalBaziSourceRuleId;

export type ProfessionalRelationshipParticipantId = "personA" | "personB";
export type ProfessionalRelationshipDependencyId =
  `${ProfessionalRelationshipParticipantId}.${string}`;
export type ProfessionalRelationshipCertainty =
  | "confirmed"
  | "uncertain"
  | "unavailable";
export type RelationshipTimezoneBasis =
  | "provided"
  | "product_assumption";
export type RelationshipElementPresence =
  | "visible"
  | "hidden_only"
  | "currently_not_seen";

export interface ProfessionalRelationshipSourcePosition {
  participant: ProfessionalRelationshipParticipantId;
  pillar?: PillarName;
  layer:
    | "input"
    | "pillar"
    | "dayMaster"
    | "stem"
    | "branch"
    | "hiddenStem"
    | "visibleElementCounts";
  hiddenStemIndex?: number;
}

export interface ProfessionalRelationshipFact<T> {
  value: T;
  participants: ProfessionalRelationshipParticipantId[];
  sourcePositions: ProfessionalRelationshipSourcePosition[];
  calculationConvention: string;
  ruleVersion: string;
  sourceRuleId: ProfessionalRelationshipSourceRuleId;
  certainty: ProfessionalRelationshipCertainty;
  dependsOn: ProfessionalRelationshipDependencyId[];
  excludedCandidatePositions: ProfessionalRelationshipSourcePosition[];
}

export type ProfessionalBaziNatalFactsV1 = Omit<
  ProfessionalBaziFactsV1,
  "timeFacts"
>;

export interface ProfessionalRelationshipParticipantInput {
  facts: ProfessionalBaziFactsV1;
  timezoneBasis: RelationshipTimezoneBasis;
}

export interface ProfessionalRelationshipBuildContext {
  calculatedAt: string;
}

export interface ProfessionalRelationshipInputIssue {
  participant: ProfessionalRelationshipParticipantId;
  position: "输入时区" | "年柱" | "月柱" | "时柱";
  reason:
    | "product_timezone_assumption"
    | "year_boundary_candidates"
    | "month_boundary_candidates"
    | "unknown_birth_time";
  candidates: string[];
}

export interface ProfessionalRelationshipDayBranchRelationValue {
  relation:
    | "same"
    | "six_harmony"
    | "six_clash"
    | "six_harm"
    | "six_break"
    | "punishment";
  personABranch: Branch;
  personBBranch: Branch;
  scope: "complete_pair" | "partial_group" | "self";
}

export interface ProfessionalRelationshipFactsV1 {
  schemaVersion: ProfessionalRelationshipFact<
    typeof PROFESSIONAL_RELATIONSHIP_FACTS_VERSION
  >;
  versions: {
    relationshipEngineVersion: ProfessionalRelationshipFact<
      typeof PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION
    >;
    traditionalCatalogVersion: ProfessionalRelationshipFact<string>;
    calculatedAt: ProfessionalRelationshipFact<string>;
  };
  participants: Record<
    ProfessionalRelationshipParticipantId,
    {
      natalFacts: ProfessionalBaziNatalFactsV1;
      inputAssumptions: {
        timezoneBasis: ProfessionalRelationshipFact<RelationshipTimezoneBasis>;
        timeKnown: ProfessionalRelationshipFact<boolean>;
        availablePillars: ProfessionalRelationshipFact<PillarName[]>;
      };
    }
  >;
  comparisonFacts: {
    dayMasterElementRelation: ProfessionalRelationshipFact<{
      personAElement: Element;
      personBElement: Element;
      relation:
        | "same"
        | "a_generates_b"
        | "b_generates_a"
        | "a_controls_b"
        | "b_controls_a";
    }>;
    dayMasterYinYangRelation: ProfessionalRelationshipFact<{
      personA: YinYang;
      personB: YinYang;
      relation: "same" | "different";
    }>;
    directionalDayStemTenGods: [
      ProfessionalRelationshipFact<{
        perspective: "personA";
        referenceDayMaster: Stem;
        observedStem: Stem;
        tenGod: TenGodName;
      }>,
      ProfessionalRelationshipFact<{
        perspective: "personB";
        referenceDayMaster: Stem;
        observedStem: Stem;
        tenGod: TenGodName;
      }>
    ];
  };
  fiveElementComparison: {
    visibleCounts: Record<
      ProfessionalRelationshipParticipantId,
      ProfessionalRelationshipFact<{
        counts: Record<Element, number | null>;
        visibleCharacterCount: number;
      }>
    >;
    presence: Record<
      ProfessionalRelationshipParticipantId,
      ProfessionalRelationshipFact<
        Record<Element, RelationshipElementPresence | null>
      >
    >;
    sharedVisibleElements: ProfessionalRelationshipFact<Element[]>;
    differingVisibleElements: ProfessionalRelationshipFact<Element[]>;
  };
  crossChartRelations: {
    dayBranchEvaluation: ProfessionalRelationshipFact<{
      personABranch: Branch;
      personBBranch: Branch;
      registeredRelationCount: number;
    }>;
    dayBranchRelations: Array<
      ProfessionalRelationshipFact<ProfessionalRelationshipDayBranchRelationValue>
    >;
  };
  uncertainty: {
    participantIssues: ProfessionalRelationshipFact<
      ProfessionalRelationshipInputIssue[]
    >;
    excludedPositions: ProfessionalRelationshipFact<
      ProfessionalRelationshipSourcePosition[]
    >;
  };
}

interface FactOptions<T> {
  value: T;
  participants: ProfessionalRelationshipParticipantId[];
  sourcePositions: ProfessionalRelationshipSourcePosition[];
  calculationConvention: string;
  ruleVersion: string;
  sourceRuleId: ProfessionalRelationshipSourceRuleId;
  certainty?: ProfessionalRelationshipCertainty;
  dependsOn?: ProfessionalRelationshipDependencyId[];
  excludedCandidatePositions?: ProfessionalRelationshipSourcePosition[];
}

type TraditionalRelation = (typeof TRADITIONAL_RELATIONS)[number];

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];
const ELEMENT_CODES: Record<Element, string> = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water"
};
const STEM_CODES: Record<Stem, string> = {
  甲: "jia",
  乙: "yi",
  丙: "bing",
  丁: "ding",
  戊: "wu",
  己: "ji",
  庚: "geng",
  辛: "xin",
  壬: "ren",
  癸: "gui"
};
const BRANCH_CODES: Record<Branch, string> = {
  子: "zi",
  丑: "chou",
  寅: "yin",
  卯: "mao",
  辰: "chen",
  巳: "si",
  午: "wu",
  未: "wei",
  申: "shen",
  酉: "you",
  戌: "xu",
  亥: "hai"
};

function relationshipFact<T>(
  options: FactOptions<T>
): ProfessionalRelationshipFact<T> {
  return {
    value: options.value,
    participants: options.participants,
    sourcePositions: options.sourcePositions,
    calculationConvention: options.calculationConvention,
    ruleVersion: options.ruleVersion,
    sourceRuleId: options.sourceRuleId,
    certainty: options.certainty ?? "confirmed",
    dependsOn: options.dependsOn ?? [],
    excludedCandidatePositions:
      options.excludedCandidatePositions ?? []
  };
}

function catalogRelation(id: string): {
  rule: TraditionalRelation;
  sourceRuleId: ProfessionalRelationshipCatalogRuleId;
} {
  const rule = TRADITIONAL_RELATIONS.find(candidate => candidate.id === id);
  if (!rule || !rule.isActive) {
    throw new Error(`关系事实引用的传统目录规则不存在或未启用：${id}`);
  }
  return {
    rule,
    sourceRuleId:
      `catalog:${rule.id}` as ProfessionalRelationshipCatalogRuleId
  };
}

function participantDependency(
  participant: ProfessionalRelationshipParticipantId,
  path: string
): ProfessionalRelationshipDependencyId {
  return `${participant}.${path}`;
}

function sourcePosition(
  participant: ProfessionalRelationshipParticipantId,
  layer: ProfessionalRelationshipSourcePosition["layer"],
  pillar?: PillarName
): ProfessionalRelationshipSourcePosition {
  return { participant, layer, ...(pillar ? { pillar } : {}) };
}

function projectNatalFacts(
  facts: ProfessionalBaziFactsV1
): ProfessionalBaziNatalFactsV1 {
  const { timeFacts: _timeFacts, ...natalFacts } = facts;
  return natalFacts;
}

function confirmedPillars(facts: ProfessionalBaziFactsV1) {
  return facts.pillars.filter(
    pillar =>
      pillar.ganzhi.certainty === "confirmed" &&
      pillar.stem.value &&
      pillar.branch.value
  );
}

function excludedPillarPositions(
  participant: ProfessionalRelationshipParticipantId,
  facts: ProfessionalBaziFactsV1
) {
  return facts.pillars.flatMap(pillar =>
    pillar.ganzhi.certainty === "confirmed"
      ? []
      : [sourcePosition(participant, "pillar", pillar.position.value)]
  );
}

function aggregateCountCertainty(facts: ProfessionalBaziFactsV1) {
  const certainties = Object.values(facts.visibleElementCounts).map(
    item => item.certainty
  );
  if (certainties.includes("uncertain")) return "uncertain" as const;
  if (certainties.includes("unavailable")) return "unavailable" as const;
  return "confirmed" as const;
}

function visibleCountsFact(
  participant: ProfessionalRelationshipParticipantId,
  facts: ProfessionalBaziFactsV1
) {
  const pillars = confirmedPillars(facts);
  const certainty = aggregateCountCertainty(facts);
  const excluded = excludedPillarPositions(participant, facts);
  const counts = Object.fromEntries(
    ELEMENTS.map(element => [
      element,
      certainty === "confirmed"
        ? facts.visibleElementCounts[element].value
        : null
    ])
  ) as Record<Element, number | null>;

  return relationshipFact({
    value: {
      counts,
      visibleCharacterCount: pillars.length * 2
    },
    participants: [participant],
    sourcePositions: [
      sourcePosition(participant, "visibleElementCounts")
    ],
    calculationConvention:
      "逐方复用个人专业事实中的明字五行数量，并同时记录已确认天干、地支的实际覆盖字数；数量不表示力量、旺衰或适配度",
    ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
    sourceRuleId:
      PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
        .visibleElementComparison,
    certainty,
    dependsOn: ELEMENTS.map(element =>
      participantDependency(
        participant,
        `visibleElementCounts.${element}`
      )
    ),
    excludedCandidatePositions: excluded
  });
}

function elementPresenceFact(
  participant: ProfessionalRelationshipParticipantId,
  facts: ProfessionalBaziFactsV1,
  countsFact: ReturnType<typeof visibleCountsFact>
) {
  const confirmed = confirmedPillars(facts);
  const hiddenElements = new Set(
    confirmed.flatMap(pillar =>
      pillar.hiddenStems.value.map(hidden => hidden.element)
    )
  );
  const certainty = countsFact.certainty;
  const value = Object.fromEntries(
    ELEMENTS.map(element => {
      const visibleCount = countsFact.value.counts[element];
      if (visibleCount === null) return [element, null];
      if (visibleCount > 0) return [element, "visible"];
      if (hiddenElements.has(element)) return [element, "hidden_only"];
      return [element, "currently_not_seen"];
    })
  ) as Record<Element, RelationshipElementPresence | null>;

  return relationshipFact({
    value,
    participants: [participant],
    sourcePositions: confirmed.map(pillar =>
      sourcePosition(participant, "hiddenStem", pillar.position.value)
    ).concat([
      sourcePosition(participant, "visibleElementCounts")
    ]),
    calculationConvention:
      "先查看已确认明字五行数量，再检查已确认柱位藏干；只区分明字出现、仅藏干出现和当前已确认范围内未见，不计算藏干权重，不判断缺失",
    ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
    sourceRuleId:
      PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.elementPresence,
    certainty,
    dependsOn: [
      ...ELEMENTS.map(element =>
        participantDependency(
          participant,
          `visibleElementCounts.${element}`
        )
      ),
      ...confirmed.map(pillar =>
        participantDependency(
          participant,
          `pillars.${pillar.position.value}.hiddenStems`
        )
      )
    ],
    excludedCandidatePositions:
      countsFact.excludedCandidatePositions
  });
}

function phaseRelation(
  personAElement: Element,
  personBElement: Element
) {
  const id = `phase-${ELEMENT_CODES[personAElement]}-${ELEMENT_CODES[personBElement]}`;
  const catalog = catalogRelation(id);
  const relation = (() => {
    switch (catalog.rule.relationType) {
      case "same":
        return "same" as const;
      case "generates":
        return "a_generates_b" as const;
      case "generated_by":
        return "b_generates_a" as const;
      case "controls":
        return "a_controls_b" as const;
      case "controlled_by":
        return "b_controls_a" as const;
      default:
        throw new Error(`五行关系目录类型不受支持：${catalog.rule.relationType}`);
    }
  })();
  return { ...catalog, relation };
}

function tenGodRelation(reference: Stem, observed: Stem) {
  const id = `ten-god-${STEM_CODES[reference]}-${STEM_CODES[observed]}`;
  const catalog = catalogRelation(id);
  if (
    catalog.rule.relationType !== "ten_god_mapping" ||
    typeof catalog.rule.attributes.tenGodName !== "string"
  ) {
    throw new Error(`十神目录规则结构无效：${id}`);
  }
  return {
    ...catalog,
    tenGod: catalog.rule.attributes.tenGodName as TenGodName
  };
}

function relationByExactBranches(
  relationType:
    | "branch_six_harmony"
    | "branch_clash"
    | "branch_harm"
    | "branch_break",
  first: Branch,
  second: Branch
) {
  const codes = new Set([
    `branch:${BRANCH_CODES[first]}`,
    `branch:${BRANCH_CODES[second]}`
  ]);
  return TRADITIONAL_RELATIONS.find(
    relation =>
      relation.isActive &&
      relation.relationType === relationType &&
      relation.subjectCodes.length === codes.size &&
      relation.subjectCodes.every(code => codes.has(code))
  );
}

function punishmentRelations(first: Branch, second: Branch) {
  const firstCode = `branch:${BRANCH_CODES[first]}`;
  const secondCode = `branch:${BRANCH_CODES[second]}`;
  return TRADITIONAL_RELATIONS.filter(relation => {
    if (!relation.isActive || relation.relationType !== "branch_punishment") {
      return false;
    }
    if (first === second) {
      return (
        relation.id === "branch-punishment-self" &&
        relation.subjectCodes.includes(firstCode)
      );
    }
    if (relation.id === "branch-punishment-self") return false;
    return (
      relation.subjectCodes.includes(firstCode) &&
      relation.subjectCodes.includes(secondCode)
    );
  });
}

function dayBranchRelations(
  personABranch: Branch,
  personBBranch: Branch
) {
  const relations: Array<{
    value: ProfessionalRelationshipDayBranchRelationValue;
    sourceRuleId: ProfessionalRelationshipSourceRuleId;
    ruleVersion: string;
  }> = [];

  if (personABranch === personBBranch) {
    relations.push({
      value: {
        relation: "same",
        personABranch,
        personBBranch,
        scope: "complete_pair"
      },
      sourceRuleId:
        PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.sameDayBranch,
      ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION
    });
  }

  const pairTypes = [
    ["branch_six_harmony", "six_harmony"],
    ["branch_clash", "six_clash"],
    ["branch_harm", "six_harm"],
    ["branch_break", "six_break"]
  ] as const;
  pairTypes.forEach(([relationType, value]) => {
    const rule = relationByExactBranches(
      relationType,
      personABranch,
      personBBranch
    );
    if (!rule) return;
    const catalog = catalogRelation(rule.id);
    relations.push({
      value: {
        relation: value,
        personABranch,
        personBBranch,
        scope: "complete_pair"
      },
      sourceRuleId: catalog.sourceRuleId,
      ruleVersion: catalog.rule.version
    });
  });

  punishmentRelations(personABranch, personBBranch).forEach(rule => {
    const catalog = catalogRelation(rule.id);
    relations.push({
      value: {
        relation: "punishment",
        personABranch,
        personBBranch,
        scope:
          personABranch === personBBranch
            ? "self"
            : rule.subjectCodes.length > 2
              ? "partial_group"
              : "complete_pair"
      },
      sourceRuleId: catalog.sourceRuleId,
      ruleVersion: catalog.rule.version
    });
  });

  return relations;
}

function availablePillarNames(facts: ProfessionalBaziFactsV1) {
  return confirmedPillars(facts).map(pillar => pillar.position.value);
}

function participantIssues(
  participant: ProfessionalRelationshipParticipantId,
  input: ProfessionalRelationshipParticipantInput
) {
  const issues: ProfessionalRelationshipInputIssue[] = [];
  if (input.timezoneBasis === "product_assumption") {
    issues.push({
      participant,
      position: "输入时区",
      reason: "product_timezone_assumption",
      candidates: []
    });
  }
  if (!input.facts.input.timeKnown.value) {
    issues.push({
      participant,
      position: "时柱",
      reason: "unknown_birth_time",
      candidates: []
    });
  }
  if (input.facts.uncertainty.yearPillarCandidates.value.length) {
    issues.push({
      participant,
      position: "年柱",
      reason: "year_boundary_candidates",
      candidates: [
        ...input.facts.uncertainty.yearPillarCandidates.value
      ]
    });
  }
  if (input.facts.uncertainty.monthPillarCandidates.value.length) {
    issues.push({
      participant,
      position: "月柱",
      reason: "month_boundary_candidates",
      candidates: [
        ...input.facts.uncertainty.monthPillarCandidates.value
      ]
    });
  }
  return issues;
}

function participantEnvelope(
  participant: ProfessionalRelationshipParticipantId,
  input: ProfessionalRelationshipParticipantInput
) {
  const excluded = excludedPillarPositions(participant, input.facts);
  return {
    natalFacts: projectNatalFacts(input.facts),
    inputAssumptions: {
      timezoneBasis: relationshipFact({
        value: input.timezoneBasis,
        participants: [participant],
        sourcePositions: [sourcePosition(participant, "input")],
        calculationConvention:
          input.timezoneBasis === "provided"
            ? "出生时区来自该参与者已提供的个人盘输入"
            : "出生时区不是第三方已确认资料，而是当前产品为日期输入采用的时区假设",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.inputAssumption,
        dependsOn: [
          participantDependency(participant, "input.timezone")
        ]
      }),
      timeKnown: relationshipFact({
        value: input.facts.input.timeKnown.value,
        participants: [participant],
        sourcePositions: [sourcePosition(participant, "input")],
        calculationConvention:
          "直接引用个人专业事实的出生时间已知状态；未知时不补写时柱",
        ruleVersion: input.facts.input.timeKnown.ruleVersion,
        sourceRuleId: input.facts.input.timeKnown.sourceRuleId,
        certainty: input.facts.input.timeKnown.certainty,
        dependsOn: [
          participantDependency(participant, "input.timeKnown")
        ],
        excludedCandidatePositions: excluded.filter(
          position => position.pillar === "时柱"
        )
      }),
      availablePillars: relationshipFact({
        value: availablePillarNames(input.facts),
        participants: [participant],
        sourcePositions: input.facts.pillars.map(pillar =>
          sourcePosition(
            participant,
            "pillar",
            pillar.position.value
          )
        ),
        calculationConvention:
          "只列出个人专业事实中干支均已确认的柱位；未知或候选柱位不进入后续关系计算",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
            .participantProjection,
        dependsOn: input.facts.pillars.map(pillar =>
          participantDependency(
            participant,
            `pillars.${pillar.position.value}.ganzhi`
          )
        ),
        excludedCandidatePositions: excluded
      })
    }
  };
}

function dayPillar(facts: ProfessionalBaziFactsV1) {
  const pillar = facts.pillars.find(
    candidate => candidate.position.value === "日柱"
  );
  if (
    !pillar ||
    pillar.stem.certainty !== "confirmed" ||
    pillar.branch.certainty !== "confirmed" ||
    !pillar.stem.value ||
    !pillar.branch.value
  ) {
    throw new Error("专业关系事实要求双方均具有已确认日柱");
  }
  return pillar as ProfessionalBaziPillarFacts & {
    stem: ProfessionalBaziPillarFacts["stem"] & { value: Stem };
    branch: ProfessionalBaziPillarFacts["branch"] & { value: Branch };
  };
}

export function buildProfessionalRelationshipFactsV1(
  personAInput: ProfessionalRelationshipParticipantInput,
  personBInput: ProfessionalRelationshipParticipantInput,
  context: ProfessionalRelationshipBuildContext
): ProfessionalRelationshipFactsV1 {
  const personA = personAInput.facts;
  const personB = personBInput.facts;
  const personADay = dayPillar(personA);
  const personBDay = dayPillar(personB);
  const personAElement = personA.dayMaster.element.value;
  const personBElement = personB.dayMaster.element.value;
  const elementRelation = phaseRelation(
    personAElement,
    personBElement
  );
  const personATenGod = tenGodRelation(
    personA.dayMaster.stem.value,
    personBDay.stem.value
  );
  const personBTenGod = tenGodRelation(
    personB.dayMaster.stem.value,
    personADay.stem.value
  );
  const branchRelations = dayBranchRelations(
    personADay.branch.value,
    personBDay.branch.value
  );
  const personACounts = visibleCountsFact("personA", personA);
  const personBCounts = visibleCountsFact("personB", personB);
  const personAPresence = elementPresenceFact(
    "personA",
    personA,
    personACounts
  );
  const personBPresence = elementPresenceFact(
    "personB",
    personB,
    personBCounts
  );
  const visibleComparisonCertainty =
    personACounts.certainty === "confirmed" &&
    personBCounts.certainty === "confirmed"
      ? "confirmed"
      : personACounts.certainty === "uncertain" ||
          personBCounts.certainty === "uncertain"
        ? "uncertain"
        : "unavailable";
  const sharedVisibleElements =
    visibleComparisonCertainty === "confirmed"
      ? ELEMENTS.filter(
          element =>
            (personACounts.value.counts[element] ?? 0) > 0 &&
            (personBCounts.value.counts[element] ?? 0) > 0
        )
      : [];
  const differingVisibleElements =
    visibleComparisonCertainty === "confirmed"
      ? ELEMENTS.filter(
          element =>
            ((personACounts.value.counts[element] ?? 0) > 0) !==
            ((personBCounts.value.counts[element] ?? 0) > 0)
        )
      : [];
  const issues = [
    ...participantIssues("personA", personAInput),
    ...participantIssues("personB", personBInput)
  ];
  const excluded = [
    ...excludedPillarPositions("personA", personA),
    ...excludedPillarPositions("personB", personB)
  ];
  const dayStemPositions = [
    sourcePosition("personA", "dayMaster", "日柱"),
    sourcePosition("personB", "dayMaster", "日柱")
  ];
  const dayBranchPositions = [
    sourcePosition("personA", "branch", "日柱"),
    sourcePosition("personB", "branch", "日柱")
  ];
  const dayStemDependencies = [
    participantDependency("personA", "dayMaster.stem"),
    participantDependency("personB", "dayMaster.stem")
  ];
  const dayBranchDependencies = [
    participantDependency("personA", "pillars.日柱.branch"),
    participantDependency("personB", "pillars.日柱.branch")
  ];

  return {
    schemaVersion: relationshipFact({
      value: PROFESSIONAL_RELATIONSHIP_FACTS_VERSION,
      participants: ["personA", "personB"],
      sourcePositions: [],
      calculationConvention:
        "窄版专业关系事实合同只组织双方个人事实、五行可见分布和日柱跨盘关系",
      ruleVersion: PROFESSIONAL_RELATIONSHIP_FACTS_VERSION,
      sourceRuleId:
        PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.factsVersion
    }),
    versions: {
      relationshipEngineVersion: relationshipFact({
        value: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        participants: ["personA", "personB"],
        sourcePositions: [],
        calculationConvention:
          "记录本次专业关系事实组合器版本，不替代双方个人八字引擎版本",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.engineVersion
      }),
      traditionalCatalogVersion: relationshipFact({
        value: TRADITIONAL_CALENDAR_VERSION,
        participants: ["personA", "personB"],
        sourcePositions: [],
        calculationConvention:
          "直接引用现有传统历法目录版本，不复制版本字符串",
        ruleVersion: TRADITIONAL_CALENDAR_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
            .traditionalCatalogVersion
      }),
      calculatedAt: relationshipFact({
        value: context.calculatedAt,
        participants: ["personA", "personB"],
        sourcePositions: [],
        calculationConvention:
          "使用调用方提供的 ISO 8601 绝对时刻记录本次关系事实组合时间",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.calculationClock
      })
    },
    participants: {
      personA: participantEnvelope("personA", personAInput),
      personB: participantEnvelope("personB", personBInput)
    },
    comparisonFacts: {
      dayMasterElementRelation: relationshipFact({
        value: {
          personAElement,
          personBElement,
          relation: elementRelation.relation
        },
        participants: ["personA", "personB"],
        sourcePositions: dayStemPositions,
        calculationConvention:
          "只比较双方已确认日主五行的同类、相生或相克方向，不推断付出、强弱或关系好坏",
        ruleVersion: elementRelation.rule.version,
        sourceRuleId: elementRelation.sourceRuleId,
        dependsOn: [
          participantDependency("personA", "dayMaster.element"),
          participantDependency("personB", "dayMaster.element")
        ]
      }),
      dayMasterYinYangRelation: relationshipFact({
        value: {
          personA: personA.dayMaster.yinYang.value,
          personB: personB.dayMaster.yinYang.value,
          relation:
            personA.dayMaster.yinYang.value ===
            personB.dayMaster.yinYang.value
              ? "same"
              : "different"
        },
        participants: ["personA", "personB"],
        sourcePositions: dayStemPositions,
        calculationConvention:
          "并列双方日主阴阳并判断相同或不同，不生成互补性或匹配度结论",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
            .yinYangComparison,
        dependsOn: [
          participantDependency("personA", "dayMaster.yinYang"),
          participantDependency("personB", "dayMaster.yinYang")
        ]
      }),
      directionalDayStemTenGods: [
        relationshipFact({
          value: {
            perspective: "personA",
            referenceDayMaster: personA.dayMaster.stem.value,
            observedStem: personBDay.stem.value,
            tenGod: personATenGod.tenGod
          },
          participants: ["personA", "personB"],
          sourcePositions: dayStemPositions,
          calculationConvention:
            "以甲方日主为参照，计算乙方日干对应十神；只记录传统结构名称",
          ruleVersion: personATenGod.rule.version,
          sourceRuleId: personATenGod.sourceRuleId,
          dependsOn: dayStemDependencies
        }),
        relationshipFact({
          value: {
            perspective: "personB",
            referenceDayMaster: personB.dayMaster.stem.value,
            observedStem: personADay.stem.value,
            tenGod: personBTenGod.tenGod
          },
          participants: ["personA", "personB"],
          sourcePositions: dayStemPositions,
          calculationConvention:
            "以乙方日主为参照，计算甲方日干对应十神；只记录传统结构名称",
          ruleVersion: personBTenGod.rule.version,
          sourceRuleId: personBTenGod.sourceRuleId,
          dependsOn: dayStemDependencies
        })
      ]
    },
    fiveElementComparison: {
      visibleCounts: {
        personA: personACounts,
        personB: personBCounts
      },
      presence: {
        personA: personAPresence,
        personB: personBPresence
      },
      sharedVisibleElements: relationshipFact({
        value: sharedVisibleElements,
        participants: ["personA", "personB"],
        sourcePositions: [
          sourcePosition("personA", "visibleElementCounts"),
          sourcePosition("personB", "visibleElementCounts")
        ],
        calculationConvention:
          "只比较双方已确认明字中是否出现相同五行；不合并数量，不表示共同能力或适配度",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
            .visibleDistributionComparison,
        certainty: visibleComparisonCertainty,
        dependsOn: [
          ...ELEMENTS.map(element =>
            participantDependency(
              "personA",
              `visibleElementCounts.${element}`
            )
          ),
          ...ELEMENTS.map(element =>
            participantDependency(
              "personB",
              `visibleElementCounts.${element}`
            )
          )
        ],
        excludedCandidatePositions: excluded
      }),
      differingVisibleElements: relationshipFact({
        value: differingVisibleElements,
        participants: ["personA", "personB"],
        sourcePositions: [
          sourcePosition("personA", "visibleElementCounts"),
          sourcePosition("personB", "visibleElementCounts")
        ],
        calculationConvention:
          "只记录一方已确认明字出现而另一方当前已确认明字未出现的五行；不解释为缺失、强弱或互补",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
            .visibleDistributionComparison,
        certainty: visibleComparisonCertainty,
        dependsOn: [
          ...ELEMENTS.map(element =>
            participantDependency(
              "personA",
              `visibleElementCounts.${element}`
            )
          ),
          ...ELEMENTS.map(element =>
            participantDependency(
              "personB",
              `visibleElementCounts.${element}`
            )
          )
        ],
        excludedCandidatePositions: excluded
      })
    },
    crossChartRelations: {
      dayBranchEvaluation: relationshipFact({
        value: {
          personABranch: personADay.branch.value,
          personBBranch: personBDay.branch.value,
          registeredRelationCount: branchRelations.length
        },
        participants: ["personA", "personB"],
        sourcePositions: dayBranchPositions,
        calculationConvention:
          "只在项目传统目录登记的同支、六合、六冲、六害、六破与刑范围内核对双方日支；零项不代表关系顺利或困难",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.dayBranchLookup,
        dependsOn: dayBranchDependencies
      }),
      dayBranchRelations: branchRelations.map(relation =>
        relationshipFact({
          value: relation.value,
          participants: ["personA", "personB"],
          sourcePositions: dayBranchPositions,
          calculationConvention:
            relation.value.scope === "partial_group"
              ? "双方日支只构成三支刑组合中的两个位置，因此仅记录为局部组合，不冒充完整三刑"
              : "只记录双方日支之间成立的传统结构名称，不生成吉凶、事件或关系结果",
          ruleVersion: relation.ruleVersion,
          sourceRuleId: relation.sourceRuleId,
          dependsOn: dayBranchDependencies
        })
      )
    },
    uncertainty: {
      participantIssues: relationshipFact({
        value: issues,
        participants: ["personA", "personB"],
        sourcePositions: issues.map(issue =>
          sourcePosition(
            issue.participant,
            issue.position === "输入时区" ? "input" : "pillar",
            issue.position === "输入时区"
              ? undefined
              : issue.position
          )
        ),
        calculationConvention:
          "集中记录产品输入假设、未知时辰和交节候选；这些项目不得被解释为已确认盘面",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.uncertainty,
        dependsOn: [
          participantDependency(
            "personA",
            "inputAssumptions.timezoneBasis"
          ),
          participantDependency("personA", "input.timeKnown"),
          participantDependency(
            "personA",
            "uncertainty.yearPillarCandidates"
          ),
          participantDependency(
            "personA",
            "uncertainty.monthPillarCandidates"
          ),
          participantDependency(
            "personB",
            "inputAssumptions.timezoneBasis"
          ),
          participantDependency("personB", "input.timeKnown"),
          participantDependency(
            "personB",
            "uncertainty.yearPillarCandidates"
          ),
          participantDependency(
            "personB",
            "uncertainty.monthPillarCandidates"
          )
        ]
      }),
      excludedPositions: relationshipFact({
        value: excluded,
        participants: ["personA", "personB"],
        sourcePositions: excluded,
        calculationConvention:
          "列出未进入五行覆盖和跨盘关系计算的未知或候选柱位；当前V1跨盘关系本身只使用双方已确认日柱",
        ruleVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
        sourceRuleId:
          PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code.uncertainty,
        dependsOn: [
          ...personA.pillars.map(pillar =>
            participantDependency(
              "personA",
              `pillars.${pillar.position.value}.ganzhi`
            )
          ),
          ...personB.pillars.map(pillar =>
            participantDependency(
              "personB",
              `pillars.${pillar.position.value}.ganzhi`
            )
          )
        ]
      })
    }
  };
}
