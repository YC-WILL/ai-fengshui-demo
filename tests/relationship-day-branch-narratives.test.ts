import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";
import { buildProfessionalRelationshipFactsV1 } from "@/lib/domain/professionalRelationshipFacts";
import {
  RELATIONSHIP_DAY_BRANCH_NARRATIVE_CATALOG,
  selectRelationshipDayBranchNarratives,
  type RelationshipDayBranchNarrativeKind
} from "@/lib/domain/relationshipDayBranchNarratives";
import type { Branch } from "@/lib/domain/elements";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";

const CALCULATED_AT = new Date("2026-08-04T04:00:00.000Z");
const DATE_BY_DAY_BRANCH: Record<Branch, string> = {
  子: "1992-01-01",
  丑: "1992-01-02",
  寅: "1992-01-03",
  卯: "1992-01-04",
  辰: "1992-01-05",
  巳: "1992-01-06",
  午: "1992-01-07",
  未: "1992-01-08",
  申: "1992-01-09",
  酉: "1992-01-10",
  戌: "1992-01-11",
  亥: "1992-01-12"
};

function natalFacts(branch: Branch) {
  const chart = computeBazi({
    gender: "other",
    birthDate: DATE_BY_DAY_BRANCH[branch],
    birthTime: "12:00",
    birthLocation: "虚构地支关系测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false
  });
  return buildProfessionalBaziFactsOnServer(chart, CALCULATED_AT)
    .professionalFacts;
}

function relationshipFacts(personABranch: Branch, personBBranch: Branch) {
  return buildProfessionalRelationshipFactsV1(
    { facts: natalFacts(personABranch), timezoneBasis: "provided" },
    { facts: natalFacts(personBBranch), timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
}

function selectedKinds(
  personABranch: Branch,
  personBBranch: Branch,
  relationshipTypeId: RelationshipType = "partner"
) {
  const selected = selectRelationshipDayBranchNarratives(
    relationshipFacts(personABranch, personBBranch),
    relationshipTypeId
  );
  expect(selected.status).toBe("available");
  return selected.status === "available"
    ? selected.items.map(item => item.entry.kind)
    : [];
}

describe("relationship day-branch reviewed narratives", () => {
  it("contains exactly the eight product-owner-approved interpretations", () => {
    expect(Object.keys(RELATIONSHIP_DAY_BRANCH_NARRATIVE_CATALOG)).toEqual([
      "six_harmony",
      "six_clash",
      "six_harm",
      "six_break",
      "complete_punishment",
      "self_punishment",
      "partial_punishment",
      "same_branch"
    ]);
    expect(Object.values(RELATIONSHIP_DAY_BRANCH_NARRATIVE_CATALOG).map(entry => entry.title)).toEqual([
      "六合", "六冲", "六害", "六破", "完整成刑", "自刑", "部分刑局", "同支"
    ]);
    Object.values(RELATIONSHIP_DAY_BRANCH_NARRATIVE_CATALOG).forEach(entry => {
      expect(entry.reviewStatus).toBe("human_reviewed_approved");
      expect(entry.approvedRelationshipTypes).toEqual([
        "partner", "cooperation", "family", "friend"
      ]);
      expect(entry.narrative).toContain("蟾先森在这儿只是以专业角度向您进行说明");
    });
  });

  it("binds every registered relation and punishment scope to its exact narrative kind", () => {
    const cases: Array<[Branch, Branch, RelationshipDayBranchNarrativeKind[]]> = [
      ["子", "丑", ["six_harmony"]],
      ["子", "午", ["six_clash"]],
      ["子", "未", ["six_harm"]],
      ["子", "酉", ["six_break"]],
      ["子", "卯", ["complete_punishment"]],
      ["辰", "辰", ["same_branch", "self_punishment"]],
      ["寅", "巳", ["six_harm", "partial_punishment"]],
      ["子", "子", ["same_branch"]]
    ];
    cases.forEach(([personA, personB, expected]) => {
      expect(selectedKinds(personA, personB)).toEqual(expected);
    });
  });

  it("requires explicit approval for the current relationship context", () => {
    const facts = relationshipFacts("子", "丑");
    (["partner", "cooperation", "family", "friend"] as const).forEach(type => {
      const selected = selectRelationshipDayBranchNarratives(facts, type);
      expect(selected.status).toBe("available");
      if (selected.status !== "available") return;
      expect(selected.relationshipTypeId).toBe(type);
      expect(selected.items[0].entry.approvedRelationshipTypes).toContain(type);
    });
  });

  it("stops when no registered relation exists", () => {
    expect(selectRelationshipDayBranchNarratives(
      relationshipFacts("子", "辰"),
      "friend"
    )).toEqual({ status: "not_available", reason: "no_registered_relation" });
  });

  it("stops the whole block on uncertain or branch-inconsistent facts", () => {
    const uncertain = relationshipFacts("子", "丑");
    uncertain.crossChartRelations.dayBranchRelations[0].certainty = "uncertain";
    expect(selectRelationshipDayBranchNarratives(uncertain, "family")).toEqual({
      status: "not_available",
      reason: "narrative_not_reviewed"
    });

    const inconsistent = relationshipFacts("子", "丑");
    inconsistent.crossChartRelations.dayBranchRelations[0].value.personBBranch = "午";
    expect(selectRelationshipDayBranchNarratives(inconsistent, "family")).toEqual({
      status: "not_available",
      reason: "narrative_not_reviewed"
    });

    const missingDayBranch = relationshipFacts("子", "丑");
    const dayPillar = missingDayBranch.participants.personA.natalFacts.pillars.find(
      pillar => pillar.position.value === "日柱"
    );
    if (!dayPillar) throw new Error("missing fictional day pillar");
    dayPillar.branch.certainty = "uncertain";
    expect(selectRelationshipDayBranchNarratives(missingDayBranch, "family")).toEqual({
      status: "not_available",
      reason: "facts_unavailable"
    });
  });

  it("has no default, approximate, or runtime AI fallback", () => {
    const source = readFileSync(
      "src/lib/domain/relationshipDayBranchNarratives.ts",
      "utf8"
    );
    expect(source).not.toMatch(/defaultNarrative|nearest|approximate|generateText|openai|anthropic/i);
  });
});
