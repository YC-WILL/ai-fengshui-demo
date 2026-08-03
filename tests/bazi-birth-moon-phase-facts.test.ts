import { describe, expect, it } from "vitest";
import { computeBazi, type BaziChart } from "@/lib/domain/bazi";
import {
  BAZI_BIRTH_MOON_PHASE_ALGORITHM_VERSION,
  BAZI_BIRTH_MOON_PHASE_ASTRONOMY_SOURCE_RULE_ID,
  BAZI_BIRTH_MOON_PHASE_CLASSIFICATION_RULE_ID,
  BAZI_BIRTH_MOON_PHASE_FACTS_VERSION,
  buildBaziBirthMoonPhaseFacts,
  classifyMoonPhase
} from "@/lib/domain/baziBirthMoonPhaseFacts";
import type { BaziInput } from "@/lib/types";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
const baseInput: BaziInput = {
  gender: "other",
  birthDate: "2024-03-17",
  birthTime: "12:11",
  birthLocation: "虚构月相测试城市",
  timezone: "Asia/Shanghai",
  unknownTime: false
};

function chart(overrides: Partial<BaziInput> = {}) {
  return computeBazi({ ...baseInput, ...overrides });
}

function distanceMs(first: string, second: string) {
  return Math.abs(new Date(first).getTime() - new Date(second).getTime());
}

describe("Bazi birth moon-phase facts", () => {
  it("records a standalone traceable astronomy and classification contract", () => {
    const facts = buildBaziBirthMoonPhaseFacts(chart());

    expect(facts).toMatchObject({
      schemaVersion: BAZI_BIRTH_MOON_PHASE_FACTS_VERSION,
      certainty: "confirmed",
      birthTimezone: "Asia/Shanghai",
      birthInstantUtc: "2024-03-17T04:11:00.000Z",
      algorithmVersion: BAZI_BIRTH_MOON_PHASE_ALGORITHM_VERSION,
      astronomySourceRuleId: BAZI_BIRTH_MOON_PHASE_ASTRONOMY_SOURCE_RULE_ID,
      classificationRuleId: BAZI_BIRTH_MOON_PHASE_CLASSIFICATION_RULE_ID,
      unavailableReason: null
    });
    expect(facts.calculationConvention).toMatch(/IANA.*UTC.*TT.*黄经差.*天文朔时.*月龄/);
    expect(facts.phaseClassificationConvention).toMatch(/0≤角度<360°.*八个等宽 45° 扇区/);
  });

  it.each([
    { birthDate: "2024-03-10", birthTime: "17:00", angle: 0, phase: "new_moon" },
    { birthDate: "2024-03-17", birthTime: "12:11", angle: 90, phase: "first_quarter" },
    { birthDate: "2024-03-25", birthTime: "15:00", angle: 180, phase: "full_moon" },
    { birthDate: "2024-04-02", birthTime: "11:15", angle: 270, phase: "last_quarter" }
  ] as const)("matches the USNO 2024 primary phase minute for $phase", ({ birthDate, birthTime, angle, phase }) => {
    const facts = buildBaziBirthMoonPhaseFacts(chart({ birthDate, birthTime }));

    expect(facts.certainty).toBe("confirmed");
    expect(facts.phase).toBe(phase);
    const circularDistance = Math.min(
      Math.abs(facts.elongationDegrees! - angle),
      360 - Math.abs(facts.elongationDegrees! - angle)
    );
    expect(circularDistance).toBeLessThan(0.02);
  });

  it("keeps adjacent astronomical new moons and derives age from the real birth instant", () => {
    const facts = buildBaziBirthMoonPhaseFacts(chart());

    expect(distanceMs(facts.previousNewMoonAtUtc!, "2024-03-10T09:00:00.000Z"))
      .toBeLessThanOrEqual(90_000);
    expect(distanceMs(facts.nextNewMoonAtUtc!, "2024-04-08T18:21:00.000Z"))
      .toBeLessThanOrEqual(90_000);
    expect(facts.moonAgeDays).toBeCloseTo(6.799, 3);
    expect(facts.lunationLengthDays).toBeCloseTo(29.3892, 3);
  });

  it("gives the same astronomical facts to timezone expressions of the same instant", () => {
    const shanghai = buildBaziBirthMoonPhaseFacts(chart({
      birthDate: "2024-03-17",
      birthTime: "12:11",
      timezone: "Asia/Shanghai"
    }));
    const newYork = buildBaziBirthMoonPhaseFacts(chart({
      birthDate: "2024-03-17",
      birthTime: "00:11",
      timezone: "America/New_York"
    }));

    expect(newYork.birthTimezone).toBe("America/New_York");
    expect(newYork.birthInstantUtc).toBe(shanghai.birthInstantUtc);
    expect({
      elongationDegrees: newYork.elongationDegrees,
      moonAgeDays: newYork.moonAgeDays,
      phase: newYork.phase,
      previousNewMoonAtUtc: newYork.previousNewMoonAtUtc,
      nextNewMoonAtUtc: newYork.nextNewMoonAtUtc
    }).toEqual({
      elongationDegrees: shanghai.elongationDegrees,
      moonAgeDays: shanghai.moonAgeDays,
      phase: shanghai.phase,
      previousNewMoonAtUtc: shanghai.previousNewMoonAtUtc,
      nextNewMoonAtUtc: shanghai.nextNewMoonAtUtc
    });
  });

  it("keeps an unknown birth time uncertain even when the endpoint phases agree", () => {
    const facts = buildBaziBirthMoonPhaseFacts(chart({
      birthDate: "2024-03-13",
      birthTime: "",
      unknownTime: true
    }));

    expect(facts).toMatchObject({
      certainty: "uncertain",
      birthInstantUtc: null,
      elongationDegrees: null,
      moonAgeDays: null,
      phase: null,
      previousNewMoonAtUtc: null,
      nextNewMoonAtUtc: null,
      lunationLengthDays: null,
      unavailableReason: null
    });
    expect(facts.candidates).toHaveLength(2);
    expect(new Set(facts.candidates.map(item => item.phase))).toEqual(
      new Set(["waxing_crescent"])
    );
    expect(facts.candidates[0].moonAgeDays).toBeLessThan(facts.candidates[1].moonAgeDays);
  });

  it("preserves both phase candidates when an unknown-time civil date crosses a sector boundary", () => {
    const facts = buildBaziBirthMoonPhaseFacts(chart({
      birthDate: "2024-03-12",
      birthTime: "",
      unknownTime: true
    }));

    expect(facts.certainty).toBe("uncertain");
    expect(facts.phase).toBeNull();
    expect(facts.candidates.map(item => item.phase)).toEqual([
      "new_moon",
      "waxing_crescent"
    ]);
  });

  it("returns unavailable without guessing when the source birth instant is invalid", () => {
    const invalid = structuredClone(chart()) as BaziChart;
    invalid.inputSnapshot.birthDate = "invalid";
    const facts = buildBaziBirthMoonPhaseFacts(invalid);

    expect(facts).toMatchObject({
      certainty: "unavailable",
      birthInstantUtc: null,
      elongationDegrees: null,
      moonAgeDays: null,
      phase: null,
      previousNewMoonAtUtc: null,
      nextNewMoonAtUtc: null,
      lunationLengthDays: null,
      candidates: [],
      unavailableReason: "calculation_failed"
    });
  });
});

describe("eight-phase elongation classification", () => {
  it.each([
    [0, "new_moon"],
    [22.499, "new_moon"],
    [22.5, "waxing_crescent"],
    [67.5, "first_quarter"],
    [112.5, "waxing_gibbous"],
    [157.5, "full_moon"],
    [202.5, "waning_gibbous"],
    [247.5, "last_quarter"],
    [292.5, "waning_crescent"],
    [337.5, "new_moon"],
    [360, "new_moon"],
    [-22.5, "new_moon"]
  ] as const)("classifies %s degrees as %s", (angle, phase) => {
    expect(classifyMoonPhase(angle)).toBe(phase);
  });
});
