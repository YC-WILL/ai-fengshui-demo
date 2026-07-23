import { describe, expect, it } from "vitest";
import {
  buildCompanionSystemPrompt,
  buildCompanionUserPrompt,
  classifyCompanionLens,
  COMPANION_PURPOSES,
  mockCompanionReply,
  reportTypeForLens
} from "@/lib/companion/core";
import { safetyFilter } from "@/lib/safety/filter";

describe("companion onboarding and routing", () => {
  it("offers four user-confirmed starting purposes", () => {
    expect(Object.keys(COMPANION_PURPOSES)).toEqual(["talk", "clarify", "self", "daily"]);
    expect(COMPANION_PURPOSES.daily.welcome).not.toMatch(/困扰|最在意|卡住/);
  });

  it("keeps the four former report areas behind one conversation", () => {
    expect(classifyCompanionLens("和对象谈钱时总会吵起来")).toBe("relationship");
    expect(classifyCompanionLens("卧室有点潮湿和霉味")).toBe("home");
    expect(classifyCompanionLens("签约放在哪天比较从容")).toBe("timing");
    expect(classifyCompanionLens("我做决定总是犹豫")).toBe("self");
    expect(reportTypeForLens("home")).toBe("home_fengshui_basic");
  });
});

describe("companion conversation", () => {
  it("does not turn curiosity into a fabricated problem", () => {
    const prompt = buildCompanionSystemPrompt("self", "self", "现实行动优先");
    expect(prompt).toContain("用户只是好奇或随便看看时，不要制造问题");
    expect(prompt).toContain("不输出报告");
    expect(prompt).toContain("只问一个");
  });

  it("uses only limited recent history", () => {
    const history = Array.from({ length: 10 }, (_, index) => ({
      message: `用户消息${index}`,
      reply: `蟾先森回复${index}`
    }));
    const prompt = buildCompanionUserPrompt(history, "今天的话");
    expect(prompt).not.toContain("用户消息0");
    expect(prompt).not.toContain("用户消息1");
    expect(prompt).toContain("用户消息2");
    expect(prompt).toContain("今天的话");
  });

  it("keeps a casual local reply free of assumed distress", () => {
    const reply = mockCompanionReply("daily", "陪我随便坐坐", "self");
    expect(reply).not.toMatch(/你最在意|你的困扰|你容易卡住/);
    expect(reply).toMatch(/今天|留意|观察/);
  });

  it("filters conversation without appending a report disclaimer", () => {
    const result = safetyFilter("可以先观察这件事对你的实际影响。", {
      appendDisclaimer: false,
      context: "conversation"
    });
    expect(result.text).not.toContain("免责声明");
    expect(result.ok).toBe(true);
  });
});
