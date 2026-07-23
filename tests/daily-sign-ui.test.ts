import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync("src/components/DailySignDraw.tsx", "utf8");
const styles = readFileSync("src/app/globals.css", "utf8");

describe("daily sign ritual animation", () => {
  it("shows the redesigned cylinder and the complete staged draw ritual", () => {
    expect(component).toContain("/images/sign-draw/cylinder-v2.png");
    expect(component).toContain("/images/sign-draw/stick-v2.png");
    expect(component).toContain('setPhase("shaking")');
    expect(component).toContain('setPhase("dropping")');
    expect(component).toContain('setPhase("materializing")');
    expect(component).toContain('setPhase("revealed")');
    expect(component.indexOf('setPhase("shaking")')).toBeLessThan(component.indexOf('setPhase("dropping")'));
    expect(component.indexOf('setPhase("dropping")')).toBeLessThan(component.indexOf('setPhase("materializing")'));
    expect(component.indexOf('setPhase("materializing")')).toBeLessThan(component.indexOf('setPhase("revealed")'));
    expect(styles).toContain("@keyframes daily-sign-shake");
    expect(styles).toContain("@keyframes daily-sign-stick-fall");
    expect(styles).toContain("@keyframes daily-sign-materialize");
  });

  it("keeps every animation stage visible for a fixed minimum duration", () => {
    expect(component).toContain("shaking: 1200");
    expect(component).toContain("dropping: 1000");
    expect(component).toContain("materializing: 1000");
    expect(component).toContain("await waitForAnimation(DRAW_ANIMATION_MS.shaking)");
    expect(component).toContain("await waitForAnimation(DRAW_ANIMATION_MS.dropping)");
    expect(component).toContain("await waitForAnimation(DRAW_ANIMATION_MS.materializing)");
  });

  it("uses composed transforms and eased settling instead of a repeating hard shake", () => {
    expect(styles).toContain("@keyframes daily-sign-cylinder-settle");
    expect(styles).toContain("@keyframes daily-sign-caption-in");
    expect(styles).toContain("translate3d");
    expect(styles).toContain("will-change: transform");
    expect(styles).not.toContain("daily-sign-shake 180ms ease-in-out infinite");
  });

  it("preloads and decodes the cylinder and stick before opening the dialog", () => {
    expect(component).toContain("SIGN_DRAW_ASSETS");
    expect(component).toContain("void preloadImages(SIGN_DRAW_ASSETS)");
    expect(component).toContain("await preloadImages(SIGN_DRAW_ASSETS)");
    expect(component.indexOf("await preloadImages(SIGN_DRAW_ASSETS)")).toBeLessThan(
      component.indexOf("setOpen(true)")
    );
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
    expect(styles).toContain("daily-sign-materialize-reduced");
  });
});
