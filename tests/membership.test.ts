import { describe, expect, it } from "vitest";
import {
  encodeMembership, membershipExpiry, parseMembership
} from "@/lib/membership";
import { isMemberReportType } from "@/lib/types";

describe("membership", () => {
  const now = new Date("2026-07-13T00:00:00.000Z");

  it("encodes and reads an active monthly membership", () => {
    const expires = membershipExpiry("monthly", now);
    const status = parseMembership(encodeMembership("monthly", expires), now);
    expect(status).toEqual({
      active: true,
      plan: "monthly",
      expiresAt: expires.toISOString()
    });
  });

  it("treats expired or malformed membership data as inactive", () => {
    const expired = new Date("2026-07-12T00:00:00.000Z");
    expect(parseMembership(encodeMembership("annual", expired), now).active).toBe(false);
    expect(parseMembership("not-valid", now)).toEqual({
      active: false,
      plan: null,
      expiresAt: null
    });
  });

  it("keeps all basic reports free and deep reports member-only", () => {
    expect(isMemberReportType("bazi_basic")).toBe(false);
    expect(isMemberReportType("marriage_basic")).toBe(false);
    expect(isMemberReportType("home_fengshui_basic")).toBe(false);
    expect(isMemberReportType("date_selection_basic")).toBe(false);
    expect(isMemberReportType("bazi_deep")).toBe(true);
    expect(isMemberReportType("marriage_deep")).toBe(true);
    expect(isMemberReportType("home_fengshui_deep")).toBe(true);
    expect(isMemberReportType("date_selection")).toBe(true);
  });
});
