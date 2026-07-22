import { describe, expect, it } from "vitest";
import { SOLAR_TERM_SCENES, solarTermScene } from "@/lib/product/solarTermScenes";

describe("solar term scenes", () => {
  it("maps all 24 solar terms to one supplied scene", () => {
    expect(SOLAR_TERM_SCENES).toHaveLength(24);
    expect(new Set(SOLAR_TERM_SCENES.map(scene => scene.name)).size).toBe(24);
    expect(new Set(SOLAR_TERM_SCENES.map(scene => scene.crop.join(","))).size).toBe(24);
  });

  it("selects the correct midsummer scene", () => {
    expect(solarTermScene("小暑")).toMatchObject({
      name: "小暑",
      note: "暑气渐盛，荷风带来清意"
    });
  });

  it("keeps every crop inside the supplied 1536 by 1024 image", () => {
    for (const scene of SOLAR_TERM_SCENES) {
      const [x, y, width, height] = scene.crop;
      expect(x + width).toBeLessThanOrEqual(1536);
      expect(y + height).toBeLessThanOrEqual(1024);
    }
  });
});
