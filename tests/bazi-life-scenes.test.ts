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

function bigramSimilarity(first: string, second: string) {
  const grams = (text: string) => new Set(Array.from({ length: Math.max(0, text.length - 1) }, (_, index) => text.slice(index, index + 2)));
  const firstGrams = grams(first);
  const secondGrams = grams(second);
  const shared = [...firstGrams].filter(item => secondGrams.has(item)).length;
  return shared / (firstGrams.size + secondGrams.size - shared);
}

describe("bazi life scenes", () => {
  it("builds four readable scenes with three moments and traceable evidence", () => {
    const scenes = buildBaziLifeScenes(chart("2006-10-03"));

    expect(scenes.map(scene => scene.id)).toEqual(["social", "solitude", "work", "own_time"]);
    expect(scenes.every(scene => scene.moments.length === 3)).toBe(true);
    expect(scenes.every(scene => scene.evidence.length >= 5)).toBe(true);
    expect(scenes.every(scene => scene.fingerprint.length > 40)).toBe(true);
    expect(scenes.flatMap(scene => scene.evidence).join(" ")).toMatch(/日主|月令|年柱|月柱|日柱/);
  });

  it("creates different life stories from different combined charts", () => {
    const first = buildBaziLifeScenes(chart("2006-10-03"));
    const second = buildBaziLifeScenes(chart("2000-06-30"));

    expect(first.find(scene => scene.id === "work")?.lead).not.toBe(second.find(scene => scene.id === "work")?.lead);
    expect(first.find(scene => scene.id === "work")?.moments).not.toEqual(second.find(scene => scene.id === "work")?.moments);
    expect(first.find(scene => scene.id === "solitude")?.moments).not.toEqual(second.find(scene => scene.id === "solitude")?.moments);
  });

  it("keeps three different family-like profiles visibly different in every scene", () => {
    const profiles = [
      chart("1963-04-18", "07:30", false),
      chart("1988-11-02", "22:10", false),
      chart("1966-09-27", "14:20", false)
    ].map(buildBaziLifeScenes);

    ["social", "solitude", "work", "own_time"].forEach(sceneId => {
      const stories = profiles.map(scenes => {
        const scene = scenes.find(item => item.id === sceneId);
        return `${scene?.lead ?? ""}${scene?.moments.map(moment => `${moment.title}${moment.body}`).join("") ?? ""}`;
      });
      expect(new Set(stories).size).toBe(3);
      expect(bigramSimilarity(stories[0], stories[1])).toBeLessThan(0.58);
      expect(bigramSimilarity(stories[0], stories[2])).toBeLessThan(0.58);
      expect(bigramSimilarity(stories[1], stories[2])).toBeLessThan(0.58);
    });
  });

  it("avoids exact story collisions across a broad date-and-hour sample", () => {
    const stories = new Set<string>();
    const fingerprints = new Set<string>();
    const start = Date.UTC(1970, 0, 1);

    for (let index = 0; index < 96; index += 1) {
      const birthDate = new Date(start + index * 137 * 86400000).toISOString().slice(0, 10);
      const birthTime = `${String((index * 5) % 24).padStart(2, "0")}:30`;
      buildBaziLifeScenes(chart(birthDate, birthTime, false)).forEach(scene => {
        stories.add(JSON.stringify({ id: scene.id, lead: scene.lead, moments: scene.moments }));
        fingerprints.add(scene.fingerprint);
      });
    }

    expect(stories.size).toBeGreaterThan(340);
    expect(fingerprints.size).toBeGreaterThan(370);
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
