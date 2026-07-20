import { describe, expect, it } from "vitest";
import { buildPairStructure, HOME_DIRECTIONS, selectCoreDates } from "@/lib/domain/coreMethods";

describe("core traditional methods", () => {
  it("builds a two-person structure without scores or outcome claims", () => {
    const result = buildPairStructure("1986-05-29", "1990-01-01");
    expect(result.first.pillar).toBe("癸酉");
    expect(result.second.pillar).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(result.stemRelation).toMatch(/同类|生|克/);
    expect(JSON.stringify(result)).not.toMatch(/分数|适合|注定|保证|心理/);
  });

  it("keeps the eight directions mapped to all eight trigrams", () => {
    expect(HOME_DIRECTIONS).toHaveLength(8);
    expect(new Set(HOME_DIRECTIONS.map(item => item.trigram)).size).toBe(8);
    expect(HOME_DIRECTIONS.find(item => item.direction === "北")).toMatchObject({ trigram: "坎", element: "水", binary: "010" });
    expect(HOME_DIRECTIONS.find(item => item.direction === "南")).toMatchObject({ trigram: "离", element: "火", binary: "101" });
  });

  it("selects near dates from traditional structure without behavioral content", () => {
    const dates = selectCoreDates("1986-05-29", "2026-07-20", 30, "moving");
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.length).toBeLessThanOrEqual(3);
    expect(JSON.stringify(dates)).not.toMatch(/心理|性格|星座|注定|保证/);
    expect(dates.every(item => item.date >= "2026-07-20" && item.date <= "2026-08-18")).toBe(true);
  });
});
