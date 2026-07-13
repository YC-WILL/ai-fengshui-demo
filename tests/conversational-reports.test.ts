import { describe, expect, it } from "vitest";
import { MockProvider } from "@/lib/ai/mock";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import { matchMarriage } from "@/lib/domain/marriage";
import { assessFengShui } from "@/lib/domain/fengshui";
import { selectDates } from "@/lib/domain/dateSelection";
import type { AIGenerateInput, ReportType } from "@/lib/types";

const provider = new MockProvider();
const personA = { gender: "male" as const, birthDate: "1992-04-10", birthTime: "08:30", unknownTime: false };
const personB = { gender: "female" as const, birthDate: "1994-09-22", birthTime: "16:00", unknownTime: false };

async function generate(reportType: ReportType, ruleResult: unknown) {
  const input: AIGenerateInput = {
    reportType,
    tier: reportType.includes("deep") ? "deep" : "basic",
    systemPrompt: buildSystemPrompt(reportType, reportType.includes("deep") ? "deep" : "basic"),
    userPrompt: buildUserPrompt(reportType, reportType.includes("deep") ? "deep" : "basic", ruleResult),
    ruleResult,
    userId: "test-user"
  };
  return (await provider.generateReport(input)).text;
}

describe("conversational report tone", () => {
  it("speaks to both people in the relationship report", async () => {
    const match = matchMarriage({ partyA: personA, partyB: personB });
    const text = await generate("marriage_basic", {
      partyA: { dayMaster: match.partyA.dayMaster, zodiac: match.partyA.zodiac },
      partyB: { dayMaster: match.partyB.dayMaster, zodiac: match.partyB.zodiac },
      communicationStyle: match.communicationStyle,
      strengths: match.strengths,
      frictionPoints: match.frictionPoints,
      suggestions: match.suggestions
    });

    expect(text).toContain("两位朋友，先说说你们相处的感觉");
    expect(text).toContain("两位朋友，最后说一句");
    expect(text).not.toMatch(/沟通风格关键词|关系优势|潜在摩擦点|匹配度/);
    expect(text).not.toMatch(/必合|必分|正缘|孽缘|克夫|克妻/);
  });

  it("walks through the home in a practical, friendly voice", async () => {
    const assessment = assessFengShui({
      orientation: "朝南",
      layout: "两室一厅，客厅采光较好",
      rooms: [{ name: "玄关" }, { name: "客厅" }, { name: "卧室" }],
      primaryConcerns: "卧室有些潮湿"
    });
    const text = await generate("home_fengshui_basic", assessment);

    expect(text).toContain("这位朋友，先说说这个家的整体感觉");
    expect(text).toContain("这位朋友，逐个看看你在意的空间");
    expect(text).not.toMatch(/整体空间判断|风险点|问题分析/);
    expect(text).toMatch(/采光|通风|潮湿/);
    expect(text).toContain("不承诺发财、转运或化煞效果");
  });

  it("presents date choices without numeric scoring or fatalism", async () => {
    const selection = selectDates({
      event: "moving",
      dateRangeStart: "2026-08-01",
      dateRangeEnd: "2026-08-20",
      user: personA
    });
    const text = await generate("date_selection", selection);

    expect(text).toContain("这位朋友，先说说这段日子");
    expect(text).toContain("这位朋友，日子之外更要准备好这些事");
    expect(text).not.toMatch(/评分\s*\d|不建议日期|吉凶判断/);
    expect(text).toContain("民俗参考");
    expect(text).not.toMatch(/一定|必然|注定|保证顺利/);
  });

  it("tells the real AI to keep semantic requirements inside conversational sections", () => {
    for (const type of ["marriage_basic", "marriage_deep", "home_fengshui_basic", "home_fengshui_deep", "date_selection"] as ReportType[]) {
      const system = buildSystemPrompt(type, type.includes("deep") ? "deep" : "basic");
      const user = buildUserPrompt(type, type.includes("deep") ? "deep" : "basic", {});
      expect(system).toContain("长者");
      expect(user).toContain("不要直接使用“分析 / 判断 / 风险点 / 依据”作为标题");
    }
  });
});
