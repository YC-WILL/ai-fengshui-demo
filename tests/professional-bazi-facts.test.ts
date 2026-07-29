import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziTimeLayers } from "@/lib/domain/baziTimeComparison";
import {
  PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY,
  PROFESSIONAL_BAZI_FACTS_VERSION,
  buildProfessionalBaziFactsV1,
  type ProfessionalBaziFact
} from "@/lib/domain/professionalBaziFacts";
import {
  TRADITIONAL_CALENDAR_VERSION,
  TRADITIONAL_METHOD_RULES
} from "@/lib/knowledge/traditionalCalendarCatalog";

const CONTEXT = {
  protocolVersion: "plate-snapshot-v1",
  engineVersion: "bazi-deterministic-v1",
  calculatedAt: "2026-07-29T06:00:00.000Z"
} as const;

function fictionalChart(
  birthDate = "1990-06-15",
  birthTime = "10:30",
  unknownTime = false
) {
  return computeBazi({
    gender: "other",
    birthDate,
    birthTime,
    birthLocation: "虚构城市",
    timezone: "Asia/Shanghai",
    unknownTime
  });
}

function buildFacts(
  birthDate = "1990-06-15",
  birthTime = "10:30",
  unknownTime = false
) {
  const chart = fictionalChart(birthDate, birthTime, unknownTime);
  return buildProfessionalBaziFactsV1(chart, {
    ...CONTEXT,
    timeLayers: buildBaziTimeLayers(chart, "2026-07-29")
  });
}

function collectFacts(value: unknown): ProfessionalBaziFact<unknown>[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (
    "value" in record &&
    "sourcePosition" in record &&
    "calculationConvention" in record &&
    "ruleVersion" in record &&
    "sourceRuleId" in record &&
    "certainty" in record
  ) {
    return [record as unknown as ProfessionalBaziFact<unknown>];
  }
  return Object.values(record).flatMap(collectFacts);
}

describe("ProfessionalBaziFactsV1", () => {
  it("is deterministic for the same explicitly fictional profile and build context", () => {
    const first = buildFacts();
    const second = buildFacts();

    expect(first).toEqual(second);
    expect(first.schemaVersion.value).toBe(PROFESSIONAL_BAZI_FACTS_VERSION);
    expect(first.pillars.map(item => item.ganzhi.value)).toEqual([
      "庚午", "壬午", "辛亥", "癸巳"
    ]);
    expect(first.timeFacts.map(item => item.id.value)).toEqual(["today", "month", "year"]);
  });

  it("binds every semantic fact to position, convention, version, rule and certainty", () => {
    const facts = buildFacts();
    const traceableFacts = collectFacts(facts);
    const registeredCodeIds = new Set<string>(Object.values(PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.code));

    expect(traceableFacts.length).toBeGreaterThan(70);
    traceableFacts.forEach(item => {
      expect(Object.prototype.hasOwnProperty.call(item, "value")).toBe(true);
      expect(item).toEqual(expect.objectContaining({
        sourcePosition: expect.any(String),
        calculationConvention: expect.any(String),
        ruleVersion: expect.any(String),
        sourceRuleId: expect.any(String),
        certainty: expect.stringMatching(/^(confirmed|uncertain|unavailable)$/)
      }));
      expect(item.sourcePosition.length).toBeGreaterThan(0);
      expect(item.calculationConvention.length).toBeGreaterThan(0);
      expect(item.ruleVersion.length).toBeGreaterThan(0);
      expect(item.sourceRuleId).toMatch(/^(catalog|code):/);
      if (item.sourceRuleId.startsWith("code:")) {
        expect(registeredCodeIds.has(item.sourceRuleId)).toBe(true);
      }
    });
  });

  it("resolves every catalog source and keeps its version aligned with the catalog", () => {
    const facts = collectFacts(buildFacts());
    const catalogIds = Object.values(PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.catalog);

    catalogIds.forEach(sourceRuleId => {
      const id = sourceRuleId.slice("catalog:".length);
      const rule = TRADITIONAL_METHOD_RULES.find(item => item.id === id);
      expect(rule, `${sourceRuleId} should resolve`).toBeDefined();
      expect(rule?.version).toBe(TRADITIONAL_CALENDAR_VERSION);
    });

    facts.filter(item => item.sourceRuleId.startsWith("catalog:")).forEach(item => {
      const id = item.sourceRuleId.slice("catalog:".length);
      const rule = TRADITIONAL_METHOD_RULES.find(candidate => candidate.id === id);
      expect(rule, item.sourceRuleId).toBeDefined();
      expect(item.ruleVersion).toBe(TRADITIONAL_CALENDAR_VERSION);
      expect(item.ruleVersion).toBe(rule?.version);
    });
  });

  it("does not invent an hour pillar or its hidden structure when time is unknown", () => {
    const facts = buildFacts("1985-03-22", "", true);
    const hour = facts.pillars.find(item => item.position.value === "时柱");

    expect(facts.input.birthTime).toMatchObject({ value: null, certainty: "unavailable" });
    expect(facts.input.timeKnown.value).toBe(false);
    expect(hour?.ganzhi).toMatchObject({ value: null, certainty: "unavailable" });
    expect(hour?.stem).toMatchObject({ value: null, certainty: "unavailable" });
    expect(hour?.branch).toMatchObject({ value: null, certainty: "unavailable" });
    expect(hour?.visibleTenGod).toMatchObject({ value: null, certainty: "unavailable" });
    expect(hour?.hiddenStems).toMatchObject({ value: [], certainty: "unavailable" });
  });

  it("preserves candidates and withholds a single pillar on an unknown-time boundary date", () => {
    const facts = buildFacts("2024-02-04", "", true);
    const year = facts.pillars.find(item => item.position.value === "年柱");
    const month = facts.pillars.find(item => item.position.value === "月柱");

    expect(facts.uncertainty.yearPillarCandidates.value).toEqual(["癸卯", "甲辰"]);
    expect(facts.uncertainty.monthPillarCandidates.value).toEqual(["乙丑", "丙寅"]);
    expect(year?.ganzhi).toMatchObject({ value: null, certainty: "uncertain" });
    expect(month?.ganzhi).toMatchObject({ value: null, certainty: "uncertain" });
    expect(facts.monthCommand.branch).toMatchObject({ value: null, certainty: "uncertain" });
    Object.values(facts.visibleElementCounts).forEach(item => {
      expect(item).toMatchObject({ value: null, certainty: "uncertain" });
    });
    expect(facts.natalBranchRelations.every(item =>
      item.value.firstPillar !== "年柱" &&
      item.value.secondPillar !== "年柱" &&
      item.value.firstPillar !== "月柱" &&
      item.value.secondPillar !== "月柱"
    )).toBe(true);
    facts.timeFacts.forEach(item => {
      expect(item.natalBranchLinks.certainty).toBe("uncertain");
      expect(item.natalBranchLinks.value.every(link =>
        link.position !== "年柱" && link.position !== "月柱"
      )).toBe(true);
    });
  });

  it("contains only calculation facts and no life observation or personality payload", () => {
    const serialized = JSON.stringify(buildFacts());

    expect(serialized).not.toMatch(/"(conclusion|trigger|strength|watchout|action|lifeTheme|branchTheme|personality)"\s*:/);
    expect(serialized).not.toMatch(/"(nayin|void|changsheng|luckCycle|shenSha|favorableElement|pattern)"\s*:/i);
  });
});
