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
  it("builds the four fact-driven themes in the required order", () => {
    const narrative = narrativeFor(confirmedFictionalFacts());

    expect(narrative.themes.map(theme => theme.id)).toEqual(BAZI_ANALYSIS_THEME_IDS);
    expect(narrative.title).toBe("命盘解读");
    expect(narrative.directNarrative).toEqual({
      status: "not_available",
      reason: "combination_not_reviewed"
    });
    narrative.themes.forEach(theme => {
      expect(theme.factIds.length).toBeGreaterThan(0);
      expect(theme.evidence.length).toBeGreaterThan(0);
    });
    expect(buildBaziMainlineNarrative).toHaveLength(1);
  });

  it("keeps the reviewed day-master and month-command semantics", () => {
    const facts = confirmedFictionalFacts();
    const theme = themeById(facts, "day-master-month-command");

    expect(narrativeFor(facts).foundation).toMatchObject({
      dayMaster: {
        stem: facts.dayMaster.stem.value,
        element: facts.dayMaster.element.value,
        yinYang: facts.dayMaster.yinYang.value
      },
      monthCommand: {
        branch: facts.monthCommand.branch.value,
        element: facts.monthCommand.element.value,
        mainStem: facts.monthCommand.mainStem.value,
        mainTenGod: facts.monthCommand.mainTenGod.value
      }
    });
    expect(theme.boundary).toBeNull();
    expect(narrativeFor(facts).introduction).toBe(
      "以下传统结构可以复算；物象和生活表达为蟾先森基于盘面的现代解读。"
    );
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
    expect(theme.factIds).toEqual(theme.evidence.map(item => item.id));
  });

  it("does not turn element counts into absence, energy, strength or remedies", () => {
    const theme = themeById(confirmedFictionalFacts(), "five-elements");
    const text = JSON.stringify(theme);

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
    expect(theme.factIds).toEqual(theme.evidence.map(item => item.id));
  });

  it("does not translate ten gods into fixed identity or life conclusions", () => {
    const theme = themeById(confirmedFictionalFacts(), "ten-gods-pillars");
    const text = JSON.stringify(theme);

    expect(text).toContain("不构成主导性、评分、格局、旺衰、喜用或吉凶判断");
    expect(text).not.toMatch(/你就是|天生适合|注定|必然|一定会|关系评分|十神评分/);
  });

  it("organizes only the registered natal branch relations by their exact pillar positions", () => {
    const facts = confirmedFictionalFacts();
    const theme = themeById(facts, "natal-branch-relations");

    expect(theme.branchRelationPositions).toEqual([
      {
        firstPillar: "年柱",
        firstBranch: "申",
        secondPillar: "时柱",
        secondBranch: "巳",
        relations: ["六合", "六破", "刑"]
      },
      {
        firstPillar: "月柱",
        firstBranch: "辰",
        secondPillar: "日柱",
        secondBranch: "酉",
        relations: ["六合"]
      }
    ]);
    expect(theme.evidence.map(item => item.id)).toEqual(
      facts.natalBranchRelations.map((_, index) => `natalBranchRelations.${index}`)
    );
    expect(theme.factIds).toEqual(theme.evidence.map(item => item.id));
  });

  it("keeps branch-relation names separate from real events, strength and good-or-bad claims", () => {
    const theme = themeById(confirmedFictionalFacts(), "natal-branch-relations");
    const text = JSON.stringify(theme);

    expect(text).toContain("合不等于一定顺利");
    expect(text).toContain("冲、害、破、刑也不等于一定不好");
    expect(text).not.toMatch(/注定|必然|一定会发生|婚姻好坏|家庭冲突|关系评分|吉凶分数/);
  });

  it("does not add an empty or uncertain branch-relation theme", () => {
    const withoutRelations = structuredClone(confirmedFictionalFacts());
    withoutRelations.natalBranchRelations = [];
    const withoutRelationNarrative = narrativeFor(withoutRelations);
    expect(withoutRelationNarrative.themes.map(theme => theme.id))
      .not.toContain("natal-branch-relations");
    expect(withoutRelationNarrative.title).toBe("命盘解读");
    expect(withoutRelationNarrative.themes.map(theme => theme.factIds)).toHaveLength(3);
    const withoutRelationMarkup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, { narrative: withoutRelationNarrative })
    );
    expect(withoutRelationMarkup).not.toContain("当前可读主题");
    expect(withoutRelationMarkup).not.toContain("地支关系");

    const uncertainRelations = structuredClone(confirmedFictionalFacts());
    uncertainRelations.natalBranchRelations = uncertainRelations.natalBranchRelations.map(
      relation => ({ ...relation, certainty: "uncertain" })
    );
    expect(narrativeFor(uncertainRelations).themes.map(theme => theme.id))
      .not.toContain("natal-branch-relations");
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
    expect(narrative.themes.every(theme => (
      theme.factIds.every(id => !id.startsWith("pillars.3."))
    ))).toBe(true);
  });

  it("excludes unknown-hour relations while retaining relations between confirmed pillars", () => {
    const facts = fictionalFacts({
      gender: "male",
      birthDate: "1992-04-15",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const theme = themeById(facts, "natal-branch-relations");
    const serialized = JSON.stringify(theme);

    expect(theme.branchRelationPositions).toEqual([
      {
        firstPillar: "月柱",
        firstBranch: "辰",
        secondPillar: "日柱",
        secondBranch: "酉",
        relations: ["六合"]
      }
    ]);
    expect(theme.limitation).toContain("时柱尚未确认");
    expect(serialized).not.toContain("时柱巳");
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
    expect(narrativeFor(facts).foundation.dayMaster?.stem).toBe(facts.dayMaster.stem.value);
    expect(narrativeFor(facts).foundation.monthCommand).toBeNull();
    expect(narrativeFor(facts).foundation.limitation).toContain("当前不选取月令");
    expect(theme.evidence.map(item => item.id)).toEqual([
      "dayMaster.stem",
      "dayMaster.element",
      "dayMaster.yinYang",
      "uncertainty.monthPillarCandidates"
    ]);
    expect(theme.factIds).not.toContain("monthCommand.mainTenGod");
    expect(narrativeFor(facts).directNarrative).toEqual({
      status: "not_available",
      reason: "month_pillar_uncertain"
    });
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
    expect(narrativeFor(facts).themes.map(theme => theme.id)).not.toContain("natal-branch-relations");
  });

  it("removes only themes whose necessary facts are unavailable", () => {
    const facts = structuredClone(confirmedFictionalFacts());
    facts.dayMaster.stem = {
      ...facts.dayMaster.stem,
      value: null as never,
      certainty: "unavailable"
    };
    const narrative = narrativeFor(facts);

    expect(narrative.themes.map(theme => theme.id)).toEqual([
      "five-elements",
      "natal-branch-relations"
    ]);
    expect(narrative.themes[0].elementSummary?.coverageCount).toBe(8);
    expect(buildBaziMainlineNarrative(null)).toBeNull();
  });

  it("makes every declared evidence id resolve to the exact fact object", () => {
    const facts = confirmedFictionalFacts();
    const narrative = narrativeFor(facts);

    narrative.themes.forEach(theme => {
      const evidenceIds = new Set(theme.evidence.map(item => item.id));
      theme.factIds.forEach(id => expect(evidenceIds.has(id)).toBe(true));
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

  it("changes the direct fact summaries when the underlying fictional chart changes", () => {
    const first = narrativeFor(confirmedFictionalFacts());
    const second = narrativeFor(fictionalFacts({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      birthLocation: "另一虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    }));

    expect(first.foundation).not.toEqual(second.foundation);
    expect(first.themes.find(theme => theme.id === "five-elements")?.elementSummary)
      .not.toEqual(second.themes.find(theme => theme.id === "five-elements")?.elementSummary);
    expect(first.themes.find(theme => theme.id === "ten-gods-pillars")?.tenGodPositions)
      .not.toEqual(second.themes.find(theme => theme.id === "ten-gods-pillars")?.tenGodPositions);
  });

  it("renders a continuous direct reading without analysis-process disclosures", () => {
    const markup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, {
        narrative: narrativeFor(confirmedFictionalFacts())
      })
    );
    const foundation = markup.indexOf("基础信息");
    const dayMaster = markup.indexOf(">日主<");
    const elements = markup.indexOf(">五行<");
    const tenGods = markup.indexOf(">十神<");
    const branchRelations = markup.indexOf(">地支关系<");

    expect(foundation).toBeGreaterThan(-1);
    expect(foundation).toBeLessThan(dayMaster);
    expect(dayMaster).toBeLessThan(elements);
    expect(elements).toBeLessThan(tenGods);
    expect(tenGods).toBeLessThan(branchRelations);
    expect(markup).not.toMatch(/<details|<summary/);
    expect(markup).not.toMatch(/先看这几条|当前可读主题|专业分析|现代意象|白话解读|看懂这条|为什么这样说|默认展开|按需展开|技术追溯/);
    expect(markup.match(/盘面依据/g)).toHaveLength(4);
    expect(markup).toContain("覆盖 8 个已确认位置");
    expect(markup).toContain('aria-label="按柱位整理的本命地支关系"');
    expect(markup.match(/蟾先森基于盘面的现代解读/g)).toHaveLength(1);
  });
});
