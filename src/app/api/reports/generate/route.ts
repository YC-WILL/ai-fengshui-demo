import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { getMembershipStatus } from "@/lib/membership";
import { orchestrateReport } from "@/lib/reports/orchestrator";
import {
  baziGenerateSchema, marriageGenerateSchema,
  fengshuiGenerateSchema, dateSelectionGenerateSchema
} from "@/lib/reports/inputs";
import type { ReportType, ReportTier } from "@/lib/types";

const requestSchema = z.object({
  reportType: z.enum([
    "bazi_basic", "bazi_deep",
    "marriage_basic", "marriage_deep",
    "home_fengshui_basic", "home_fengshui_deep",
    "date_selection_basic", "date_selection"
  ]),
  tier: z.enum(["basic", "deep"]),
  input: z.unknown()
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "参数校验失败", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reportType, tier } = parsed.data;
  const innerSchema = pickInnerSchema(reportType);
  const inner = innerSchema.safeParse({ tier, input: parsed.data.input });
  if (!inner.success) {
    return NextResponse.json(
      { ok: false, error: "输入校验失败", issues: inner.error.flatten() },
      { status: 400 }
    );
  }

  // 数据库初始化/连接失败时也必须返回 JSON。此前这里位于 try 外，
  // Prisma 在本地缺少连接配置时会让 Route Handler 直接返回空 500，
  // 浏览器端随后只能报 "Unexpected end of JSON input"。
  try {
    const user = await getOrCreateUser();
    const membership = getMembershipStatus();
    const result = await orchestrateReport({
      userId: user.id,
      reportType: reportType as ReportType,
      tier: tier as ReportTier,
      input: inner.data.input as never,
      isMember: membership.active
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "服务器错误";
    // 不把连接串、驱动细节或堆栈返回给用户；服务端日志保留简短原因便于排查。
    console.error("[reports/generate] generation failed", {
      name: err instanceof Error ? err.name : "UnknownError",
      message: msg.slice(0, 240)
    });
    const isDatabaseError = /prisma|database|datasource|DATABASE_URL|connect|P1001|P1003|P1011/i.test(msg);
    return NextResponse.json(
      {
        ok: false,
        error: isDatabaseError
          ? "本地数据服务暂未配置或暂时不可用，请先配置数据库连接后再生成。"
          : "报告生成暂时失败，请稍后重试。"
      },
      { status: isDatabaseError ? 503 : 500 }
    );
  }
}

function pickInnerSchema(reportType: ReportType) {
  switch (reportType) {
    case "bazi_basic":
    case "bazi_deep":
      return baziGenerateSchema;
    case "marriage_basic":
    case "marriage_deep":
      return marriageGenerateSchema;
    case "home_fengshui_basic":
    case "home_fengshui_deep":
      return fengshuiGenerateSchema;
    case "date_selection_basic":
    case "date_selection":
      return dateSelectionGenerateSchema;
    default:
      throw new Error(`未知 reportType: ${reportType}`);
  }
}
