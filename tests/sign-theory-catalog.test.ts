import { describe, expect, it } from "vitest";
import {
  SIGN_DIRECTIONS,
  SIGN_DOMAINS,
  SIGN_ENTRIES,
  SIGN_METHOD_RULES,
  SIGN_PERIOD_PROFILES,
  SIGN_SYSTEM
} from "../src/lib/knowledge/signTheoryCatalog";

describe("professional sign theory foundation", () => {
  it("maps one sign to every canonical Zhouyi hexagram", () => {
    expect(SIGN_SYSTEM.drawCount).toBe(64);
    expect(SIGN_ENTRIES).toHaveLength(64);
    expect(new Set(SIGN_ENTRIES.map(item => item.number))).toEqual(new Set(Array.from({ length: 64 }, (_, index) => index + 1)));
    expect(new Set(SIGN_ENTRIES.map(item => item.hexagramNumber)).size).toBe(64);
  });

  it("uses only declared directions", () => {
    const codes = new Set(SIGN_DIRECTIONS.map(item => item.code));
    expect(codes.size).toBe(8);
    for (const entry of SIGN_ENTRIES) {
      expect(codes.has(entry.primaryDirectionCode)).toBe(true);
      if (entry.secondaryDirectionCode) expect(codes.has(entry.secondaryDirectionCode)).toBe(true);
    }
  });

  it("defines the four non-overlapping daily periods", () => {
    expect(SIGN_PERIOD_PROFILES).toHaveLength(4);
    const coverage = Array.from({ length: 1440 }, () => 0);
    for (const period of SIGN_PERIOD_PROFILES) {
      for (let minute = 0; minute < 1440; minute += 1) {
        const contains = period.crossesMidnight
          ? minute >= period.startMinute || minute <= period.endMinute
          : minute >= period.startMinute && minute <= period.endMinute;
        if (contains) coverage[minute] += 1;
      }
    }
    expect(coverage.every(count => count === 1)).toBe(true);
  });

  it("supports interaction domains and stable draw rules", () => {
    expect(SIGN_DOMAINS).toHaveLength(7);
    expect(SIGN_DOMAINS.every(item => item.clarifyingQuestions.length >= 2)).toBe(true);
    expect(SIGN_METHOD_RULES).toHaveLength(9);
    expect(SIGN_METHOD_RULES.find(item => item.code === "secure_random")?.rule).toMatchObject({
      algorithm: "crypto.randomInt",
      clientRandomForbidden: true
    });
    expect(SIGN_METHOD_RULES.find(item => item.code === "immutable_draw")?.rule).toMatchObject({
      interpretationUsesStoredSign: true,
      redrawDuringConversation: false
    });
  });
});
