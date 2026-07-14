import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  pickSignCandidate,
  SIGN_PERIOD_LABEL,
  type SignPeriod
} from "@/lib/domain/dailySign";

const requestSchema = z.object({
  period: z.enum(["morning", "noon", "afternoon", "evening"])
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "当前时段信息不正确" }, { status: 400 });
  }

  const user = await getOrCreateUser();
  const period = parsed.data.period as SignPeriod;
  const recent = await prisma.report.findMany({
    where: { userId: user.id, reportType: "daily_sign" },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { ruleResult: true }
  });
  const recentIds = recent.flatMap(item => {
    try {
      const parsedResult = JSON.parse(item.ruleResult ?? "{}") as { signId?: unknown };
      return typeof parsedResult.signId === "string" ? [parsedResult.signId] : [];
    } catch {
      return [];
    }
  });
  const sign = pickSignCandidate(period, recentIds);
  const periodLabel = SIGN_PERIOD_LABEL[period];
  const snapshot = { word: sign.word, message: sign.message, period, periodLabel };

  const record = await prisma.report.create({
    data: {
      userId: user.id,
      reportType: "daily_sign",
      inputData: JSON.stringify({ period }),
      ruleResult: JSON.stringify({ signId: sign.id }),
      aiResult: JSON.stringify(snapshot),
      safetyResult: JSON.stringify({ curated: true, predictive: false }),
      status: "generated",
      isPaid: true
    }
  });

  return NextResponse.json({
    ok: true,
    data: { id: record.id, ...snapshot, createdAt: record.createdAt.toISOString() }
  });
}
