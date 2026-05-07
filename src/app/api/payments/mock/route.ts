// ============================================================
// 模拟支付（MVP）
//
// 真实接入：
//   · 微信支付：见 https://pay.weixin.qq.com/docs/merchant/apis/native-payment/native-prepay.html
//   · 支付宝：  见 https://opendocs.alipay.com/open/270
//   · 接入步骤大致一致：创建 prepay → 拉起客户端支付 → 后端 notify 回调 → 更新 Payment.status
//   · 本路由把"创建 + 回调"压缩成一次同步调用，仅用于 MVP demo。
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { REPORT_PRICING } from "@/lib/types";
import type { ReportType } from "@/lib/types";

const schema = z.object({
  reportId: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id: parsed.data.reportId } });
  if (!report || report.userId !== userId) {
    return NextResponse.json({ ok: false, error: "报告不存在或无权限" }, { status: 404 });
  }
  if (report.status === "blocked") {
    return NextResponse.json({ ok: false, error: "该报告未通过安全检查，无需支付" }, { status: 400 });
  }
  if (report.isPaid) {
    return NextResponse.json({ ok: true, data: { alreadyPaid: true, reportId: report.id } });
  }

  const pricing = REPORT_PRICING[report.reportType as ReportType];
  if (!pricing) {
    return NextResponse.json({ ok: false, error: "该报告类型无需付费" }, { status: 400 });
  }

  // mock 支付：直接置为 success
  const payment = await prisma.payment.create({
    data: {
      userId,
      reportId: report.id,
      amount: pricing.amountFen,
      currency: pricing.currency,
      provider: process.env.PAYMENT_PROVIDER ?? "mock",
      status: "success"
    }
  });

  await prisma.report.update({
    where: { id: report.id },
    data: {
      isPaid: true,
      paymentId: payment.id,
      status: "paid"
    }
  });

  return NextResponse.json({
    ok: true,
    data: {
      reportId: report.id,
      paymentId: payment.id,
      amountFen: pricing.amountFen,
      mock: process.env.PAYMENT_PROVIDER !== "wechat" && process.env.PAYMENT_PROVIDER !== "alipay"
    }
  });
}
