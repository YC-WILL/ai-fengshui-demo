import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziTemporalFacts } from "@/lib/domain/baziTemporalFacts";

describe("Bazi temporal facts", () => {
  it("preserves exact ten gods, pillar positions, visibility and month command", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2006-10-03",
      birthTime: "09:00",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const facts = buildBaziTemporalFacts(chart);

    expect(facts.input).toMatchObject({ localDate: "2006-10-03", localTime: "09:00", timeKnown: true });
    expect(facts.pillars.map(item => item.label)).toEqual(["丙戌", "丁酉", "乙丑", "辛巳"]);
    expect(new Set(facts.occurrences.map(item => item.tenGod)).size).toBeGreaterThan(5);
    expect(facts.occurrences.some(item => item.visibility === "天干明现")).toBe(true);
    expect(facts.occurrences.some(item => item.visibility === "地支藏干" && item.qiLevel === "本气")).toBe(true);
    expect(facts.occurrences.filter(item => item.isMonthCommand)).toHaveLength(1);
    expect(facts.signature).toContain("年柱");
  });

  it("does not use gender or birthplace as behavior facts", () => {
    const base = {
      birthDate: "1990-06-15",
      birthTime: "10:30",
      timezone: "Asia/Shanghai",
      unknownTime: false
    } as const;
    const first = buildBaziTemporalFacts(computeBazi({ ...base, gender: "male", birthLocation: "上海" }));
    const second = buildBaziTemporalFacts(computeBazi({ ...base, gender: "female", birthLocation: "成都" }));

    expect(first.signature).toBe(second.signature);
    expect(first.dayMaster).toEqual(second.dayMaster);
    expect(first.occurrences).toEqual(second.occurrences);
  });

  it("omits all hour facts when birth time is unknown", () => {
    const facts = buildBaziTemporalFacts(computeBazi({
      gender: "other", birthDate: "1985-03-22", birthTime: "", unknownTime: true
    }));
    expect(facts.pillars.at(-1)).toEqual({ name: "时柱", label: null });
    expect(facts.occurrences.every(item => item.pillar !== "时柱")).toBe(true);
    expect(facts.input.timeKnown).toBe(false);
  });
});
