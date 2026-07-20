import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDailyCorrespondence } from "@/lib/domain/dailyCorrespondence";
import { dateKeyInTimeZone } from "@/lib/time";

const profileSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  birthLocation: z.string().max(40).nullable().optional(),
  unknownTime: z.boolean().optional()
});

export async function GET() {
  try {
    const user = await getOrCreateUser();
    return NextResponse.json(await responseForUser(user.id));
  } catch {
    return NextResponse.json({ ok: false, error: "今日相应暂时无法读取，请稍后再试。" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success || parsed.data.birthDate > dateKeyInTimeZone()) {
      return NextResponse.json({ ok: false, error: "请检查出生日期和时间。" }, { status: 400 });
    }
    // 先走领域计算验证真实日期，避免将 2 月 30 日等无效资料写入档案。
    try {
      buildDailyCorrespondence({ birthDate: parsed.data.birthDate }, dateKeyInTimeZone());
    } catch {
      return NextResponse.json({ ok: false, error: "出生日期不是有效日期。" }, { status: 400 });
    }
    const birthTime = parsed.data.unknownTime ? null : parsed.data.birthTime ?? null;
    if (!parsed.data.unknownTime && !birthTime) {
      return NextResponse.json({ ok: false, error: "请选择出生时间，或勾选时间不确定。" }, { status: 400 });
    }
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        birthDate: parsed.data.birthDate,
        birthTime,
        birthLocation: parsed.data.birthLocation || null,
        timezone: "Asia/Shanghai"
      },
      update: {
        birthDate: parsed.data.birthDate,
        birthTime,
        birthLocation: parsed.data.birthLocation || null,
        timezone: "Asia/Shanghai"
      }
    });
    return NextResponse.json(await responseForUser(user.id));
  } catch {
    return NextResponse.json({ ok: false, error: "生辰资料暂时无法保存，请稍后再试。" }, { status: 503 });
  }
}

async function responseForUser(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile?.birthDate) {
    return { ok: true, data: { profile: null, correspondence: null, sources: [] } };
  }
  const correspondence = buildDailyCorrespondence({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    timezone: profile.timezone
  }, dateKeyInTimeZone());
  const cardCodes = [
    correspondence.phaseRelation.code,
    correspondence.tenGod.code,
    correspondence.branchRelation?.code
  ].filter((code): code is string => Boolean(code));
  const [cards, rules] = await Promise.all([
    prisma.traditionalInterpretationCard.findMany({
      where: { isActive: true, code: { in: cardCodes } },
      select: { code: true, title: true, summary: true, detail: true, sourceTitle: true, sourceUrl: true }
    }),
    prisma.traditionalMethodRule.findMany({
      where: { isActive: true, code: { in: ["day_master", "daily_facts", "birth_daily_relations"] } },
      orderBy: { step: "asc" },
      select: { code: true, title: true, explanation: true, sourceTitle: true, sourceUrl: true }
    })
  ]);
  return {
    ok: true,
    data: {
      profile: {
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        birthLocation: profile.birthLocation,
        unknownTime: !profile.birthTime
      },
      correspondence,
      sources: [...cards, ...rules]
    }
  };
}
