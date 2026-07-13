import { cookies } from "next/headers";
import type { MembershipPlan } from "./types";

// MVP mock：用 httpOnly cookie 演示会员体验，不涉及真实扣款。
// 正式订阅应改为数据库权益 + 支付回调校验，不能依赖客户端 cookie。
export const MEMBERSHIP_COOKIE_NAME = "guaan_membership";

export interface MembershipStatus {
  active: boolean;
  plan: MembershipPlan | null;
  expiresAt: string | null;
}

interface StoredMembership {
  plan: MembershipPlan;
  expiresAt: string;
}

export function membershipExpiry(plan: MembershipPlan, now = new Date()): Date {
  const expires = new Date(now);
  if (plan === "annual") {
    expires.setFullYear(expires.getFullYear() + 1);
  } else {
    expires.setMonth(expires.getMonth() + 1);
  }
  return expires;
}

export function encodeMembership(plan: MembershipPlan, expiresAt: Date): string {
  const stored: StoredMembership = { plan, expiresAt: expiresAt.toISOString() };
  return Buffer.from(JSON.stringify(stored), "utf8").toString("base64url");
}

export function parseMembership(value: string | undefined, now = new Date()): MembershipStatus {
  if (!value) return { active: false, plan: null, expiresAt: null };
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<StoredMembership>;
    if ((parsed.plan !== "monthly" && parsed.plan !== "annual") || !parsed.expiresAt) {
      return { active: false, plan: null, expiresAt: null };
    }
    const expiresAt = new Date(parsed.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) {
      return { active: false, plan: parsed.plan, expiresAt: parsed.expiresAt };
    }
    return { active: true, plan: parsed.plan, expiresAt: parsed.expiresAt };
  } catch {
    return { active: false, plan: null, expiresAt: null };
  }
}

export function getMembershipStatus(): MembershipStatus {
  return parseMembership(cookies().get(MEMBERSHIP_COOKIE_NAME)?.value);
}
