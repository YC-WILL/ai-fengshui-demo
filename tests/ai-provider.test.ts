import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import { getAIProvider, resetAIProviderForTests } from "@/lib/ai/client";
import { safetyFilter } from "@/lib/safety/filter";
import type { AIGenerateInput } from "@/lib/types";

const ORIGINAL_ENV = { ...process.env };
const ENV_KEYS = [
  "AI_PROVIDER",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_MAX_TOKENS",
  "ANTHROPIC_TEMPERATURE"
];

beforeEach(() => {
  restoreEnv();
  resetAIProviderForTests();
});

afterEach(() => {
  restoreEnv();
  resetAIProviderForTests();
  vi.restoreAllMocks();
});

describe("AI provider factory", () => {
  it("defaults to mock provider", () => {
    delete process.env.AI_PROVIDER;
    expect(getAIProvider().name).toBe("mock");
  });

  it("returns mock provider when AI_PROVIDER=mock", () => {
    process.env.AI_PROVIDER = "mock";
    expect(getAIProvider().name).toBe("mock");
  });

  it("returns anthropic provider when AI_PROVIDER=anthropic", () => {
    process.env.AI_PROVIDER = "anthropic";
    expect(getAIProvider().name).toBe("anthropic");
  });

  it("throws for unknown AI_PROVIDER", () => {
    process.env.AI_PROVIDER = "unknown-provider";
    expect(() => getAIProvider()).toThrow(/Unknown AI_PROVIDER/);
  });
});

describe("AnthropicProvider", () => {
  it("throws a clear error when ANTHROPIC_API_KEY is missing", async () => {
    process.env.AI_PROVIDER = "anthropic";
    delete process.env.ANTHROPIC_API_KEY;

    const provider = getAIProvider();

    await expect(provider.generateReport(sampleInput())).rejects.toThrow(
      "ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic"
    );
  });

  it("uses Messages API params and joins text content blocks without logging sensitive payload", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.ANTHROPIC_MODEL = "claude-sonnet-4-6";
    process.env.ANTHROPIC_MAX_TOKENS = "1234";
    process.env.ANTHROPIC_TEMPERATURE = "0.2";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const create = vi.fn(async () => ({
      id: "msg_test",
      model: "claude-sonnet-4-6",
      stop_reason: "end_turn",
      usage: { input_tokens: 12, output_tokens: 34 },
      content: [
        { type: "text", text: "第一段" },
        { type: "tool_use" },
        { type: "text", text: "第二段" }
      ]
    }));

    const provider = new AnthropicProvider({ messages: { create } });
    const out = await provider.generateReport(sampleInput());

    expect(create).toHaveBeenCalledWith({
      model: "claude-sonnet-4-6",
      max_tokens: 1234,
      temperature: 0.2,
      system: "system prompt",
      messages: [{ role: "user", content: "user prompt" }]
    });
    expect(out).toMatchObject({
      text: "第一段\n\n第二段",
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      promptTokens: 12,
      completionTokens: 34,
      finishReason: "end_turn"
    });
    expect(logSpy.mock.calls.join("\n")).not.toContain("test-key");
    expect(logSpy.mock.calls.join("\n")).not.toContain("user prompt");
  });

  it("normalizes hidden line separators copied with ANTHROPIC_API_KEY", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key\u2028";
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const create = vi.fn(async () => ({
      model: "claude-sonnet-4-6",
      stop_reason: "end_turn",
      usage: { input_tokens: 1, output_tokens: 1 },
      content: [{ type: "text", text: "安全报告正文" }]
    }));

    const provider = new AnthropicProvider({ messages: { create } });
    const out = await provider.generateReport(sampleInput());

    expect(out.provider).toBe("anthropic");
    expect(create).toHaveBeenCalledOnce();
  });

  it("does not bypass safetyFilter for high-risk generated text", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const provider = new AnthropicProvider({
      messages: {
        create: async () => ({
          model: "claude-sonnet-4-6",
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
          content: [{ type: "text", text: "此宅必发财，保证有效。" }]
        })
      }
    });

    const out = await provider.generateReport(sampleInput());
    const safe = safetyFilter(out.text);

    expect(safe.blocked).toBe(true);
    expect(safe.text).toContain("出于内容安全考虑");
  });
});

function sampleInput(): AIGenerateInput {
  return {
    reportType: "bazi_basic",
    tier: "basic",
    systemPrompt: "system prompt",
    userPrompt: "user prompt",
    ruleResult: { demo: true },
    userId: "test-user",
    reportId: "test-report"
  };
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
