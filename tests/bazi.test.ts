import { describe, it, expect } from "vitest";
import {
  computeBazi, personalityProfile, lifeSuggestions, lifeReminders,
  friendlyCoreConclusion, friendlyElementNote
} from "@/lib/domain/bazi";

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

  it("personalityProfile returns a 100-180 character behavioral description", () => {
    ["1985-03-22", "1990-06-15", "1995-11-11", "2000-01-01", "2004-08-18"].forEach(birthDate => {
      const chart = computeBazi({
        gender: "other",
        birthDate,
        birthTime: "06:00",
        unknownTime: false
      });
      const profile = personalityProfile(chart);
      expect(profile.length).toBeGreaterThanOrEqual(100);
      expect(profile.length).toBeLessThanOrEqual(180);
      expect(profile).not.toContain("这位朋友");
      expect(profile).toMatch(/像|小镜子/);
      expect(profile).toMatch(/可能|倾向|建议|从行为模式看/);
      expect(profile).not.toMatch(/一定|必然|注定|保证|焦虑症|抑郁症|心理有问题/);
    });
  });

  it("varies personality profiles and life suggestions by chart structure", () => {
    const first = computeBazi({
      gender: "male",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    const second = computeBazi({
      gender: "female",
      birthDate: "2000-01-01",
      birthTime: "12:00",
      unknownTime: false
    });
    expect(personalityProfile(first)).not.toBe(personalityProfile(second));
    expect(lifeSuggestions(first)).toHaveLength(3);
    expect(lifeSuggestions(second)).toHaveLength(3);
    expect(lifeSuggestions(first)).not.toEqual(lifeSuggestions(second));
  });

  it("builds concise, friendly and chart-specific free report copy", () => {
    const first = computeBazi({
      gender: "male",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    const second = computeBazi({
      gender: "female",
      birthDate: "2000-01-01",
      birthTime: "12:00",
      unknownTime: false
    });

    expect(friendlyCoreConclusion(first)).not.toContain("这位朋友");
    expect(friendlyCoreConclusion(first)).toMatch(/像/);
    expect(friendlyElementNote(first)).not.toContain("这位朋友");
    expect(friendlyElementNote(first).length).toBeLessThan(100);
    expect(lifeReminders(first)).toHaveLength(2);
    expect(lifeReminders(first)).not.toEqual(lifeReminders(second));
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
