import { describe, expect, it } from "vitest";
import { PROFILE_GENDER_OPTIONS, normalizeProfileGender, profileGenderLabel } from "@/lib/profileGender";
import { computeBazi } from "@/lib/domain/bazi";

describe("saved birth profile gender", () => {
  it("offers male, female and a non-forced option", () => {
    expect(PROFILE_GENDER_OPTIONS.map(option => option.value)).toEqual(["male", "female", "other"]);
    expect(profileGenderLabel("other")).toBe("暂不填写");
  });

  it("keeps old profiles without gender compatible", () => {
    expect(normalizeProfileGender(null)).toBe("other");
    expect(normalizeProfileGender(undefined)).toBe("other");
    expect(normalizeProfileGender("legacy-value")).toBe("other");
  });

  it("does not change the four pillars for the same birth data", () => {
    const base = { birthDate: "2006-10-03", birthTime: "09:00", unknownTime: false };
    const male = computeBazi({ ...base, gender: "male" });
    const female = computeBazi({ ...base, gender: "female" });

    expect([male.year, male.month, male.day, male.hour]).toEqual([
      female.year,
      female.month,
      female.day,
      female.hour
    ]);
  });
});
