import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import {
  HIDDEN_STEM_REFERENCE,
  buildBaziStructure,
  tenGodFor
} from "@/lib/domain/baziStructure";

describe("bazi structure evidence", () => {
  it("keeps the canonical hidden stems in main, middle and residual order", () => {
    expect(HIDDEN_STEM_REFERENCE.子).toEqual([{ stem: "癸", qiLevel: "本气" }]);
    expect(HIDDEN_STEM_REFERENCE.辰).toEqual([
      { stem: "戊", qiLevel: "本气" },
      { stem: "乙", qiLevel: "中气" },
      { stem: "癸", qiLevel: "余气" }
    ]);
    expect(Object.values(HIDDEN_STEM_REFERENCE).flat()).toHaveLength(28);
  });

  it("derives all ten-god families from the day master, element relation and polarity", () => {
    expect(tenGodFor("甲", "甲")).toMatchObject({ name: "比肩", relation: "同我", polarity: "同阴阳" });
    expect(tenGodFor("甲", "乙")).toMatchObject({ name: "劫财", relation: "同我", polarity: "异阴阳" });
    expect(tenGodFor("甲", "丙").name).toBe("食神");
    expect(tenGodFor("甲", "丁").name).toBe("伤官");
    expect(tenGodFor("甲", "戊").name).toBe("偏财");
    expect(tenGodFor("甲", "己").name).toBe("正财");
    expect(tenGodFor("甲", "庚").name).toBe("七杀");
    expect(tenGodFor("甲", "辛").name).toBe("正官");
    expect(tenGodFor("甲", "壬").name).toBe("偏印");
    expect(tenGodFor("甲", "癸").name).toBe("正印");
  });

  it("builds a traceable hierarchy for every available pillar", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    const structure = buildBaziStructure(chart);

    expect(structure.dayMaster).toMatchObject({ stem: chart.day.stem, source: "日柱天干" });
    expect(structure.monthCommand).toMatchObject({ branch: chart.month.branch, source: "月柱地支" });
    expect(structure.pillars).toHaveLength(4);
    expect(structure.pillars[2].visibleStem?.role).toBe("日主");
    structure.pillars.forEach(item => {
      expect(item.visibleStem?.source).toBe(`${item.name}天干`);
      expect(item.branch?.source).toBe(`${item.name}地支`);
      expect(item.hiddenStems.every(hidden => hidden.source.startsWith(`${item.name}地支`))).toBe(true);
    });
  });

  it("does not invent an hour pillar or evidence when birth time is unknown", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1985-03-22",
      birthTime: "",
      unknownTime: true
    });
    const hour = buildBaziStructure(chart).pillars[3];
    expect(hour.pillar).toBeNull();
    expect(hour.visibleStem).toBeNull();
    expect(hour.hiddenStems).toEqual([]);
  });
});
