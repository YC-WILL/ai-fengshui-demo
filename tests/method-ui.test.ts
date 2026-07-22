import { readFileSync } from "node:fs";
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

  it("presents the frozen Bazi and relationship plates with their actual reading order", () => {
    const baziPage = readFileSync("src/app/bazi/page.tsx", "utf8");
    const relationshipPage = readFileSync("src/app/marriage/page.tsx", "utf8");
    const workspaces = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
    const baziWorkspace = workspaces.slice(workspaces.indexOf("export function BaziWorkspace"), workspaces.indexOf("export function RelationWorkspace"));
    const relationshipWorkspace = workspaces.slice(workspaces.indexOf("export function RelationWorkspace"), workspaces.indexOf("const ROOMS"));

    expect(baziPage).toContain('status="1.0 已冻结"');
    expect(baziPage).toContain("先看三项生活观察");
    expect(baziPage).toContain("再看专业命盘");
    expect(baziPage).toContain("最后对照时间");
    expect(baziWorkspace.indexOf("bazi-observations")).toBeLessThan(baziWorkspace.indexOf("bazi-chart-workbench"));
    expect(baziWorkspace.indexOf("bazi-chart-workbench")).toBeLessThan(baziWorkspace.indexOf("bazi-time-comparison"));

    expect(relationshipPage).toContain('status="1.0 已冻结"');
    expect(relationshipPage).toContain("先看三种互动");
    expect(relationshipPage).toContain("一起试一个动作");
    expect(relationshipPage).toContain("再查双方日柱");
    expect(relationshipWorkspace.indexOf("relationship-setup")).toBeLessThan(relationshipWorkspace.indexOf("relationship-card-grid"));
    expect(relationshipWorkspace.indexOf("relationship-card-grid")).toBeLessThan(relationshipWorkspace.indexOf("relationship-joint-action"));
    expect(relationshipWorkspace.indexOf("relationship-joint-action")).toBeLessThan(relationshipWorkspace.indexOf("relationship-professional"));
  });
});
