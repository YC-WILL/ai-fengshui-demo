import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai/client";
import {
  buildCompanionSystemPrompt,
  buildCompanionUserPrompt,
  classifyCompanionLens,
  mockCompanionReply,
  reportTypeForLens,
  type CompanionTurn
} from "@/lib/companion/core";
import {
  getCompanionPurpose,
  getRecentCompanionTurns,
  saveCompanionTurn
} from "@/lib/companion/repository";
import { buildTheoryGuidanceFromDatabase } from "@/lib/knowledge/theoryRepository";
import { safetyFilter } from "@/lib/safety/filter";
import { prisma } from "@/lib/db";
import type { AIGenerateOutput } from "@/lib/types";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(800)
});

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const turns = await getRecentCompanionTurns(user.id, 20);
    return NextResponse.json({ ok: true, data: { turns } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "陪伴记录暂时无法读取，请稍后再试。" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "请写下 1–800 字再发送。" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser();
    const purpose = await getCompanionPurpose(user.id);
    if (!purpose) {
      return NextResponse.json(
        { ok: false, error: "请先选一下你希望蟾先森怎样陪你。" },
        { status: 409 }
      );
    }

    const message = parsed.data.message;
    const history = await getRecentCompanionTurns(user.id, 8);
    const lens = classifyCompanionLens(message);
    const reportType = reportTypeForLens(lens);
    const theoryGuidance = await buildTheoryGuidanceFromDatabase(reportType, { userSituation: message });
    const provider = getAIProvider();

    let output: AIGenerateOutput;
    try {
      output = provider.name === "mock"
        ? localOutput(purpose, message, lens)
        : await provider.generateReport({
            reportType,
            tier: "basic",
            systemPrompt: buildCompanionSystemPrompt(purpose, lens, theoryGuidance),
            userPrompt: buildCompanionUserPrompt(history, message),
            ruleResult: { lens, purpose },
            userId: user.id
          });
    } catch (error) {
      console.warn("[companion] provider fallback", error instanceof Error ? error.message.slice(0, 180) : "unknown");
      output = { ...localOutput(purpose, message, lens), fallbackUsed: true };
    }

    const safety = safetyFilter(output.text, {
      appendDisclaimer: false,
      context: "conversation"
    });
    const reply = safety.text.trim();
    const record = await saveCompanionTurn(
      user.id,
      message,
      reply,
      { purpose, lens, provider: output.provider, fallbackUsed: output.fallbackUsed ?? false },
      { blocked: safety.blocked, rewritten: safety.rewritten, matchCount: safety.matches.length }
    );

    try {
      await prisma.modelLog.create({
        data: {
          userId: user.id,
          reportId: record.id,
          provider: output.provider,
          model: output.model,
          reasoningEffort: output.reasoningEffort,
          promptTokens: output.promptTokens,
          completionTokens: output.completionTokens,
          rawRequest: null,
          rawResponse: null,
          safetyFlags: JSON.stringify({
            blocked: safety.blocked,
            rewritten: safety.rewritten,
            fallbackUsed: output.fallbackUsed ?? false,
            companion: true
          })
        }
      });
    } catch (error) {
      console.warn("[companion] model log skipped", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    }

    const turn: CompanionTurn = {
      id: record.id,
      message,
      reply,
      createdAt: record.createdAt.toISOString()
    };
    return NextResponse.json({ ok: true, data: { turn } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[companion/chat] failed", { message: message.slice(0, 200) });
    return NextResponse.json(
      { ok: false, error: "蟾先森刚才没有接住这句话，请稍后再说一次。" },
      { status: 503 }
    );
  }
}

function localOutput(
  purpose: Parameters<typeof mockCompanionReply>[0],
  message: string,
  lens: Parameters<typeof mockCompanionReply>[2]
): AIGenerateOutput {
  return {
    text: mockCompanionReply(purpose, message, lens),
    provider: "mock",
    model: "guaan-companion-local"
  };
}
