import { describe, expect, it } from "vitest";
import {
  normalizeGeneratedReport,
  normalizePersonalityProfile,
  prepareRuleResultForReport
} from "@/lib/reports/contentGuard";
import { safetyFilter } from "@/lib/safety/filter";

describe("report content guard", () => {
  it("keeps basic bazi inputs conversational and enforces a 100-180 character profile", () => {
    const prepared = prepareRuleResultForReport("bazi_basic", {
      dayMaster: "甲",
      pillars: { year: "甲子" },
      elementCounts: { 木: 4, 火: 0 },
      elementMissing: ["火"],
      friendlyCoreConclusion: "先看生活里的步调，不急着给自己下结论。",
      friendlyElementNote: "你更熟悉稳稳落实的节奏，也可以为表达和尝试多留一点空间。",
      personalityProfile: "这是一段太短的画像。",
      lifeReminders: ["提醒一", "提醒二"],
      lifeSuggestions: ["建议一", "建议二", "建议三"]
    }) as Record<string, unknown>;

    expect(prepared).not.toHaveProperty("dayMaster");
    expect(prepared).not.toHaveProperty("pillars");
    expect(prepared).not.toHaveProperty("elementCounts");
    expect(prepared).not.toHaveProperty("elementMissing");
    expect(String(prepared.personalityProfile).length).toBeGreaterThanOrEqual(100);
    expect(String(prepared.personalityProfile).length).toBeLessThanOrEqual(180);
  });

  it("does not expose relationship calculations to the model", () => {
    const prepared = prepareRuleResultForReport("marriage_basic", {
      partyA: { dayMaster: "乙" },
      partyB: { dayMaster: "辛" },
      dayMasterRelation: { kind: "ke", direction: "B→A" },
      elementBalance: { combinedDistribution: { 木: 3, 金: 4 } },
      communicationStyle: "日主组合 乙/辛：建议先听完再回应。",
      strengths: ["彼此愿意给出真实反馈"],
      frictionPoints: ["回应顺序不同"],
      suggestions: ["先确认彼此真正介意的重点"]
    });
    const serialized = JSON.stringify(prepared);

    expect(serialized).not.toMatch(/dayMaster|elementBalance|combinedDistribution|B→A|日主组合/);
    expect(serialized).toContain("回应和决策节奏不同");
  });

  it("removes member-only dates and calculation fields from free date selection", () => {
    const prepared = prepareRuleResultForReport("date_selection_basic", {
      event: "signing",
      recommended: [
        { date: "2026-08-01", score: 80, ganzhiDay: "甲子", reasons: ["人员方便"] },
        { date: "2026-08-02", score: 70, ganzhiDay: "乙丑", reasons: ["时间从容"] },
        { date: "2026-08-03", score: 65, ganzhiDay: "丙寅", reasons: ["便于核对"] }
      ],
      notRecommended: [{ date: "2026-08-08", score: 20 }],
      preparationChecklist: ["核对条款", "确认人员", "留存版本", "咨询律师"]
    });
    const serialized = JSON.stringify(prepared);

    expect(serialized).not.toMatch(/notRecommended|2026-08-08|score|ganzhiDay/);
    expect((prepared as { recommended: unknown[] }).recommended).toHaveLength(2);
    expect((prepared as { preparationChecklist: unknown[] }).preparationChecklist).toHaveLength(3);
    expect(serialized).toContain("留存版本");
  });

  it("replaces an oversized personality section and leaves one system disclaimer", () => {
    const profile = normalizePersonalityProfile("你可能习惯先行动，再根据现实反馈慢慢调整。".repeat(20));
    const aiText = `# 这位朋友，我们聊聊你的性格与步调

## 1. 先说说整体印象
先把最在意的事情理清，再决定下一步。

## 2. 看看五行的小提示
这里是一段生活化的小提示。

## 3. 来看看你的性格画像
${"这是一段模型自行扩写的超长性格画像。".repeat(30)}

## 4. 给你三句小建议
- 今天先完成一件最重要的小事。

## 5. 最后说一句
免责声明：仅供参考。`;
    const normalized = normalizeGeneratedReport("bazi_basic", aiText, {
      personalityProfile: profile
    });
    const safe = safetyFilter(normalized);
    const profileSection = normalized.match(/## 3[^\n]*\n([\s\S]*?)(?=\n##|$)/)?.[1].trim() ?? "";

    expect(profileSection).toBe(profile);
    expect(profileSection.length).toBeGreaterThanOrEqual(100);
    expect(profileSection.length).toBeLessThanOrEqual(180);
    expect(normalized).not.toContain("免责声明");
    expect(normalized.length).toBeLessThanOrEqual(900);
    expect(safe.text.match(/免责声明/g)).toHaveLength(1);
  });

  it("scrubs internal relationship terminology if a model still echoes it", () => {
    const normalized = normalizeGeneratedReport(
      "marriage_basic",
      "# 两位朋友，我们看看彼此相处的步调\n\n## 看看步调\n乙木与辛金的日主形成金克木，生克方向是 B→A，合并的五行分布也有差别。",
      {}
    );

    expect(normalized).not.toMatch(/乙木|辛金|日主|金克木|生克|B→A|五行分布/);
    expect(normalized).toMatch(/回应节奏|双方节奏有别|互动方式|共同的生活节奏/);
    expect(normalized).toContain("\n\n## 看看步调\n");
  });

  it("keeps three actions while shortening a mobile report", () => {
    const longAction = "先把真正需要处理的事情写清楚，再和相关的人确认时间、责任与下一步。";
    const normalized = normalizeGeneratedReport(
      "date_selection_basic",
      `# 这位朋友，先挑个从容的日子\n\n## 日子之外，先准备好这三件事\n1. ${longAction.repeat(5)}\n\n2. ${longAction.repeat(5)}\n\n3. ${longAction.repeat(5)}`,
      {}
    );

    expect(normalized).toMatch(/1\./);
    expect(normalized).toMatch(/2\./);
    expect(normalized).toMatch(/3\./);
    expect(normalized.length).toBeLessThanOrEqual(800);
  });

  it("removes unsupported home and participant-schedule assertions", () => {
    const home = normalizeGeneratedReport(
      "home_fengshui_basic",
      "# 这位朋友，我们一起看看这个家\n\n## 整体感觉\n两室一厅，格局算是踏实的。骨架是够用的。可以观察下午是否西晒。",
      {}
    );
    const date = normalizeGeneratedReport(
      "date_selection_basic",
      "# 这位朋友，先挑个从容的日子\n\n## 这段日子\n对方还没进入忙乱状态，约时间相对容易。如果安排在周末，建议确认相关人员是否在岗。",
      {}
    );

    expect(home).not.toMatch(/格局算是踏实|骨架是够用/);
    expect(home).toContain("可以观察下午是否西晒");
    expect(date).not.toContain("还没进入忙乱状态");
    expect(date).toContain("建议确认相关人员是否在岗");
  });
});
