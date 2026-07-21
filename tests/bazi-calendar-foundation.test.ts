import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { defaultBirthTimezoneForLocation } from "@/lib/domain/birthTimezone";

const base = { gender: "other" as const, unknownTime: false };

describe("precise Bazi calendar foundation", () => {
  it.each([
    ["1986-05-29", "00:00", ["丙寅", "癸巳", "癸酉", "壬子"]],
    ["1990-06-15", "10:30", ["庚午", "壬午", "辛亥", "癸巳"]],
    ["2000-01-01", "12:00", ["己卯", "丙子", "戊午", "戊午"]],
    ["2006-10-03", "09:00", ["丙戌", "丁酉", "乙丑", "辛巳"]]
  ])("matches the known four-pillar example %s %s", (birthDate, birthTime, expected) => {
    const chart = computeBazi({ ...base, birthDate, birthTime, timezone: "Asia/Shanghai" });
    expect([
      chart.year.pillarLabel,
      chart.month.pillarLabel,
      chart.day.pillarLabel,
      chart.hour?.pillarLabel
    ]).toEqual(expected);
  });

  it("switches year and first solar month at the precise Li Chun moment", () => {
    const before = computeBazi({ ...base, birthDate: "2024-02-04", birthTime: "16:26", timezone: "Asia/Shanghai" });
    const after = computeBazi({ ...base, birthDate: "2024-02-04", birthTime: "16:28", timezone: "Asia/Shanghai" });

    expect([before.year.pillarLabel, before.month.pillarLabel]).toEqual(["癸卯", "乙丑"]);
    expect([after.year.pillarLabel, after.month.pillarLabel]).toEqual(["甲辰", "丙寅"]);
  });

  it("switches month at the precise Jing Zhe moment rather than at midnight", () => {
    const before = computeBazi({ ...base, birthDate: "2024-03-05", birthTime: "10:21", timezone: "Asia/Shanghai" });
    const after = computeBazi({ ...base, birthDate: "2024-03-05", birthTime: "10:23", timezone: "Asia/Shanghai" });

    expect(before.month.pillarLabel).toBe("丙寅");
    expect(after.month.pillarLabel).toBe("丁卯");
  });

  it("compares the same instant to the same solar-term boundary across timezones", () => {
    const shanghai = computeBazi({
      ...base,
      birthDate: "2024-02-04",
      birthTime: "16:28",
      birthLocation: "上海",
      timezone: "Asia/Shanghai"
    });
    const newYork = computeBazi({
      ...base,
      birthDate: "2024-02-04",
      birthTime: "03:28",
      birthLocation: "海外",
      timezone: "America/New_York"
    });

    expect([newYork.year.pillarLabel, newYork.month.pillarLabel])
      .toEqual([shanghai.year.pillarLabel, shanghai.month.pillarLabel]);
    expect(newYork.calculation.timezone).toBe("America/New_York");
  });

  it("rejects a wall-clock time that did not exist during a DST jump", () => {
    expect(() => computeBazi({
      ...base,
      birthDate: "2024-03-10",
      birthTime: "02:30",
      timezone: "America/New_York"
    })).toThrow(/夏令时/);
  });

  it("omits the hour pillar explicitly when birth time is unknown", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1985-03-22",
      birthTime: "",
      birthLocation: "香港",
      timezone: "Asia/Hong_Kong",
      unknownTime: true
    });

    expect(chart.hour).toBeNull();
    expect(chart.calculation.timeKnown).toBe(false);
    expect(chart.notes.join(" ")).toMatch(/时柱明确省略|不以中午或其他时刻代填/);
  });

  it("derives the legal timezone from supported birth locations", () => {
    expect(defaultBirthTimezoneForLocation("香港")).toBe("Asia/Hong_Kong");
    expect(defaultBirthTimezoneForLocation("台湾")).toBe("Asia/Taipei");
    expect(defaultBirthTimezoneForLocation("四川")).toBe("Asia/Shanghai");
  });
});
