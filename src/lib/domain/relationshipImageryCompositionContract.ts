import type { RelationshipType } from "./relationshipInteractions";
import type { TenGodName } from "./baziStructure";
import type { Element, Stem } from "./elements";
import {
  PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
  PROFESSIONAL_RELATIONSHIP_FACTS_VERSION,
  type ProfessionalRelationshipFact
} from "./professionalRelationshipFacts";
import {
  RELATIONSHIP_IMAGERY_CORE_CATALOG,
  RELATIONSHIP_IMAGERY_CORE_CONTENT_VERSION
} from "./relationshipImageryCoreNarratives";
import {
  RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION,
  type RelationshipImageryInteractionInputContract,
  type RelationshipImageryInteractionInputSelection
} from "./relationshipImageryInteractionInput";
import {
  TRADITIONAL_RELATIONS
} from "../knowledge/traditionalCalendarCatalog";

export const RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION =
  "relationship-imagery-composition-contract-v1" as const;

const DETERMINISTIC_PROHIBITED_NARRATIVE_TERMS = [
  "匹配度",
  "正缘",
  "孽缘",
  "必合",
  "必分",
  "注定",
  "默认正文",
  "近似替代",
  "AI补写"
] as const;

export type ProfessionalInteractionSkeletonId =
  | "same_same_bijian_bijian"
  | "same_different_jiecai_jiecai"
  | "a_generates_b_same_shishen_pianyin"
  | "a_generates_b_different_shangguan_zhengyin"
  | "a_controls_b_same_piancai_qisha"
  | "a_controls_b_different_zhengcai_zhengguan"
  | "b_controls_a_same_qisha_piancai"
  | "b_controls_a_different_zhengguan_zhengcai"
  | "b_generates_a_same_pianyin_shishen"
  | "b_generates_a_different_zhengyin_shangguan";

export interface InteractionAttributeValues {
  attentionFocus: string;
  movementMode: string;
  rhythmPattern: string;
  conditionResponse: string;
}

export interface InteractionAttributeVocabulary {
  contractVersion: typeof RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION;
  catalogVersion: string;
  vocabularyVersion: string;
  values: {
    attentionFocus: readonly string[];
    movementMode: readonly string[];
    rhythmPattern: readonly string[];
    conditionResponse: readonly string[];
  };
}

export interface InteractionAttributeSelectionReasons {
  attentionFocus: string;
  movementMode: string;
  rhythmPattern: string;
  conditionResponse: string;
}

export interface InteractionAttributeRecord {
  selectionKey: string;
  coreEntryId: string;
  coreContentVersion: string;
  attributeCatalogVersion: string;
  recordVersion: string;
  contractVersion: typeof RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION;
  vocabularyVersion: string;
  attributes: InteractionAttributeValues;
  selectionReasons: InteractionAttributeSelectionReasons;
  reviewStatus: "human_reviewed_approved";
}

export interface InteractionModuleBase {
  id: string;
  contentVersion: string;
  contractVersion: typeof RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION;
  vocabularyVersion: string;
  relationshipTypeId: RelationshipType;
  personAAttributeSignature: string;
  personBAttributeSignature: string;
  narrative: string;
  reviewStatus: "human_reviewed_approved";
}

export interface CommonalityInteractionModule extends InteractionModuleBase {
  kind: "commonality";
}

export interface DifferenceInteractionModule extends InteractionModuleBase {
  kind: "difference";
}

export interface InteractionStateModule extends InteractionModuleBase {
  kind: "interaction_state";
  professionalSkeletonId: ProfessionalInteractionSkeletonId;
}

export type RelationshipInteractionModule =
  | CommonalityInteractionModule
  | DifferenceInteractionModule
  | InteractionStateModule;

export interface CompositionModuleReference {
  id: string;
  contentVersion: string;
}

export interface InteractionCompositionApproval {
  id: string;
  compositionVersion: string;
  contractVersion: typeof RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION;
  vocabularyVersion: string;
  compositionSignature: string;
  relationshipTypeId: RelationshipType;
  personAAttributeSignature: string;
  personBAttributeSignature: string;
  professionalSkeletonId: ProfessionalInteractionSkeletonId;
  modules: {
    commonality: CompositionModuleReference;
    difference: CompositionModuleReference;
    interactionState: CompositionModuleReference;
  };
  paragraphOrder: readonly [
    "commonality",
    "difference",
    "interaction_state"
  ];
  reviewStatus: "human_reviewed_approved";
}

export type ProfessionalSkeletonSelection =
  | {
      certainty: "confirmed";
      id: ProfessionalInteractionSkeletonId;
    }
  | { certainty: "uncertain" };

export interface RelationshipImageryCompositionPublicCatalogs {
  publicModules: readonly RelationshipInteractionModule[];
  publicCompositions: readonly InteractionCompositionApproval[];
}

export interface RelationshipImageryCompositionApprovedSources {
  privateApprovedVocabulary: InteractionAttributeVocabulary;
  privateApprovedAttributeRecords: readonly InteractionAttributeRecord[];
  privateApprovedModules: readonly RelationshipInteractionModule[];
  privateApprovedCompositions: readonly InteractionCompositionApproval[];
}

export interface RelationshipImageryCompositionInput {
  relationshipTypeId: RelationshipType;
  interactionInput: RelationshipImageryInteractionInputSelection;
  publicAttributeRecords: readonly InteractionAttributeRecord[];
  vocabulary: InteractionAttributeVocabulary;
  professionalSkeleton: ProfessionalSkeletonSelection;
  catalogs: RelationshipImageryCompositionPublicCatalogs;
}

export type RelationshipImageryCompositionSelection =
  | {
      status: "available";
      personAAttributeSignature: string;
      personBAttributeSignature: string;
      orderedAttributeSignature: string;
      compositionSignature: string;
      modules: {
        commonality: CommonalityInteractionModule;
        difference: DifferenceInteractionModule;
        interactionState: InteractionStateModule;
      };
      composition: InteractionCompositionApproval;
    }
  | { status: "not_available"; reason: "input_unavailable" };

function hasUniqueNonEmptyValues(values: readonly string[]): boolean {
  return (
    values.length > 0
    && values.every(value => value.trim().length > 0)
    && new Set(values).size === values.length
  );
}

function vocabularyIsValid(
  vocabulary: InteractionAttributeVocabulary,
  privateApprovedVocabulary: InteractionAttributeVocabulary
): boolean {
  return (
    JSON.stringify(vocabulary) === JSON.stringify(privateApprovedVocabulary)
    && vocabulary.contractVersion ===
      RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION
    && vocabulary.catalogVersion.trim().length > 0
    && vocabulary.vocabularyVersion.trim().length > 0
    && hasUniqueNonEmptyValues(vocabulary.values.attentionFocus)
    && hasUniqueNonEmptyValues(vocabulary.values.movementMode)
    && hasUniqueNonEmptyValues(vocabulary.values.rhythmPattern)
    && hasUniqueNonEmptyValues(vocabulary.values.conditionResponse)
  );
}

function attributesUseVocabulary(
  attributes: InteractionAttributeValues,
  vocabulary: InteractionAttributeVocabulary
): boolean {
  return (
    vocabulary.values.attentionFocus.includes(attributes.attentionFocus)
    && vocabulary.values.movementMode.includes(attributes.movementMode)
    && vocabulary.values.rhythmPattern.includes(attributes.rhythmPattern)
    && vocabulary.values.conditionResponse.includes(attributes.conditionResponse)
  );
}

function attributeRecordsMatch(
  publicRecord: InteractionAttributeRecord,
  privateApprovedRecord: InteractionAttributeRecord
): boolean {
  return (
    publicRecord.selectionKey === privateApprovedRecord.selectionKey
    && publicRecord.coreEntryId === privateApprovedRecord.coreEntryId
    && publicRecord.coreContentVersion ===
      privateApprovedRecord.coreContentVersion
    && publicRecord.attributeCatalogVersion ===
      privateApprovedRecord.attributeCatalogVersion
    && publicRecord.recordVersion === privateApprovedRecord.recordVersion
    && publicRecord.contractVersion === privateApprovedRecord.contractVersion
    && publicRecord.vocabularyVersion ===
      privateApprovedRecord.vocabularyVersion
    && publicRecord.attributes.attentionFocus ===
      privateApprovedRecord.attributes.attentionFocus
    && publicRecord.attributes.movementMode ===
      privateApprovedRecord.attributes.movementMode
    && publicRecord.attributes.rhythmPattern ===
      privateApprovedRecord.attributes.rhythmPattern
    && publicRecord.attributes.conditionResponse ===
      privateApprovedRecord.attributes.conditionResponse
    && publicRecord.selectionReasons.attentionFocus ===
      privateApprovedRecord.selectionReasons.attentionFocus
    && publicRecord.selectionReasons.movementMode ===
      privateApprovedRecord.selectionReasons.movementMode
    && publicRecord.selectionReasons.rhythmPattern ===
      privateApprovedRecord.selectionReasons.rhythmPattern
    && publicRecord.selectionReasons.conditionResponse ===
      privateApprovedRecord.selectionReasons.conditionResponse
    && publicRecord.reviewStatus === privateApprovedRecord.reviewStatus
  );
}

function attributeRecordIsAvailable(
  publicRecord: InteractionAttributeRecord,
  privateApprovedRecord: InteractionAttributeRecord,
  vocabulary: InteractionAttributeVocabulary
): boolean {
  return (
    attributeRecordsMatch(publicRecord, privateApprovedRecord)
    && publicRecord.contractVersion ===
      RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION
    && publicRecord.vocabularyVersion === vocabulary.vocabularyVersion
    && publicRecord.selectionKey.trim().length > 0
    && publicRecord.coreEntryId.trim().length > 0
    && publicRecord.coreContentVersion.trim().length > 0
    && publicRecord.attributeCatalogVersion === vocabulary.catalogVersion
    && publicRecord.recordVersion.trim().length > 0
    && publicRecord.reviewStatus === "human_reviewed_approved"
    && Object.values(publicRecord.selectionReasons).every(reason =>
      reason.trim().length > 0
    )
    && attributesUseVocabulary(publicRecord.attributes, vocabulary)
  );
}

function selectApprovedAttributeRecord(input: {
  selectionKey: string;
  coreEntryId: string;
  publicRecords: readonly InteractionAttributeRecord[];
  privateApprovedRecords: readonly InteractionAttributeRecord[];
  vocabulary: InteractionAttributeVocabulary;
}): InteractionAttributeRecord | null {
  const publicMatches = input.publicRecords.filter(record =>
    record.selectionKey === input.selectionKey
  );
  const privateMatches = input.privateApprovedRecords.filter(record =>
    record.selectionKey === input.selectionKey
  );
  if (publicMatches.length !== 1 || privateMatches.length !== 1) return null;
  const publicRecord = publicMatches[0];
  const privateRecord = privateMatches[0];
  return (
    publicRecord.coreEntryId === input.coreEntryId
    && publicRecord.coreContentVersion ===
      RELATIONSHIP_IMAGERY_CORE_CONTENT_VERSION
    && attributeRecordIsAvailable(
      publicRecord,
      privateRecord,
      input.vocabulary
    )
  ) ? publicRecord : null;
}

const ELEMENT_CODES = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water"
} as const satisfies Record<Element, string>;

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

const PROFESSIONAL_SKELETONS = {
  "same|same": {
    id: "same_same_bijian_bijian",
    personATenGod: "比肩",
    personBTenGod: "比肩"
  },
  "same|different": {
    id: "same_different_jiecai_jiecai",
    personATenGod: "劫财",
    personBTenGod: "劫财"
  },
  "a_generates_b|same": {
    id: "a_generates_b_same_shishen_pianyin",
    personATenGod: "食神",
    personBTenGod: "偏印"
  },
  "a_generates_b|different": {
    id: "a_generates_b_different_shangguan_zhengyin",
    personATenGod: "伤官",
    personBTenGod: "正印"
  },
  "a_controls_b|same": {
    id: "a_controls_b_same_piancai_qisha",
    personATenGod: "偏财",
    personBTenGod: "七杀"
  },
  "a_controls_b|different": {
    id: "a_controls_b_different_zhengcai_zhengguan",
    personATenGod: "正财",
    personBTenGod: "正官"
  },
  "b_controls_a|same": {
    id: "b_controls_a_same_qisha_piancai",
    personATenGod: "七杀",
    personBTenGod: "偏财"
  },
  "b_controls_a|different": {
    id: "b_controls_a_different_zhengguan_zhengcai",
    personATenGod: "正官",
    personBTenGod: "正财"
  },
  "b_generates_a|same": {
    id: "b_generates_a_same_pianyin_shishen",
    personATenGod: "偏印",
    personBTenGod: "食神"
  },
  "b_generates_a|different": {
    id: "b_generates_a_different_zhengyin_shangguan",
    personATenGod: "正印",
    personBTenGod: "伤官"
  }
} as const satisfies Record<string, {
  id: ProfessionalInteractionSkeletonId;
  personATenGod: TenGodName;
  personBTenGod: TenGodName;
}>;

function confirmedFact<T>(fact: ProfessionalRelationshipFact<T>): boolean {
  return (
    fact.certainty === "confirmed"
    && fact.sourceRuleId.length > 0
    && fact.ruleVersion.length > 0
  );
}

function catalogRuleForFact(fact: ProfessionalRelationshipFact<unknown>) {
  if (!fact.sourceRuleId.startsWith("catalog:")) return null;
  const ruleId = fact.sourceRuleId.slice("catalog:".length);
  const rule = TRADITIONAL_RELATIONS.find(candidate =>
    candidate.id === ruleId && candidate.isActive
  );
  return rule?.version === fact.ruleVersion ? rule : null;
}

function elementFactMatchesCatalog(
  fact: RelationshipImageryInteractionInputContract[
    "professionalRelationshipFacts"
  ]["dayMasterElementRelation"]
): boolean {
  const rule = catalogRuleForFact(fact);
  const relationByCatalogType = {
    same: "same",
    generates: "a_generates_b",
    generated_by: "b_generates_a",
    controls: "a_controls_b",
    controlled_by: "b_controls_a"
  } as const;
  const expectedRelation = rule && relationByCatalogType[
    rule.relationType as keyof typeof relationByCatalogType
  ];
  const subjectCodes: readonly string[] = rule?.subjectCodes ?? [];
  const objectCodes: readonly string[] = rule?.objectCodes ?? [];
  return Boolean(
    rule
    && rule.system === "five_phase"
    && expectedRelation === fact.value.relation
    && subjectCodes.includes(
      `phase:${ELEMENT_CODES[fact.value.personAElement]}`
    )
    && objectCodes.includes(
      `phase:${ELEMENT_CODES[fact.value.personBElement]}`
    )
  );
}

function tenGodFactMatchesCatalog(
  fact: RelationshipImageryInteractionInputContract[
    "professionalRelationshipFacts"
  ]["directionalDayStemTenGods"][number]
): boolean {
  const rule = catalogRuleForFact(fact);
  const subjectCodes: readonly string[] = rule?.subjectCodes ?? [];
  const objectCodes: readonly string[] = rule?.objectCodes ?? [];
  return Boolean(
    rule
    && rule.relationType === "ten_god_mapping"
    && subjectCodes.includes(
      `dayStem:${STEM_CODES[fact.value.referenceDayMaster]}`
    )
    && objectCodes.includes(
      `otherStem:${STEM_CODES[fact.value.observedStem]}`
    )
    && rule.attributes.tenGodName === fact.value.tenGod
  );
}

function deriveProfessionalSkeleton(
  interactionInput: RelationshipImageryInteractionInputSelection,
  relationshipTypeId: RelationshipType
): ProfessionalInteractionSkeletonId | null {
  if (
    interactionInput.status !== "available"
    || interactionInput.contractVersion !==
      RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION
    || interactionInput.relationshipContext.relationshipTypeId !==
      relationshipTypeId
    || interactionInput.professionalRelationshipFacts.schemaVersion !==
      PROFESSIONAL_RELATIONSHIP_FACTS_VERSION
    || interactionInput.professionalRelationshipFacts
      .relationshipEngineVersion !== PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION
  ) return null;
  const [personA, personB] = interactionInput.coreImagery.participants;
  const approvedA = RELATIONSHIP_IMAGERY_CORE_CATALOG[personA.selectionKey];
  const approvedB = RELATIONSHIP_IMAGERY_CORE_CATALOG[personB.selectionKey];
  if (
    personA.id !== "personA"
    || personB.id !== "personB"
    || personA.entry !== approvedA
    || personB.entry !== approvedB
  ) return null;
  const professional = interactionInput.professionalRelationshipFacts;
  const element = professional.dayMasterElementRelation;
  const yinYang = professional.dayMasterYinYangRelation;
  const [personATenGod, personBTenGod] = professional.directionalDayStemTenGods;
  if (
    !confirmedFact(element)
    || !elementFactMatchesCatalog(element)
    || element.value.personAElement !== approvedA.requiredFacts.dayElement
    || element.value.personBElement !== approvedB.requiredFacts.dayElement
    || !confirmedFact(yinYang)
    || yinYang.value.personA !== approvedA.requiredFacts.dayYinYang
    || yinYang.value.personB !== approvedB.requiredFacts.dayYinYang
    || yinYang.value.relation !== (
      approvedA.requiredFacts.dayYinYang === approvedB.requiredFacts.dayYinYang
        ? "same"
        : "different"
    )
    || yinYang.sourceRuleId !==
      "code:professionalRelationshipFacts:dayMasterYinYangComparison"
    || yinYang.ruleVersion !== PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION
    || !confirmedFact(personATenGod)
    || personATenGod.value.perspective !== "personA"
    || personATenGod.value.referenceDayMaster !==
      approvedA.requiredFacts.dayStem
    || personATenGod.value.observedStem !== approvedB.requiredFacts.dayStem
    || !tenGodFactMatchesCatalog(personATenGod)
    || !confirmedFact(personBTenGod)
    || personBTenGod.value.perspective !== "personB"
    || personBTenGod.value.referenceDayMaster !==
      approvedB.requiredFacts.dayStem
    || personBTenGod.value.observedStem !== approvedA.requiredFacts.dayStem
    || !tenGodFactMatchesCatalog(personBTenGod)
  ) return null;
  const skeletonKey = (
    `${element.value.relation}|${yinYang.value.relation}`
  ) as keyof typeof PROFESSIONAL_SKELETONS;
  const skeleton = PROFESSIONAL_SKELETONS[skeletonKey];
  if (
    !skeleton
    || personATenGod.value.tenGod !== skeleton.personATenGod
    || personBTenGod.value.tenGod !== skeleton.personBTenGod
  ) return null;
  return skeleton.id;
}

export function normalizeInteractionAttributeSignature(
  record: InteractionAttributeRecord
): string {
  return JSON.stringify([
    "interaction_attributes",
    record.contractVersion,
    record.vocabularyVersion,
    record.attributes.attentionFocus,
    record.attributes.movementMode,
    record.attributes.rhythmPattern,
    record.attributes.conditionResponse
  ]);
}

export function normalizeOrderedInteractionAttributeSignature(
  personAAttributeSignature: string,
  personBAttributeSignature: string
): string {
  return JSON.stringify([
    "ordered_participants",
    ["personA", personAAttributeSignature],
    ["personB", personBAttributeSignature]
  ]);
}

function moduleRecordsMatch(
  publicModule: RelationshipInteractionModule,
  privateApprovedModule: RelationshipInteractionModule
): boolean {
  return JSON.stringify(publicModule) === JSON.stringify(privateApprovedModule);
}

function moduleBaseMatches(
  module: RelationshipInteractionModule,
  relationshipTypeId: RelationshipType,
  personAAttributeSignature: string,
  personBAttributeSignature: string,
  vocabularyVersion: string
): boolean {
  return (
    module.contractVersion ===
      RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION
    && module.vocabularyVersion === vocabularyVersion
    && module.relationshipTypeId === relationshipTypeId
    && module.personAAttributeSignature === personAAttributeSignature
    && module.personBAttributeSignature === personBAttributeSignature
    && module.id.trim().length > 0
    && module.contentVersion.trim().length > 0
    && module.narrative.trim().length > 0
    && DETERMINISTIC_PROHIBITED_NARRATIVE_TERMS.every(term =>
      !module.narrative.includes(term)
    )
    && module.reviewStatus === "human_reviewed_approved"
  );
}

function uniqueApprovedModule<T extends RelationshipInteractionModule>(
  publicModules: readonly RelationshipInteractionModule[],
  privateApprovedModules: readonly RelationshipInteractionModule[],
  predicate: (module: RelationshipInteractionModule) => module is T
): T | null {
  const matches = publicModules.filter(predicate);
  if (matches.length !== 1) return null;
  const publicModule = matches[0];
  const privateMatches = privateApprovedModules.filter(module =>
    module.id === publicModule.id
    && module.contentVersion === publicModule.contentVersion
  );
  if (
    privateMatches.length !== 1
    || !moduleRecordsMatch(publicModule, privateMatches[0])
  ) return null;
  return publicModule;
}

export function selectUniqueCommonalityModule(input: {
  relationshipTypeId: RelationshipType;
  personAAttributeSignature: string;
  personBAttributeSignature: string;
  vocabularyVersion: string;
  publicModules: readonly RelationshipInteractionModule[];
  privateApprovedModules: readonly RelationshipInteractionModule[];
}): CommonalityInteractionModule | null {
  return uniqueApprovedModule(
    input.publicModules,
    input.privateApprovedModules,
    (module): module is CommonalityInteractionModule => (
      module.kind === "commonality"
      && moduleBaseMatches(
        module,
        input.relationshipTypeId,
        input.personAAttributeSignature,
        input.personBAttributeSignature,
        input.vocabularyVersion
      )
    )
  );
}

export function selectUniqueDifferenceModule(input: {
  relationshipTypeId: RelationshipType;
  personAAttributeSignature: string;
  personBAttributeSignature: string;
  vocabularyVersion: string;
  publicModules: readonly RelationshipInteractionModule[];
  privateApprovedModules: readonly RelationshipInteractionModule[];
}): DifferenceInteractionModule | null {
  return uniqueApprovedModule(
    input.publicModules,
    input.privateApprovedModules,
    (module): module is DifferenceInteractionModule => (
      module.kind === "difference"
      && moduleBaseMatches(
        module,
        input.relationshipTypeId,
        input.personAAttributeSignature,
        input.personBAttributeSignature,
        input.vocabularyVersion
      )
    )
  );
}

export function selectUniqueInteractionStateModule(input: {
  relationshipTypeId: RelationshipType;
  personAAttributeSignature: string;
  personBAttributeSignature: string;
  vocabularyVersion: string;
  professionalSkeletonId: ProfessionalInteractionSkeletonId;
  publicModules: readonly RelationshipInteractionModule[];
  privateApprovedModules: readonly RelationshipInteractionModule[];
}): InteractionStateModule | null {
  return uniqueApprovedModule(
    input.publicModules,
    input.privateApprovedModules,
    (module): module is InteractionStateModule => (
      module.kind === "interaction_state"
      && module.professionalSkeletonId === input.professionalSkeletonId
      && moduleBaseMatches(
        module,
        input.relationshipTypeId,
        input.personAAttributeSignature,
        input.personBAttributeSignature,
        input.vocabularyVersion
      )
    )
  );
}

export function normalizeInteractionCompositionSignature(input: {
  contractVersion: typeof RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION;
  vocabularyVersion: string;
  relationshipTypeId: RelationshipType;
  personAAttributeSignature: string;
  personBAttributeSignature: string;
  professionalSkeletonId: ProfessionalInteractionSkeletonId;
  commonality: CompositionModuleReference;
  difference: CompositionModuleReference;
  interactionState: CompositionModuleReference;
}): string {
  return JSON.stringify([
    "interaction_composition",
    input.contractVersion,
    input.vocabularyVersion,
    input.relationshipTypeId,
    ["personA", input.personAAttributeSignature],
    ["personB", input.personBAttributeSignature],
    input.professionalSkeletonId,
    ["commonality", input.commonality.id, input.commonality.contentVersion],
    ["difference", input.difference.id, input.difference.contentVersion],
    [
      "interaction_state",
      input.interactionState.id,
      input.interactionState.contentVersion
    ]
  ]);
}

function compositionRecordsMatch(
  publicComposition: InteractionCompositionApproval,
  privateApprovedComposition: InteractionCompositionApproval
): boolean {
  return JSON.stringify(publicComposition) ===
    JSON.stringify(privateApprovedComposition);
}

function moduleReference(
  module: RelationshipInteractionModule
): CompositionModuleReference {
  return { id: module.id, contentVersion: module.contentVersion };
}

function selectUniqueComposition(input: {
  compositionSignature: string;
  publicCompositions: readonly InteractionCompositionApproval[];
  privateApprovedCompositions: readonly InteractionCompositionApproval[];
}): InteractionCompositionApproval | null {
  const matches = input.publicCompositions.filter(composition =>
    composition.compositionSignature === input.compositionSignature
  );
  if (matches.length !== 1) return null;
  const publicComposition = matches[0];
  const privateMatches = input.privateApprovedCompositions.filter(
    composition => (
      composition.id === publicComposition.id
      && composition.compositionVersion ===
        publicComposition.compositionVersion
    )
  );
  if (
    privateMatches.length !== 1
    || !compositionRecordsMatch(publicComposition, privateMatches[0])
  ) return null;
  return publicComposition;
}

function selectRelationshipImageryCompositionFromApprovedSources(
  input: RelationshipImageryCompositionInput,
  approvedSources: RelationshipImageryCompositionApprovedSources
): RelationshipImageryCompositionSelection {
  const derivedSkeleton = deriveProfessionalSkeleton(
    input.interactionInput,
    input.relationshipTypeId
  );
  if (
    !vocabularyIsValid(
      input.vocabulary,
      approvedSources.privateApprovedVocabulary
    )
    || !derivedSkeleton
    || input.professionalSkeleton.certainty !== "confirmed"
    || input.professionalSkeleton.id !== derivedSkeleton
    || input.interactionInput.status !== "available"
  ) {
    return { status: "not_available", reason: "input_unavailable" };
  }

  const [personACore, personBCore] = input.interactionInput
    .coreImagery.participants;
  const personARecord = selectApprovedAttributeRecord({
    selectionKey: personACore.selectionKey,
    coreEntryId: personACore.entry.id,
    publicRecords: input.publicAttributeRecords,
    privateApprovedRecords: approvedSources.privateApprovedAttributeRecords,
    vocabulary: input.vocabulary
  });
  const personBRecord = selectApprovedAttributeRecord({
    selectionKey: personBCore.selectionKey,
    coreEntryId: personBCore.entry.id,
    publicRecords: input.publicAttributeRecords,
    privateApprovedRecords: approvedSources.privateApprovedAttributeRecords,
    vocabulary: input.vocabulary
  });
  if (!personARecord || !personBRecord) {
    return { status: "not_available", reason: "input_unavailable" };
  }

  const personAAttributeSignature = normalizeInteractionAttributeSignature(
    personARecord
  );
  const personBAttributeSignature = normalizeInteractionAttributeSignature(
    personBRecord
  );
  const moduleInput = {
    relationshipTypeId: input.relationshipTypeId,
    personAAttributeSignature,
    personBAttributeSignature,
    vocabularyVersion: input.vocabulary.vocabularyVersion,
    publicModules: input.catalogs.publicModules,
    privateApprovedModules: approvedSources.privateApprovedModules
  };
  const commonality = selectUniqueCommonalityModule(moduleInput);
  const difference = selectUniqueDifferenceModule(moduleInput);
  const interactionState = selectUniqueInteractionStateModule({
    ...moduleInput,
    professionalSkeletonId: derivedSkeleton
  });
  if (!commonality || !difference || !interactionState) {
    return { status: "not_available", reason: "input_unavailable" };
  }

  const orderedAttributeSignature =
    normalizeOrderedInteractionAttributeSignature(
      personAAttributeSignature,
      personBAttributeSignature
    );
  const compositionSignature = normalizeInteractionCompositionSignature({
    contractVersion: RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION,
    vocabularyVersion: input.vocabulary.vocabularyVersion,
    relationshipTypeId: input.relationshipTypeId,
    personAAttributeSignature,
    personBAttributeSignature,
    professionalSkeletonId: derivedSkeleton,
    commonality: moduleReference(commonality),
    difference: moduleReference(difference),
    interactionState: moduleReference(interactionState)
  });
  const composition = selectUniqueComposition({
    compositionSignature,
    publicCompositions: input.catalogs.publicCompositions,
    privateApprovedCompositions:
      approvedSources.privateApprovedCompositions
  });
  if (
    !composition
    || composition.contractVersion !==
      RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION
    || composition.vocabularyVersion !== input.vocabulary.vocabularyVersion
    || composition.relationshipTypeId !== input.relationshipTypeId
    || composition.personAAttributeSignature !== personAAttributeSignature
    || composition.personBAttributeSignature !== personBAttributeSignature
    || composition.professionalSkeletonId !== derivedSkeleton
    || composition.reviewStatus !== "human_reviewed_approved"
    || JSON.stringify(composition.modules) !== JSON.stringify({
      commonality: moduleReference(commonality),
      difference: moduleReference(difference),
      interactionState: moduleReference(interactionState)
    })
    || JSON.stringify(composition.paragraphOrder) !== JSON.stringify([
      "commonality",
      "difference",
      "interaction_state"
    ])
  ) {
    return { status: "not_available", reason: "input_unavailable" };
  }

  return {
    status: "available",
    personAAttributeSignature,
    personBAttributeSignature,
    orderedAttributeSignature,
    compositionSignature,
    modules: { commonality, difference, interactionState },
    composition
  };
}

export function createRelationshipImageryCompositionValidator(
  approvedSources: RelationshipImageryCompositionApprovedSources
): (
  input: RelationshipImageryCompositionInput
) => RelationshipImageryCompositionSelection {
  const trustedApprovedSources = JSON.parse(
    JSON.stringify(approvedSources)
  ) as RelationshipImageryCompositionApprovedSources;
  return input => selectRelationshipImageryCompositionFromApprovedSources(
    input,
    trustedApprovedSources
  );
}
