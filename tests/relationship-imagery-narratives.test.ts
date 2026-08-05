import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BAZI_DIRECT_NARRATIVE_CATALOG } from "@/lib/domain/baziDirectNarratives";
import {
  PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY,
  type ProfessionalBaziFact
} from "@/lib/domain/professionalBaziFacts";
import {
  RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG,
  selectRelationshipImageryNarrative
} from "@/lib/domain/relationshipImageryNarratives";
import type {
  RelationshipImageryInput,
  RelationshipParticipantImageryInput
} from "@/lib/domain/relationshipMainlineFoundation";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";

type BaziNarrativeKey = keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG;

function confirmedFact(value: unknown, sourcePosition: string): ProfessionalBaziFact<unknown> {
  return {
    value,
    sourcePosition,
    calculationConvention: "test fixture copied from approved Bazi entry",
    ruleVersion: "test-v1",
    sourceRuleId: PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.catalog.dayMaster,
    certainty: "confirmed"
  };
}

function participant(
  id: RelationshipParticipantImageryInput["id"],
  label: RelationshipParticipantImageryInput["label"],
  selectionKey: BaziNarrativeKey
): RelationshipParticipantImageryInput {
  const entry = BAZI_DIRECT_NARRATIVE_CATALOG[selectionKey];
  return {
    id,
    label,
    selectionKey,
    entry,
    dependencyFacts: {
      "dayMaster.stem": confirmedFact(entry.dayStem, "日柱天干"),
      "dayMaster.element": confirmedFact(entry.requiredFacts.dayElement, "日主五行"),
      "dayMaster.yinYang": confirmedFact(entry.requiredFacts.dayYinYang, "日主阴阳"),
      "monthCommand.branch": confirmedFact(entry.monthBranch, "月令地支"),
      "monthCommand.mainStem": confirmedFact(entry.requiredFacts.monthMainStem, "月令本气天干"),
      "monthCommand.mainTenGod": confirmedFact(entry.requiredFacts.monthMainTenGod, "月令本气十神")
    }
  };
}

function availableInput(
  relationshipTypeId: RelationshipType,
  personASelectionKey: BaziNarrativeKey,
  personBSelectionKey: BaziNarrativeKey
): RelationshipImageryInput {
  return {
    status: "available",
    relationshipTypeId,
    relationshipType: relationshipTypeId === "partner" ? "情感"
      : relationshipTypeId === "family" ? "家人"
        : relationshipTypeId === "friend" ? "朋友" : "工作",
    participants: [
      participant("personA", "你", personASelectionKey),
      participant("personB", "对方", personBSelectionKey)
    ]
  };
}

describe("relationship imagery narratives", () => {
  it("contains only the six direction-bound and human-reviewed samples", () => {
    expect(Object.keys(RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG)).toEqual([
      "cooperation:甲-寅:乙-酉",
      "partner:丙-午:癸-子",
      "family:戊-辰:庚-申",
      "friend:丁-巳:辛-酉",
      "family:壬-亥:己-丑",
      "cooperation:乙-卯:庚-子"
    ]);
    expect(Object.values(RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG).map(entry => entry.title)).toEqual([
      "乔木与藤蔓", "日光与静水", "山峦与原铁", "灯火与银饰", "水脉与育苗土", "花枝与冰纹"
    ]);
    Object.values(RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG).forEach(entry => {
      expect(entry.reviewStatus).toBe("human_reviewed_approved");
      expect(BAZI_DIRECT_NARRATIVE_CATALOG).toHaveProperty(entry.personASelectionKey);
      expect(BAZI_DIRECT_NARRATIVE_CATALOG).toHaveProperty(entry.personBSelectionKey);
    });
  });

  it("selects every approved sample only from its exact direction and context", () => {
    Object.values(RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG).forEach(entry => {
      expect(selectRelationshipImageryNarrative(availableInput(
        entry.relationshipTypeId,
        entry.personASelectionKey,
        entry.personBSelectionKey
      ))).toEqual({ status: "available", entry });
    });
  });

  it("does not reverse participants or reuse a sample across contexts", () => {
    expect(selectRelationshipImageryNarrative(
      availableInput("cooperation", "乙-酉", "甲-寅")
    )).toEqual({ status: "not_available", reason: "combination_not_reviewed" });
    expect(selectRelationshipImageryNarrative(
      availableInput("friend", "甲-寅", "乙-酉")
    )).toEqual({ status: "not_available", reason: "combination_not_reviewed" });
  });

  it("stops when the factual imagery input is unavailable", () => {
    expect(selectRelationshipImageryNarrative({
      status: "not_available",
      relationshipTypeId: "family",
      relationshipType: "家人",
      reason: "participant_imagery_unavailable"
    })).toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("stops when an input entry is forged or altered outside the approved Bazi catalog", () => {
    const input = availableInput("cooperation", "甲-寅", "乙-酉");
    if (input.status !== "available") return;
    input.participants[0] = {
      ...input.participants[0],
      entry: {
        ...input.participants[0].entry,
        narrative: "被篡改的伪造正文"
      }
    };

    expect(selectRelationshipImageryNarrative(input)).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });
  });

  it("returns authored relationship prose rather than concatenating either Bazi source", () => {
    Object.values(RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG).forEach(entry => {
      expect(entry.narrative).not.toContain(
        BAZI_DIRECT_NARRATIVE_CATALOG[entry.personASelectionKey].narrative
      );
      expect(entry.narrative).not.toContain(
        BAZI_DIRECT_NARRATIVE_CATALOG[entry.personBSelectionKey].narrative
      );
    });
  });

  it("has no generic, approximate, or runtime AI fallback", () => {
    const source = readFileSync("src/lib/domain/relationshipImageryNarratives.ts", "utf8");
    expect(source).not.toMatch(/defaultNarrative|nearest|approximate|generateText|openai|anthropic/i);
  });
});
