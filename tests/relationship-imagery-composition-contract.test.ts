import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";
import { buildProfessionalRelationshipFactsV1 } from
  "@/lib/domain/professionalRelationshipFacts";
import { selectRelationshipImageryCore } from
  "@/lib/domain/relationshipImageryCoreNarratives";
import { buildRelationshipImageryInteractionInput } from
  "@/lib/domain/relationshipImageryInteractionInput";
import { buildRelationshipImageryInput } from
  "@/lib/domain/relationshipMainlineFoundation";
import {
  RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION,
  createRelationshipImageryCompositionValidator,
  normalizeInteractionAttributeSignature,
  normalizeInteractionCompositionSignature,
  normalizeOrderedInteractionAttributeSignature,
  selectUniqueCommonalityModule,
  selectUniqueDifferenceModule,
  selectUniqueInteractionStateModule,
  type CommonalityInteractionModule,
  type DifferenceInteractionModule,
  type InteractionAttributeRecord,
  type InteractionAttributeVocabulary,
  type InteractionCompositionApproval,
  type InteractionStateModule,
  type ProfessionalInteractionSkeletonId,
  type RelationshipImageryCompositionApprovedSources,
  type RelationshipImageryCompositionInput,
  type RelationshipInteractionModule
} from "@/lib/domain/relationshipImageryCompositionContract";

const CALCULATED_AT = new Date("2026-08-05T04:00:00.000Z");
const ATTRIBUTE_CATALOG_VERSION = "fictional-attribute-catalog-v1";

const VOCABULARY: InteractionAttributeVocabulary = {
  contractVersion: RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION,
  catalogVersion: ATTRIBUTE_CATALOG_VERSION,
  vocabularyVersion: "fictional-vocabulary-v1",
  values: {
    attentionFocus: ["虚构整体", "虚构细节"],
    movementMode: ["虚构展开", "虚构收拢"],
    rhythmPattern: ["虚构持续", "虚构校准"],
    conditionResponse: ["虚构守向", "虚构排序"]
  }
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fictionalFacts(birthDate: string) {
  const chart = computeBazi({
    gender: "other",
    birthDate,
    birthTime: "12:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false
  });
  return buildProfessionalBaziFactsOnServer(chart, CALCULATED_AT)
    .professionalFacts;
}

function interactionInput(
  personABirthDate = "1980-06-12",
  personBBirthDate = "1980-01-01"
) {
  const professionalFacts = buildProfessionalRelationshipFactsV1(
    {
      facts: fictionalFacts(personABirthDate),
      timezoneBasis: "provided"
    },
    {
      facts: fictionalFacts(personBBirthDate),
      timezoneBasis: "provided"
    },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
  const imageryInput = buildRelationshipImageryInput(
    professionalFacts,
    "cooperation"
  );
  const coreSelection = selectRelationshipImageryCore(imageryInput);
  const selected = buildRelationshipImageryInteractionInput({
    relationshipTypeId: "cooperation",
    imageryInput,
    coreSelection,
    professionalFacts
  });
  if (selected.status !== "available") {
    throw new Error("fictional interaction fixture must be available");
  }
  return selected;
}

function attributeRecord(
  participant: ReturnType<typeof interactionInput>["coreImagery"][
    "participants"
  ][number],
  side: "a" | "b"
): InteractionAttributeRecord {
  return {
    selectionKey: participant.selectionKey,
    coreEntryId: participant.entry.id,
    coreContentVersion: participant.entry.contentVersion,
    attributeCatalogVersion: ATTRIBUTE_CATALOG_VERSION,
    recordVersion: `fictional-record-${side}-v1`,
    contractVersion: RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION,
    vocabularyVersion: VOCABULARY.vocabularyVersion,
    attributes: side === "a" ? {
      attentionFocus: "虚构整体",
      movementMode: "虚构展开",
      rhythmPattern: "虚构持续",
      conditionResponse: "虚构守向"
    } : {
      attentionFocus: "虚构细节",
      movementMode: "虚构收拢",
      rhythmPattern: "虚构校准",
      conditionResponse: "虚构排序"
    },
    selectionReasons: {
      attentionFocus: `虚构${side}关注理由`,
      movementMode: `虚构${side}运动理由`,
      rhythmPattern: `虚构${side}节奏理由`,
      conditionResponse: `虚构${side}条件理由`
    },
    reviewStatus: "human_reviewed_approved"
  };
}

function moduleCatalogs(
  personAAttributeSignature: string,
  personBAttributeSignature: string,
  skeletonId: ProfessionalInteractionSkeletonId
) {
  const base = {
    contractVersion: RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION,
    vocabularyVersion: VOCABULARY.vocabularyVersion,
    relationshipTypeId: "cooperation" as const,
    personAAttributeSignature,
    personBAttributeSignature,
    reviewStatus: "human_reviewed_approved" as const
  };
  const commonality: CommonalityInteractionModule = {
    ...base,
    id: "fictional-commonality-v1",
    contentVersion: "fictional-content-v1",
    kind: "commonality",
    narrative: "虚构相通模块。"
  };
  const difference: DifferenceInteractionModule = {
    ...base,
    id: "fictional-difference-v1",
    contentVersion: "fictional-content-v1",
    kind: "difference",
    narrative: "虚构差异模块。"
  };
  const interactionState: InteractionStateModule = {
    ...base,
    id: "fictional-interaction-state-v1",
    contentVersion: "fictional-content-v1",
    kind: "interaction_state",
    professionalSkeletonId: skeletonId,
    narrative: "虚构互动状态模块。"
  };
  return { commonality, difference, interactionState };
}

function approvedComposition(
  modules: ReturnType<typeof moduleCatalogs>,
  personAAttributeSignature: string,
  personBAttributeSignature: string,
  skeletonId: ProfessionalInteractionSkeletonId
): InteractionCompositionApproval {
  const moduleReferences = {
    commonality: {
      id: modules.commonality.id,
      contentVersion: modules.commonality.contentVersion
    },
    difference: {
      id: modules.difference.id,
      contentVersion: modules.difference.contentVersion
    },
    interactionState: {
      id: modules.interactionState.id,
      contentVersion: modules.interactionState.contentVersion
    }
  };
  return {
    id: "fictional-composition-v1",
    compositionVersion: "fictional-composition-content-v1",
    contractVersion: RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION,
    vocabularyVersion: VOCABULARY.vocabularyVersion,
    compositionSignature: normalizeInteractionCompositionSignature({
      contractVersion: RELATIONSHIP_IMAGERY_COMPOSITION_CONTRACT_VERSION,
      vocabularyVersion: VOCABULARY.vocabularyVersion,
      relationshipTypeId: "cooperation",
      personAAttributeSignature,
      personBAttributeSignature,
      professionalSkeletonId: skeletonId,
      ...moduleReferences
    }),
    relationshipTypeId: "cooperation",
    personAAttributeSignature,
    personBAttributeSignature,
    professionalSkeletonId: skeletonId,
    modules: moduleReferences,
    paragraphOrder: ["commonality", "difference", "interaction_state"],
    reviewStatus: "human_reviewed_approved"
  };
}

function availableFixture(
  personABirthDate = "1980-06-12",
  personBBirthDate = "1980-01-01",
  skeletonId: ProfessionalInteractionSkeletonId =
    "b_controls_a_different_zhengguan_zhengcai"
) {
  const interaction = interactionInput(personABirthDate, personBBirthDate);
  const personA = attributeRecord(
    interaction.coreImagery.participants[0],
    interaction.coreImagery.participants[0].selectionKey === "丙-午" ? "a" : "b"
  );
  const personB = attributeRecord(
    interaction.coreImagery.participants[1],
    interaction.coreImagery.participants[1].selectionKey === "丙-午" ? "a" : "b"
  );
  const personASignature = normalizeInteractionAttributeSignature(personA);
  const personBSignature = normalizeInteractionAttributeSignature(personB);
  const modules = moduleCatalogs(personASignature, personBSignature, skeletonId);
  const composition = approvedComposition(
    modules,
    personASignature,
    personBSignature,
    skeletonId
  );
  const approvedSources: RelationshipImageryCompositionApprovedSources = {
    privateApprovedVocabulary: clone(VOCABULARY),
    privateApprovedAttributeRecords: [clone(personA), clone(personB)],
    privateApprovedModules: clone(Object.values(modules)),
    privateApprovedCompositions: [clone(composition)]
  };
  const input: RelationshipImageryCompositionInput = {
    relationshipTypeId: "cooperation",
    interactionInput: interaction,
    publicAttributeRecords: [clone(personA), clone(personB)],
    vocabulary: clone(VOCABULARY),
    professionalSkeleton: { certainty: "confirmed", id: skeletonId },
    catalogs: {
      publicModules: clone(Object.values(modules)),
      publicCompositions: [clone(composition)]
    }
  };
  return {
    input,
    approvedSources,
    validate: createRelationshipImageryCompositionValidator(approvedSources)
  };
}

describe("relationship imagery composition contract", () => {
  it("selects one exact approved three-module composition", () => {
    const fixture = availableFixture();
    const selected = fixture.validate(fixture.input);
    expect(selected.status).toBe("available");
    if (selected.status !== "available") return;
    expect(selected.modules.commonality.kind).toBe("commonality");
    expect(selected.modules.difference.kind).toBe("difference");
    expect(selected.modules.interactionState.professionalSkeletonId)
      .toBe("b_controls_a_different_zhengguan_zhengcai");
  });

  it("keeps record versions and keys out of reusable attribute signatures", () => {
    const fixture = availableFixture();
    const first = fixture.input.publicAttributeRecords[0];
    const sameAttributes = {
      ...clone(first),
      selectionKey: "虚构替代键",
      recordVersion: "fictional-record-other-v9"
    };
    expect(normalizeInteractionAttributeSignature(sameAttributes))
      .toBe(normalizeInteractionAttributeSignature(first));

    first.recordVersion = "tampered-record-version";
    expect(fixture.validate(fixture.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("produces different ordered signatures after participant reversal", () => {
    const forward = availableFixture();
    const reversed = availableFixture(
      "1980-01-01",
      "1980-06-12",
      "a_controls_b_different_zhengcai_zhengguan"
    );
    const selectedForward = forward.validate(forward.input);
    const selectedReversed = reversed.validate(reversed.input);
    expect(selectedForward.status).toBe("available");
    expect(selectedReversed.status).toBe("available");
    if (
      selectedForward.status !== "available"
      || selectedReversed.status !== "available"
    ) return;
    expect(selectedForward.orderedAttributeSignature)
      .not.toBe(selectedReversed.orderedAttributeSignature);
    expect(selectedForward.compositionSignature)
      .not.toBe(selectedReversed.compositionSignature);
    expect(normalizeOrderedInteractionAttributeSignature(
      selectedForward.personAAttributeSignature,
      selectedForward.personBAttributeSignature
    )).toBe(selectedForward.orderedAttributeSignature);
  });

  it("keeps commonality and difference independent of professional skeleton", () => {
    const fixture = availableFixture();
    const personA = normalizeInteractionAttributeSignature(
      fixture.input.publicAttributeRecords[0]
    );
    const personB = normalizeInteractionAttributeSignature(
      fixture.input.publicAttributeRecords[1]
    );
    const moduleInput = {
      relationshipTypeId: "cooperation" as const,
      personAAttributeSignature: personA,
      personBAttributeSignature: personB,
      vocabularyVersion: VOCABULARY.vocabularyVersion,
      publicModules: fixture.input.catalogs.publicModules,
      privateApprovedModules: fixture.approvedSources.privateApprovedModules
    };
    const commonality = selectUniqueCommonalityModule(moduleInput);
    const difference = selectUniqueDifferenceModule(moduleInput);
    expect(commonality && "professionalSkeletonId" in commonality).toBe(false);
    expect(difference && "professionalSkeletonId" in difference).toBe(false);
  });

  it("derives the skeleton from trusted facts and rejects a forged claimed ID", () => {
    const fixture = availableFixture();
    fixture.input.professionalSkeleton = {
      certainty: "confirmed",
      id: "a_generates_b_same_shishen_pianyin"
    };
    expect(fixture.validate(fixture.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const forgedSource = availableFixture();
    if (forgedSource.input.interactionInput.status !== "available") return;
    forgedSource.input.interactionInput.professionalRelationshipFacts
      .dayMasterElementRelation.ruleVersion = "forged-rule-version";
    expect(forgedSource.validate(forgedSource.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const exact = availableFixture();
    const personA = normalizeInteractionAttributeSignature(
      exact.input.publicAttributeRecords[0]
    );
    const personB = normalizeInteractionAttributeSignature(
      exact.input.publicAttributeRecords[1]
    );
    expect(selectUniqueInteractionStateModule({
      relationshipTypeId: "cooperation",
      personAAttributeSignature: personA,
      personBAttributeSignature: personB,
      vocabularyVersion: VOCABULARY.vocabularyVersion,
      professionalSkeletonId: "a_generates_b_same_shishen_pianyin",
      publicModules: exact.input.catalogs.publicModules,
      privateApprovedModules: exact.approvedSources.privateApprovedModules
    })).toBeNull();
  });

  it("stops for zero or multiple module matches", () => {
    const zero = availableFixture();
    zero.input.catalogs.publicModules = zero.input.catalogs.publicModules
      .filter(module => module.kind !== "commonality");
    expect(zero.validate(zero.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const multiple = availableFixture();
    const original = multiple.input.catalogs.publicModules.find(
      module => module.kind === "difference"
    );
    expect(original).toBeDefined();
    if (!original) return;
    const duplicate: RelationshipInteractionModule = {
      ...clone(original),
      id: "fictional-difference-duplicate"
    };
    multiple.input.catalogs.publicModules = [
      ...multiple.input.catalogs.publicModules,
      duplicate
    ];
    multiple.approvedSources.privateApprovedModules = [
      ...multiple.approvedSources.privateApprovedModules,
      clone(duplicate)
    ];
    const validate = createRelationshipImageryCompositionValidator(
      multiple.approvedSources
    );
    expect(validate(multiple.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("requires one approved composition and its exact private draft", () => {
    const missing = availableFixture();
    missing.input.catalogs.publicCompositions = [];
    expect(missing.validate(missing.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const altered = availableFixture();
    altered.input.catalogs.publicCompositions[0].id = "tampered-composition";
    expect(altered.validate(altered.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const multiple = availableFixture();
    const duplicate = {
      ...clone(multiple.input.catalogs.publicCompositions[0]),
      id: "fictional-composition-duplicate"
    };
    multiple.input.catalogs.publicCompositions = [
      ...multiple.input.catalogs.publicCompositions,
      duplicate
    ];
    multiple.approvedSources.privateApprovedCompositions = [
      ...multiple.approvedSources.privateApprovedCompositions,
      clone(duplicate)
    ];
    const validate = createRelationshipImageryCompositionValidator(
      multiple.approvedSources
    );
    expect(validate(multiple.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("rejects unapproved vocabulary, attributes, audit data, and core binding", () => {
    const vocabulary = availableFixture();
    vocabulary.input.vocabulary.values.attentionFocus = ["伪造主值"];
    expect(vocabulary.validate(vocabulary.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const attribute = availableFixture();
    attribute.input.publicAttributeRecords[0].attributes.attentionFocus =
      "虚构细节";
    expect(attribute.validate(attribute.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const reason = availableFixture();
    reason.input.publicAttributeRecords[0].selectionReasons.attentionFocus =
      "伪造理由";
    expect(reason.validate(reason.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const core = availableFixture();
    core.input.publicAttributeRecords[0].coreEntryId = "伪造核心正文";
    expect(core.validate(core.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("contains no default, approximate, template, AI, or frontend fallback", () => {
    const fixture = availableFixture();
    const commonality = fixture.input.catalogs.publicModules.find(
      module => module.kind === "commonality"
    );
    expect(commonality).toBeDefined();
    if (!commonality) return;
    commonality.narrative = "虚构匹配度正文。";
    expect(fixture.validate(fixture.input))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const source = readFileSync(
      "src/lib/domain/relationshipImageryCompositionContract.ts",
      "utf8"
    );
    expect(source).not.toMatch(
      /defaultNarrative|nearest|approximate|templateReplace|generateText|openai|anthropic/i
    );
    expect(source).not.toMatch(/\/marriage|RelationshipMainlineFoundation/);
  });
});
