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
import { MockProvider } from "../ai/mock";
import { buildSystemPrompt, buildUserPrompt } from "../ai/prompts";
import { safetyFilter } from "../safety/filter";
import {
  computeBazi, personalityProfile, lifeSuggestions, lifeReminders, elementSummary,
  dayMasterDescription, friendlyCoreConclusion, friendlyElementNote, personalNarrativeFacts
} from "../domain/bazi";
import { matchMarriage } from "../domain/marriage";
import { assessFengShui } from "../domain/fengshui";
import { selectDates } from "../domain/dateSelection";
import { makePreview } from "./preview";
import { normalizeGeneratedReport, prepareRuleResultForReport } from "./contentGuard";
import {
  assessReportNarrativeQuality,
  type NarrativeQualityResult
} from "./narrativeQuality";
import type {
  ReportType, ReportTier,
  BaziInput, MarriageInput, FengShuiInput, DateSelectionInput,
  AIGenerateInput, AIGenerateOutput
} from "../types";
import { isMemberReportType } from "../types";

// ---- 不同报告输入类型联合 ----
type AnyInput = BaziInput | MarriageInput | FengShuiInput | DateSelectionInput;

const NOVELTY_GATED_REPORTS: ReportType[] = [
  "bazi_basic", "marriage_basic", "home_fengshui_basic", "date_selection_basic"
];

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
  const fullRuleResult = runRuleEngine(reportType, input);
  const ruleResult = prepareRuleResultForReport(reportType, fullRuleResult);

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
  const recentReports = NOVELTY_GATED_REPORTS.includes(reportType)
    ? await prisma.report.findMany({
        where: { reportType, status: "generated", aiResult: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { aiResult: true }
      }).then(rows => rows.flatMap(row => row.aiResult ? [row.aiResult] : []))
    : [];

  // 4) 调 AI
  const provider = getAIProvider();
  const generateInput = {
    reportType, tier, systemPrompt, userPrompt, ruleResult,
    userId, reportId: report.id
  };
  // 外部模型偶发超时/限流时立即用本地规则兜底，
  // 保证用户拿到报告，同时在日志中明确标记 fallbackUsed。
  let ai = await generateWithFallback(provider, generateInput);

  // 5) 非模板化质量检查：四类基础报告不直接交付空泛或重复草稿。
  let normalizedText = normalizeGeneratedReport(reportType, ai.text, ruleResult);
  let narrativeQuality: NarrativeQualityResult | undefined;
  if (NOVELTY_GATED_REPORTS.includes(reportType)) {
    narrativeQuality = assessReportNarrativeQuality(reportType, normalizedText, recentReports);
    // 质量检查只记录质量信号，不再为了修复再发起第二次模型请求。
    // 第二次请求会显著增加等待时间，也会让偶发限流变成用户侧失败；
    // normalizeGeneratedReport 已经负责长度、结构和免责声明的本地兜底。
  }

  // 6) 安全过滤
  let safety = safetyFilter(normalizedText);
  if (safety.blocked) {
    // 极少数情况下模型原文触发安全拦截；用本地内容再走一次同样过滤，
    // 保证用户拿到安全、可读的报告，而不是停在“生成失败”。
    const fallback = await new MockProvider().generateReport(generateInput);
    const fallbackSafety = safetyFilter(normalizeGeneratedReport(reportType, fallback.text, ruleResult));
    if (!fallbackSafety.blocked) {
      ai = { ...fallback, fallbackUsed: true, metadata: { ...(fallback.metadata ?? {}), fallbackReason: "safety_blocked" } };
      safety = fallbackSafety;
    }
  }

  // 7) 写日志
  try {
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
        matchCount: safety.matches.length,
        narrativeQuality: narrativeQuality
          ? {
              maxRecentSimilarity: narrativeQuality.maxRecentSimilarity,
              maxSectionSimilarity: narrativeQuality.maxSectionSimilarity
            }
          : undefined
      })
      }
    });
  } catch (error) {
    // 日志写入失败不应抹掉已经生成好的报告。
    console.warn("[reports] model log write failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
  }

  // 8) 更新 Report 状态
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

  // 9) 构造返回（非会员访问深度报告时先返回 preview）
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

async function generateWithFallback(
  provider: { generateReport: (input: AIGenerateInput) => Promise<AIGenerateOutput> },
  input: AIGenerateInput
): Promise<AIGenerateOutput> {
  let lastError: unknown;
  try {
    // 给外部模型一个明确上限；超时后立即走本地兜底，避免前端一直等待。
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI generation timeout")), 30_000);
    });
    return await Promise.race([provider.generateReport(input), timeout]);
  } catch (error) {
    lastError = error;
  }
  const fallback = await new MockProvider().generateReport(input);
  return {
    ...fallback,
    fallbackUsed: true,
    metadata: {
      ...(fallback.metadata ?? {}),
      fallbackReason: lastError instanceof Error ? lastError.message.slice(0, 240) : "provider_error"
    }
  };
}

// ---------- helpers ----------
function runRuleEngine(reportType: ReportType, input: AnyInput): unknown {
  switch (reportType) {
    case "bazi_basic":
    case "bazi_deep": {
      const baziInput = input as BaziInput;
      const chart = computeBazi(baziInput);
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
        personalNarrativeFacts: personalNarrativeFacts(chart, baziInput.userContext),
        userSituation: baziInput.userContext?.trim().slice(0, 500) || undefined,
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
        behaviorFacts: m.behaviorFacts,
        personalDistinctness: m.personalDistinctness,
        communicationStyle: m.communicationStyle,
        strengths: m.strengths,
        frictionPoints: m.frictionPoints,
        suggestions: m.suggestions,
        notes: m.notes
        ,userSituation: [
          (input as MarriageInput).notes,
          (input as MarriageInput).partyA.userContext,
          (input as MarriageInput).partyB.userContext
        ].filter(Boolean).join("；").trim().slice(0, 500) || undefined
      };
    }
    case "home_fengshui_basic":
    case "home_fengshui_deep":
      return { ...assessFengShui(input as FengShuiInput), userSituation: (input as FengShuiInput).primaryConcerns?.trim().slice(0, 500) || undefined };
    case "date_selection_basic":
    case "date_selection":
      return { ...selectDates(input as DateSelectionInput), userSituation: (input as DateSelectionInput).notes?.trim().slice(0, 300) || undefined };
    default:
      return {};
  }
}
