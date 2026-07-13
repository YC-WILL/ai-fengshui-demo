// ============================================================
// 报告编排：rule engine → prompt → AI → safetyFilter → DB
//
// 任意一个 API 入口都通过本模块产出报告，保证：
//   · 同样的安全检查
//   · 同样的日志结构
//   · 付费/解锁逻辑统一在一个地方
// ============================================================

import { prisma } from "../db";
import { getAIProvider } from "../ai/client";
import { buildSystemPrompt, buildUserPrompt } from "../ai/prompts";
import { safetyFilter } from "../safety/filter";
import {
  computeBazi, personalityProfile, lifeSuggestions, lifeReminders, elementSummary,
  dayMasterDescription, friendlyCoreConclusion, friendlyElementNote
} from "../domain/bazi";
import { matchMarriage } from "../domain/marriage";
import { assessFengShui } from "../domain/fengshui";
import { selectDates } from "../domain/dateSelection";
import { makePreview } from "./preview";
import type {
  ReportType, ReportTier,
  BaziInput, MarriageInput, FengShuiInput, DateSelectionInput,
  AIGenerateOutput
} from "../types";
import { isMemberReportType } from "../types";

// ---- 不同报告输入类型联合 ----
type AnyInput = BaziInput | MarriageInput | FengShuiInput | DateSelectionInput;

interface OrchestrateArgs {
  userId: string;
  reportType: ReportType;
  tier: ReportTier;
  input: AnyInput;
  isMember?: boolean;
}

interface OrchestrateResult {
  reportId: string;
  status: "generated" | "blocked";
  text: string;
  preview?: string;
  ruleResult: unknown;
  safety: ReturnType<typeof safetyFilter>;
  ai: { provider: string; model: string; reasoningEffort?: string };
  hasAccess: boolean;
  needsMembership: boolean;
}

export async function orchestrateReport(args: OrchestrateArgs): Promise<OrchestrateResult> {
  const { userId, reportType, tier, input, isMember = false } = args;
  const memberOnly = isMemberReportType(reportType);
  const hasAccess = !memberOnly || isMember;

  // 1) 规则引擎
  const ruleResult = runRuleEngine(reportType, input);

  // 2) 创建草稿 Report
  const report = await prisma.report.create({
    data: {
      userId,
      reportType,
      inputData: JSON.stringify(input),
      ruleResult: JSON.stringify(ruleResult),
      status: "draft",
      // 基础报告始终完整；会员深度报告的访问权由当前会员状态判断。
      // 旧数据中已经单次解锁的深度报告仍保留 isPaid=true，继续永久可看。
      isPaid: !memberOnly
    }
  });

  // 3) 构造 prompt
  const systemPrompt = buildSystemPrompt(reportType, tier);
  const userPrompt = buildUserPrompt(reportType, tier, ruleResult);

  // 4) 调 AI
  const provider = getAIProvider();
  let ai: AIGenerateOutput;
  try {
    ai = await provider.generateReport({
      reportType, tier, systemPrompt, userPrompt, ruleResult,
      userId, reportId: report.id
    });
  } catch (err) {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "failed" }
    });
    throw err;
  }

  // 5) 安全过滤
  const safety = safetyFilter(ai.text);

  // 6) 写日志
  await prisma.modelLog.create({
    data: {
      userId,
      reportId: report.id,
      provider: ai.provider,
      model: ai.model,
      reasoningEffort: ai.reasoningEffort,
      promptTokens: ai.promptTokens,
      completionTokens: ai.completionTokens,
      // 默认不写 rawRequest/rawResponse，避免敏感数据
      rawRequest: process.env.LOG_AI_RAW_PAYLOAD === "true"
        ? JSON.stringify({ systemPrompt: "[redacted]", userPrompt: "[redacted]" })
        : null,
      rawResponse: process.env.LOG_AI_RAW_PAYLOAD === "true"
        ? JSON.stringify(ai.raw ?? {})
        : null,
      safetyFlags: JSON.stringify({
        blocked: safety.blocked,
        rewritten: safety.rewritten,
        matchCount: safety.matches.length
      })
    }
  });

  // 7) 更新 Report 状态
  const finalStatus: "generated" | "blocked" = safety.blocked ? "blocked" : "generated";
  await prisma.report.update({
    where: { id: report.id },
    data: {
      aiResult: safety.text,
      safetyResult: JSON.stringify({
        blocked: safety.blocked,
        rewritten: safety.rewritten,
        matches: safety.matches
      }),
      status: finalStatus
    }
  });

  // 8) 构造返回（非会员访问深度报告时先返回 preview）
  const needsMembership = memberOnly && !isMember;
  const preview = needsMembership ? makePreview(safety.text) : undefined;

  return {
    reportId: report.id,
    status: finalStatus,
    text: safety.text,
    preview,
    ruleResult,
    safety,
    ai: { provider: ai.provider, model: ai.model, reasoningEffort: ai.reasoningEffort },
    hasAccess,
    needsMembership
  };
}

// ---------- helpers ----------
function runRuleEngine(reportType: ReportType, input: AnyInput): unknown {
  switch (reportType) {
    case "bazi_basic":
    case "bazi_deep": {
      const chart = computeBazi(input as BaziInput);
      return {
        dayMaster: chart.dayMaster,
        zodiac: chart.zodiac,
        pillars: {
          year: chart.year.pillarLabel,
          month: chart.month.pillarLabel,
          day: chart.day.pillarLabel,
          hour: chart.hour?.pillarLabel ?? null
        },
        elementCounts: chart.elementDistribution.counts,
        elementMissing: chart.elementDistribution.missing,
        elementStrongest: chart.elementDistribution.strongest,
        elementWeakest: chart.elementDistribution.weakest,
        elementSummary: elementSummary(chart),
        dayMasterDescription: dayMasterDescription(chart),
        friendlyCoreConclusion: friendlyCoreConclusion(chart),
        friendlyElementNote: friendlyElementNote(chart),
        personalityProfile: personalityProfile(chart),
        lifeReminders: lifeReminders(chart),
        lifeSuggestions: lifeSuggestions(chart),
        notes: chart.notes
      };
    }
    case "marriage_basic":
    case "marriage_deep": {
      const m = matchMarriage(input as MarriageInput);
      return {
        partyA: { dayMaster: m.partyA.dayMaster, zodiac: m.partyA.zodiac },
        partyB: { dayMaster: m.partyB.dayMaster, zodiac: m.partyB.zodiac },
        dayMasterRelation: m.dayMasterRelation,
        zodiacRelation: m.zodiacRelation,
        elementBalance: m.elementBalance,
        communicationStyle: m.communicationStyle,
        strengths: m.strengths,
        frictionPoints: m.frictionPoints,
        suggestions: m.suggestions,
        notes: m.notes
      };
    }
    case "home_fengshui_basic":
    case "home_fengshui_deep":
      return assessFengShui(input as FengShuiInput);
    case "date_selection_basic":
    case "date_selection":
      return selectDates(input as DateSelectionInput);
    default:
      return {};
  }
}
