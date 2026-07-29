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
    expect(workspace).toContain("context?.professionalFacts ?? null");
    expect(workspace).not.toContain("buildProfessionalBaziFactsV1");
    expect(workspace).not.toContain("traditionalCalendarCatalog");
    expect(route).toContain("buildProfessionalBaziFactsOnServer(chart, calculatedAt)");
    expect(route).toContain("professionalFacts,");
    expect(continuation).toContain('from "@/lib/plateVersions"');
    expect(continuation).not.toContain('from "@/lib/plateRecords"');
  });

  it("keeps the original chart, current time and source information in separate sections", () => {
    expect(panel.indexOf("professional-origin")).toBeLessThan(panel.indexOf("professional-supplement"));
    expect(panel.indexOf("professional-supplement")).toBeLessThan(panel.indexOf("professional-current-time"));
    expect(panel.indexOf("professional-current-time")).toBeLessThan(panel.indexOf("professional-source"));
    expect(panel).toContain("与原局分区，不视为本命组成");
  });

  it("does not derive child fields for an uncertain pillar", () => {
    expect(panel).toContain("随出生时刻候选变化，暂不展开");
    expect(panel).toContain('pillar.visibleTenGod.certainty === "confirmed"');
    expect(panel).toContain('pillar.hiddenStems.certainty === "confirmed"');
    expect(panel).toContain("候选干支同等展示");
  });

  it("expands hidden stems with their existing reviewable facts", () => {
    for (const field of ["item.element", "item.qiLevel", "item.tenGod", "item.relation", "item.polarity"]) {
      expect(panel).toContain(field);
    }
    expect(panel).toContain("expandedHiddenPillar");
    expect(panel).toContain("professional-hidden-detail");
    expect(panel).toContain("nextExpandedHiddenPillar(current, pillar.position.value)");
    expect(panel).not.toContain("<details key={pillar.position.value}");
  });

  it("uses real table rows for the dense matrix", () => {
    expect(panel.match(/className="professional-matrix-row" role="row"/g)).toHaveLength(5);
    expect(panel).toContain('role="table"');
    expect(panel).toContain('role="rowheader"');
    expect(panel).toContain('role="columnheader"');
    expect(panel).toMatch(/<div\s+key=\{pillar\.position\.value\}\s+role="cell"\s+className=\{`professional-hidden-cell/);
    expect(panel).toMatch(/<button\s+type="button"\s+aria-label=/);
    expect(panel).not.toMatch(/<button[\s\S]{0,120}role="cell"/);
    expect(panel).toContain('aria-expanded={expandedHiddenPillar === pillar.position.value}');
    expect(panel).toContain('aria-controls="professional-hidden-detail"');
  });

  it("separates traditional catalog sources from project implementation IDs", () => {
    expect(panel).toContain("传统历法规则");
    expect(panel).toContain("项目计算规则");
    expect(panel).toContain("不等同于传统出处");
    expect(panel).toContain("技术追溯");
    expect(panel).toContain('startsWith("catalog:")');
    expect(panel).toContain('startsWith("code:")');
  });

  it("keeps excluded predictive fields out of the professional panel", () => {
    expect(panel).toContain("不含旺衰、喜忌、格局与吉凶判断");
    expect(panel).not.toMatch(/大运|多年流年|纳音|空亡|十二长生|神煞|人生评分|财富预测|健康预测/);
  });
});
