import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";
import { buildProfessionalRelationshipFactsV1 } from "@/lib/domain/professionalRelationshipFacts";
import { selectRelationshipImageryCore } from "@/lib/domain/relationshipImageryCoreNarratives";
import {
  buildRelationshipImageryInteractionInput,
  type RelationshipImageryInteractionInputSelection
} from "@/lib/domain/relationshipImageryInteractionInput";
import {
  RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG,
  RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_VERSION,
  selectRelationshipImageryStructureValidationSample,
  type RelationshipImageryStructureValidationSampleEntry
} from "@/lib/domain/relationshipImageryInteractionStructureSamples";
import { buildRelationshipImageryInput } from "@/lib/domain/relationshipMainlineFoundation";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";

const CALCULATED_AT = new Date("2026-08-05T04:00:00.000Z");

const CASES = [
  {
    id: "water_controls_fire",
    dates: ["1980-06-12", "1980-01-01"],
    keys: ["丙-午", "癸-子"],
    elementRelation: "b_controls_a",
    yinYangRelation: "different",
    tenGods: ["正官", "正财"]
  },
  {
    id: "earth_generates_metal",
    dates: ["1980-04-05", "1980-08-15"],
    keys: ["戊-辰", "庚-申"],
    elementRelation: "a_generates_b",
    yinYangRelation: "same",
    tenGods: ["食神", "偏印"]
  },
  {
    id: "fire_controls_metal",
    dates: ["1980-05-14", "1980-09-15"],
    keys: ["丁-巳", "辛-酉"],
    elementRelation: "a_controls_b",
    yinYangRelation: "same",
    tenGods: ["偏财", "七杀"]
  }
] as const;

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
  personABirthDate: string,
  personBBirthDate: string,
  relationshipTypeId: RelationshipType = "cooperation"
): RelationshipImageryInteractionInputSelection {
  const personA = fictionalFacts(personABirthDate);
  const personB = fictionalFacts(personBBirthDate);
  const professionalFacts = buildProfessionalRelationshipFactsV1(
    { facts: personA, timezoneBasis: "provided" },
    { facts: personB, timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
  const imageryInput = buildRelationshipImageryInput(
    professionalFacts,
    relationshipTypeId
  );
  const coreSelection = selectRelationshipImageryCore(imageryInput);
  return buildRelationshipImageryInteractionInput({
    relationshipTypeId,
    imageryInput,
    coreSelection,
    professionalFacts
  });
}

describe("relationship imagery interaction structure validation samples", () => {
  it("contains only three approved work-context comparison samples", () => {
    expect(Object.keys(RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG))
      .toEqual([
        "water_controls_fire",
        "earth_generates_metal",
        "fire_controls_metal"
      ]);
    Object.values(RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG)
      .forEach(entry => {
        expect(entry).toMatchObject({
          relationshipTypeId: "cooperation",
          relationshipContextLabel: "工作",
          reviewStatus: "human_reviewed_approved",
          contentKind: "modern_relationship_structure_validation",
          contentVersion: RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_VERSION
        });
        expect(Object.keys(entry.sections)).toEqual([
          "commonality",
          "difference",
          "interactionState"
        ]);
      });
  });

  it("selects all three samples from exact confirmed interaction contracts", () => {
    CASES.forEach(testCase => {
      const input = interactionInput(testCase.dates[0], testCase.dates[1]);
      expect(input.status).toBe("available");
      if (input.status !== "available") return;
      expect(input.coreImagery.participants.map(value => value.selectionKey))
        .toEqual(testCase.keys);
      expect(input.professionalRelationshipFacts.dayMasterElementRelation.value.relation)
        .toBe(testCase.elementRelation);
      expect(input.professionalRelationshipFacts.dayMasterYinYangRelation.value.relation)
        .toBe(testCase.yinYangRelation);
      expect(input.professionalRelationshipFacts.directionalDayStemTenGods.map(
        value => value.value.tenGod
      )).toEqual(testCase.tenGods);
      const selected = selectRelationshipImageryStructureValidationSample(input);
      expect(selected.status).toBe("available");
      if (selected.status === "available") {
        expect(selected.entry.validationSampleId).toBe(testCase.id);
      }
    });
  });

  it("keeps the three professional structures and prose bodies distinct", () => {
    const entries = Object.values(
      RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG
    );
    expect(new Set(entries.map(entry =>
      entry.inputBinding.traditionalProfessionalFacts
        .dayMasterElementRelation.relation
    )).size).toBe(3);
    expect(new Set(entries.map(entry => JSON.stringify(
      entry.inputBinding.traditionalProfessionalFacts.directionalDayStemTenGods
    ))).size).toBe(3);
    (["commonality", "difference", "interactionState"] as const)
      .forEach(section => {
        expect(new Set(entries.map(entry => entry.sections[section])).size).toBe(3);
      });
    expect(entries[0].sections.interactionState).toContain("外向推进和内向校准");
    expect(entries[1].sections.interactionState).toContain("基础搭建与结构成型");
    expect(entries[2].sections.interactionState).toContain("聚焦照亮与细致辨形");
  });

  it("does not change either participant core imagery narrative", () => {
    CASES.forEach(testCase => {
      const input = interactionInput(testCase.dates[0], testCase.dates[1]);
      expect(input.status).toBe("available");
      if (input.status !== "available") return;
      const before = input.coreImagery.participants.map(participant => ({
        key: participant.selectionKey,
        title: participant.entry.title,
        narrative: participant.narrative,
        version: participant.entry.contentVersion
      }));
      selectRelationshipImageryStructureValidationSample(input);
      expect(input.coreImagery.participants.map(participant => ({
        key: participant.selectionKey,
        title: participant.entry.title,
        narrative: participant.narrative,
        version: participant.entry.contentVersion
      }))).toEqual(before);
    });
  });

  it("stops for reversal, another context, another pair, or altered facts", () => {
    const first = CASES[0];
    expect(selectRelationshipImageryStructureValidationSample(
      interactionInput(first.dates[1], first.dates[0])
    )).toEqual({ status: "not_available", reason: "input_unavailable" });
    expect(selectRelationshipImageryStructureValidationSample(
      interactionInput(first.dates[0], first.dates[1], "partner")
    )).toEqual({ status: "not_available", reason: "input_unavailable" });
    expect(selectRelationshipImageryStructureValidationSample(
      interactionInput("1990-04-09", "1990-07-17")
    )).toEqual({ status: "not_available", reason: "input_unavailable" });

    const input = interactionInput(first.dates[0], first.dates[1]);
    expect(input.status).toBe("available");
    if (input.status !== "available") return;
    const altered: RelationshipImageryInteractionInputSelection = {
      ...input,
      professionalRelationshipFacts: {
        ...input.professionalRelationshipFacts,
        dayMasterElementRelation: {
          ...input.professionalRelationshipFacts.dayMasterElementRelation,
          value: {
            ...input.professionalRelationshipFacts.dayMasterElementRelation.value,
            relation: "a_generates_b"
          }
        }
      }
    };
    expect(selectRelationshipImageryStructureValidationSample(altered))
      .toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("stops when an approved comparison draft is altered at runtime", () => {
    const entry: RelationshipImageryStructureValidationSampleEntry =
      RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG
        .water_controls_fire;
    const original = entry.sections.difference;
    try {
      entry.sections.difference = "tampered-comparison";
      expect(selectRelationshipImageryStructureValidationSample(
        interactionInput(CASES[0].dates[0], CASES[0].dates[1])
      )).toEqual({ status: "not_available", reason: "input_unavailable" });
    } finally {
      entry.sections.difference = original;
    }
  });

  it("contains no fate, scoring, fixed-role, advice, or relationship result", () => {
    const prose = Object.values(
      RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG
    ).flatMap(entry => Object.values(entry.sections)).join("\n");
    expect(prose).not.toMatch(
      /缘分来源|注定|宿命|匹配度|评分|吉凶|必合|必分|关系结论|行动建议|应该|必须|你负责|对方负责|谁补谁|控制对方|压制对方|双向增益|不接受信息模糊悬置/
    );
  });

  it("reads only the interaction input contract and has no fallback or AI generation", () => {
    const source = readFileSync(
      "src/lib/domain/relationshipImageryInteractionStructureSamples.ts",
      "utf8"
    );
    expect(source).toMatch(/from "\.\/relationshipImageryInteractionInput"/);
    expect(source).not.toMatch(
      /from\s+["'][^"']*(?:baziDirectNarratives|professionalRelationshipFacts|relationshipImageryCoreNarratives)["']/
    );
    expect(source).not.toMatch(
      /defaultNarrative|nearest|approximate|templateReplace|generateText|openai|anthropic/i
    );
  });
});
