import type { Gender } from "@/lib/types";

export const PROFILE_GENDER_OPTIONS = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "other", label: "暂不填写" }
] as const satisfies ReadonlyArray<{ value: Gender; label: string }>;

export function normalizeProfileGender(value: string | null | undefined): Gender {
  return value === "male" || value === "female" ? value : "other";
}

export function profileGenderLabel(value: string | null | undefined): string {
  return PROFILE_GENDER_OPTIONS.find(option => option.value === normalizeProfileGender(value))?.label ?? "暂不填写";
}
