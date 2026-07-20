import { describe, expect, it } from "vitest";
import { buildBirthVisual } from "@/lib/domain/birthVisual";

describe("birth visual", () => {
  it("uses the birth day stem as body and today's stem as use", () => {
    const visual = buildBirthVisual({ birthDate: "1986-05-29" }, "2026-07-20");
    expect(visual.birthDayPillar).toBe("癸酉");
    expect(visual.todayDayPillar).toBe("乙未");
    expect(visual.bodyTrigram).toMatchObject({ id: "kan", name: "坎", binary: "010" });
    expect(visual.useTrigram).toMatchObject({ id: "xun", name: "巽", binary: "011" });
    expect(visual.hexagramBinary).toBe("010011");
  });

  it("keeps the five element structure complete and proportional", () => {
    const visual = buildBirthVisual({ birthDate: "2000-01-01", birthTime: "12:00" }, "2026-07-20");
    expect(visual.elements.map(item => item.element)).toEqual(["木", "火", "土", "金", "水"]);
    expect(visual.elements.reduce((sum, item) => sum + item.count, 0)).toBe(8);
    expect(visual.elements.reduce((sum, item) => sum + item.ratio, 0)).toBeCloseTo(1);
    expect(visual.pillars).toHaveLength(4);
  });

  it("omits the hour pillar when the birth time is uncertain", () => {
    const visual = buildBirthVisual({ birthDate: "1986-05-29" }, "2026-07-20");
    expect(visual.hourKnown).toBe(false);
    expect(visual.pillars).toHaveLength(3);
    expect(visual.methodNote).toMatch(/固定展示口径|不替代其他起卦法/);
    expect(JSON.stringify(visual)).not.toMatch(/注定|保证|吉凶结论|心理诊断/);
  });
});
