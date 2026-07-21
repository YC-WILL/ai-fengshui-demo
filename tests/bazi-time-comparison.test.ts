import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziTimeLayers } from "@/lib/domain/baziTimeComparison";

describe("Bazi time comparison", () => {
  const natal = computeBazi({
    gender: "other",
    birthDate: "1990-06-15",
    birthTime: "10:30",
    unknownTime: false
  });

  it("builds today, solar month and Li-Chun year layers", () => {
    const layers = buildBaziTimeLayers(natal, "2026-07-21");
    expect(layers.map(item => item.id)).toEqual(["today", "month", "year"]);
    expect(layers[0].period).toBe("2026-07-21");
    expect(layers[1].period).toMatch(/大暑|小暑/);
    expect(layers[1].pillar.branch).toBe("未");
    expect(layers[2].period).toBe("2026年");
    expect(layers[2].precision).toMatch(/立春/);
    expect(layers.map(item => item.focusTitle)).toEqual([
      "今天较容易碰到的主题", "这个月反复出现的主题", "这一年的长期背景"
    ]);
  });

  it("uses the previous Ganzhi year before Li Chun", () => {
    const before = buildBaziTimeLayers(natal, "2026-01-20").find(item => item.id === "year");
    const after = buildBaziTimeLayers(natal, "2026-02-10").find(item => item.id === "year");
    expect(before?.period).toBe("2025年");
    expect(after?.period).toBe("2026年");
    expect(before?.pillar.pillarLabel).not.toBe(after?.pillar.pillarLabel);
  });

  it("provides traceable stem and branch comparisons without outcome claims", () => {
    const layers = buildBaziTimeLayers(natal, "2026-07-21");
    layers.forEach(layer => {
      expect(layer.stemRole).toBeTruthy();
      expect(layer.source).toBeTruthy();
      expect(layer.precision).toBeTruthy();
      expect(layer.lifeTheme).toMatch(/放到今日|放到当月|放到流年/);
      expect(layer.branchTheme.length).toBeGreaterThan(20);
      expect(layer.professionalSummary).toMatch(/相对日主|地支/);
      expect(JSON.stringify(layer)).not.toMatch(/吉|凶|一定|必然|注定|保证/);
    });
  });

  it("uses only named structural relations for branch links", () => {
    const layers = buildBaziTimeLayers(natal, "2026-02-10");
    const linkNames = layers.flatMap(layer => layer.branchLinks.map(link => link.relation));
    linkNames.forEach(name => expect(name).toMatch(/同支|六合|六冲|六害|六破/));
  });
});
