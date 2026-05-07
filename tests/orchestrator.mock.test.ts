// 用 mock provider 跑一次 generateReport，验证安全过滤 + markdown 拼装链路
// 注意：本测试不命中数据库（直接调用 mock + safetyFilter），适合 CI 内冒烟。

import { describe, it, expect } from "vitest";
import { MockProvider } from "@/lib/ai/mock";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import { safetyFilter } from "@/lib/safety/filter";
import { computeBazi, personalityKeywords, elementSummary } from "@/lib/domain/bazi";

describe("MockProvider + safetyFilter (smoke)", () => {
  it("bazi_basic round trip", async () => {
    const chart = computeBazi({
      gender: "male", birthDate: "1990-06-15", birthTime: "10:30", unknownTime: false
    });
    const ruleResult = {
      dayMaster: chart.dayMaster,
      zodiac: chart.zodiac,
      pillars: {
        year: chart.year.pillarLabel,
        month: chart.month.pillarLabel,
        day: chart.day.pillarLabel,
        hour: chart.hour?.pillarLabel
      },
      elementSummary: elementSummary(chart),
      personalityKeywords: personalityKeywords(chart)
    };
    const provider = new MockProvider();
    const out = await provider.generateReport({
      reportType: "bazi_basic",
      tier: "basic",
      systemPrompt: buildSystemPrompt("bazi_basic", "basic"),
      userPrompt: buildUserPrompt("bazi_basic", "basic", ruleResult),
      ruleResult,
      userId: "test-user"
    });
    expect(out.text).toContain("八字基础参考");
    const safe = safetyFilter(out.text);
    expect(safe.blocked).toBe(false);
    expect(safe.text).toContain("免责声明");
  });
});
