import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
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
    "date_selection"
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

  const user = await getOrCreateUser();
  try {
    const result = await orchestrateReport({
      userId: user.id,
      reportType: reportType as ReportType,
      tier: tier as ReportTier,
      input: inner.data.input as never
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "服务器错误";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
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
    case "date_selection":
      return dateSelectionGenerateSchema;
    default:
      throw new Error(`未知 reportType: ${reportType}`);
  }
}
