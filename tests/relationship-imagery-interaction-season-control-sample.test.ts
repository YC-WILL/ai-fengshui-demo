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
  RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE,
  RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE_VERSION,
  selectRelationshipImagerySeasonControlSample
} from "@/lib/domain/relationshipImageryInteractionSeasonControlSample";
import { buildRelationshipImageryInput } from "@/lib/domain/relationshipMainlineFoundation";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";

const CALCULATED_AT = new Date("2026-08-05T04:00:00.000Z");
const BASELINE_DATES = ["1980-06-12", "1980-01-01"] as const;
const CONTROL_DATES = ["1980-01-04", "1980-06-09"] as const;

function fictionalFacts(birthDate: string) {
  return buildProfessionalBaziFactsOnServer(computeBazi({
    gender: "other",
    birthDate,
    birthTime: "12:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false
  }), CALCULATED_AT).professionalFacts;
}

function interactionInput(
  dates: readonly [string, string],
  relationshipTypeId: RelationshipType = "cooperation"
): RelationshipImageryInteractionInputSelection {
  const personA = fictionalFacts(dates[0]);
  const personB = fictionalFacts(dates[1]);
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

describe("relationship imagery month-season control sample", () => {
  it("records one approved work-context sample with an explicit control design", () => {
    expect(RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE).toMatchObject({
      relationshipTypeId: "cooperation",
      relationshipContextLabel: "工作",
      reviewStatus: "human_reviewed_approved",
      contentKind: "modern_relationship_season_control",
      contentVersion: RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE_VERSION,
      controlDesign: {
        baselineSelectionKeys: ["丙-午", "癸-子"],
        controlSelectionKeys: ["丙-子", "癸-午"],
        changedVariable: "month_branch_season_and_approved_core_imagery"
      }
    });
    expect(Object.keys(RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections))
      .toEqual(["commonality", "difference", "interactionState"]);
  });

  it("holds day stems and all professional relationship facts constant", () => {
    const baseline = interactionInput(BASELINE_DATES);
    const control = interactionInput(CONTROL_DATES);
    expect(baseline.status).toBe("available");
    expect(control.status).toBe("available");
    if (baseline.status !== "available" || control.status !== "available") return;
    expect(baseline.coreImagery.participants.map(value =>
      value.entry.requiredFacts.dayStem
    )).toEqual(["丙", "癸"]);
    expect(control.coreImagery.participants.map(value =>
      value.entry.requiredFacts.dayStem
    )).toEqual(["丙", "癸"]);
    expect(control.professionalRelationshipFacts)
      .toEqual(baseline.professionalRelationshipFacts);
  });

  it("changes only month-season metadata and approved core imagery selections", () => {
    const baseline = interactionInput(BASELINE_DATES);
    const control = interactionInput(CONTROL_DATES);
    expect(baseline.status).toBe("available");
    expect(control.status).toBe("available");
    if (baseline.status !== "available" || control.status !== "available") return;
    expect(baseline.coreImagery.participants.map(value => value.selectionKey))
      .toEqual(["丙-午", "癸-子"]);
    expect(control.coreImagery.participants.map(value => value.selectionKey))
      .toEqual(["丙-子", "癸-午"]);
    expect(baseline.modernImageryMetadata.participants.map(value =>
      value.dayStemFamily.value
    )).toEqual(["日光", "雨露细流"]);
    expect(control.modernImageryMetadata.participants.map(value =>
      value.dayStemFamily.value
    )).toEqual(["日光", "雨露细流"]);
    expect(baseline.modernImageryMetadata.participants.map(value =>
      value.monthBranchSeason.value
    )).toEqual(["盛夏", "仲冬"]);
    expect(control.modernImageryMetadata.participants.map(value =>
      value.monthBranchSeason.value
    )).toEqual(["仲冬", "盛夏"]);
    expect(control.coreImagery.participants.map(value => value.narrative))
      .not.toEqual(baseline.coreImagery.participants.map(value => value.narrative));
  });

  it("selects only the exact control input", () => {
    const selected = selectRelationshipImagerySeasonControlSample(
      interactionInput(CONTROL_DATES)
    );
    expect(selected.status).toBe("available");
    if (selected.status === "available") {
      expect(selected.entry.id).toBe(
        "relationship-imagery-season-control:cooperation:丙-子:癸-午:v2"
      );
    }
    expect(selectRelationshipImagerySeasonControlSample(
      interactionInput(BASELINE_DATES)
    )).toEqual({ status: "not_available", reason: "input_unavailable" });
    expect(selectRelationshipImagerySeasonControlSample(
      interactionInput([CONTROL_DATES[1], CONTROL_DATES[0]])
    )).toEqual({ status: "not_available", reason: "input_unavailable" });
    expect(selectRelationshipImagerySeasonControlSample(
      interactionInput(CONTROL_DATES, "partner")
    )).toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("stops for altered professional facts or a modified draft", () => {
    const input = interactionInput(CONTROL_DATES);
    expect(input.status).toBe("available");
    if (input.status !== "available") return;
    const altered: RelationshipImageryInteractionInputSelection = {
      ...input,
      professionalRelationshipFacts: {
        ...input.professionalRelationshipFacts,
        dayMasterYinYangRelation: {
          ...input.professionalRelationshipFacts.dayMasterYinYangRelation,
          value: {
            ...input.professionalRelationshipFacts.dayMasterYinYangRelation.value,
            relation: "same"
          }
        }
      }
    };
    expect(selectRelationshipImagerySeasonControlSample(altered))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const original = RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections.commonality;
    try {
      RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections.commonality =
        "tampered-control";
      expect(selectRelationshipImagerySeasonControlSample(input))
        .toEqual({ status: "not_available", reason: "input_unavailable" });
    } finally {
      RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections.commonality = original;
    }
  });

  it("contains no fate, scoring, fixed role, advice, or relationship result", () => {
    const prose = Object.values(
      RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections
    ).join("\n");
    expect(prose).not.toMatch(
      /缘分来源|注定|宿命|匹配度|评分|吉凶|必合|必分|关系结论|行动建议|应该|必须|你负责|对方负责|谁补谁|控制|压制|双向增益|形成有效配合|冲突更柔和|相较于盛夏日光|对比基线组/
    );
  });

  it("reads only the interaction input contract and has no fallback or AI generation", () => {
    const source = readFileSync(
      "src/lib/domain/relationshipImageryInteractionSeasonControlSample.ts",
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
