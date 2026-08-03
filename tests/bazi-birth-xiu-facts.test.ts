import { describe, expect, it } from "vitest";
import { computeBazi, type BaziChart } from "@/lib/domain/bazi";
import {
  BAZI_BIRTH_XIU_ALGORITHM_VERSION,
  BAZI_BIRTH_XIU_FACTS_VERSION,
  BAZI_BIRTH_XIU_SOURCE_RULE_ID,
  XIU_NAMES,
  buildBaziBirthXiuFacts
} from "@/lib/domain/baziBirthXiuFacts";
import type { BaziInput } from "@/lib/types";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
const baseInput: BaziInput = {
  gender: "other",
  birthDate: "1986-05-29",
  birthTime: "08:30",
  birthLocation: "虚构星宿测试城市",
  timezone: "Asia/Shanghai",
  unknownTime: false
};

function chart(overrides: Partial<BaziInput> = {}) {
  return computeBazi({ ...baseInput, ...overrides });
}

describe("Bazi birth traditional daily xiu facts", () => {
  it("records a standalone traceable daily-calendar contract", () => {
    const facts = buildBaziBirthXiuFacts(chart());

    expect(facts).toMatchObject({
      schemaVersion: BAZI_BIRTH_XIU_FACTS_VERSION,
      certainty: "confirmed",
      calculationKind: "traditional_daily_xiu",
      birthTimezone: "Asia/Shanghai",
      birthCivilDate: "1986-05-29",
      timeKnown: true,
      dayBoundary: "出生地民用日期 00:00 换日",
      algorithmVersion: BAZI_BIRTH_XIU_ALGORITHM_VERSION,
      sourceRuleId: BAZI_BIRTH_XIU_SOURCE_RULE_ID,
      unavailableReason: null
    });
    expect(facts.calculationConvention).toMatch(/出生地民用日期.*日支与星期.*不表示.*月球.*实际星宿位置/);
  });

  it("matches the dependency's published 1986-05-29 example", () => {
    expect(buildBaziBirthXiuFacts(chart())).toMatchObject({
      xiu: "斗",
      zheng: "木",
      animal: "獬",
      gong: "北",
      shou: "玄武",
      dayBranch: "酉",
      weekdayIndex: 4
    });
  });

  it("stays confirmed when birth time is unknown because the rule is date-based", () => {
    expect(buildBaziBirthXiuFacts(chart({
      birthTime: "",
      unknownTime: true
    }))).toMatchObject({
      certainty: "confirmed",
      timeKnown: false,
      xiu: "斗"
    });
  });

  it("does not change within one local civil date", () => {
    const early = buildBaziBirthXiuFacts(chart({ birthTime: "00:01" }));
    const late = buildBaziBirthXiuFacts(chart({ birthTime: "23:59" }));

    expect(late).toEqual(early);
  });

  it("uses each supplied timezone's local civil date rather than claiming an astronomical instant", () => {
    const shanghai = buildBaziBirthXiuFacts(chart({
      birthDate: "2024-03-18",
      birthTime: "00:30",
      timezone: "Asia/Shanghai"
    }));
    const newYork = buildBaziBirthXiuFacts(chart({
      birthDate: "2024-03-17",
      birthTime: "12:30",
      timezone: "America/New_York"
    }));

    expect(shanghai.birthCivilDate).toBe("2024-03-18");
    expect(newYork.birthCivilDate).toBe("2024-03-17");
    expect(shanghai.birthTimezone).toBe("Asia/Shanghai");
    expect(newYork.birthTimezone).toBe("America/New_York");
    expect(shanghai.xiu).not.toBe(newYork.xiu);
  });

  it("exposes every canonical mansion across a complete 84-day rule cycle", () => {
    const values = Array.from({ length: 84 }, (_, offset) => {
      const date = new Date(Date.UTC(2024, 0, 1 + offset));
      return buildBaziBirthXiuFacts(chart({
        birthDate: date.toISOString().slice(0, 10)
      })).xiu;
    });

    expect(new Set(values)).toEqual(new Set(XIU_NAMES));
    expect(XIU_NAMES).toHaveLength(28);
  });

  it("returns unavailable without guessing when the civil date is invalid", () => {
    const invalid = structuredClone(chart()) as BaziChart;
    invalid.inputSnapshot.birthDate = "invalid";

    expect(buildBaziBirthXiuFacts(invalid)).toMatchObject({
      certainty: "unavailable",
      xiu: null,
      zheng: null,
      animal: null,
      gong: null,
      shou: null,
      dayBranch: null,
      weekdayIndex: null,
      unavailableReason: "calculation_failed"
    });
  });

  it("does not include luck, songs, personality, fate or runtime AI", () => {
    const facts = buildBaziBirthXiuFacts(chart());
    const text = JSON.stringify(facts);

    expect(facts).not.toHaveProperty("luck");
    expect(facts).not.toHaveProperty("song");
    expect(text).not.toMatch(/吉|凶|性格|命运|openai|anthropic/);
  });
});
