// ============================================================
// AI Client：Provider 抽象 + 工厂
//
// 当前支持：
//   - mock     ：本地伪报告，无网络
//   - anthropic：Claude Messages API，按 ANTHROPIC_MODEL（默认 claude-sonnet-4-6）
//   - openai   ：使用官方 SDK，按 OPENAI_MODEL（默认 gpt-5.5）
//
// 后续可扩展：dashscope（通义）、ernie（文心）、doubao（豆包）等
// 国内备案模型，只需新增实现 AIProvider 即可。
// ============================================================

import type { AIGenerateInput, AIGenerateOutput, ReportTier } from "../types";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { MockProvider } from "./mock";

export interface AIProvider {
  readonly name: string;
  generateReport(input: AIGenerateInput): Promise<AIGenerateOutput>;
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const which = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  switch (which) {
    case "mock":
      cached = new MockProvider();
      break;
    case "anthropic":
      cached = new AnthropicProvider();
      break;
    case "openai":
      cached = new OpenAIProvider();
      break;
    default:
      throw new Error(`Unknown AI_PROVIDER "${which}". Expected one of: mock, anthropic, openai`);
  }
  return cached;
}

export function resetAIProviderForTests(): void {
  cached = null;
}

export function reasoningEffortFor(tier: ReportTier): string {
  if (tier === "deep") {
    return process.env.OPENAI_REASONING_EFFORT_DEEP ?? "xhigh";
  }
  return process.env.OPENAI_REASONING_EFFORT_BASIC ?? "high";
}
