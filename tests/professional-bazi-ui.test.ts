import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Professional Bazi V1 UI contract", () => {
  const workspace = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
  const panel = readFileSync("src/components/ProfessionalBaziPanel.tsx", "utf8");
  const route = readFileSync("src/app/api/today-correspondence/route.ts", "utf8");
  const continuation = readFileSync("src/lib/plateContinuation.ts", "utf8");

  it("switches between the unchanged analysis layer and a facts-contract professional layer", () => {
    expect(workspace).toContain('useState<"analysis" | "professional">("analysis")');
    expect(workspace).toContain('baziView === "analysis"');
    expect(workspace).toContain('baziView === "professional" && professionalFacts');
    expect(workspace).toContain('boundaryUncertainty && baziView === "professional"');
    expect(workspace).not.toContain('{boundaryUncertainty && <div');
    expect(workspace).toContain("birthSolarTermFacts={birthSolarTermFacts}");
    expect(workspace).toContain("context?.professionalFacts ?? null");
    expect(workspace).not.toContain("buildProfessionalBaziFactsV1");
    expect(workspace).not.toContain("traditionalCalendarCatalog");
    expect(route).toContain("buildProfessionalBaziFactsOnServer(chart, calculatedAt)");
    expect(route).toContain("professionalFacts,");
    expect(continuation).toContain('from "@/lib/plateVersions"');
    expect(continuation).not.toContain('from "@/lib/plateRecords"');
  });

  it("keeps every professional fact group in one continuous order", () => {
    expect(panel.indexOf("professional-origin")).toBeLessThan(panel.indexOf("professional-supplement"));
    expect(panel.indexOf("professional-supplement")).toBeLessThan(panel.indexOf("<SolarTermFactsSection"));
    expect(panel.indexOf("<SolarTermFactsSection")).toBeLessThan(panel.indexOf("professional-current-time"));
    expect(panel.indexOf("professional-current-time")).toBeLessThan(panel.indexOf("professional-source"));
    expect(panel.indexOf("professional-source")).toBeLessThan(panel.indexOf("professional-technical-trace"));
    expect(panel).toContain("与原局分区，不视为本命组成");
    expect(panel).not.toMatch(/<details|<summary/);
  });

  it("does not derive child fields for an uncertain pillar", () => {
    expect(panel).toContain("候选柱位");
    expect(panel).toContain('pillar.visibleTenGod.certainty === "confirmed"');
    expect(panel).toContain('pillar.hiddenStems.certainty === "confirmed"');
    expect(panel).toContain("候选干支同等展示");
  });

  it("shows hidden stems with their existing reviewable facts without expansion", () => {
    for (const field of ["item.element", "item.qiLevel", "item.tenGod", "item.relation", "item.polarity"]) {
      expect(panel).toContain(field);
    }
    expect(panel).toContain("professional-hidden-facts");
    expect(panel).not.toContain("expandedHiddenPillar");
    expect(panel).not.toMatch(/展开|收起|aria-expanded|aria-controls/);
  });

  it("uses real table rows for the dense matrix", () => {
    expect(panel.match(/className="professional-matrix-row" role="row"/g)).toHaveLength(5);
    expect(panel).toContain('role="table"');
    expect(panel).toContain('role="rowheader"');
    expect(panel).toContain('role="columnheader"');
    expect(panel).toContain('className="professional-hidden-cell"');
    expect(panel).not.toMatch(/<button[\s\S]{0,120}藏干/);
  });

  it("shows solar-term facts and separates every trace source", () => {
    expect(panel).toContain("出生节气事实");
    expect(panel).toContain("birthSolarTermFacts.calculationConvention");
    expect(panel).toContain("birthSolarTermFacts.algorithmVersion");
    expect(panel).toContain("birthSolarTermFacts.sourceRuleId");
    expect(panel).toContain("传统历法规则");
    expect(panel).toContain("项目计算规则");
    expect(panel).toContain("技术追溯");
    expect(panel).toContain('startsWith("catalog:")');
    expect(panel).toContain('startsWith("code:")');
  });

  it("keeps excluded predictive fields out of the professional panel", () => {
    expect(panel).toContain("旺衰、喜忌、格局与吉凶不在当前事实合同中");
    expect(panel).not.toMatch(/仅供参考|只负责|只呈现|系统判断|吉凶判断|可能是|大致处于|建议结合实际/);
    expect(panel).not.toMatch(/大运|多年流年|纳音|空亡|十二长生|神煞|人生评分|财富预测|健康预测/);
  });
});
