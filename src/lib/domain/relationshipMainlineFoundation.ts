import type {
  ProfessionalRelationshipFactsV1,
  ProfessionalRelationshipFact,
  ProfessionalRelationshipParticipantId
} from "@/lib/domain/professionalRelationshipFacts";
import {
  selectBaziDirectNarrative,
  type BaziDirectNarrativeEntry,
  type BaziDirectNarrativeFactId,
  type BaziDirectNarrativeSelection
} from "@/lib/domain/baziDirectNarratives";
import type {
  ProfessionalBaziFact,
  ProfessionalBaziSourceRuleId
} from "@/lib/domain/professionalBaziFacts";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";
import { ZODIAC_BY_BRANCH, type Branch, type Element } from "@/lib/domain/elements";
import {
  selectRelationshipImageryCore,
  type RelationshipParticipantImageryCore
} from "@/lib/domain/relationshipImageryCoreNarratives";
import { buildRelationshipImageryInteractionInput } from "@/lib/domain/relationshipImageryInteractionInput";
import { selectRelationshipImageryInteractionNarrativeSample } from "@/lib/domain/relationshipImageryInteractionNarrativeSamples";
import { selectRelationshipImageryStructureValidationSample } from "@/lib/domain/relationshipImageryInteractionStructureSamples";
import { selectRelationshipImagerySeasonControlSample } from "@/lib/domain/relationshipImageryInteractionSeasonControlSample";
import {
  buildConfirmedVisibleYinYangSummary,
  buildConfirmedVisibleElementSummary,
  type BaziVisibleElementPillarSource,
  type BaziYinYangPillarSource
} from "@/lib/domain/baziMainlineNarrative";
import type { YinYang } from "@/lib/domain/elements";
import type { TenGodName } from "@/lib/domain/baziStructure";
import {
  selectRelationshipDayBranchNarratives,
  type RelationshipDayBranchNarrativeSelection
} from "@/lib/domain/relationshipDayBranchNarratives";
import {
  BAZI_BIRTH_XIU_ALGORITHM_VERSION,
  BAZI_BIRTH_XIU_FACTS_VERSION,
  BAZI_BIRTH_XIU_SOURCE_RULE_ID,
  type BaziBirthXiuFactsV1,
  type XiuGong,
  type XiuName,
  type XiuShou,
  type XiuZheng
} from "@/lib/domain/baziBirthXiuFacts";

export interface RelationshipFoundationParticipant {
  id: ProfessionalRelationshipParticipantId;
  label: "你" | "对方";
  dayMaster: string | null;
  dayMasterNarrative: string | null;
  monthCommand: string | null;
  mainQi: string | null;
}

export interface RelationshipMainlineFoundation {
  participants: [
    RelationshipFoundationParticipant,
    RelationshipFoundationParticipant
  ];
}

export interface RelationshipZodiacParticipant {
  id: ProfessionalRelationshipParticipantId;
  label: "你" | "对方";
  yearBranch: Branch;
  zodiac: string;
  sourceFact: ProfessionalBaziFact<Branch | null>;
  mappingTrace: {
    sourceRuleId: typeof RELATIONSHIP_ZODIAC_MAPPING_RULE_ID;
    ruleVersion: string;
  };
}

export const RELATIONSHIP_ZODIAC_MAPPING_RULE_ID =
  "code:elements:ZODIAC_BY_BRANCH" as const;

export type RelationshipZodiacFacts =
  | { status: "available"; participants: [RelationshipZodiacParticipant, RelationshipZodiacParticipant] }
  | { status: "not_available" };

export interface RelationshipMainlineReading {
  foundation: RelationshipMainlineFoundation;
  zodiac: RelationshipZodiacFacts;
  imagery: RelationshipMainlineImagery;
  yinYang: RelationshipYinYangFacts;
  birthXiu: RelationshipBirthXiuFacts;
  fiveElements: RelationshipFiveElementFacts;
  directionalTenGods: RelationshipDirectionalTenGodFacts;
  dayBranchRelations: RelationshipDayBranchNarrativeSelection;
}

export interface RelationshipMainlineImageryInteraction {
  id: string;
  sections: {
    commonality: string;
    difference: string;
    interactionState: string;
  };
}

export type RelationshipMainlineImagery =
  | {
      status: "available";
      participants: [
        RelationshipParticipantImageryCore,
        RelationshipParticipantImageryCore
      ];
      interaction: RelationshipMainlineImageryInteraction | null;
    }
  | { status: "not_available" };

export interface RelationshipBirthXiuParticipant {
  id: ProfessionalRelationshipParticipantId;
  label: "你" | "对方";
  birthCivilDate: string;
  calculationKind: "traditional_daily_xiu";
  calculationConvention: BaziBirthXiuFactsV1["calculationConvention"];
  xiu: XiuName;
  zheng: XiuZheng;
  animal: string;
  gong: XiuGong;
  shou: XiuShou;
  certainty: "confirmed";
  sourceRuleId: typeof BAZI_BIRTH_XIU_SOURCE_RULE_ID;
  algorithmVersion: typeof BAZI_BIRTH_XIU_ALGORITHM_VERSION;
  schemaVersion: typeof BAZI_BIRTH_XIU_FACTS_VERSION;
}

export type RelationshipBirthXiuInput = Record<
  ProfessionalRelationshipParticipantId,
  BaziBirthXiuFactsV1 | null
>;

export type RelationshipBirthXiuFacts =
  | {
      status: "available";
      participants: [
        RelationshipBirthXiuParticipant,
        RelationshipBirthXiuParticipant
      ];
    }
  | { status: "not_available" };

export interface RelationshipYinYangRuleTrace {
  sourceRuleId: ProfessionalBaziSourceRuleId;
  ruleVersion: string;
}

export interface RelationshipYinYangParticipant {
  id: ProfessionalRelationshipParticipantId;
  label: "你" | "对方";
  coverageCount: number;
  counts: Record<YinYang, number>;
  ratios: Record<YinYang, number>;
  sources: BaziYinYangPillarSource[];
  ruleTraces: RelationshipYinYangRuleTrace[];
}

export type RelationshipYinYangFacts =
  | { status: "available"; participants: [RelationshipYinYangParticipant, RelationshipYinYangParticipant] }
  | { status: "not_available" };

export interface RelationshipFiveElementParticipant {
  id: ProfessionalRelationshipParticipantId;
  label: "你" | "对方";
  coverageCount: number;
  counts: Record<Element, number>;
  sources: BaziVisibleElementPillarSource[];
  ruleTraces: RelationshipYinYangRuleTrace[];
}

export type RelationshipFiveElementFacts =
  | {
      status: "available";
      participants: [
        RelationshipFiveElementParticipant,
        RelationshipFiveElementParticipant
      ];
    }
  | { status: "not_available" };

type DirectionalTenGodValue = ProfessionalRelationshipFactsV1[
  "comparisonFacts"
]["directionalDayStemTenGods"][number]["value"];

export interface RelationshipDirectionalTenGodLine {
  perspective: "personA" | "personB";
  perspectiveLabel: "你" | "对方";
  observedLabel: "对方" | "你";
  referenceDayMaster: DirectionalTenGodValue["referenceDayMaster"];
  observedStem: DirectionalTenGodValue["observedStem"];
  tenGod: TenGodName;
  statement: string;
  sourceFact: ProfessionalRelationshipFact<DirectionalTenGodValue>;
}

export type RelationshipDirectionalTenGodFacts =
  | {
      status: "available";
      lines: [
        RelationshipDirectionalTenGodLine,
        RelationshipDirectionalTenGodLine
      ];
    }
  | { status: "not_available" };

export type RelationshipImageryContext = "情感" | "工作" | "家人" | "朋友";

export type RelationshipImageryDependencyFacts = Record<
  BaziDirectNarrativeFactId,
  ProfessionalBaziFact<unknown>
>;

export interface RelationshipParticipantImageryInput {
  id: ProfessionalRelationshipParticipantId;
  label: "你" | "对方";
  selectionKey: Extract<
    BaziDirectNarrativeSelection,
    { status: "available" }
  >["key"];
  entry: BaziDirectNarrativeEntry;
  dependencyFacts: RelationshipImageryDependencyFacts;
}

export type RelationshipImageryInput =
  | {
      status: "available";
      relationshipTypeId: RelationshipType;
      relationshipType: RelationshipImageryContext;
      participants: [
        RelationshipParticipantImageryInput,
        RelationshipParticipantImageryInput
      ];
    }
  | {
      status: "not_available";
      relationshipTypeId: RelationshipType;
      relationshipType: RelationshipImageryContext;
      reason: "participant_imagery_unavailable";
    };

const RELATIONSHIP_IMAGERY_CONTEXTS: Record<
  RelationshipType,
  RelationshipImageryContext
> = {
  partner: "情感",
  cooperation: "工作",
  family: "家人",
  friend: "朋友"
};

function confirmedValue<T>(fact: {
  value: T | null;
  certainty: "confirmed" | "uncertain" | "unavailable";
}): T | null {
  return fact.certainty === "confirmed" && fact.value !== null
    ? fact.value
    : null;
}

function participantFoundation(
  facts: ProfessionalRelationshipFactsV1,
  id: ProfessionalRelationshipParticipantId,
  label: RelationshipFoundationParticipant["label"]
): RelationshipFoundationParticipant {
  const natal = facts.participants[id].natalFacts;
  const dayStem = confirmedValue(natal.dayMaster.stem);
  const dayElement = confirmedValue(natal.dayMaster.element);
  const dayYinYang = confirmedValue(natal.dayMaster.yinYang);
  const monthBranch = confirmedValue(natal.monthCommand.branch);
  const monthElement = confirmedValue(natal.monthCommand.element);
  const mainStem = confirmedValue(natal.monthCommand.mainStem);
  const mainTenGod = confirmedValue(natal.monthCommand.mainTenGod);
  const dayMasterReady = dayStem && dayElement && dayYinYang;
  const owner = label === "你" ? "你的" : "对方的";

  return {
    id,
    label,
    dayMaster: dayMasterReady
      ? `${dayStem}${dayElement} · ${dayYinYang}`
      : null,
    dayMasterNarrative: dayMasterReady
      ? `${owner}日主是${dayStem}，五行为${dayElement}，阴阳属${dayYinYang}，也称${dayYinYang}${dayElement}。`
      : null,
    monthCommand:
      monthBranch && monthElement ? `${monthBranch}${monthElement}` : null,
    mainQi:
      mainStem && monthElement && mainTenGod
        ? `${mainStem}${monthElement} · ${mainTenGod}`
        : null
  };
}

/**
 * Selects only confirmed natal facts for the ordinary relationship reading.
 * This layer does not calculate compatibility or expose technical uncertainty.
 */
export function buildRelationshipMainlineFoundation(
  facts: ProfessionalRelationshipFactsV1
): RelationshipMainlineFoundation {
  return {
    participants: [
      participantFoundation(facts, "personA", "你"),
      participantFoundation(facts, "personB", "对方")
    ]
  };
}

function participantImageryInput(
  facts: ProfessionalRelationshipFactsV1,
  id: ProfessionalRelationshipParticipantId,
  label: RelationshipParticipantImageryInput["label"]
): RelationshipParticipantImageryInput | null {
  const natal = facts.participants[id].natalFacts;
  const selection = selectBaziDirectNarrative(natal);
  if (selection.status !== "available") return null;

  const dependencyFacts: RelationshipImageryDependencyFacts = {
    "dayMaster.stem": natal.dayMaster.stem,
    "dayMaster.element": natal.dayMaster.element,
    "dayMaster.yinYang": natal.dayMaster.yinYang,
    "monthCommand.branch": natal.monthCommand.branch,
    "monthCommand.mainStem": natal.monthCommand.mainStem,
    "monthCommand.mainTenGod": natal.monthCommand.mainTenGod
  };
  const dependenciesAreConfirmed = selection.entry.factDependencies.every(
    dependencyId => {
      const fact = dependencyFacts[dependencyId];
      return fact.certainty === "confirmed" && fact.value !== null;
    }
  );
  if (!dependenciesAreConfirmed) return null;

  return {
    id,
    label,
    selectionKey: selection.key,
    entry: selection.entry,
    dependencyFacts
  };
}

/**
 * Reuses both approved Bazi imagery selections as input for a future
 * relationship narrative. The relationship type is context only and never
 * participates in either participant's fact or catalog selection.
 */
export function buildRelationshipImageryInput(
  facts: ProfessionalRelationshipFactsV1,
  relationshipTypeId: RelationshipType
): RelationshipImageryInput {
  const relationshipType = RELATIONSHIP_IMAGERY_CONTEXTS[relationshipTypeId];
  const personA = participantImageryInput(facts, "personA", "你");
  const personB = participantImageryInput(facts, "personB", "对方");

  if (!personA || !personB) {
    return {
      status: "not_available",
      relationshipTypeId,
      relationshipType,
      reason: "participant_imagery_unavailable"
    };
  }

  return {
    status: "available",
    relationshipTypeId,
    relationshipType,
    participants: [personA, personB]
  };
}

function zodiacParticipant(
  facts: ProfessionalRelationshipFactsV1,
  id: ProfessionalRelationshipParticipantId,
  label: RelationshipZodiacParticipant["label"]
): RelationshipZodiacParticipant | null {
  const natal = facts.participants[id].natalFacts;
  if (natal.uncertainty.yearPillarCandidates.value.length > 0) return null;
  const yearPillar = natal.pillars.find(pillar => (
    pillar.position.certainty === "confirmed" && pillar.position.value === "年柱"
  ));
  if (!yearPillar) return null;
  const yearBranch = confirmedValue(yearPillar.branch);
  const engineVersion = confirmedValue(natal.versions.engineVersion);
  if (!yearBranch || !engineVersion) return null;
  return {
    id,
    label,
    yearBranch,
    zodiac: ZODIAC_BY_BRANCH[yearBranch],
    sourceFact: yearPillar.branch,
    mappingTrace: {
      sourceRuleId: RELATIONSHIP_ZODIAC_MAPPING_RULE_ID,
      ruleVersion: engineVersion
    }
  };
}

export function buildRelationshipZodiacFacts(
  facts: ProfessionalRelationshipFactsV1
): RelationshipZodiacFacts {
  const personA = zodiacParticipant(facts, "personA", "你");
  const personB = zodiacParticipant(facts, "personB", "对方");
  return personA && personB
    ? { status: "available", participants: [personA, personB] }
    : { status: "not_available" };
}

function yinYangParticipant(
  facts: ProfessionalRelationshipFactsV1,
  id: ProfessionalRelationshipParticipantId,
  label: RelationshipYinYangParticipant["label"]
): RelationshipYinYangParticipant | null {
  const summary = buildConfirmedVisibleYinYangSummary(
    facts.participants[id].natalFacts
  );
  if (!summary) return null;
  const ruleTraces = Array.from(new Map(
    summary.sources.flatMap(source => [source.stem, source.branch]).map(fact => [
      `${fact.sourceRuleId}:${fact.ruleVersion}`,
      { sourceRuleId: fact.sourceRuleId, ruleVersion: fact.ruleVersion }
    ])
  ).values());
  return { id, label, ...summary, ruleTraces };
}

export function buildRelationshipYinYangFacts(
  facts: ProfessionalRelationshipFactsV1
): RelationshipYinYangFacts {
  const personA = yinYangParticipant(facts, "personA", "你");
  const personB = yinYangParticipant(facts, "personB", "对方");
  return personA && personB
    ? { status: "available", participants: [personA, personB] }
    : { status: "not_available" };
}

function fiveElementParticipant(
  facts: ProfessionalRelationshipFactsV1,
  id: ProfessionalRelationshipParticipantId,
  label: RelationshipFiveElementParticipant["label"]
): RelationshipFiveElementParticipant | null {
  const summary = buildConfirmedVisibleElementSummary(
    facts.participants[id].natalFacts
  );
  if (!summary) return null;
  const ruleTraces = Array.from(new Map(
    summary.sources.flatMap(source => [source.stem, source.branch]).map(fact => [
      `${fact.sourceRuleId}:${fact.ruleVersion}`,
      { sourceRuleId: fact.sourceRuleId, ruleVersion: fact.ruleVersion }
    ])
  ).values());
  return { id, label, ...summary, ruleTraces };
}

export function buildRelationshipFiveElementFacts(
  facts: ProfessionalRelationshipFactsV1
): RelationshipFiveElementFacts {
  const personA = fiveElementParticipant(facts, "personA", "你");
  const personB = fiveElementParticipant(facts, "personB", "对方");
  return personA && personB
    ? { status: "available", participants: [personA, personB] }
    : { status: "not_available" };
}

export function buildRelationshipDirectionalTenGodFacts(
  facts: ProfessionalRelationshipFactsV1
): RelationshipDirectionalTenGodFacts {
  const [personAFact, personBFact] =
    facts.comparisonFacts.directionalDayStemTenGods;
  const personAStem = facts.participants.personA.natalFacts.dayMaster.stem;
  const personBStem = facts.participants.personB.natalFacts.dayMaster.stem;
  if (
    personAFact.certainty !== "confirmed"
    || personBFact.certainty !== "confirmed"
    || personAStem.certainty !== "confirmed"
    || personBStem.certainty !== "confirmed"
    || !personAStem.value
    || !personBStem.value
    || personAFact.value.perspective !== "personA"
    || personBFact.value.perspective !== "personB"
    || personAFact.value.referenceDayMaster !== personAStem.value
    || personAFact.value.observedStem !== personBStem.value
    || personBFact.value.referenceDayMaster !== personBStem.value
    || personBFact.value.observedStem !== personAStem.value
    || !personAFact.value.tenGod
    || !personBFact.value.tenGod
  ) return { status: "not_available" };

  return {
    status: "available",
    lines: [
      {
        perspective: "personA",
        perspectiveLabel: "你",
        observedLabel: "对方",
        referenceDayMaster: personAFact.value.referenceDayMaster,
        observedStem: personAFact.value.observedStem,
        tenGod: personAFact.value.tenGod,
        statement: `以你的日主为参照，对方日干对应的十神是${personAFact.value.tenGod}。`,
        sourceFact: personAFact
      },
      {
        perspective: "personB",
        perspectiveLabel: "对方",
        observedLabel: "你",
        referenceDayMaster: personBFact.value.referenceDayMaster,
        observedStem: personBFact.value.observedStem,
        tenGod: personBFact.value.tenGod,
        statement: `以对方的日主为参照，你的日干对应的十神是${personBFact.value.tenGod}。`,
        sourceFact: personBFact
      }
    ]
  };
}

function birthXiuParticipant(
  facts: ProfessionalRelationshipFactsV1,
  birthXiuInput: RelationshipBirthXiuInput,
  id: ProfessionalRelationshipParticipantId,
  label: RelationshipBirthXiuParticipant["label"]
): RelationshipBirthXiuParticipant | null {
  const natal = facts.participants[id].natalFacts;
  const source = birthXiuInput[id];
  if (
    !source
    || source.certainty !== "confirmed"
    || source.calculationKind !== "traditional_daily_xiu"
    || source.schemaVersion !== BAZI_BIRTH_XIU_FACTS_VERSION
    || source.algorithmVersion !== BAZI_BIRTH_XIU_ALGORITHM_VERSION
    || source.sourceRuleId !== BAZI_BIRTH_XIU_SOURCE_RULE_ID
    || !source.birthCivilDate
    || !source.xiu
    || !source.zheng
    || !source.animal
    || !source.gong
    || !source.shou
    || natal.input.birthDate.certainty !== "confirmed"
    || natal.input.timezone.certainty !== "confirmed"
    || source.birthCivilDate !== natal.input.birthDate.value
    || source.birthTimezone !== natal.input.timezone.value
  ) return null;

  return {
    id,
    label,
    birthCivilDate: source.birthCivilDate,
    calculationKind: source.calculationKind,
    calculationConvention: source.calculationConvention,
    xiu: source.xiu,
    zheng: source.zheng,
    animal: source.animal,
    gong: source.gong,
    shou: source.shou,
    certainty: source.certainty,
    sourceRuleId: source.sourceRuleId,
    algorithmVersion: source.algorithmVersion,
    schemaVersion: source.schemaVersion
  };
}

/**
 * Projects the two existing Bazi traditional-daily-xiu facts into the isolated
 * relationship reading. It never recalculates a mansion or interprets a pair.
 */
export function buildRelationshipBirthXiuFacts(
  facts: ProfessionalRelationshipFactsV1,
  birthXiuInput: RelationshipBirthXiuInput
): RelationshipBirthXiuFacts {
  const personA = birthXiuParticipant(
    facts,
    birthXiuInput,
    "personA",
    "你"
  );
  const personB = birthXiuParticipant(
    facts,
    birthXiuInput,
    "personB",
    "对方"
  );
  return personA && personB
    ? { status: "available", participants: [personA, personB] }
    : { status: "not_available" };
}

export function buildRelationshipMainlineReading(
  facts: ProfessionalRelationshipFactsV1,
  relationshipTypeId: RelationshipType,
  birthXiuInput: RelationshipBirthXiuInput = {
    personA: null,
    personB: null
  }
): RelationshipMainlineReading {
  const imageryInput = buildRelationshipImageryInput(facts, relationshipTypeId);
  const coreImagery = selectRelationshipImageryCore(imageryInput);
  const interactionInput = buildRelationshipImageryInteractionInput({
    relationshipTypeId,
    imageryInput,
    coreSelection: coreImagery,
    professionalFacts: facts
  });
  const interactionCandidates = [
    selectRelationshipImageryInteractionNarrativeSample(interactionInput),
    selectRelationshipImageryStructureValidationSample(interactionInput),
    selectRelationshipImagerySeasonControlSample(interactionInput)
  ].flatMap(selection => selection.status === "available"
    ? [{ id: selection.entry.id, sections: selection.entry.sections }]
    : []
  );
  const imagery: RelationshipMainlineImagery = coreImagery.status === "available"
    ? {
        status: "available",
        participants: coreImagery.participants,
        interaction: interactionCandidates.length === 1
          ? interactionCandidates[0]
          : null
      }
    : { status: "not_available" };
  return {
    foundation: buildRelationshipMainlineFoundation(facts),
    zodiac: buildRelationshipZodiacFacts(facts),
    imagery,
    yinYang: buildRelationshipYinYangFacts(facts),
    birthXiu: buildRelationshipBirthXiuFacts(facts, birthXiuInput),
    fiveElements: buildRelationshipFiveElementFacts(facts),
    directionalTenGods: buildRelationshipDirectionalTenGodFacts(facts),
    dayBranchRelations: selectRelationshipDayBranchNarratives(
      facts,
      relationshipTypeId
    )
  };
}
