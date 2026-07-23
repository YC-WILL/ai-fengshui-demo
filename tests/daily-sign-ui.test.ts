import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync("src/components/DailySignDraw.tsx", "utf8");
const styles = readFileSync("src/app/globals.css", "utf8");

describe("daily sign ritual animation", () => {
  it("keeps the cylinder shake and the falling sign slip", () => {
    expect(component).toContain("is-shaking");
    expect(component).toContain("daily-sign-slip-result");
    expect(component).toContain("daily-sign-slip");
    expect(styles).toContain("@keyframes daily-sign-shake");
    expect(styles).toContain("@keyframes daily-sign-slip-drop");
  });

  it("keeps original-sign lookup invisible and lets the draw endpoint return it", () => {
    expect(component).toContain("取回本时段原签，不重新抽取");
    expect(component).not.toContain("正在查看本时段原签");
    expect(component).not.toContain("/api/signs/current");
    expect(component).not.toContain("点击签筒取回原签");
    expect(component).toContain("fetchReport(\"/api/signs/draw\"");
    expect(component).not.toContain("再求一签");
  });

  it("respects reduced-motion preferences", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toMatch(/daily-sign-slip-result[\s\S]*animation: none/);
  });
});
