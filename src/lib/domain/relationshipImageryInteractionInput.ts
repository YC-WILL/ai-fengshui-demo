import type { Branch, Stem } from "./elements";
import {
  TRADITIONAL_CALENDAR_VERSION,
  TRADITIONAL_RELATIONS
} from "../knowledge/traditionalCalendarCatalog";
import type { RelationshipType } from "./relationshipInteractions";
import {
  PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
  PROFESSIONAL_RELATIONSHIP_FACTS_VERSION,
  type ProfessionalRelationshipFact,
  type ProfessionalRelationshipFactsV1
} from "./professionalRelationshipFacts";
import {
  RELATIONSHIP_IMAGERY_CORE_CATALOG,
  selectRelationshipImageryCore,
  type RelationshipImageryCoreSelection,
  type RelationshipParticipantImageryCore
} from "./relationshipImageryCoreNarratives";
import type { RelationshipImageryInput } from "./relationshipMainlineFoundation";

export const RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION =
  "relationship-imagery-interaction-input-v1" as const;
export const RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION =
  "relationship-imagery-structure-metadata-v1" as const;

export const RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES = {
  dayStemFamily:
    "code:relationshipImageryInteractionInput:DAY_STEM_IMAGERY_FAMILY",
  monthBranchSeason:
    "code:relationshipImageryInteractionInput:MONTH_BRANCH_SEASON_STATE"
} as const;

export const DAY_STEM_IMAGERY_FAMILY = Object.freeze({
  甲: "乔木",
  乙: "柔木",
  丙: "日光",
  丁: "灯火",
  戊: "山地",
  己: "田园",
  庚: "原铁器具",
  辛: "细金器物",
  壬: "江河",
  癸: "雨露细流"
} as const satisfies Record<Stem, string>);

export const MONTH_BRANCH_SEASON_STATE = Object.freeze({
  寅: "初春",
  卯: "仲春",
  辰: "春末",
  巳: "初夏",
  午: "盛夏",
  未: "夏末",
  申: "初秋",
  酉: "仲秋",
  戌: "深秋",
  亥: "初冬",
  子: "仲冬",
  丑: "冬末"
} as const satisfies Record<Branch, string>);

const ELEMENT_CODES = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water"
} as const;

const STEM_CODES = {
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
} as const satisfies Record<Stem, string>;

type AvailableCoreSelection = Extract<
  RelationshipImageryCoreSelection,
  { status: "available" }
>;

export interface RelationshipImageryInteractionBuildInput {
  relationshipTypeId: RelationshipType;
  imageryInput: RelationshipImageryInput;
  coreSelection: RelationshipImageryCoreSelection;
  professionalFacts: ProfessionalRelationshipFactsV1;
}

export interface RelationshipImageryParticipantStructureMetadata {
  id: "personA" | "personB";
  label: "你" | "对方";
  selectionKey: RelationshipParticipantImageryCore["selectionKey"];
  dayStemFamily: {
    dayStem: Stem;
    value: (typeof DAY_STEM_IMAGERY_FAMILY)[Stem];
    sourceRuleId: typeof RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.dayStemFamily;
    version: typeof RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION;
  };
  monthBranchSeason: {
    monthBranch: Branch;
    value: (typeof MONTH_BRANCH_SEASON_STATE)[Branch];
    sourceRuleId: typeof RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.monthBranchSeason;
    version: typeof RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION;
  };
}

export type RelationshipImageryStructureMetadataEntry = Omit<
  RelationshipImageryParticipantStructureMetadata,
  "id" | "label"
>;

function buildStructureMetadataCatalog(): Record<
  RelationshipParticipantImageryCore["selectionKey"],
  RelationshipImageryStructureMetadataEntry
> {
  return Object.fromEntries(
    Object.values(RELATIONSHIP_IMAGERY_CORE_CATALOG).map(entry => {
      const { dayStem, monthBranch } = entry.requiredFacts;
      return [
        entry.selectionKey,
        Object.freeze({
          selectionKey: entry.selectionKey,
          dayStemFamily: Object.freeze({
            dayStem,
            value: DAY_STEM_IMAGERY_FAMILY[dayStem],
            sourceRuleId:
              RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.dayStemFamily,
            version: RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
          }),
          monthBranchSeason: Object.freeze({
            monthBranch,
            value: MONTH_BRANCH_SEASON_STATE[monthBranch],
            sourceRuleId:
              RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.monthBranchSeason,
            version: RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
          })
        })
      ];
    })
  ) as Record<
    RelationshipParticipantImageryCore["selectionKey"],
    RelationshipImageryStructureMetadataEntry
  >;
}

export const RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_CATALOG = Object.freeze(
  buildStructureMetadataCatalog()
);

type ElementRelationFact = ProfessionalRelationshipFactsV1[
  "comparisonFacts"
]["dayMasterElementRelation"];
type YinYangRelationFact = ProfessionalRelationshipFactsV1[
  "comparisonFacts"
]["dayMasterYinYangRelation"];
type DirectionalTenGodFacts = ProfessionalRelationshipFactsV1[
  "comparisonFacts"
]["directionalDayStemTenGods"];

export interface RelationshipImageryInteractionInputContract {
  status: "available";
  contractVersion: typeof RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION;
  relationshipContext: {
    relationshipTypeId: RelationshipType;
    label: "情感" | "工作" | "家人" | "朋友";
  };
  coreImagery: {
    kind: "human_reviewed_core_imagery";
    participants: AvailableCoreSelection["participants"];
  };
  modernImageryMetadata: {
    kind: "modern_product_metadata";
    version: typeof RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION;
    participants: [
      RelationshipImageryParticipantStructureMetadata,
      RelationshipImageryParticipantStructureMetadata
    ];
  };
  professionalRelationshipFacts: {
    kind: "traditional_computed_facts";
    schemaVersion: typeof PROFESSIONAL_RELATIONSHIP_FACTS_VERSION;
    relationshipEngineVersion: typeof PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION;
    dayMasterElementRelation: ElementRelationFact;
    dayMasterYinYangRelation: YinYangRelationFact;
    directionalDayStemTenGods: DirectionalTenGodFacts;
  };
}

export type RelationshipImageryInteractionInputSelection =
  | RelationshipImageryInteractionInputContract
  | { status: "not_available"; reason: "input_unavailable" };

const RELATIONSHIP_CONTEXTS: Record<
  RelationshipType,
  RelationshipImageryInteractionInputContract["relationshipContext"]["label"]
> = {
  partner: "情感",
  cooperation: "工作",
  family: "家人",
  friend: "朋友"
};

function isConfirmedFact<T>(
  fact: ProfessionalRelationshipFact<T>
): boolean {
  return (
    fact.certainty === "confirmed"
    && fact.ruleVersion.length > 0
    && fact.sourceRuleId.length > 0
  );
}

function selectionsMatch(
  supplied: RelationshipImageryCoreSelection,
  expected: RelationshipImageryCoreSelection
): supplied is AvailableCoreSelection {
  if (supplied.status !== "available" || expected.status !== "available") {
    return false;
  }
  return supplied.participants.every((participant, index) => {
    const expectedParticipant = expected.participants[index];
    return (
      participant.id === expectedParticipant.id
      && participant.label === expectedParticipant.label
      && participant.selectionKey === expectedParticipant.selectionKey
      && participant.entry === expectedParticipant.entry
      && participant.narrative === expectedParticipant.narrative
    );
  });
}

function participantMatchesProfessionalFacts(
  participant: RelationshipParticipantImageryCore,
  professionalFacts: ProfessionalRelationshipFactsV1
): boolean {
  const natal = professionalFacts.participants[participant.id].natalFacts;
  const required = participant.entry.requiredFacts;
  const facts = [
    [natal.dayMaster.stem, required.dayStem],
    [natal.dayMaster.element, required.dayElement],
    [natal.dayMaster.yinYang, required.dayYinYang],
    [natal.monthCommand.branch, required.monthBranch],
    [natal.monthCommand.mainStem, required.monthMainStem],
    [natal.monthCommand.mainTenGod, required.monthMainTenGod]
  ] as const;
  return (
    natal.uncertainty.monthPillarCandidates.value.length === 0
    && facts.every(([fact, expected]) => (
      fact.certainty === "confirmed" && fact.value === expected
    ))
  );
}

function professionalVersionsAreValid(
  facts: ProfessionalRelationshipFactsV1
): boolean {
  return (
    isConfirmedFact(facts.schemaVersion)
    && facts.schemaVersion.value === PROFESSIONAL_RELATIONSHIP_FACTS_VERSION
    && isConfirmedFact(facts.versions.relationshipEngineVersion)
    && facts.versions.relationshipEngineVersion.value ===
      PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION
    && isConfirmedFact(facts.versions.traditionalCatalogVersion)
    && facts.versions.traditionalCatalogVersion.value ===
      TRADITIONAL_CALENDAR_VERSION
  );
}

function catalogRuleForFact(fact: ProfessionalRelationshipFact<unknown>) {
  if (!fact.sourceRuleId.startsWith("catalog:")) return null;
  const id = fact.sourceRuleId.slice("catalog:".length);
  const rule = TRADITIONAL_RELATIONS.find(candidate => (
    candidate.id === id && candidate.isActive
  ));
  return rule && rule.version === fact.ruleVersion ? rule : null;
}

function elementRelationFactMatchesCatalog(
  fact: ElementRelationFact
): boolean {
  const rule = catalogRuleForFact(fact);
  if (!rule || rule.system !== "five_phase") return false;
  const relationByCatalogType = {
    same: "same",
    generates: "a_generates_b",
    generated_by: "b_generates_a",
    controls: "a_controls_b",
    controlled_by: "b_controls_a"
  } as const;
  const expectedRelation = relationByCatalogType[
    rule.relationType as keyof typeof relationByCatalogType
  ];
  const subjectCodes: readonly string[] = rule.subjectCodes;
  const objectCodes: readonly string[] = rule.objectCodes;
  return (
    expectedRelation === fact.value.relation
    && subjectCodes.includes(
      `phase:${ELEMENT_CODES[fact.value.personAElement]}`
    )
    && objectCodes.includes(
      `phase:${ELEMENT_CODES[fact.value.personBElement]}`
    )
  );
}

function directionalTenGodFactMatchesCatalog(
  fact: DirectionalTenGodFacts[number]
): boolean {
  const rule = catalogRuleForFact(fact);
  if (!rule || rule.relationType !== "ten_god_mapping") return false;
  const subjectCodes: readonly string[] = rule.subjectCodes;
  const objectCodes: readonly string[] = rule.objectCodes;
  return (
    subjectCodes.includes(
      `dayStem:${STEM_CODES[fact.value.referenceDayMaster]}`
    )
    && objectCodes.includes(
      `otherStem:${STEM_CODES[fact.value.observedStem]}`
    )
    && rule.attributes.tenGodName === fact.value.tenGod
  );
}

function professionalComparisonFactsMatch(
  core: AvailableCoreSelection,
  facts: ProfessionalRelationshipFactsV1
): boolean {
  const personA = core.participants[0].entry.requiredFacts;
  const personB = core.participants[1].entry.requiredFacts;
  const element = facts.comparisonFacts.dayMasterElementRelation;
  const yinYang = facts.comparisonFacts.dayMasterYinYangRelation;
  const [personATenGod, personBTenGod] =
    facts.comparisonFacts.directionalDayStemTenGods;
  return (
    isConfirmedFact(element)
    && element.value.personAElement === personA.dayElement
    && element.value.personBElement === personB.dayElement
    && elementRelationFactMatchesCatalog(element)
    && isConfirmedFact(yinYang)
    && yinYang.value.personA === personA.dayYinYang
    && yinYang.value.personB === personB.dayYinYang
    && yinYang.value.relation === (
      personA.dayYinYang === personB.dayYinYang ? "same" : "different"
    )
    && yinYang.sourceRuleId ===
      "code:professionalRelationshipFacts:dayMasterYinYangComparison"
    && yinYang.ruleVersion === PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION
    && isConfirmedFact(personATenGod)
    && personATenGod.value.perspective === "personA"
    && personATenGod.value.referenceDayMaster === personA.dayStem
    && personATenGod.value.observedStem === personB.dayStem
    && directionalTenGodFactMatchesCatalog(personATenGod)
    && isConfirmedFact(personBTenGod)
    && personBTenGod.value.perspective === "personB"
    && personBTenGod.value.referenceDayMaster === personB.dayStem
    && personBTenGod.value.observedStem === personA.dayStem
    && directionalTenGodFactMatchesCatalog(personBTenGod)
  );
}

function structureMetadata(
  participant: RelationshipParticipantImageryCore
): RelationshipImageryParticipantStructureMetadata | null {
  const approved =
    RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_CATALOG[participant.selectionKey];
  const { dayStem, monthBranch } = participant.entry.requiredFacts;
  if (
    !approved
    || approved.selectionKey !== participant.selectionKey
    || approved.dayStemFamily.dayStem !== dayStem
    || approved.dayStemFamily.value !== DAY_STEM_IMAGERY_FAMILY[dayStem]
    || approved.dayStemFamily.sourceRuleId !==
      RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.dayStemFamily
    || approved.dayStemFamily.version !==
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
    || approved.monthBranchSeason.monthBranch !== monthBranch
    || approved.monthBranchSeason.value !==
      MONTH_BRANCH_SEASON_STATE[monthBranch]
    || approved.monthBranchSeason.sourceRuleId !==
      RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.monthBranchSeason
    || approved.monthBranchSeason.version !==
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
  ) return null;
  return {
    id: participant.id,
    label: participant.label,
    ...approved
  };
}

export function buildRelationshipImageryInteractionInput(
  input: RelationshipImageryInteractionBuildInput
): RelationshipImageryInteractionInputSelection {
  if (
    input.imageryInput.status !== "available"
    || input.imageryInput.relationshipTypeId !== input.relationshipTypeId
    || input.imageryInput.relationshipType !==
      RELATIONSHIP_CONTEXTS[input.relationshipTypeId]
  ) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  const expectedCore = selectRelationshipImageryCore(input.imageryInput);
  if (!selectionsMatch(input.coreSelection, expectedCore)) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  if (
    !professionalVersionsAreValid(input.professionalFacts)
    || !input.coreSelection.participants.every(participant =>
      participantMatchesProfessionalFacts(participant, input.professionalFacts)
    )
    || !professionalComparisonFactsMatch(
      input.coreSelection,
      input.professionalFacts
    )
  ) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  const personAMetadata = structureMetadata(input.coreSelection.participants[0]);
  const personBMetadata = structureMetadata(input.coreSelection.participants[1]);
  if (!personAMetadata || !personBMetadata) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  return {
    status: "available",
    contractVersion: RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION,
    relationshipContext: {
      relationshipTypeId: input.relationshipTypeId,
      label: RELATIONSHIP_CONTEXTS[input.relationshipTypeId]
    },
    coreImagery: {
      kind: "human_reviewed_core_imagery",
      participants: input.coreSelection.participants
    },
    modernImageryMetadata: {
      kind: "modern_product_metadata",
      version: RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION,
      participants: [personAMetadata, personBMetadata]
    },
    professionalRelationshipFacts: {
      kind: "traditional_computed_facts",
      schemaVersion: PROFESSIONAL_RELATIONSHIP_FACTS_VERSION,
      relationshipEngineVersion: PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
      dayMasterElementRelation:
        input.professionalFacts.comparisonFacts.dayMasterElementRelation,
      dayMasterYinYangRelation:
        input.professionalFacts.comparisonFacts.dayMasterYinYangRelation,
      directionalDayStemTenGods:
        input.professionalFacts.comparisonFacts.directionalDayStemTenGods
    }
  };
}
