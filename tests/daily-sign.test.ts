import { describe, expect, it } from "vitest";
import {
  getSignCandidates,
  getSignDateKey,
  getSignPeriod,
  type SignPeriod
} from "@/lib/domain/dailySign";

function at(hour: number, minute = 0) {
  return new Date(2026, 6, 14, hour, minute, 0);
}

describe("daily sign", () => {
  it("uses the requested four time periods", () => {
    expect(getSignPeriod(at(6))).toBe("morning");
    expect(getSignPeriod(at(10, 59))).toBe("morning");
    expect(getSignPeriod(at(11))).toBe("noon");
    expect(getSignPeriod(at(12, 59))).toBe("noon");
    expect(getSignPeriod(at(13))).toBe("afternoon");
    expect(getSignPeriod(at(16, 59))).toBe("afternoon");
    expect(getSignPeriod(at(17))).toBe("evening");
    expect(getSignPeriod(at(5, 59))).toBe("evening");
  });

  it("keeps after-midnight evening signs on the previous date", () => {
    expect(getSignDateKey(at(1))).toBe("2026-07-13");
    expect(getSignDateKey(at(6))).toBe("2026-07-14");
  });

  it("provides 96 concise, non-fatalistic sign variants", () => {
    const periods: SignPeriod[] = ["morning", "noon", "afternoon", "evening"];
    const signs = periods.flatMap(getSignCandidates);
    expect(signs).toHaveLength(96);
    signs.forEach(sign => {
      expect(Array.from(sign.word)).toHaveLength(2);
      expect(sign.message.length).toBeGreaterThan(15);
      expect(sign.message).not.toMatch(/一定|必然|注定|保证|大吉|大凶|发财|改运/);
    });
  });
});
