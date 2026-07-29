import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProfessionalBaziPanel, {
  nextExpandedHiddenPillar
} from "@/components/ProfessionalBaziPanel";
import { computeBazi } from "@/lib/domain/bazi";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

describe("Professional Bazi mobile matrix render", () => {
  it("renders a compact semantic table and keeps hidden-stem detail closed initially", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1988-03-12",
      birthTime: "09:35",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(
      chart,
      new Date("2026-07-29T07:18:42.321Z")
    );

    const markup = renderToStaticMarkup(
      createElement(ProfessionalBaziPanel, { facts: professionalFacts })
    );

    expect(markup).toContain('role="table"');
    expect(markup.match(/role="row"/g)).toHaveLength(5);
    expect(markup).toMatch(/<div role="cell" class="professional-hidden-cell [^"]*"><button type="button"/);
    expect(markup).not.toMatch(/<button[^>]*role="cell"/);
    expect(markup.match(/aria-label="展开[^"]+藏干详情：[^"]+"/g)).toHaveLength(4);
    expect(markup.match(/aria-expanded="false"/g)).toHaveLength(4);
    expect(markup.match(/aria-controls="professional-hidden-detail"/g)).toHaveLength(4);
    expect(markup).not.toContain('id="professional-hidden-detail"');
    expect(markup).not.toContain("7px");
    expect(markup).not.toContain("8px");
  });

  it("keeps at most one expanded pillar and toggles the current pillar closed", () => {
    expect(nextExpandedHiddenPillar(null, "年柱")).toBe("年柱");
    expect(nextExpandedHiddenPillar("年柱", "月柱")).toBe("月柱");
    expect(nextExpandedHiddenPillar("月柱", "月柱")).toBeNull();
  });

  it("does not render expand buttons for uncertain or unavailable pillars", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-02-04",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(
      chart,
      new Date("2026-07-29T07:18:42.321Z")
    );

    const markup = renderToStaticMarkup(
      createElement(ProfessionalBaziPanel, { facts: professionalFacts })
    );

    expect(markup.match(/aria-label="展开[^"]+藏干详情：[^"]+"/g)).toHaveLength(1);
    expect(markup).toContain('aria-label="展开日柱藏干详情：');
    expect(markup).not.toContain('aria-label="展开年柱藏干详情：');
    expect(markup).not.toContain('aria-label="展开月柱藏干详情：');
    expect(markup).not.toContain('aria-label="展开时柱藏干详情：');
  });
});
