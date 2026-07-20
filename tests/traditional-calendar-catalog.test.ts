import { describe, expect, it } from "vitest";
import {
  TRADITIONAL_CALENDAR_VERSION,
  TRADITIONAL_ENTITIES,
  TRADITIONAL_INTERPRETATIONS,
  TRADITIONAL_METHOD_RULES,
  TRADITIONAL_RELATIONS
} from "../src/lib/knowledge/traditionalCalendarCatalog";

const entitiesByCategory = (category: string) => TRADITIONAL_ENTITIES.filter(item => item.category === category);
const relationsByType = (relationType: string) => TRADITIONAL_RELATIONS.filter(item => item.relationType === relationType);

describe("traditional birth and daily calendar catalog", () => {
  it("contains the complete foundational entity sets", () => {
    expect(TRADITIONAL_CALENDAR_VERSION).toBe("2026-07-20.birth-daily-v1");
    expect(entitiesByCategory("five_phase")).toHaveLength(5);
    expect(entitiesByCategory("heavenly_stem")).toHaveLength(10);
    expect(entitiesByCategory("earthly_branch")).toHaveLength(12);
    expect(entitiesByCategory("sexagenary_cycle")).toHaveLength(60);
    expect(entitiesByCategory("solar_term")).toHaveLength(24);
    expect(entitiesByCategory("ten_god")).toHaveLength(10);
    expect(new Set(TRADITIONAL_ENTITIES.map(item => item.id)).size).toBe(TRADITIONAL_ENTITIES.length);
  });

  it("keeps the sexagenary cycle in canonical stem-branch order", () => {
    const cycle = entitiesByCategory("sexagenary_cycle");
    expect(cycle[0].name).toBe("甲子");
    expect(cycle[59].name).toBe("癸亥");
    expect(new Set(cycle.map(item => item.name)).size).toBe(60);
    for (const [index, item] of cycle.entries()) {
      expect(item.sequence).toBe(index + 1);
      expect(item.attributes.stemCode).toBe(entitiesByCategory("heavenly_stem")[index % 10].code);
      expect(item.attributes.branchCode).toBe(entitiesByCategory("earthly_branch")[index % 12].code);
    }
  });

  it("contains 24 unique solar longitudes and twelve month boundaries", () => {
    const terms = entitiesByCategory("solar_term");
    expect(new Set(terms.map(item => item.attributes.solarLongitude)).size).toBe(24);
    expect(terms.filter(item => item.attributes.isMonthBoundary)).toHaveLength(12);
    expect(new Set(terms.map(item => item.attributes.monthBranch)).size).toBe(12);
    expect(terms.every(item => Number(item.attributes.solarLongitude) % 15 === 0)).toBe(true);
  });

  it("maps all hidden stems and ten gods without missing combinations", () => {
    expect(relationsByType("hidden_stem")).toHaveLength(28);
    expect(relationsByType("ten_god_mapping")).toHaveLength(100);
    const mappings = new Map(relationsByType("ten_god_mapping").map(item => [item.id, item.resultCode]));
    expect(mappings.get("ten-god-jia-jia")).toBe("tenGod:bijian");
    expect(mappings.get("ten-god-jia-yi")).toBe("tenGod:jiecai");
    expect(mappings.get("ten-god-jia-bing")).toBe("tenGod:shishen");
    expect(mappings.get("ten-god-jia-ding")).toBe("tenGod:shangguan");
    expect(mappings.get("ten-god-jia-wu")).toBe("tenGod:piancai");
    expect(mappings.get("ten-god-jia-ji")).toBe("tenGod:zhengcai");
    expect(mappings.get("ten-god-jia-geng")).toBe("tenGod:qisha");
    expect(mappings.get("ten-god-jia-xin")).toBe("tenGod:zhengguan");
    expect(mappings.get("ten-god-jia-ren")).toBe("tenGod:pianyin");
    expect(mappings.get("ten-god-jia-gui")).toBe("tenGod:zhengyin");
  });

  it("defines complete branch relationships and seasonal phase strength", () => {
    expect(relationsByType("branch_six_harmony")).toHaveLength(6);
    expect(relationsByType("branch_clash")).toHaveLength(6);
    expect(relationsByType("branch_harm")).toHaveLength(6);
    expect(relationsByType("branch_break")).toHaveLength(6);
    expect(relationsByType("branch_three_harmony")).toHaveLength(4);
    expect(relationsByType("branch_season_meeting")).toHaveLength(4);
    expect(relationsByType("branch_punishment")).toHaveLength(4);

    const seasonal = relationsByType("seasonal_phase_strength");
    expect(seasonal).toHaveLength(60);
    for (const branch of entitiesByCategory("earthly_branch")) {
      const rows = seasonal.filter(item => item.subjectCodes.includes(`monthBranch:${branch.code}`));
      expect(rows).toHaveLength(5);
      expect(new Set(rows.map(item => item.objectCodes[0])).size).toBe(5);
      expect(new Set(rows.map(item => item.resultCode)).size).toBe(5);
    }
  });

  it("versions the four-pillar, daily relation and birth-time hexagram methods separately", () => {
    expect(TRADITIONAL_METHOD_RULES.filter(item => item.method === "four_pillars")).toHaveLength(10);
    expect(TRADITIONAL_METHOD_RULES.filter(item => item.method === "daily_relation")).toHaveLength(3);
    expect(TRADITIONAL_METHOD_RULES.filter(item => item.method === "meihua_birth_time")).toHaveLength(8);
    expect(TRADITIONAL_METHOD_RULES.find(item => item.code === "year_boundary")?.rule.boundarySolarTerm).toBe("lichun");
    expect(TRADITIONAL_METHOD_RULES.find(item => item.code === "month_boundary")?.rule.useLunarMonthStart).toBe(false);
    expect(TRADITIONAL_METHOD_RULES.find(item => item.code === "time_input")?.explanation).toContain("并列保存");
  });

  it("keeps user-facing explanations factual and within the product safety boundary", () => {
    expect(TRADITIONAL_INTERPRETATIONS).toHaveLength(27);
    const content = JSON.stringify({
      entities: TRADITIONAL_ENTITIES,
      relations: TRADITIONAL_RELATIONS,
      methods: TRADITIONAL_METHOD_RULES,
      interpretations: TRADITIONAL_INTERPRETATIONS
    });
    expect(content).not.toMatch(/心理学|星座|命中注定|保证发财|必然离婚|疾病预测/);
    expect(TRADITIONAL_INTERPRETATIONS.every(item => item.forbiddenUse.includes("不得"))).toBe(true);
    expect([...TRADITIONAL_ENTITIES, ...TRADITIONAL_RELATIONS, ...TRADITIONAL_METHOD_RULES]
      .every(item => item.sourceUrl.startsWith("https://"))).toBe(true);
  });
});
