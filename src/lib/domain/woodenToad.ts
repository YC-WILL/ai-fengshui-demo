export function woodenToadIntensity(holdMs: number, pressure?: number): number {
  const holdIntensity = 0.22 + Math.min(Math.max(holdMs, 0), 1400) / 1400 * 0.78;
  const pressureIntensity = pressure == null ? 0 : Math.min(Math.max(pressure, 0), 1);
  return Math.min(1, Math.max(holdIntensity, pressureIntensity));
}

export function woodenToadVolume(masterVolume: number, intensity: number): number {
  const master = Math.min(1, Math.max(0, masterVolume));
  const strength = Math.min(1, Math.max(0, intensity));
  return master * (0.16 + strength * 0.84);
}

export function woodenToadVibration(intensity: number): number[] {
  if (intensity >= 0.8) return [38, 18, 28];
  if (intensity >= 0.5) return [30];
  return [18];
}

export function woodenToadStrengthLabel(intensity: number): string {
  if (intensity >= 0.8) return "深响";
  if (intensity >= 0.5) return "稳响";
  return "轻响";
}

export type WoodenToadMood = "gentle" | "steady" | "lively";

export function woodenToadReaction(intensity: number): {
  mood: WoodenToadMood;
  label: string;
  reply: string;
} {
  if (intensity >= 0.8) {
    return { mood: "lively", label: "惊喜一跃", reply: "它睁圆眼睛，轻轻弹了一下，又安稳坐好。" };
  }
  if (intensity >= 0.5) {
    return { mood: "steady", label: "鼓腮回应", reply: "它鼓了鼓圆脸，稳稳陪你响了一声。" };
  }
  return { mood: "gentle", label: "眯眼点头", reply: "它轻轻点了点头，像是在说：听见了。" };
}
