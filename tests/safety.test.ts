import { describe, it, expect } from "vitest";
import { safetyFilter } from "@/lib/safety/filter";

describe("safetyFilter · 高风险拦截", () => {
  it.each([
    ["死亡 / 绝症",       "根据测算，你三年内会有绝症缠身。"],
    ["血光之灾",         "今年血光之灾在所难免。"],
    ["寿命预测",         "结合八字给你做一份寿命预测。"],
    ["必发财",           "此宅必发财，三月内进账百万。"],
    ["必破财",           "本月必破财，提前规避。"],
    ["改命 / 消灾",      "通过本服务可以改命，消灾避难。"],
    ["必离婚",           "两位日主相克，今年必离婚。"],
    ["必出轨",           "对方一定必出轨。"],
    ["克夫克妻",         "她属虎，克夫克妻无疑。"],
    ["孽缘",             "你们二人是前世孽缘。"],
    ["绝对正缘",         "他就是你的绝对正缘。"],
    ["股票推荐",         "推荐你买一只内部消息股，必涨。"],
    ["彩票号码",         "本期推荐彩票号码：07 12 18。"],
    ["投资必赚",         "把钱放进这个理财，投资必赚。"],
    ["不用看医生",       "腰痛不需要看医生，用风水治病即可。"],
    ["开光保证 / 化太岁保证", "今年化太岁保证有效，记得开光保证保你顺遂。"]
  ])("blocks: %s", (_label, text) => {
    const r = safetyFilter(text);
    expect(r.blocked).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("出于内容安全考虑");
  });
});

describe("safetyFilter · 中风险重写", () => {
  it("rewrites: 一定破财", () => {
    const r = safetyFilter("根据流年分析，今年一定破财。");
    expect(r.blocked).toBe(false);
    expect(r.text).not.toMatch(/今年一定破财/);
  });

  it("rewrites: 你们一定离婚", () => {
    const r = safetyFilter("从八字来看，你们一定离婚。");
    expect(r.blocked).toBe(false);
    expect(r.text).not.toMatch(/你们一定离婚/);
  });

  it("rewrites: 这个布局一定发财", () => {
    const r = safetyFilter("这个布局一定发财，全家都会受益。");
    expect(r.blocked).toBe(false);
    expect(r.text).not.toMatch(/布局一定发财/);
  });
});

describe("safetyFilter · 低风险软化", () => {
  it("softens 必然 / 一定 / 保证 / 百分百", () => {
    const r = safetyFilter("这种布局必然提升运势，一定改善财务，保证家庭和睦，百分百有效。");
    expect(r.blocked).toBe(false);
    expect(r.text).not.toContain("必然");
    expect(r.text).not.toMatch(/(?<!程度)一定(?!程度)/);
    expect(r.text).not.toContain("保证家庭");
    expect(r.text).not.toContain("百分百");
    expect(r.text).toContain("更倾向于");
  });

  it("does not soften 一定程度 (whitelisted)", () => {
    const r = safetyFilter("在一定程度上可以改善睡眠。");
    expect(r.blocked).toBe(false);
    expect(r.text).toContain("一定程度");
  });

  it("does not soften 保证金", () => {
    const r = safetyFilter("退还保证金后再决定。");
    expect(r.blocked).toBe(false);
    expect(r.text).toContain("保证金");
  });
});

describe("safetyFilter · 收尾", () => {
  it("appends GuaAn-branded disclaimer when not present", () => {
    const r = safetyFilter("这是一段安全的报告内容。");
    expect(r.text).toContain("免责声明");
    expect(r.text).toContain("卦安");
  });

  it("does not double-append disclaimer", () => {
    const r = safetyFilter("这是一段安全的报告内容。\n\n免责声明：仅供参考。");
    const count = (r.text.match(/免责声明/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("safety result includes match metadata", () => {
    const r = safetyFilter("你的命中注定一定如此。");
    expect(r.matches.length).toBeGreaterThan(0);
    expect(r.matches.some(m => m.severity === "low")).toBe(true);
  });
});
