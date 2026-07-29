import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

describe("server-generated ProfessionalBaziFactsV1", () => {
  it("uses the actual injected calculation instant and is stable for the same fictitious profile", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1992-08-17",
      birthTime: "14:20",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const calculatedAt = new Date("2026-07-29T07:18:42.321Z");

    const first = buildProfessionalBaziFactsOnServer(chart, calculatedAt);
    const second = buildProfessionalBaziFactsOnServer(chart, calculatedAt);

    expect(first).toEqual(second);
    expect(first.professionalFacts.versions.calculatedAt.value).toBe("2026-07-29T07:18:42.321Z");
    expect(first.professionalFacts.versions.calculatedAt.value).not.toBe("2026-07-29T04:00:00.000Z");
    expect(first.timeLayers).toHaveLength(3);
    expect(first.professionalFacts.timeFacts).toHaveLength(3);
  });
});
