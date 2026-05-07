import { describe, it, expect } from "vitest";
import { computeBazi, personalityKeywords } from "@/lib/domain/bazi";

describe("computeBazi (simplified)", () => {
  it("returns 4 pillars when birth time is known", () => {
    const chart = computeBazi({
      gender: "male",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    expect(chart.year.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.month.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.day.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.hour?.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.dayMaster).toBe(chart.day.stem);
  });

  it("omits hour pillar when unknownTime=true", () => {
    const chart = computeBazi({
      gender: "female",
      birthDate: "1985-03-22",
      birthTime: "",
      unknownTime: true
    });
    expect(chart.hour).toBeNull();
    expect(chart.notes.join(" ")).toMatch(/时柱/);
  });

  it("returns 5-element distribution that sums to 6 or 8", () => {
    const chart = computeBazi({
      gender: "male",
      birthDate: "2000-01-01",
      birthTime: "12:00",
      unknownTime: false
    });
    const counts = chart.elementDistribution.counts;
    const sum = counts.木 + counts.火 + counts.土 + counts.金 + counts.水;
    expect([6, 8]).toContain(sum); // 4 pillars * 2 chars = 8 (with hour) or 6 (without)
  });

  it("personalityKeywords returns 3 chinese words", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1995-11-11",
      birthTime: "06:00",
      unknownTime: false
    });
    const kws = personalityKeywords(chart);
    expect(kws).toHaveLength(3);
    kws.forEach(k => expect(k).toMatch(/[一-鿿]+/));
  });

  it("rejects malformed date", () => {
    expect(() => computeBazi({
      gender: "male",
      birthDate: "not-a-date",
      birthTime: "10:00",
      unknownTime: false
    })).toThrow();
  });
});
