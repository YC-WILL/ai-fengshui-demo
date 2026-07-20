import { describe, expect, it } from "vitest";
import {
  buildDailyCorrespondence,
  currentSolarTerm,
  phaseRelation,
  solarTermTimeline
} from "@/lib/domain/dailyCorrespondence";

describe("daily correspondence", () => {
  it("keeps the known sexagenary day calculation stable", () => {
    const result = buildDailyCorrespondence({ birthDate: "1986-05-29" }, "2026-07-20");
    expect(result.birth.dayPillar).toBe("癸酉");
    expect(result.today.dayPillar).toBe("乙未");
    expect(result.birth.dayStem).toBe("癸");
    expect(result.today.dayStem).toBe("乙");
  });

  it("uses the active solar term and its month branch", () => {
    expect(currentSolarTerm("2026-07-20")).toMatchObject({ name: "小暑", monthBranch: "未" });
    expect(currentSolarTerm("2026-02-10")).toMatchObject({ name: "立春", monthBranch: "寅" });
  });

  it("builds a complete, ordered solar-term timeline", () => {
    const timeline = solarTermTimeline("2026-07-20");
    expect(timeline.current.name).toBe("小暑");
    expect(timeline.next.name).toBe("大暑");
    expect(timeline.yearTerms).toHaveLength(24);
    expect(timeline.yearTerms[0].name).toBe("小寒");
    expect(timeline.yearTerms[23].name).toBe("冬至");
    expect(timeline.progress).toBeGreaterThanOrEqual(0);
    expect(timeline.progress).toBeLessThan(1);
  });

  it("rolls the next solar term into the following year", () => {
    const timeline = solarTermTimeline("2026-12-31");
    expect(timeline.current.name).toBe("冬至");
    expect(timeline.next.name).toBe("小寒");
    expect(timeline.next.date.startsWith("2027-")).toBe(true);
  });

  it("derives all five phase directions from the birth element perspective", () => {
    expect(phaseRelation("木", "木")).toBe("same");
    expect(phaseRelation("木", "火")).toBe("generates");
    expect(phaseRelation("火", "木")).toBe("generated_by");
    expect(phaseRelation("木", "土")).toBe("controls");
    expect(phaseRelation("木", "金")).toBe("controlled_by");
  });

  it("does not turn traditional structures into outcomes or psychological claims", () => {
    const result = buildDailyCorrespondence({ birthDate: "2000-01-01" }, "2026-07-20");
    const text = JSON.stringify(result);
    expect(text).not.toMatch(/注定|保证|必然|发财|灾祸|焦虑症|抑郁症|心理/);
    expect(text).toMatch(/结构名称|不直接等同于现实结果|传统五行/);
  });

  it("rejects impossible calendar dates", () => {
    expect(() => buildDailyCorrespondence({ birthDate: "2000-02-30" }, "2026-07-20")).toThrow(/有效日期/);
  });
});
