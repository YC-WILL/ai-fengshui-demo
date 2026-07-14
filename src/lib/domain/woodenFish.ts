export function woodenFishIntensity(holdMs: number, pressure?: number): number {
  const holdIntensity = 0.22 + Math.min(Math.max(holdMs, 0), 1400) / 1400 * 0.78;
  const pressureIntensity = pressure == null ? 0 : Math.min(Math.max(pressure, 0), 1);
  return Math.min(1, Math.max(holdIntensity, pressureIntensity));
}

export function woodenFishVolume(masterVolume: number, intensity: number): number {
  const master = Math.min(1, Math.max(0, masterVolume));
  const strength = Math.min(1, Math.max(0, intensity));
  return master * (0.16 + strength * 0.84);
}

export function woodenFishVibration(intensity: number): number[] {
  if (intensity >= 0.8) return [38, 18, 28];
  if (intensity >= 0.5) return [30];
  return [18];
}

export function woodenFishStrengthLabel(intensity: number): string {
  if (intensity >= 0.8) return "深响";
  if (intensity >= 0.5) return "稳响";
  return "轻响";
}
