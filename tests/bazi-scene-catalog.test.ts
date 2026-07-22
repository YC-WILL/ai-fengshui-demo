import { describe, expect, it } from "vitest";
import {
  BAZI_SCENE_METHOD_RULES,
  TEN_GOD_BEHAVIOR_ATOMS
} from "@/lib/knowledge/baziSceneCatalog";
import { syncBaziSceneKnowledge } from "@/lib/knowledge/baziSceneSync";

describe("Bazi scene knowledge catalog", () => {
  it("contains exact ten-god behavior atoms for all four scenes", () => {
    expect(Object.keys(TEN_GOD_BEHAVIOR_ATOMS)).toHaveLength(10);
    Object.values(TEN_GOD_BEHAVIOR_ATOMS).forEach(atom => {
      expect(Object.keys(atom.focus).sort()).toEqual(["own_time", "social", "solitude", "work"]);
      expect(`${atom.entry}${atom.active}${atom.pressure}`).not.toMatch(/一定|必然|注定|保证|人格障碍|抑郁症|焦虑症/);
    });
  });

  it("syncs versioned scene rules without changing the database schema", async () => {
    const upserts: Array<Record<string, unknown>> = [];
    const updates: Array<Record<string, unknown>> = [];
    const count = await syncBaziSceneKnowledge({
      traditionalMethodRule: {
        upsert: async (args: Record<string, unknown>) => { upserts.push(args); return args; },
        updateMany: async (args: Record<string, unknown>) => { updates.push(args); return { count: 0 }; }
      }
    } as never);

    expect(count).toBe(BAZI_SCENE_METHOD_RULES.length);
    expect(upserts).toHaveLength(BAZI_SCENE_METHOD_RULES.length);
    expect(JSON.stringify(upserts)).toContain("bazi_life_scene");
    expect(updates).toEqual([expect.objectContaining({ data: { isActive: false } })]);
  });
});
