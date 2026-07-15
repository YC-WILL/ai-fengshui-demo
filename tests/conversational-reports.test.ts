import { describe, expect, it } from "vitest";
import { MockProvider } from "@/lib/ai/mock";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import { matchMarriage } from "@/lib/domain/marriage";
import { assessFengShui } from "@/lib/domain/fengshui";
import { selectDates } from "@/lib/domain/dateSelection";
import {
  MEMBERSHIP_PRICING, isMemberReportType,
  type AIGenerateInput, type ReportType
} from "@/lib/types";

const provider = new MockProvider();
const personA = { gender: "male" as const, birthDate: "1992-04-10", birthTime: "08:30", unknownTime: false };
const personB = { gender: "female" as const, birthDate: "1994-09-22", birthTime: "16:00", unknownTime: false };

async function generate(reportType: ReportType, ruleResult: unknown) {
  const tier = reportType.includes("deep") || reportType === "date_selection" ? "deep" : "basic";
  const input: AIGenerateInput = {
    reportType,
    tier,
    systemPrompt: buildSystemPrompt(reportType, tier),
    userPrompt: buildUserPrompt(reportType, tier, ruleResult),
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

    expect(text).toMatch(/^# 两位朋友，我们看看彼此相处的步调/);
    expect(text).toContain("## 1. 先说说你们相处的感觉");
    expect(text).toContain("## 6. 最后说一句");
    expect(text.match(/两位朋友/g)).toHaveLength(1);
    expect(text).not.toMatch(/沟通风格关键词|关系优势|潜在摩擦点|匹配度/);
    expect(text).not.toMatch(/必合|必分|正缘|孽缘|克夫|克妻/);
  });

  it("uses a warm title for the deep relationship report", async () => {
    const match = matchMarriage({ partyA: personA, partyB: personB });
    const text = await generate("marriage_deep", {
      partyA: { dayMaster: match.partyA.dayMaster, zodiac: match.partyA.zodiac },
      partyB: { dayMaster: match.partyB.dayMaster, zodiac: match.partyB.zodiac },
      communicationStyle: match.communicationStyle,
      strengths: match.strengths,
      frictionPoints: match.frictionPoints,
      suggestions: match.suggestions
    });

    expect(text).toMatch(/^# 两位朋友，我们把这段相处慢慢聊开/);
    expect(text.match(/两位朋友/g)).toHaveLength(1);
    expect(buildSystemPrompt("marriage_deep", "deep")).toContain(
      "一级标题必须是“两位朋友，我们把这段相处慢慢聊开”"
    );
  });

  it("walks through the home in a practical, friendly voice", async () => {
    const assessment = assessFengShui({
      orientation: "朝南",
      layout: "两室一厅，客厅采光较好",
      rooms: [{ name: "玄关" }, { name: "客厅" }, { name: "卧室" }],
      primaryConcerns: "卧室有些潮湿"
    });
    const text = await generate("home_fengshui_basic", assessment);

    expect(text).toMatch(/^# 这位朋友，我们一起看看这个家/);
    expect(text).toContain("## 1. 先说说这个家的整体感觉");
    expect(text).toContain("## 3. 逐个看看你在意的空间");
    expect(text.match(/这位朋友/g)).toHaveLength(1);
    expect(text).not.toMatch(/整体空间判断|风险点|问题分析/);
    expect(text).toMatch(/采光|通风|潮湿/);
    expect(text).toContain("不承诺发财、转运或化煞效果");
  });

  it("uses a warmer title for the deep home report", async () => {
    const assessment = assessFengShui({
      orientation: "朝东",
      layout: "一室一厅，下午光线较柔和",
      rooms: [{ name: "客厅" }, { name: "书房" }]
    });
    const text = await generate("home_fengshui_deep", assessment);

    expect(text).toMatch(/^# 这位朋友，我们把这个家细细走一遍/);
    expect(text.match(/这位朋友/g)).toHaveLength(1);
    expect(buildSystemPrompt("home_fengshui_deep", "deep")).toContain(
      "一级标题必须是“这位朋友，我们把这个家细细走一遍”"
    );
  });

  it("provides a useful free date selection without a paywall", async () => {
    const selection = selectDates({
      event: "moving",
      dateRangeStart: "2026-08-01",
      dateRangeEnd: "2026-08-20",
      user: personA
    });
    const text = await generate("date_selection_basic", selection);

    expect(text).toMatch(/^# 这位朋友，先挑个从容的日子/);
    expect(text).toContain("## 3. 日子之外，先准备好这三件事");
    expect(text.match(/这位朋友/g)).toHaveLength(1);
    expect(text).not.toContain("有几个日子不妨绕开");
    expect(text).toContain("每天都可以使用的免费民俗参考");
    expect(isMemberReportType("date_selection_basic")).toBe(false);
  });

  it("keeps more date options and comparison in the paid version", async () => {
    const selection = selectDates({
      event: "moving",
      dateRangeStart: "2026-08-01",
      dateRangeEnd: "2026-08-20",
      user: personA
    });
    const text = await generate("date_selection", selection);

    expect(text).toMatch(/^# 这位朋友，我们把这段日子细细挑一遍/);
    expect(text).toContain("## 3. 有几个日子不妨绕开");
    expect(text).toContain("## 4. 日子之外更要准备好这些事");
    expect(text.match(/这位朋友/g)).toHaveLength(1);
    expect(text).not.toMatch(/评分\s*\d|不建议日期|吉凶判断/);
    expect(text).toContain("民俗参考");
    expect(text).not.toMatch(/一定|必然|注定|保证顺利/);
    expect(isMemberReportType("date_selection")).toBe(true);
    expect(MEMBERSHIP_PRICING.monthly.amountFen).toBe(1800);
    expect(MEMBERSHIP_PRICING.annual.amountFen).toBe(12800);
  });

  it("tells the real AI to keep semantic requirements inside conversational sections", () => {
    for (const type of ["marriage_basic", "marriage_deep", "home_fengshui_basic", "home_fengshui_deep", "date_selection_basic", "date_selection"] as ReportType[]) {
      const tier = type.includes("deep") || type === "date_selection" ? "deep" : "basic";
      const system = buildSystemPrompt(type, tier);
      const user = buildUserPrompt(type, tier, {});
      expect(system).toContain("长者");
      expect(user).toContain("不要直接使用“分析 / 判断 / 风险点 / 依据”作为标题");
    }
  });

  it("changes relationship advice when the two-person structure changes", async () => {
    const first = matchMarriage({ partyA: personA, partyB: personB });
    const second = matchMarriage({
      partyA: { gender: "female", birthDate: "1988-01-08", birthTime: "06:20", unknownTime: false },
      partyB: { gender: "male", birthDate: "2001-11-19", birthTime: "21:10", unknownTime: false }
    });
    const firstText = await generate("marriage_basic", first);
    const secondText = await generate("marriage_basic", second);

    expect(first.suggestions).not.toEqual(second.suggestions);
    expect(firstText).not.toBe(secondText);
    expect(firstText.match(/两位朋友/g)).toHaveLength(1);
    expect(secondText.match(/两位朋友/g)).toHaveLength(1);
  });

  it("changes the home focus and first actions with the lived concern", async () => {
    const damp = assessFengShui({
      orientation: "朝北",
      layout: "卧室靠近卫生间",
      rooms: [{ name: "卧室", note: "墙角偶有返潮" }],
      primaryConcerns: "潮湿和霉味"
    });
    const noisy = assessFengShui({
      orientation: "朝西",
      layout: "客厅与卧室临街",
      rooms: [{ name: "卧室", note: "晚上能听到车声" }],
      primaryConcerns: "噪音和隔音"
    });
    const dampText = await generate("home_fengshui_basic", damp);
    const noisyText = await generate("home_fengshui_basic", noisy);

    expect(damp.focus.key).toBe("dry");
    expect(noisy.focus.key).toBe("quiet");
    expect(damp.improvementsZeroBudget[0]).not.toBe(noisy.improvementsZeroBudget[0]);
    expect(dampText).toContain("干爽与呼吸");
    expect(noisyText).toContain("安静与休息");
  });

  it("uses conditional language for home conditions the user did not provide", () => {
    const assessment = assessFengShui({
      orientation: "朝西",
      layout: "两室一厅",
      rooms: [{ name: "卧室", note: "临街" }],
      primaryConcerns: "晚上有车流噪音"
    });

    expect(assessment.orientationNote).toMatch(/观察|如果/);
    expect(assessment.orientationNote).not.toMatch(/采光良好|通风良好|整体不差|格局舒展/);
    expect(assessment.layoutNote).not.toMatch(/格局本身|舒展|通风不差/);
  });

  it("writes date-selection openings and preparation for the actual event", async () => {
    const moving = selectDates({
      event: "moving",
      dateRangeStart: "2026-08-01",
      dateRangeEnd: "2026-08-20",
      user: personA
    });
    const signing = selectDates({
      event: "signing",
      dateRangeStart: "2026-08-01",
      dateRangeEnd: "2026-08-20",
      user: personA
    });
    const movingText = await generate("date_selection_basic", moving);
    const signingText = await generate("date_selection_basic", signing);

    expect(movingText).toContain("搬运、水电、天气");
    expect(signingText).toContain("条款清楚、双方在场");
    expect(moving.preparationChecklist).not.toEqual(signing.preparationChecklist);
    expect(movingText).not.toBe(signingText);
    expect(movingText).not.toMatch(/星座|白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼/);
  });
});
