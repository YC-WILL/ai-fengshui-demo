import { describe, it, expect } from "vitest";
import { matchMarriage } from "@/lib/domain/marriage";

const A = { gender: "male" as const, birthDate: "1992-04-10", birthTime: "08:30", unknownTime: false };
const B = { gender: "female" as const, birthDate: "1994-09-22", birthTime: "16:00", unknownTime: false };

describe("matchMarriage", () => {
  it("returns structured match with strengths and frictionPoints", () => {
    const m = matchMarriage({ partyA: A, partyB: B });
    expect(m.partyA.dayMaster).toMatch(/[甲乙丙丁戊己庚辛壬癸]/);
    expect(m.partyB.dayMaster).toMatch(/[甲乙丙丁戊己庚辛壬癸]/);
    expect(m.communicationStyle).toBeTypeOf("string");
    expect(Array.isArray(m.strengths)).toBe(true);
    expect(Array.isArray(m.frictionPoints)).toBe(true);
    expect(m.suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it("never claims definitive 必合 or 必分", () => {
    const m = matchMarriage({ partyA: A, partyB: B });
    const allText = JSON.stringify(m);
    expect(allText).not.toMatch(/必合|必分手|必离婚|必出轨/);
  });

  it("notes is non-empty (caveat included)", () => {
    const m = matchMarriage({ partyA: A, partyB: B });
    expect(m.notes.length).toBeGreaterThan(0);
    expect(m.notes.join(" ")).toMatch(/参考|没有/);
  });
});
