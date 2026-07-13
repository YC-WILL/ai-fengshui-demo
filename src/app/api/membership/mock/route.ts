import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import {
  MEMBERSHIP_COOKIE_NAME, encodeMembership, membershipExpiry
} from "@/lib/membership";
import { MEMBERSHIP_PRICING } from "@/lib/types";

const schema = z.object({ plan: z.enum(["monthly", "annual"]) });

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });

  const plan = parsed.data.plan;
  const expiresAt = membershipExpiry(plan);
  const response = NextResponse.json({
    ok: true,
    data: {
      plan,
      expiresAt: expiresAt.toISOString(),
      amountFen: MEMBERSHIP_PRICING[plan].amountFen,
      mock: true
    }
  });
  response.cookies.set(MEMBERSHIP_COOKIE_NAME, encodeMembership(plan, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
  return response;
}
