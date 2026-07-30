import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import {
  PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY,
  type ProfessionalBaziFactsV1
} from "@/lib/domain/professionalBaziFacts";
import {
  PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION,
  PROFESSIONAL_RELATIONSHIP_FACTS_VERSION,
  PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY,
  buildProfessionalRelationshipFactsV1,
  type ProfessionalRelationshipFact,
  type RelationshipTimezoneBasis
} from "@/lib/domain/professionalRelationshipFacts";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";
import {
  TRADITIONAL_CALENDAR_VERSION,
  TRADITIONAL_METHOD_RULES,
  TRADITIONAL_RELATIONS
} from "@/lib/knowledge/traditionalCalendarCatalog";
import type { Branch } from "@/lib/domain/elements";

const CALCULATED_AT = new Date("2026-07-30T08:12:34.000Z");

function fictionalFacts(
  birthDate: string,
  birthTime: string,
  unknownTime: boolean
) {
  const chart = computeBazi({
    gender: "other",
    birthDate,
    birthTime,
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime
  });
  return buildProfessionalBaziFactsOnServer(
    chart,
    CALCULATED_AT
  ).professionalFacts;
}

function participant(
  facts: ProfessionalBaziFactsV1,
  timezoneBasis: RelationshipTimezoneBasis
) {
  return { facts, timezoneBasis };
}

function standardPair() {
  return {
    personA: participant(
      fictionalFacts("1992-04-15", "10:00", false),
      "provided"
    ),
    personB: participant(
      fictionalFacts("1994-09-22", "", true),
      "product_assumption"
    )
  };
}

function buildStandardPair() {
  const pair = standardPair();
  return buildProfessionalRelationshipFactsV1(
    pair.personA,
    pair.personB,
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
}

function collectRelationshipFacts(
  value: unknown
): ProfessionalRelationshipFact<unknown>[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (
    "value" in record &&
    "participants" in record &&
    "sourcePositions" in record &&
    "calculationConvention" in record &&
    "ruleVersion" in record &&
    "sourceRuleId" in record &&
    "certainty" in record &&
    "dependsOn" in record &&
    "excludedCandidatePositions" in record
  ) {
    return [
      record as unknown as ProfessionalRelationshipFact<unknown>
    ];
  }
  return Object.values(record).flatMap(collectRelationshipFacts);
}

function dependencyIds(
  participantId: "personA" | "personB",
  facts: ProfessionalBaziFactsV1
) {
  const ids = new Set<string>([
    `${participantId}.inputAssumptions.timezoneBasis`,
    `${participantId}.input.timezone`,
    `${participantId}.input.timeKnown`,
    `${participantId}.dayMaster.stem`,
    `${participantId}.dayMaster.element`,
    `${participantId}.dayMaster.yinYang`,
    `${participantId}.uncertainty.yearPillarCandidates`,
    `${participantId}.uncertainty.monthPillarCandidates`
  ]);
  for (const element of ["木", "火", "土", "金", "水"]) {
    ids.add(`${participantId}.visibleElementCounts.${element}`);
  }
  facts.pillars.forEach(pillar => {
    ids.add(
      `${participantId}.pillars.${pillar.position.value}.ganzhi`
    );
    ids.add(
      `${participantId}.pillars.${pillar.position.value}.branch`
    );
    ids.add(
      `${participantId}.pillars.${pillar.position.value}.hiddenStems`
    );
  });
  return ids;
}

const factsByDayBranch = new Map<Branch, ProfessionalBaziFactsV1>();

function fictionalFactsWithDayBranch(branch: Branch) {
  const cached = factsByDayBranch.get(branch);
  if (cached) return cached;
  for (let day = 1; day <= 24; day += 1) {
    const facts = fictionalFacts(
      `1994-09-${String(day).padStart(2, "0")}`,
      "12:00",
      false
    );
    const dayPillar = facts.pillars.find(
      pillar => pillar.position.value === "日柱"
    );
    if (
      dayPillar?.branch.value &&
      !factsByDayBranch.has(dayPillar.branch.value)
    ) {
      factsByDayBranch.set(dayPillar.branch.value, facts);
    }
  }
  const found = factsByDayBranch.get(branch);
  if (!found) throw new Error(`未找到虚构${branch}日支样例`);
  return found;
}

describe("ProfessionalRelationshipFactsV1", () => {
  it("is deterministic for the same two explicitly fictional profiles", () => {
    const first = buildStandardPair();
    const second = buildStandardPair();

    expect(first).toEqual(second);
    expect(first.schemaVersion.value).toBe(
      PROFESSIONAL_RELATIONSHIP_FACTS_VERSION
    );
    expect(first.versions.relationshipEngineVersion.value).toBe(
      PROFESSIONAL_RELATIONSHIP_ENGINE_VERSION
    );
    expect(first.versions.calculatedAt.value).toBe(
      CALCULATED_AT.toISOString()
    );
  });

  it("reuses two personal fact contracts without carrying current time layers", () => {
    const facts = buildStandardPair();

    expect(facts.participants.personA.natalFacts.dayMaster.stem.value).toBe(
      "辛"
    );
    expect(facts.participants.personB.natalFacts.dayMaster.stem.value).toBe(
      "辛"
    );
    expect(facts.participants.personA.natalFacts).not.toHaveProperty(
      "timeFacts"
    );
    expect(facts.participants.personB.natalFacts).not.toHaveProperty(
      "timeFacts"
    );
  });

  it("records unequal input coverage and the product timezone assumption", () => {
    const facts = buildStandardPair();

    expect(
      facts.fiveElementComparison.visibleCounts.personA.value
        .visibleCharacterCount
    ).toBe(8);
    expect(
      facts.fiveElementComparison.visibleCounts.personB.value
        .visibleCharacterCount
    ).toBe(6);
    expect(
      facts.participants.personB.inputAssumptions.timezoneBasis.value
    ).toBe("product_assumption");
    expect(
      facts.participants.personB.inputAssumptions.timeKnown.value
    ).toBe(false);
    expect(
      facts.participants.personB.inputAssumptions.availablePillars.value
    ).toEqual(["年柱", "月柱", "日柱"]);
    expect(
      facts.participants.personB.inputAssumptions.availablePillars
        .sourcePositions.every(position => position.layer === "pillar")
    ).toBe(true);
    expect(
      facts.uncertainty.excludedPositions.value
    ).toContainEqual({
      participant: "personB",
      layer: "pillar",
      pillar: "时柱"
    });
    expect(facts.uncertainty.participantIssues.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participant: "personB",
          position: "输入时区",
          reason: "product_timezone_assumption"
        }),
        expect.objectContaining({
          participant: "personB",
          position: "时柱",
          reason: "unknown_birth_time"
        })
      ])
    );
    expect(
      facts.uncertainty.participantIssues.dependsOn
    ).toEqual(
      expect.arrayContaining([
        "personA.inputAssumptions.timezoneBasis",
        "personB.inputAssumptions.timezoneBasis"
      ])
    );
  });

  it("traces timezone-assumption issues to the assumption source rather than the timezone string", () => {
    const pair = standardPair();
    const assumed = buildProfessionalRelationshipFactsV1(
      pair.personA,
      pair.personB,
      { calculatedAt: CALCULATED_AT.toISOString() }
    );
    const provided = buildProfessionalRelationshipFactsV1(
      pair.personA,
      { ...pair.personB, timezoneBasis: "provided" },
      { calculatedAt: CALCULATED_AT.toISOString() }
    );

    expect(
      assumed.uncertainty.participantIssues.value.some(
        issue =>
          issue.participant === "personB" &&
          issue.reason === "product_timezone_assumption"
      )
    ).toBe(true);
    expect(
      provided.uncertainty.participantIssues.value.some(
        issue =>
          issue.participant === "personB" &&
          issue.reason === "product_timezone_assumption"
      )
    ).toBe(false);
    expect(
      assumed.participants.personB.natalFacts.input.timezone.value
    ).toBe(
      provided.participants.personB.natalFacts.input.timezone.value
    );
    expect(
      assumed.uncertainty.participantIssues.dependsOn
    ).toContain("personB.inputAssumptions.timezoneBasis");
  });

  it("distinguishes visible, hidden-only and currently-not-seen without strength claims", () => {
    const facts = buildStandardPair();

    expect(
      facts.fiveElementComparison.visibleCounts.personB.value.counts
    ).toEqual({ 木: 1, 火: 0, 土: 1, 金: 2, 水: 2 });
    expect(
      facts.fiveElementComparison.presence.personB.value.火
    ).toBe("hidden_only");
    expect(
      facts.fiveElementComparison.sharedVisibleElements.value
    ).toEqual(["木", "土", "金", "水"]);
    expect(
      facts.fiveElementComparison.differingVisibleElements.value
    ).toEqual(["火"]);

    const factValues = JSON.stringify({
      visibleCounts: {
        personA:
          facts.fiveElementComparison.visibleCounts.personA.value,
        personB:
          facts.fiveElementComparison.visibleCounts.personB.value
      },
      presence: {
        personA: facts.fiveElementComparison.presence.personA.value,
        personB: facts.fiveElementComparison.presence.personB.value
      },
      shared:
        facts.fiveElementComparison.sharedVisibleElements.value,
      differing:
        facts.fiveElementComparison.differingVisibleElements.value
    });
    expect(factValues).not.toMatch(
      /旺衰|强弱|缺.{0,2}五行|补五行|匹配|评分/
    );
  });

  it("builds only the confirmed day-master and day-pillar cross facts", () => {
    const facts = buildStandardPair();

    expect(facts.comparisonFacts.dayMasterElementRelation.value).toEqual({
      personAElement: "金",
      personBElement: "金",
      relation: "same"
    });
    expect(
      facts.comparisonFacts.dayMasterElementRelation.sourceRuleId
    ).toBe("catalog:phase-metal-metal");
    expect(facts.comparisonFacts.dayMasterYinYangRelation.value).toEqual({
      personA: "阴",
      personB: "阴",
      relation: "same"
    });
    expect(
      facts.comparisonFacts.directionalDayStemTenGods.map(
        fact => fact.value.tenGod
      )
    ).toEqual(["比肩", "比肩"]);
    expect(
      facts.comparisonFacts.directionalDayStemTenGods.map(
        fact => fact.sourceRuleId
      )
    ).toEqual([
      "catalog:ten-god-xin-xin",
      "catalog:ten-god-xin-xin"
    ]);
    expect(
      facts.crossChartRelations.dayBranchEvaluation.value
    ).toEqual({
      personABranch: "酉",
      personBBranch: "亥",
      registeredRelationCount: 0
    });
    expect(
      facts.crossChartRelations.dayBranchRelations
    ).toEqual([]);
  });

  it("binds a positive day-branch relation to its exact catalog entry", () => {
    const personA = participant(
      fictionalFacts("1992-04-10", "10:00", false),
      "provided"
    );
    const personB = participant(
      fictionalFacts("1994-09-20", "", true),
      "product_assumption"
    );
    const facts = buildProfessionalRelationshipFactsV1(
      personA,
      personB,
      { calculatedAt: CALCULATED_AT.toISOString() }
    );
    const harmony =
      facts.crossChartRelations.dayBranchRelations.find(
        fact => fact.value.relation === "six_harmony"
      );

    expect(harmony).toBeDefined();
    expect(harmony?.sourceRuleId).toBe(
      "catalog:branch_six_harmony-chen-you"
    );
    expect(harmony?.value).toMatchObject({
      personABranch: "辰",
      personBBranch: "酉",
      scope: "complete_pair"
    });
  });

  it.each([
    ["子", "丑", ["six_harmony"]],
    ["子", "午", ["six_clash"]],
    ["子", "未", ["six_harm"]],
    ["子", "酉", ["six_break"]],
    ["子", "卯", ["punishment"]],
    ["寅", "巳", ["six_harm", "punishment"]],
    ["巳", "申", ["six_harmony", "six_break", "punishment"]],
    ["午", "午", ["same", "punishment"]],
    ["酉", "亥", []]
  ] as Array<[Branch, Branch, string[]]>)(
    "uses the registered day-branch set for %s/%s",
    (personABranch, personBBranch, expected) => {
      const facts = buildProfessionalRelationshipFactsV1(
        participant(
          fictionalFactsWithDayBranch(personABranch),
          "provided"
        ),
        participant(
          fictionalFactsWithDayBranch(personBBranch),
          "provided"
        ),
        { calculatedAt: CALCULATED_AT.toISOString() }
      );
      expect(
        facts.crossChartRelations.dayBranchRelations.map(
          fact => fact.value.relation
        )
      ).toEqual(expected);
      const partial =
        facts.crossChartRelations.dayBranchRelations.find(
          fact => fact.value.relation === "punishment"
        );
      if (
        (personABranch === "寅" && personBBranch === "巳") ||
        (personABranch === "巳" && personBBranch === "申")
      ) {
        expect(partial?.value.scope).toBe("partial_group");
      }
    }
  );

  it("keeps every relationship fact traceable and prevents source drift", () => {
    const facts = collectRelationshipFacts(buildStandardPair());
    const relationshipCodeIds = new Set<string>(
      Object.values(
        PROFESSIONAL_RELATIONSHIP_SOURCE_RULE_REGISTRY.code
      )
    );
    const baziCodeIds = new Set<string>(
      Object.values(PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.code)
    );
    const baziCatalogIds = new Set<string>(
      Object.values(PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.catalog)
    );

    expect(facts.length).toBeGreaterThan(20);
    const pair = standardPair();
    const validDependencies = new Set([
      ...dependencyIds("personA", pair.personA.facts),
      ...dependencyIds("personB", pair.personB.facts)
    ]);
    facts.forEach(fact => {
      expect(fact.participants.length).toBeGreaterThan(0);
      expect(fact.calculationConvention.length).toBeGreaterThan(0);
      expect(fact.ruleVersion.length).toBeGreaterThan(0);
      expect(fact.certainty).toMatch(
        /^(confirmed|uncertain|unavailable)$/
      );
      expect(Array.isArray(fact.dependsOn)).toBe(true);
      fact.dependsOn.forEach(dependency => {
        expect(
          validDependencies.has(dependency),
          `${dependency} should resolve to a participant fact`
        ).toBe(true);
      });
      expect(
        Array.isArray(fact.excludedCandidatePositions)
      ).toBe(true);

      if (fact.sourceRuleId.startsWith("catalog:")) {
        const id = fact.sourceRuleId.slice("catalog:".length);
        const relation = TRADITIONAL_RELATIONS.find(
          candidate => candidate.id === id
        );
        const method = TRADITIONAL_METHOD_RULES.find(
          candidate => candidate.id === id
        );
        expect(
          relation || method,
          `${fact.sourceRuleId} should resolve`
        ).toBeDefined();
        expect(fact.ruleVersion).toBe(
          relation?.version ?? method?.version
        );
        expect(fact.ruleVersion).toBe(
          TRADITIONAL_CALENDAR_VERSION
        );
      } else {
        expect(
          relationshipCodeIds.has(fact.sourceRuleId) ||
            baziCodeIds.has(fact.sourceRuleId) ||
            baziCatalogIds.has(fact.sourceRuleId)
        ).toBe(true);
      }
    });
  });

  it("cannot attach one participant's facts to another participant's cross result", () => {
    const original = standardPair();
    const changedPersonB = participant(
      fictionalFacts("1994-09-23", "", true),
      "product_assumption"
    );
    const before = buildProfessionalRelationshipFactsV1(
      original.personA,
      original.personB,
      { calculatedAt: CALCULATED_AT.toISOString() }
    );
    const after = buildProfessionalRelationshipFactsV1(
      original.personA,
      changedPersonB,
      { calculatedAt: CALCULATED_AT.toISOString() }
    );

    expect(after.participants.personA).toEqual(
      before.participants.personA
    );
    expect(
      after.participants.personB.natalFacts.input.birthDate.value
    ).toBe("1994-09-23");
    expect(
      after.comparisonFacts.directionalDayStemTenGods
    ).not.toEqual(
      before.comparisonFacts.directionalDayStemTenGods
    );
    expect(
      after.crossChartRelations.dayBranchEvaluation
    ).not.toEqual(
      before.crossChartRelations.dayBranchEvaluation
    );
  });

  it("withholds boundary-dependent element comparison while preserving confirmed day facts", () => {
    const stable = participant(
      fictionalFacts("1992-04-15", "10:00", false),
      "provided"
    );
    const boundary = participant(
      fictionalFacts("2024-02-04", "", true),
      "product_assumption"
    );
    const facts = buildProfessionalRelationshipFactsV1(
      stable,
      boundary,
      { calculatedAt: CALCULATED_AT.toISOString() }
    );

    expect(
      facts.fiveElementComparison.visibleCounts.personB.certainty
    ).toBe("uncertain");
    expect(
      Object.values(
        facts.fiveElementComparison.visibleCounts.personB.value.counts
      )
    ).toEqual([null, null, null, null, null]);
    expect(
      Object.values(
        facts.fiveElementComparison.presence.personB.value
      )
    ).toEqual([null, null, null, null, null]);
    expect(
      facts.fiveElementComparison.sharedVisibleElements
    ).toMatchObject({ value: [], certainty: "uncertain" });
    expect(
      facts.uncertainty.participantIssues.value
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participant: "personB",
          position: "年柱",
          reason: "year_boundary_candidates",
          candidates: ["癸卯", "甲辰"]
        }),
        expect.objectContaining({
          participant: "personB",
          position: "月柱",
          reason: "month_boundary_candidates",
          candidates: ["乙丑", "丙寅"]
        })
      ])
    );
    expect(
      facts.uncertainty.excludedPositions.value
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participant: "personB",
          pillar: "年柱",
          layer: "pillar"
        }),
        expect.objectContaining({
          participant: "personB",
          pillar: "月柱",
          layer: "pillar"
        }),
        expect.objectContaining({
          participant: "personB",
          pillar: "时柱",
          layer: "pillar"
        })
      ])
    );
    expect(
      facts.comparisonFacts.dayMasterElementRelation.certainty
    ).toBe("confirmed");
    expect(
      facts.crossChartRelations.dayBranchEvaluation.certainty
    ).toBe("confirmed");

    const crossChart = JSON.stringify({
      comparisonFacts: facts.comparisonFacts,
      crossChartRelations: facts.crossChartRelations
    });
    expect(crossChart).not.toMatch(/癸卯|甲辰|乙丑|丙寅/);
  });

  it("contains no relationship lens, imagery, prediction, observation or action payload", () => {
    const serialized = JSON.stringify(buildStandardPair());

    expect(serialized).not.toMatch(
      /relationshipLens|relationshipContext|关系之象|盘面意象/
    );
    expect(serialized).not.toMatch(
      /"(conclusion|trigger|strength|watchout|action|suggestion|score|matching)"\s*:/
    );
    expect(serialized).not.toMatch(
      /适合恋爱|谁更爱谁|结婚|分手|注定|缘分深浅|补五行/
    );
    expect(serialized).not.toMatch(
      /stemCombinations|hiddenStemCrossTenGods|zodiacRelation/
    );
  });
});
