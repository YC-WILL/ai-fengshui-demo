import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";
import {
  buildProfessionalRelationshipFactsV1,
  type ProfessionalRelationshipFactsV1
} from "@/lib/domain/professionalRelationshipFacts";
import {
  RELATIONSHIP_IMAGERY_CORE_CATALOG,
  selectRelationshipImageryCore
} from "@/lib/domain/relationshipImageryCoreNarratives";
import {
  DAY_STEM_IMAGERY_FAMILY,
  MONTH_BRANCH_SEASON_STATE,
  RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_CATALOG,
  RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION,
  RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES,
  buildRelationshipImageryInteractionInput
} from "@/lib/domain/relationshipImageryInteractionInput";
import {
  buildRelationshipImageryInput,
  type RelationshipImageryInput
} from "@/lib/domain/relationshipMainlineFoundation";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";

const CALCULATED_AT = new Date("2026-08-05T04:00:00.000Z");

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

function relationshipFacts(
  personABirthDate = "1992-04-15",
  personBBirthDate = "1994-09-23"
) {
  return buildProfessionalRelationshipFactsV1(
    { facts: fictionalFacts(personABirthDate), timezoneBasis: "provided" },
    { facts: fictionalFacts(personBBirthDate), timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
}

function availableCore(
  facts: ProfessionalRelationshipFactsV1,
  relationshipTypeId: RelationshipType
) {
  const imageryInput = buildRelationshipImageryInput(
    facts,
    relationshipTypeId
  );
  const coreSelection = selectRelationshipImageryCore(imageryInput);
  expect(imageryInput.status).toBe("available");
  expect(coreSelection.status).toBe("available");
  return { imageryInput, coreSelection };
}

function buildInteraction(
  facts: ProfessionalRelationshipFactsV1,
  relationshipTypeId: RelationshipType
) {
  const { imageryInput, coreSelection } = availableCore(
    facts,
    relationshipTypeId
  );
  return buildRelationshipImageryInteractionInput({
    relationshipTypeId,
    imageryInput,
    coreSelection,
    professionalFacts: facts
  });
}

describe("relationship imagery interaction input", () => {
  it("maps all 120 selection keys to explicit day-stem families and month seasons", () => {
    const entries = Object.values(
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_CATALOG
    );
    expect(entries).toHaveLength(120);
    expect(Object.keys(RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_CATALOG).sort())
      .toEqual(Object.keys(RELATIONSHIP_IMAGERY_CORE_CATALOG).sort());
    entries.forEach(metadata => {
      const core = RELATIONSHIP_IMAGERY_CORE_CATALOG[metadata.selectionKey];
      expect(metadata.dayStemFamily).toEqual({
        dayStem: core.requiredFacts.dayStem,
        value: DAY_STEM_IMAGERY_FAMILY[core.requiredFacts.dayStem],
        sourceRuleId: RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.dayStemFamily,
        version: RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
      });
      expect(metadata.monthBranchSeason).toEqual({
        monthBranch: core.requiredFacts.monthBranch,
        value: MONTH_BRANCH_SEASON_STATE[core.requiredFacts.monthBranch],
        sourceRuleId: RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.monthBranchSeason,
        version: RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
      });
    });
  });

  it("builds a stable directional input for an arbitrary confirmed pair", () => {
    const facts = relationshipFacts();
    const selection = buildInteraction(facts, "friend");
    expect(selection.status).toBe("available");
    if (selection.status !== "available") return;
    expect(selection.relationshipContext).toEqual({
      relationshipTypeId: "friend",
      label: "朋友"
    });
    expect(selection.coreImagery.participants.map(item => item.label))
      .toEqual(["你", "对方"]);
    expect(selection.modernImageryMetadata.kind)
      .toBe("modern_product_metadata");
    expect(selection.professionalRelationshipFacts.kind)
      .toBe("traditional_computed_facts");
    expect(selection.professionalRelationshipFacts.dayMasterElementRelation)
      .toBe(facts.comparisonFacts.dayMasterElementRelation);
    expect(selection.professionalRelationshipFacts.directionalDayStemTenGods)
      .toBe(facts.comparisonFacts.directionalDayStemTenGods);
  });

  it("correctly exchanges participant metadata and directional facts when people swap", () => {
    const originalFacts = relationshipFacts("1992-04-15", "1994-09-23");
    const reversedFacts = relationshipFacts("1994-09-23", "1992-04-15");
    const original = buildInteraction(originalFacts, "cooperation");
    const reversed = buildInteraction(reversedFacts, "cooperation");
    expect(original.status).toBe("available");
    expect(reversed.status).toBe("available");
    if (original.status !== "available" || reversed.status !== "available") return;

    expect(reversed.coreImagery.participants.map(item => item.selectionKey))
      .toEqual(original.coreImagery.participants.map(item => item.selectionKey).reverse());
    expect(reversed.modernImageryMetadata.participants.map(item => item.selectionKey))
      .toEqual(original.modernImageryMetadata.participants.map(item => item.selectionKey).reverse());

    const originalDirections = original.professionalRelationshipFacts
      .directionalDayStemTenGods.map(fact => fact.value);
    const reversedDirections = reversed.professionalRelationshipFacts
      .directionalDayStemTenGods.map(fact => fact.value);
    expect(reversedDirections[0]).toMatchObject({
      perspective: "personA",
      referenceDayMaster: originalDirections[1].referenceDayMaster,
      observedStem: originalDirections[1].observedStem,
      tenGod: originalDirections[1].tenGod
    });
    expect(reversedDirections[1]).toMatchObject({
      perspective: "personB",
      referenceDayMaster: originalDirections[0].referenceDayMaster,
      observedStem: originalDirections[0].observedStem,
      tenGod: originalDirections[0].tenGod
    });
  });

  it("changes only relationship context across the four relationship types", () => {
    const facts = relationshipFacts();
    const selections = (["partner", "cooperation", "family", "friend"] as const)
      .map(type => buildInteraction(facts, type));
    expect(selections.every(selection => selection.status === "available"))
      .toBe(true);
    const withoutContext = selections.map(selection => {
      if (selection.status !== "available") return selection;
      const { relationshipContext: _relationshipContext, ...stable } = selection;
      return stable;
    });
    expect(withoutContext).toEqual([
      withoutContext[0],
      withoutContext[0],
      withoutContext[0],
      withoutContext[0]
    ]);
  });

  it.each([
    "dayMasterElementRelation",
    "dayMasterYinYangRelation",
    "directionalDayStemTenGods.0",
    "directionalDayStemTenGods.1"
  ] as const)("stops when %s is not confirmed", field => {
    const facts = relationshipFacts();
    if (field === "dayMasterElementRelation") {
      facts.comparisonFacts.dayMasterElementRelation.certainty = "uncertain";
    } else if (field === "dayMasterYinYangRelation") {
      facts.comparisonFacts.dayMasterYinYangRelation.certainty = "uncertain";
    } else {
      const index = field.endsWith("0") ? 0 : 1;
      facts.comparisonFacts.directionalDayStemTenGods[index].certainty =
        "uncertain";
    }
    expect(buildInteraction(facts, "partner")).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });
  });

  it("stops when professional facts disagree with either core participant", () => {
    const comparisonMismatch = relationshipFacts();
    comparisonMismatch.comparisonFacts.dayMasterElementRelation.value
      .personAElement = "火";
    expect(buildInteraction(comparisonMismatch, "family")).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });

    const natalMismatch = relationshipFacts();
    const prepared = availableCore(natalMismatch, "family");
    const personBYinYang = natalMismatch.participants.personB.natalFacts
      .dayMaster.yinYang;
    personBYinYang.value = personBYinYang.value === "阳" ? "阴" : "阳";
    expect(buildRelationshipImageryInteractionInput({
      relationshipTypeId: "family",
      imageryInput: prepared.imageryInput,
      coreSelection: prepared.coreSelection,
      professionalFacts: natalMismatch
    })).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });
  });

  it.each([
    [0, "perspective", "personB"],
    [0, "referenceDayMaster", "甲"],
    [0, "observedStem", "乙"],
    [1, "perspective", "personA"],
    [1, "referenceDayMaster", "丙"],
    [1, "observedStem", "丁"]
  ] as const)(
    "stops when ten-god direction %s.%s is altered",
    (index, field, value) => {
      const facts = relationshipFacts();
      Reflect.set(
        facts.comparisonFacts.directionalDayStemTenGods[index].value,
        field,
        value
      );
      expect(buildInteraction(facts, "friend")).toEqual({
        status: "not_available",
        reason: "input_unavailable"
      });
    }
  );

  it("stops when a confirmed element relation or ten-god catalog binding is altered", () => {
    const elementRelation = relationshipFacts();
    elementRelation.comparisonFacts.dayMasterElementRelation.value.relation =
      "same";
    expect(buildInteraction(elementRelation, "partner")).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });

    const tenGodName = relationshipFacts();
    tenGodName.comparisonFacts.directionalDayStemTenGods[0].value.tenGod =
      "比肩";
    expect(buildInteraction(tenGodName, "partner")).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });

    const tenGodVersion = relationshipFacts();
    tenGodVersion.comparisonFacts.directionalDayStemTenGods[1].ruleVersion =
      "tampered-rule-version";
    expect(buildInteraction(tenGodVersion, "partner")).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });
  });

  it("stops for an abnormal professional contract version", () => {
    const facts = relationshipFacts();
    Reflect.set(facts.schemaVersion, "value", "tampered-version");
    expect(buildInteraction(facts, "cooperation")).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });
  });

  it("does not infer metadata from core titles or narratives", () => {
    const metadata = RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_CATALOG["甲-辰"];
    const saved = RELATIONSHIP_IMAGERY_CORE_CATALOG["甲-辰"];
    RELATIONSHIP_IMAGERY_CORE_CATALOG["甲-辰"] = {
      ...saved,
      title: "不包含乔木或春季词语的标题",
      narrative: "你像一段不包含家族与季节关键词的内容。"
    };
    try {
      expect(RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_CATALOG["甲-辰"])
        .toBe(metadata);
      expect(metadata.dayStemFamily.value).toBe("乔木");
      expect(metadata.monthBranchSeason.value).toBe("春末");
    } finally {
      RELATIONSHIP_IMAGERY_CORE_CATALOG["甲-辰"] = saved;
    }
  });

  it("has no fallback or generated interaction narrative", () => {
    const source = readFileSync(
      "src/lib/domain/relationshipImageryInteractionInput.ts",
      "utf8"
    );
    expect(source).not.toMatch(
      /defaultNarrative|nearest|approximate|templateReplace|generateText|openai|anthropic/i
    );
    const selection = buildInteraction(relationshipFacts(), "partner");
    expect(selection.status).toBe("available");
    if (selection.status !== "available") return;
    expect(selection).not.toHaveProperty("commonalityNarrative");
    expect(selection).not.toHaveProperty("differenceNarrative");
    expect(selection).not.toHaveProperty("collisionNarrative");
    expect(selection).not.toHaveProperty("integrationNarrative");
    expect(selection).not.toHaveProperty("matchScore");
    expect(selection).not.toHaveProperty("relationshipConclusion");
  });

  it("stops when the supplied core selection or relationship context is inconsistent", () => {
    const facts = relationshipFacts();
    const { imageryInput, coreSelection } = availableCore(facts, "friend");
    if (imageryInput.status !== "available") return;
    const mismatchedContext: RelationshipImageryInput = {
      ...imageryInput,
      relationshipType: "情感"
    };
    expect(buildRelationshipImageryInteractionInput({
      relationshipTypeId: "friend",
      imageryInput: mismatchedContext,
      coreSelection,
      professionalFacts: facts
    })).toEqual({ status: "not_available", reason: "input_unavailable" });

    expect(buildRelationshipImageryInteractionInput({
      relationshipTypeId: "friend",
      imageryInput,
      coreSelection: { status: "not_available", reason: "input_unavailable" },
      professionalFacts: facts
    })).toEqual({ status: "not_available", reason: "input_unavailable" });
  });
});
