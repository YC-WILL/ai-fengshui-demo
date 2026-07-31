import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi } from "@/lib/domain/bazi";
import {
  BAZI_ANALYSIS_THEME_IDS,
  BAZI_MAINLINE_FACT_IDS,
  buildBaziMainlineNarrative,
  type ReadyBaziAnalysisTheme
} from "@/lib/domain/baziMainlineNarrative";
import type { ProfessionalBaziFactsV1 } from "@/lib/domain/professionalBaziFacts";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
const calculatedAt = new Date("2026-07-30T08:00:00.000Z");

function fictionalFacts(input: Parameters<typeof computeBazi>[0]) {
  const chart = computeBazi(input);
  return buildProfessionalBaziFactsOnServer(chart, calculatedAt).professionalFacts;
}

function confirmedFictionalFacts() {
  return fictionalFacts({
    gender: "male",
    birthDate: "1992-04-15",
    birthTime: "10:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false
  });
}

function narrativeFor(facts: ProfessionalBaziFactsV1) {
  const narrative = buildBaziMainlineNarrative(facts);
  expect(narrative).not.toBeNull();
  return narrative!;
}

function themeById(
  facts: ProfessionalBaziFactsV1,
  id: ReadyBaziAnalysisTheme["id"]
) {
  const theme = narrativeFor(facts).themes.find(item => item.id === id);
  expect(theme).toBeDefined();
  return theme!;
}

function resolveFactPath(facts: ProfessionalBaziFactsV1, id: string): unknown {
  return id.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, facts);
}

describe("Bazi foundation analysis narrative", () => {
  it("builds the three fact-driven themes in the required order", () => {
    const narrative = narrativeFor(confirmedFictionalFacts());

    expect(narrative.themes.map(theme => theme.id)).toEqual(BAZI_ANALYSIS_THEME_IDS);
    narrative.themes.forEach(theme => {
      expect(theme.professionalAnalysis.text).toBeTruthy();
      expect(theme.imagery.text).toBeTruthy();
      expect(theme.plainReading.text).toBeTruthy();
      expect(theme.evidence.length).toBeGreaterThan(0);
    });
    expect(buildBaziMainlineNarrative).toHaveLength(1);
  });

  it("keeps the reviewed day-master and month-command semantics", () => {
    const facts = confirmedFictionalFacts();
    const theme = themeById(facts, "day-master-month-command");

    expect(theme.professionalAnalysis.text).toContain(`日主为${facts.dayMaster.stem.value}`);
    expect(theme.professionalAnalysis.text).toContain(`月令为${facts.monthCommand.branch.value}`);
    expect(theme.professionalAnalysis.text).toContain(`本气是${facts.monthCommand.mainStem.value}`);
    expect(theme.professionalAnalysis.text).toContain(`形成${facts.monthCommand.mainTenGod.value}`);
    expect(theme.imagery.disclaimer).toContain("现代意象");
    expect(theme.imagery.disclaimer).toContain("不是古籍原句");
    expect(theme.plainReading.boundary).toContain("不证明某段现实经历已经发生");
    expect(theme.evidence.map(item => item.id)).toEqual(BAZI_MAINLINE_FACT_IDS);
  });

  it("shows real visible-element counts and the actual covered character count", () => {
    const facts = confirmedFictionalFacts();
    const theme = themeById(facts, "five-elements");
    const summary = theme.elementSummary!;

    expect(summary.coverageCount).toBe(8);
    expect(summary.counts).toEqual(Object.fromEntries(
      Object.entries(facts.visibleElementCounts).map(([element, fact]) => [element, fact.value])
    ));
    expect(Object.values(summary.counts).reduce((sum, count) => sum + count, 0)).toBe(8);
    expect(theme.professionalAnalysis.text).toContain("当前已确认明字共8个");
    expect(theme.professionalAnalysis.text).toContain("只在藏干出现");
    expect(theme.professionalAnalysis.text).toContain("当前已确认范围内未见");
  });

  it("does not turn element counts into absence, energy, strength or remedies", () => {
    const theme = themeById(confirmedFictionalFacts(), "five-elements");
    const text = JSON.stringify(theme);

    expect(text).toContain("不等于命里绝对缺失");
    expect(text).toContain("明字数量不等于力量或能量");
    expect(text).not.toMatch(/五行能量百分比|能量分数|最强五行|最弱五行|命里缺[木火土金水]|应该补[木火土金水]|幸运颜色|补救方位/);
  });

  it("organizes visible and hidden ten gods by confirmed pillar positions", () => {
    const facts = confirmedFictionalFacts();
    const theme = themeById(facts, "ten-gods-pillars");

    expect(theme.tenGodPositions?.map(item => item.position)).toEqual(["年柱", "月柱", "日柱", "时柱"]);
    expect(theme.tenGodPositions?.find(item => item.position === "日柱")?.visible).toBe("日主");
    facts.pillars.forEach((pillar, index) => {
      expect(theme.tenGodPositions?.[index].visible).toBe(
        pillar.position.value === "日柱" ? "日主" : pillar.visibleTenGod.value
      );
      expect(theme.tenGodPositions?.[index].hidden).toEqual(
        pillar.hiddenStems.value.map(item => `${item.stem}·${item.tenGod}·${item.qiLevel}`)
      );
    });
    expect(theme.professionalAnalysis.text).toContain(`月令本气相对日主形成${facts.monthCommand.mainTenGod.value}`);
  });

  it("does not translate ten gods into fixed identity or life conclusions", () => {
    const theme = themeById(confirmedFictionalFacts(), "ten-gods-pillars");
    const text = JSON.stringify(theme);

    expect(text).toContain("不能单独证明人格、职业、婚姻、财富");
    expect(text).toContain("不构成主导性、评分、格局、旺衰、喜用或吉凶判断");
    expect(text).not.toMatch(/你就是|天生适合|注定|必然|一定会|关系评分|十神评分/);
  });

  it("omits the hour pillar and reduces element coverage when birth time is unknown", () => {
    const facts = fictionalFacts({
      gender: "other",
      birthDate: "1985-03-22",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const narrative = narrativeFor(facts);
    const elements = themeById(facts, "five-elements");
    const tenGods = themeById(facts, "ten-gods-pillars");
    const serialized = JSON.stringify(narrative);

    expect(elements.elementSummary?.coverageCount).toBe(6);
    expect(elements.limitation).toContain("时柱未参与本次统计");
    expect(tenGods.tenGodPositions?.map(item => item.position)).toEqual(["年柱", "月柱", "日柱"]);
    expect(tenGods.limitation).toContain("时柱尚未确认");
    expect(serialized).not.toContain("pillars.3.visibleTenGod");
    expect(serialized).not.toContain("pillars.3.hiddenStems");
  });

  it("keeps the day master but stops month-command child interpretation at a boundary", () => {
    const facts = fictionalFacts({
      gender: "other",
      birthDate: "2024-02-04",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const theme = themeById(facts, "day-master-month-command");

    expect(facts.uncertainty.monthPillarCandidates.value.length).toBeGreaterThan(1);
    expect(theme.professionalAnalysis.text).toContain(`日主为${facts.dayMaster.stem.value}`);
    expect(theme.professionalAnalysis.text).toContain("月柱当前存在");
    expect(theme.professionalAnalysis.text).toContain("不继续生成月令、本气或本气十神解释");
    expect(theme.evidence.map(item => item.id)).toEqual([
      "dayMaster.stem",
      "dayMaster.element",
      "dayMaster.yinYang",
      "uncertainty.monthPillarCandidates"
    ]);
    expect(theme.professionalAnalysis.factIds).not.toContain("monthCommand.mainTenGod");
    expect(theme.plainReading.text).not.toContain(String(facts.monthCommand.mainTenGod.value));
  });

  it("excludes uncertain year and month pillars from element and ten-god themes", () => {
    const facts = fictionalFacts({
      gender: "other",
      birthDate: "2024-02-04",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const elements = themeById(facts, "five-elements");
    const tenGods = themeById(facts, "ten-gods-pillars");

    expect(elements.elementSummary?.coverageCount).toBe(2);
    expect(elements.limitation).toContain("年柱、月柱、时柱未参与本次统计");
    expect(tenGods.tenGodPositions?.map(item => item.position)).toEqual(["日柱"]);
    expect(tenGods.limitation).toContain("年柱、月柱、时柱尚未确认");
    expect(JSON.stringify([elements, tenGods])).not.toMatch(/pillars\.(0|1|3)\.(visibleTenGod|hiddenStems|stemElement|branchElement)/);
  });

  it("removes only themes whose necessary facts are unavailable", () => {
    const facts = structuredClone(confirmedFictionalFacts());
    facts.dayMaster.stem = {
      ...facts.dayMaster.stem,
      value: null as never,
      certainty: "unavailable"
    };
    const narrative = narrativeFor(facts);

    expect(narrative.themes.map(theme => theme.id)).toEqual(["five-elements"]);
    expect(narrative.themes[0].elementSummary?.coverageCount).toBe(8);
    expect(buildBaziMainlineNarrative(null)).toBeNull();
  });

  it("makes every declared evidence id resolve to the exact fact object", () => {
    const facts = confirmedFictionalFacts();
    const narrative = narrativeFor(facts);

    narrative.themes.forEach(theme => {
      const evidenceIds = new Set(theme.evidence.map(item => item.id));
      [
        ...theme.professionalAnalysis.factIds,
        ...theme.imagery.factIds,
        ...theme.plainReading.factIds
      ].forEach(id => expect(evidenceIds.has(id)).toBe(true));
      theme.evidence.forEach(item => {
        expect(resolveFactPath(facts, item.id)).toBe(item.fact);
      });
    });
  });

  it("keeps traditional catalog and project implementation sources distinct", () => {
    const narrative = narrativeFor(confirmedFictionalFacts());
    const evidence = narrative.themes.flatMap(theme => theme.evidence);

    expect(new Set(evidence.map(item => item.sourceKind))).toEqual(
      new Set(["traditional-catalog", "project-code"])
    );
    evidence.forEach(item => {
      expect(item.sourceKind).toBe(
        item.fact.sourceRuleId.startsWith("catalog:")
          ? "traditional-catalog"
          : "project-code"
      );
    });
  });

  it("changes all three themes when the underlying fictional chart changes", () => {
    const first = narrativeFor(confirmedFictionalFacts());
    const second = narrativeFor(fictionalFacts({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      birthLocation: "另一虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    }));

    first.themes.forEach((theme, index) => {
      expect(theme.professionalAnalysis.text)
        .not.toBe(second.themes[index].professionalAnalysis.text);
    });
  });

  it("renders three vertical four-layer themes with collapsed accessible evidence", () => {
    const markup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, {
        narrative: narrativeFor(confirmedFictionalFacts())
      })
    );
    const dayMonth = markup.indexOf("日主与月令");
    const elements = markup.indexOf("五行构成");
    const tenGods = markup.indexOf("十神与四柱");

    expect(dayMonth).toBeGreaterThan(-1);
    expect(dayMonth).toBeLessThan(elements);
    expect(elements).toBeLessThan(tenGods);
    expect(markup.match(/专业分析/g)).toHaveLength(3);
    expect(markup.match(/形象解释/g)).toHaveLength(3);
    expect(markup.match(/白话解读/g)).toHaveLength(3);
    expect(markup.match(/为什么这样说/g)).toHaveLength(3);
    expect(markup.match(/<details/g)?.length).toBeGreaterThanOrEqual(6);
    expect(markup).not.toMatch(/<details[^>]* open/);
    expect(markup).toContain("<summary>");
    expect(markup).toContain("传统规则目录");
    expect(markup).toContain("项目计算实现");
    expect(markup).toContain("覆盖 8 个已确认位置");
  });
});
