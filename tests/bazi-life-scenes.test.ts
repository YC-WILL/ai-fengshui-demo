import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziLifeScenes } from "@/lib/domain/baziLifeScenes";

function chart(birthDate: string, birthTime = "", unknownTime = true) {
  return computeBazi({
    gender: "other",
    birthDate,
    birthTime,
    timezone: "Asia/Shanghai",
    unknownTime
  });
}

describe("bazi life scenes", () => {
  it("builds four readable scenes with three moments and traceable evidence", () => {
    const scenes = buildBaziLifeScenes(chart("2006-10-03"));

    expect(scenes.map(scene => scene.id)).toEqual(["social", "solitude", "work", "own_time"]);
    expect(scenes.every(scene => scene.moments.length === 3)).toBe(true);
    expect(scenes.every(scene => scene.evidence.length >= 5)).toBe(true);
    expect(scenes.flatMap(scene => scene.evidence).join(" ")).toMatch(/日主|月令|年柱|月柱|日柱/);
  });

  it("creates different life stories from different combined charts", () => {
    const first = buildBaziLifeScenes(chart("2006-10-03"));
    const second = buildBaziLifeScenes(chart("2000-06-30"));

    expect(first.find(scene => scene.id === "work")?.lead).not.toBe(second.find(scene => scene.id === "work")?.lead);
    expect(first.find(scene => scene.id === "work")?.moments).not.toEqual(second.find(scene => scene.id === "work")?.moments);
    expect(first.find(scene => scene.id === "solitude")?.moments).not.toEqual(second.find(scene => scene.id === "solitude")?.moments);
  });

  it("keeps the same chart stable and lets a known hour add real evidence", () => {
    const first = buildBaziLifeScenes(chart("2006-10-03"));
    const repeated = buildBaziLifeScenes(chart("2006-10-03"));
    const withHour = buildBaziLifeScenes(chart("2006-10-03", "09:00", false));

    expect(first).toEqual(repeated);
    expect(first).not.toEqual(withHour);
    expect(first.flatMap(scene => scene.evidence).join(" ")).toMatch(/时柱没有补猜/);
    expect(withHour.flatMap(scene => scene.evidence).join(" ")).toMatch(/时柱：.*已参与/);
  });

  it("does not ask users to judge accuracy or use diagnostic and fatalistic language", () => {
    const text = JSON.stringify(buildBaziLifeScenes(chart("2006-10-03")));

    expect(text).not.toMatch(/像不像|准不准|很像我|不太像我|请选择|反馈/);
    expect(text).not.toMatch(/你就是|一定|必然|注定|保证|焦虑症|抑郁症|人格障碍/);
    expect(text).not.toContain("？");
  });
});
