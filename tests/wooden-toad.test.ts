import { describe, expect, it } from "vitest";
import {
  woodenToadIntensity,
  woodenToadStrengthLabel,
  woodenToadReaction,
  woodenToadVibration,
  woodenToadVolume
} from "@/lib/domain/woodenToad";
import { readFileSync } from "node:fs";

const component = readFileSync("src/components/WoodenToad.tsx", "utf8");

describe("wooden toad feedback", () => {
  it("makes longer holds stronger", () => {
    expect(woodenToadIntensity(50)).toBeLessThan(woodenToadIntensity(700));
    expect(woodenToadIntensity(700)).toBeLessThan(woodenToadIntensity(1400));
  });

  it("uses real pressure when the device supplies it", () => {
    expect(woodenToadIntensity(20, 0.9)).toBeCloseTo(0.9);
  });

  it("keeps sound and vibration within safe bounded levels", () => {
    expect(woodenToadVolume(0.7, 0.2)).toBeGreaterThan(0);
    expect(woodenToadVolume(2, 2)).toBe(1);
    expect(woodenToadVibration(0.9)).toEqual([38, 18, 28]);
    expect(woodenToadStrengthLabel(0.2)).toBe("轻响");
    expect(woodenToadStrengthLabel(0.6)).toBe("稳响");
    expect(woodenToadStrengthLabel(0.9)).toBe("深响");
  });

  it("gives each strength a gentle, non-painful reaction", () => {
    expect(woodenToadReaction(0.2)).toMatchObject({ mood: "gentle", label: "小口接住" });
    expect(woodenToadReaction(0.6)).toMatchObject({ mood: "steady", label: "慢嚼团子" });
    expect(woodenToadReaction(0.9)).toMatchObject({ mood: "lively", label: "接住饭团" });
    [0.2, 0.6, 0.9].forEach(intensity => {
      expect(woodenToadReaction(intensity).reply).not.toMatch(/疼|痛|受伤|生气/);
    });
  });

  it("preloads and decodes the toad artwork before opening the dialog", () => {
    expect(component).toContain("WOODEN_TOAD_ASSETS");
    expect(component).toContain("void preloadImages(WOODEN_TOAD_ASSETS)");
    expect(component).toContain("await preloadImages(WOODEN_TOAD_ASSETS)");
    expect(component.indexOf("await preloadImages(WOODEN_TOAD_ASSETS)")).toBeLessThan(
      component.indexOf("setOpen(true)")
    );
  });
});
