import { describe, it, expect } from "vitest";
import { safetyFilter } from "@/lib/safety/filter";

describe("safetyFilter", () => {
  it("blocks high-risk: 死亡/绝症", () => {
    const r = safetyFilter("根据测算，你三年内会有绝症缠身。");
    expect(r.blocked).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("出于内容安全考虑");
  });

  it("blocks high-risk: 必发财", () => {
    const r = safetyFilter("此宅必发财，三月内进账百万。");
    expect(r.blocked).toBe(true);
  });

  it("blocks high-risk: 改命", () => {
    const r = safetyFilter("通过本服务可以改命，消灾避难。");
    expect(r.blocked).toBe(true);
  });

  it("blocks high-risk: 必离婚", () => {
    const r = safetyFilter("两位日主相克，今年必离婚。");
    expect(r.blocked).toBe(true);
  });

  it("blocks high-risk: 股票必涨", () => {
    const r = safetyFilter("近期某只股票必涨，建议加仓。");
    expect(r.blocked).toBe(true);
  });

  it("rewrites medium-risk: 一定破财", () => {
    const r = safetyFilter("根据流年分析，今年一定破财。");
    // 中风险应被重写而非拦截（"一定"是低风险，整体仍 ok）
    expect(r.blocked).toBe(false);
    expect(r.text).not.toMatch(/^[^一]*一定破财/);
  });

  it("softens 必然/一定/保证 → 更倾向于 / 更可能 / 更有助于", () => {
    const r = safetyFilter("这种布局必然提升运势，一定改善财务，保证家庭和睦。");
    expect(r.blocked).toBe(false);
    expect(r.text).not.toContain("必然");
    expect(r.text).not.toMatch(/(?<!程度)一定(?!程度)/);
    expect(r.text).not.toContain("保证家庭");
    expect(r.text).toContain("更倾向于");
  });

  it("appends disclaimer when not present", () => {
    const r = safetyFilter("这是一段安全的报告内容。");
    expect(r.text).toContain("免责声明");
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
