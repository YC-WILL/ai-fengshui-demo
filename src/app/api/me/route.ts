import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOrCreateUser, bindEmail } from "@/lib/auth";
import { getMembershipStatus, MEMBERSHIP_COOKIE_NAME } from "@/lib/membership";
import { COMPANION_PROFILE_REPORT_TYPE, COMPANION_TURN_REPORT_TYPE } from "@/lib/companion/core";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const [reports, signs] = await Promise.all([
      prisma.report.findMany({
        where: {
          userId: user.id,
          reportType: { notIn: ["daily_sign", COMPANION_PROFILE_REPORT_TYPE, COMPANION_TURN_REPORT_TYPE] }
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, reportType: true, status: true, isPaid: true,
          createdAt: true
        }
      }),
      prisma.report.findMany({
        where: { userId: user.id, reportType: "daily_sign" },
        orderBy: { createdAt: "desc" },
        select: { id: true, aiResult: true, createdAt: true }
      })
    ]);
    return NextResponse.json({
      ok: true,
      data: {
        user: { id: user.id, email: user.email, nickname: user.nickname },
        reports,
        signs,
        membership: getMembershipStatus()
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: "历史记录服务暂时不可用，请稍后重试。" }, { status: 503 });
  }
}

const patchSchema = z.object({
  email: z.string().email().optional(),
  nickname: z.string().min(1).max(40).optional()
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
    const data: Record<string, string> = {};
    if (parsed.data.email) await bindEmail(user.id, parsed.data.email);
    if (parsed.data.nickname) data.nickname = parsed.data.nickname;
    if (Object.keys(data).length > 0) await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "账户信息暂时无法保存，请稍后重试。" }, { status: 503 });
  }
}

// 用户行使「数据删除权」：清空账户下的所有数据（合规层）
export async function DELETE() {
  try {
    const user = await getOrCreateUser();
    await prisma.user.delete({ where: { id: user.id } });
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(MEMBERSHIP_COOKIE_NAME);
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "账户数据暂时无法删除，请稍后重试。" }, { status: 503 });
  }
}
