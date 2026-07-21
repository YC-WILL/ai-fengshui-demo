import { describe, expect, it } from "vitest";
import { DATE_EVENTS, METHOD_MODULES, RELATION_DIMENSIONS } from "@/lib/product/methodUi";

describe("four plate product UI", () => {
  it("keeps four distinct, routable product modules", () => {
    expect(METHOD_MODULES.map(module => module.id)).toEqual(["bazi", "relation", "home", "timing"]);
    expect(new Set(METHOD_MODULES.map(module => module.href)).size).toBe(4);
    expect(METHOD_MODULES.every(module => module.basis.length > 0 && module.description.length > 0)).toBe(true);
  });

  it("uses structure dimensions instead of scores for relationships", () => {
    expect(RELATION_DIMENSIONS).toHaveLength(4);
    expect(JSON.stringify(RELATION_DIMENSIONS)).not.toMatch(/评分|匹配分|适不适合|注定|保证/);
  });

  it("gives each supported date event its own selectable entry", () => {
    expect(DATE_EVENTS.map(event => event.id)).toEqual([
      "wedding", "moving", "opening", "signing", "travel", "renovation_start"
    ]);
  });
});
