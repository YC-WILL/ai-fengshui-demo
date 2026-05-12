// ============================================================
// Anthropic Provider
//
// 使用 Claude Messages API。默认模型 claude-sonnet-4-6。
// 注意：
//   · 只有 AI_PROVIDER=anthropic 且真实调用时才要求 ANTHROPIC_API_KEY
//   · 不打印 API Key、完整 prompt 或用户输入
//   · safetyFilter 仍由 reports/orchestrator.ts 统一执行
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "./client";
import type { AIGenerateInput, AIGenerateOutput } from "../types";

type AnthropicTextBlock = {
  type: string;
  text?: string;
};

type AnthropicMessageResponse = {
  id?: string;
  content: AnthropicTextBlock[];
  model?: string;
  stop_reason?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

type AnthropicMessagesClient = {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      temperature: number;
      system: string;
      messages: Array<{ role: "user"; content: string }>;
    }): Promise<AnthropicMessageResponse>;
  };
};

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client?: AnthropicMessagesClient;

  constructor(client?: AnthropicMessagesClient) {
    this.client = client;
  }

  async generateReport(input: AIGenerateInput): Promise<AIGenerateOutput> {
    const apiKey = normalizeApiKey(process.env.ANTHROPIC_API_KEY);
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic");
    }

    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
    const maxTokens = positiveIntFromEnv("ANTHROPIC_MAX_TOKENS", 4000);
    const temperature = numberFromEnv("ANTHROPIC_TEMPERATURE", 0.4);
    const client = this.client ?? new Anthropic({ apiKey });

    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: input.systemPrompt,
        messages: [{ role: "user", content: input.userPrompt }]
      });

      const text = response.content
        .filter((block): block is AnthropicTextBlock & { text: string } => {
          return block.type === "text" && typeof block.text === "string";
        })
        .map(block => block.text)
        .join("\n\n")
        .trim();

      if (!text) {
        throw new Error("Anthropic response did not include text content");
      }

      const inputTokens = response.usage?.input_tokens;
      const outputTokens = response.usage?.output_tokens;
      const finishReason = response.stop_reason ?? undefined;

      // 只打印 metadata，不打印 prompt、用户输入或 API Key。
      // eslint-disable-next-line no-console
      console.log(`[ai/anthropic] model=${model} tier=${input.tier} ` +
        `input=${inputTokens ?? "?"} output=${outputTokens ?? "?"} stop=${finishReason ?? "?"}`);

      return {
        text,
        provider: this.name,
        model: response.model ?? model,
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        finishReason,
        metadata: {
          stopReason: finishReason,
          responseId: response.id
        },
        raw: process.env.LOG_AI_RAW_PAYLOAD === "true"
          ? {
              id: response.id,
              model: response.model,
              stop_reason: response.stop_reason,
              usage: response.usage,
              contentTypes: response.content.map(block => block.type)
            }
          : undefined
      };
    } catch (err) {
      const message = redactErr(err);
      const status = statusCodeOf(err);
      // eslint-disable-next-line no-console
      console.warn(`[ai/anthropic] provider=anthropic model=${model} ` +
        `status=${status ?? "unknown"} error=${message}`);
      throw new Error(`Anthropic API request failed: ${message}`);
    }
  }
}

function positiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeApiKey(value: string | undefined): string {
  return (value ?? "").trim().replace(/[\r\n\u2028\u2029]/g, "");
}

function statusCodeOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null || !("status" in err)) return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function redactErr(err: unknown): string {
  if (err instanceof Error) {
    return err.message.length > 300 ? err.message.slice(0, 300) + "..." : err.message;
  }
  return "unknown error";
}
