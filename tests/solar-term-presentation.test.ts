import { describe, expect, it } from "vitest";
import { SOLAR_TERM_PRESENTATION_NAMES, solarTermNote } from "@/lib/product/solarTermPresentation";

describe("solar term presentation", () => {
  it("provides concise text for all 24 solar terms without image dependencies", () => {
    expect(SOLAR_TERM_PRESENTATION_NAMES).toHaveLength(24);
    expect(new Set(SOLAR_TERM_PRESENTATION_NAMES).size).toBe(24);
    expect(solarTermNote("小暑")).toBe("暑气渐盛，荷风带来清意");
  });

  it("falls back safely for an unknown term", () => {
    expect(solarTermNote("未知")).toMatch(/四时|节气/);
  });
});
