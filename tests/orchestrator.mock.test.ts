// 用 mock provider 跑一次 generateReport，验证安全过滤 + markdown 拼装链路
// 注意：本测试不命中数据库（直接调用 mock + safetyFilter），适合 CI 内冒烟。

import { describe, it, expect } from "vitest";
import { MockProvider } from "@/lib/ai/mock";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import { safetyFilter } from "@/lib/safety/filter";
import {
  computeBazi, personalityProfile, lifeSuggestions, lifeReminders,
  elementSummary, friendlyCoreConclusion, friendlyElementNote
} from "@/lib/domain/bazi";

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
      friendlyCoreConclusion: friendlyCoreConclusion(chart),
      friendlyElementNote: friendlyElementNote(chart),
      personalityProfile: personalityProfile(chart),
      lifeReminders: lifeReminders(chart),
      lifeSuggestions: lifeSuggestions(chart)
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
    expect(out.text).toMatch(/^# 这位朋友，我们聊聊你的性格与步调/);
    expect(out.text).not.toContain("性格关键词");
    expect(out.text).toContain("来看看你的性格画像");
    expect(out.text).toContain(personalityProfile(chart));
    lifeSuggestions(chart).forEach(item => expect(out.text).toContain(item));
    expect(out.text.match(/这位朋友/g)).toHaveLength(1);
    expect(out.text).not.toContain("五行分布");
    expect(out.text).not.toMatch(/一定|必然|注定|保证|你有焦虑症|你有抑郁症|你心理有问题/);
    const safe = safetyFilter(out.text);
    expect(safe.blocked).toBe(false);
    expect(safe.text).toContain("免责声明");
  });

  it("makes the free and deep bazi scopes explicit", () => {
    const basic = buildSystemPrompt("bazi_basic", "basic");
    const deep = buildSystemPrompt("bazi_deep", "deep");

    expect(basic).toContain("只出现在报告最上方的一级标题中");
    expect(basic).toContain("完整但精简");
    expect(deep).toContain("分场景展开");
    expect(deep).toContain("不要通过制造焦虑体现价值");
  });
});
