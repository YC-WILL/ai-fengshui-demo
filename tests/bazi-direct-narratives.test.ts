import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi } from "@/lib/domain/bazi";
import {
  BAZI_DIRECT_NARRATIVE_CATALOG,
  BAZI_DIRECT_NARRATIVE_FACT_IDS,
  YI_WOOD_ROOSTER_MONTH_NARRATIVE,
  selectBaziDirectNarrative
} from "@/lib/domain/baziDirectNarratives";
import { buildBaziMainlineNarrative } from "@/lib/domain/baziMainlineNarrative";
import type { ProfessionalBaziFactsV1 } from "@/lib/domain/professionalBaziFacts";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
const calculatedAt = new Date("2026-08-01T02:00:00.000Z");
const approvedNarrative = `秋意铺开的时候你来到世间，草木褪去旺盛生机，天地慢慢沉静收敛。

你就像一株柔韧藤蔓，秋日不复温暖繁盛，无法肆意蔓延，总要循着周遭的框架，找到合适的地方缓缓生长。

秋里清劲之气自成边界，时刻与你相伴。

这让你本能留意人和事的边界、截止的期限、该承担的责任。只要环境条理分明，没有模糊不清的灰色地带，你便能清晰看清方向，安心向外舒展。`;

function fictionalFacts(
  overrides: Partial<Parameters<typeof computeBazi>[0]> = {}
): ProfessionalBaziFactsV1 {
  const chart = computeBazi({
    gender: "other",
    birthDate: "1980-09-09",
    birthTime: "10:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false,
    ...overrides
  });
  return buildProfessionalBaziFactsOnServer(chart, calculatedAt).professionalFacts;
}

function resolveFactPath(facts: ProfessionalBaziFactsV1, id: string): unknown {
  return id.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, facts);
}

describe("Bazi direct narrative catalog", () => {
  it("stores the approved 乙木酉月 text as one complete, versioned original entry", () => {
    const entries = Object.values(BAZI_DIRECT_NARRATIVE_CATALOG);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: "bazi-direct-narrative:乙-酉:v1",
      dayStem: "乙",
      monthBranch: "酉",
      requiredFacts: {
        dayElement: "木",
        dayYinYang: "阴",
        monthMainStem: "辛",
        monthMainTenGod: "七杀"
      },
      contentVersion: "bazi-direct-narrative-v1",
      interpretationKind: "project_original_modern_reading",
      factDependencies: BAZI_DIRECT_NARRATIVE_FACT_IDS
    });
    expect(YI_WOOD_ROOSTER_MONTH_NARRATIVE).toBe(approvedNarrative);
    expect(entries[0].narrative).toBe(approvedNarrative);
  });

  it("selects the approved text only when every required 乙木酉月 fact matches", () => {
    const facts = fictionalFacts();
    const selection = selectBaziDirectNarrative(facts);

    expect(facts.dayMaster).toMatchObject({
      stem: { value: "乙", certainty: "confirmed" },
      element: { value: "木", certainty: "confirmed" },
      yinYang: { value: "阴", certainty: "confirmed" }
    });
    expect(facts.monthCommand).toMatchObject({
      branch: { value: "酉", certainty: "confirmed" },
      mainStem: { value: "辛", certainty: "confirmed" },
      mainTenGod: { value: "七杀", certainty: "confirmed" }
    });
    expect(selection.status).toBe("available");
    expect(selection.status === "available" && selection.entry.narrative).toBe(approvedNarrative);
    expect(selectBaziDirectNarrative).toHaveLength(1);
  });

  it("does not reuse the text for a different day stem or a different month branch", () => {
    const differentDay = structuredClone(fictionalFacts());
    differentDay.dayMaster.stem = { ...differentDay.dayMaster.stem, value: "甲" };
    const differentMonth = structuredClone(fictionalFacts());
    differentMonth.monthCommand.branch = { ...differentMonth.monthCommand.branch, value: "申" };

    expect(selectBaziDirectNarrative(differentDay)).toEqual({
      status: "not_available",
      reason: "combination_not_reviewed"
    });
    expect(selectBaziDirectNarrative(differentMonth)).toEqual({
      status: "not_available",
      reason: "combination_not_reviewed"
    });
  });

  it("stops on month candidates or unavailable dependencies", () => {
    const uncertainMonth = structuredClone(fictionalFacts());
    uncertainMonth.uncertainty.monthPillarCandidates = {
      ...uncertainMonth.uncertainty.monthPillarCandidates,
      value: ["乙酉", "甲申"],
      certainty: "uncertain"
    };
    const unavailableMainTenGod = structuredClone(fictionalFacts());
    unavailableMainTenGod.monthCommand.mainTenGod = {
      ...unavailableMainTenGod.monthCommand.mainTenGod,
      value: null,
      certainty: "unavailable"
    };
    const mismatchedMainTenGod = structuredClone(fictionalFacts());
    mismatchedMainTenGod.monthCommand.mainTenGod = {
      ...mismatchedMainTenGod.monthCommand.mainTenGod,
      value: "正官"
    };

    expect(selectBaziDirectNarrative(uncertainMonth)).toEqual({
      status: "not_available",
      reason: "month_pillar_uncertain"
    });
    expect(selectBaziDirectNarrative(unavailableMainTenGod)).toEqual({
      status: "not_available",
      reason: "necessary_fact_unavailable"
    });
    expect(selectBaziDirectNarrative(mismatchedMainTenGod)).toEqual({
      status: "not_available",
      reason: "necessary_fact_unavailable"
    });
  });

  it("keeps the reading when only the unknown hour changes", () => {
    const facts = fictionalFacts({ birthTime: "", unknownTime: true });
    const selection = selectBaziDirectNarrative(facts);

    expect(facts.input.timeKnown.value).toBe(false);
    expect(selection.status).toBe("available");
  });

  it("does not change the reading when non-plate labels change", () => {
    const first = selectBaziDirectNarrative(fictionalFacts({
      gender: "male",
      birthLocation: "虚构甲城"
    }));
    const second = selectBaziDirectNarrative(fictionalFacts({
      gender: "female",
      birthLocation: "虚构乙城"
    }));

    expect(first).toEqual(second);
  });

  it("binds every declared dependency to a real professional fact", () => {
    const facts = fictionalFacts();
    const selection = selectBaziDirectNarrative(facts);
    expect(selection.status).toBe("available");
    if (selection.status !== "available") return;

    selection.entry.factDependencies.forEach(id => {
      const fact = resolveFactPath(facts, id);
      expect(fact).toBeDefined();
      expect(fact).toHaveProperty("certainty", "confirmed");
    });
  });

  it("has no generic article fallback or runtime AI dependency", () => {
    const source = readFileSync("src/lib/domain/baziDirectNarratives.ts", "utf8");

    expect(Object.keys(BAZI_DIRECT_NARRATIVE_CATALOG)).toEqual(["乙-酉"]);
    expect(source).not.toMatch(/@\/lib\/ai|openai|anthropic|generateText|chatCompletion/);
    expect(source).not.toMatch(/你出生在.*季节|你像.*物象|内容正在生成/);
  });

  it("renders the approved article and its basis directly in server markup", () => {
    const narrative = buildBaziMainlineNarrative(fictionalFacts());
    expect(narrative).not.toBeNull();
    const markup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, { narrative: narrative! })
    );

    approvedNarrative.split("\n\n").forEach(paragraph => {
      expect(markup).toContain(paragraph);
    });
    expect(markup).toContain("日主乙木 · 月令酉金 · 本气辛金 · 七杀");
    expect(markup).not.toMatch(/<details|<summary/);
  });

  it("renders confirmed facts without an empty article for an uncovered chart", () => {
    const narrative = buildBaziMainlineNarrative(fictionalFacts({
      birthDate: "1992-04-15"
    }));
    expect(narrative).not.toBeNull();
    expect(narrative!.directNarrative).toEqual({
      status: "not_available",
      reason: "combination_not_reviewed"
    });

    const markup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, { narrative: narrative! })
    );
    expect(markup).toContain("基础信息");
    expect(markup).toContain("五行");
    expect(markup).toContain("十神");
    expect(markup).not.toContain('id="bazi-direct-imagery-title">物象</h3>');
    expect(markup).not.toContain("内容正在生成");
  });
});
