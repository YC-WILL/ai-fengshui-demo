// ============================================================
// OpenAI Provider
//
// 默认 model = OPENAI_MODEL（默认 gpt-5.5）
// 默认 reasoning_effort 由 reasoningEffortFor(tier) 决定
//
// 注意：
//   · 不在控制台打印用户敏感原文；只打印 token usage 与 model
//   · 失败 → 切换 OPENAI_FALLBACK_MODEL 重试一次
//   · 超时由 SDK 内部 + AbortController 控制
// ============================================================

import OpenAI from "openai";
import type { AIProvider } from "./client";
import type { AIGenerateInput, AIGenerateOutput } from "../types";
import { reasoningEffortFor } from "./client";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("AI_PROVIDER=openai 但未设置 OPENAI_API_KEY");
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });
  }

  async generateReport(input: AIGenerateInput): Promise<AIGenerateOutput> {
    const primary = process.env.OPENAI_MODEL ?? "gpt-5.5";
    const fallback = process.env.OPENAI_FALLBACK_MODEL ?? primary;
    const effort = reasoningEffortFor(input.tier);

    try {
      return await this.callOnce(primary, effort, input, false);
    } catch (err) {
      if (primary !== fallback) {
        // eslint-disable-next-line no-console
        console.warn(`[ai/openai] primary model "${primary}" failed, falling back to "${fallback}"`, redactErr(err));
        return await this.callOnce(fallback, effort, input, true);
      }
      throw err;
    }
  }

  private async callOnce(
    model: string,
    effort: string,
    input: AIGenerateInput,
    fallbackUsed: boolean
  ): Promise<AIGenerateOutput> {
    const timeoutMs = parseInt(process.env.OPENAI_TIMEOUT_MS ?? "60000", 10);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    try {
      // 我们使用 chat.completions 的兼容形式，并把 reasoning_effort 通过
      // 额外字段透传（OpenAI Responses API / GPT-5.x 系列支持）。
      const resp = await this.client.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: input.userPrompt }
          ],
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.4"),
          // 透传扩展字段：reasoning_effort, max_output_tokens
          // SDK 类型未必声明，使用 extra_body / unknown 强转
          // @ts-expect-error reasoning_effort 是 GPT-5.x 系列扩展字段
          reasoning_effort: effort
        },
        { signal: ac.signal }
      );

      const text = resp.choices?.[0]?.message?.content ?? "";
      const usage = resp.usage;

      // 只打印 metadata，不要打印用户原文
      // eslint-disable-next-line no-console
      console.log(`[ai/openai] model=${model} effort=${effort} tier=${input.tier} ` +
        `prompt=${usage?.prompt_tokens ?? "?"} completion=${usage?.completion_tokens ?? "?"}`);

      return {
        text,
        provider: this.name,
        model,
        reasoningEffort: effort,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        raw: process.env.LOG_AI_RAW_PAYLOAD === "true" ? resp : undefined,
        fallbackUsed
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

function redactErr(err: unknown): string {
  if (err instanceof Error) {
    return err.message.length > 300 ? err.message.slice(0, 300) + "..." : err.message;
  }
  return "unknown error";
}
