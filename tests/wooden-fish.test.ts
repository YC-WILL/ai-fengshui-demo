import { describe, expect, it } from "vitest";
import {
  woodenFishIntensity,
  woodenFishStrengthLabel,
  woodenFishVibration,
  woodenFishVolume
} from "@/lib/domain/woodenFish";

describe("wooden fish feedback", () => {
  it("makes longer holds stronger", () => {
    expect(woodenFishIntensity(50)).toBeLessThan(woodenFishIntensity(700));
    expect(woodenFishIntensity(700)).toBeLessThan(woodenFishIntensity(1400));
  });

  it("uses real pressure when the device supplies it", () => {
    expect(woodenFishIntensity(20, 0.9)).toBeCloseTo(0.9);
  });

  it("keeps sound and vibration within safe bounded levels", () => {
    expect(woodenFishVolume(0.7, 0.2)).toBeGreaterThan(0);
    expect(woodenFishVolume(2, 2)).toBe(1);
    expect(woodenFishVibration(0.9)).toEqual([38, 18, 28]);
    expect(woodenFishStrengthLabel(0.2)).toBe("轻响");
    expect(woodenFishStrengthLabel(0.6)).toBe("稳响");
    expect(woodenFishStrengthLabel(0.9)).toBe("深响");
  });
});
