import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi } from "@/lib/domain/bazi";
import {
  MOON_PHASE_NAMES,
  buildBaziBirthMoonPhaseFacts,
  type BaziBirthMoonPhaseFactsV1,
  type MoonPhaseName
} from "@/lib/domain/baziBirthMoonPhaseFacts";
import { buildBaziBirthSolarTermFacts } from "@/lib/domain/baziBirthSolarTermFacts";
import { buildBaziMainlineNarrative } from "@/lib/domain/baziMainlineNarrative";
import {
  BAZI_MOON_PHASE_NARRATIVE_CATALOG,
  hasCompleteBaziMoonPhaseNarrativeCatalog,
  selectBaziMoonPhaseNarrative
} from "@/lib/domain/baziMoonPhaseNarratives";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
const chart = computeBazi({
  gender: "other",
  birthDate: "2024-03-17",
  birthTime: "12:11",
  birthLocation: "虚构月相正文测试城市",
  timezone: "Asia/Shanghai",
  unknownTime: false
});
const professionalFacts = buildProfessionalBaziFactsOnServer(
  chart,
  new Date("2026-08-03T04:00:00.000Z")
).professionalFacts;
const basis = buildBaziBirthMoonPhaseFacts(chart);

const expectedNarratives: Record<MoonPhaseName, { label: string; narrative: string }> = {
  new_moon: {
    label: "朔",
    narrative: "你出生时，月亮与太阳运行到相近的方向，月亮被照亮的一面大多背向大地，夜空中几乎看不见它的轮廓。\n\n此刻的月光收拢在黑暗之中，一轮旧的盈亏已经结束，新的月相循环正从寂静里重新开始。\n\n这片几乎不见月光的夜空，也成为你生命开始时最初的月亮印记。"
  },
  waxing_crescent: {
    label: "盈眉月",
    narrative: "你出生时，月亮刚刚离开朔的位置，一弯纤细月光出现在天空。明亮部分仍然不多，却在接下来的夜晚持续增长。\n\n它像黑暗中轻轻展开的一道银色弧线，月亮正在一点点显露自己的形状，夜空也由此重新拥有光亮。\n\n这弯刚刚显露的银光，正是你来到世界时，天空留下的出生剪影。"
  },
  first_quarter: {
    label: "上弦月",
    narrative: "你出生时，月亮已经走过约四分之一轮盈亏循环，面向大地的明亮部分接近一半，光与暗在月面上清楚相接。\n\n半轮月亮悬在夜空，一侧明亮，一侧隐入阴影。它停留在圆缺之间，让增长中的月光拥有清晰轮廓。\n\n这道明暗各半的月面，成为天空为你生命开端保存的一枚清晰刻度。"
  },
  waxing_gibbous: {
    label: "盈凸月",
    narrative: "你出生时，月亮的明亮部分已经超过一半，并继续朝着望月靠近。夜晚的月光逐渐充盈，月面只剩下一小部分藏在阴影里。\n\n此刻的月亮已经显出接近圆满的形态，光芒一夜比一夜完整，安静照亮越来越广阔的天空。\n\n这轮趋近圆满的月光，就此定格为你出生之夜的天幕印记。"
  },
  full_moon: {
    label: "望",
    narrative: "你出生时，月亮运行到与太阳相对的方向，被照亮的一面朝向大地，月面呈现接近完整的圆形。\n\n圆月高悬，明亮光线铺向屋顶、树梢与水面。月亮在这一刻抵达本轮盈亏中最充盈的位置，随后开始走向另一半旅程。\n\n这片铺满天地的圆月清辉，成为你抵达世界时最明亮的天空背景。"
  },
  waning_gibbous: {
    label: "亏凸月",
    narrative: "你出生时，月亮已经越过望的位置，明亮部分依旧宽广，却开始逐夜减少。圆满的轮廓从一侧慢慢收起，月光进入回落阶段。\n\n它仍然能够照亮深夜，只是不再继续扩张。月亮带着曾经完整的光芒，平静走向下一次半明半暗。\n\n这轮由盛转静的月光，为你出生的那一夜留下宽广而安定的轮廓。"
  },
  last_quarter: {
    label: "下弦月",
    narrative: "你出生时，月亮已经走过约四分之三轮盈亏循环，面向大地的明亮部分再次接近一半。\n\n半轮月亮多在后半夜与清晨出现，光与暗重新形成清晰边界。夜色尚未完全退去，它已经陪伴天空走向黎明。\n\n这轮陪伴黎明的半月，成为你来到世界时夜与晨交接的天空记号。"
  },
  waning_crescent: {
    label: "残月",
    narrative: "你出生时，本轮月相循环已经接近尾声。月亮只留下逐渐变细的一弯微光，多在天亮前短暂出现在东方天空。\n\n这道光安静收回夜色之中，轮廓一天比一天纤细。等最后一线月光隐去，月亮便会回到朔的位置，开始下一轮圆缺流转。\n\n这弯黎明前的微光，正是月亮为你出生时刻留下的最后一笔银色轮廓。"
  }
};

function confirmedFacts(phase: MoonPhaseName): BaziBirthMoonPhaseFactsV1 {
  return {
    ...basis,
    certainty: "confirmed",
    phase,
    moonAgeDays: 6.799,
    elongationDegrees: 90.002,
    candidates: [],
    unavailableReason: null
  };
}

function renderOrdinary(facts: BaziBirthMoonPhaseFactsV1) {
  const narrative = buildBaziMainlineNarrative(
    professionalFacts,
    buildBaziBirthSolarTermFacts(chart),
    facts
  );
  expect(narrative).not.toBeNull();
  return renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative: narrative! }));
}

describe("Bazi reviewed moon-phase narratives", () => {
  it("covers exactly all eight canonical phases with the approved labels and text", () => {
    expect(hasCompleteBaziMoonPhaseNarrativeCatalog()).toBe(true);
    expect(Object.keys(BAZI_MOON_PHASE_NARRATIVE_CATALOG)).toEqual([...MOON_PHASE_NAMES]);
    expect(Object.keys(BAZI_MOON_PHASE_NARRATIVE_CATALOG)).toHaveLength(8);

    MOON_PHASE_NAMES.forEach(phase => {
      expect(BAZI_MOON_PHASE_NARRATIVE_CATALOG[phase]).toEqual({
        phase,
        label: expectedNarratives[phase].label,
        reviewStatus: "human_reviewed_approved",
        narrative: expectedNarratives[phase].narrative
      });
    });
    expect(new Set(Object.values(BAZI_MOON_PHASE_NARRATIVE_CATALOG).map(item => item.narrative)).size).toBe(8);
  });

  it.each(MOON_PHASE_NAMES)("selects and renders confirmed %s without fallback", phase => {
    const selection = selectBaziMoonPhaseNarrative(confirmedFacts(phase));
    expect(selection).toMatchObject({
      status: "available",
      entry: BAZI_MOON_PHASE_NARRATIVE_CATALOG[phase],
      moonAgeDays: 6.799,
      elongationDegrees: 90.002
    });

    const markup = renderOrdinary(confirmedFacts(phase));
    expect(markup).toContain('id="bazi-direct-moon-phase-title">月相</h3>');
    expect(markup).toContain(`data-phase="${phase}"`);
    expect(markup).toContain(`aria-label="${expectedNarratives[phase].label}月相图：`);
    expect(markup).toContain(expectedNarratives[phase].label);
    expectedNarratives[phase].narrative.split("\n\n").forEach(paragraph => {
      expect(markup).toContain(paragraph);
    });
    expect(markup).toContain("6.7990 日");
    expect(markup).toContain("90.002°");
  });

  it("keeps waxing light on the right and waning light on the left", () => {
    expect(renderOrdinary(confirmedFacts("waxing_crescent")))
      .toContain('<circle class="is-light" cx="80"');
    expect(renderOrdinary(confirmedFacts("first_quarter")))
      .toContain('<rect class="is-light" x="50"');
    expect(renderOrdinary(confirmedFacts("waxing_gibbous")))
      .toContain('<circle class="is-shadow" cx="20"');
    expect(renderOrdinary(confirmedFacts("waning_gibbous")))
      .toContain('<circle class="is-shadow" cx="80"');
    expect(renderOrdinary(confirmedFacts("last_quarter")))
      .toContain('<rect class="is-light" x="10"');
    expect(renderOrdinary(confirmedFacts("waning_crescent")))
      .toContain('<circle class="is-light" cx="20"');
  });

  it("hides uncertain, unavailable and incomplete facts without leaving technical copy", () => {
    const uncertain = { ...basis, certainty: "uncertain" as const };
    const unavailable = {
      ...basis,
      certainty: "unavailable" as const,
      phase: null,
      moonAgeDays: null,
      elongationDegrees: null,
      candidates: [],
      unavailableReason: "calculation_failed" as const
    };
    const incomplete = { ...confirmedFacts("full_moon"), moonAgeDays: null };

    expect(selectBaziMoonPhaseNarrative(uncertain)).toEqual({ status: "not_available", reason: "facts_uncertain" });
    expect(selectBaziMoonPhaseNarrative(unavailable)).toEqual({ status: "not_available", reason: "facts_unavailable" });
    expect(selectBaziMoonPhaseNarrative(incomplete)).toEqual({ status: "not_available", reason: "facts_incomplete" });
    [uncertain, unavailable, incomplete].forEach(facts => {
      const markup = renderOrdinary(facts);
      expect(markup).not.toMatch(/bazi-direct-moon-phase|出生月相正文|候选月相|无法计算|计算失败|资料不足|暂不展示/);
    });
  });

  it("places moon phase after yin-yang and before five elements", () => {
    const markup = renderOrdinary(confirmedFacts("first_quarter"));
    const imagery = markup.indexOf(">物象<");
    const solarTerm = markup.indexOf(">节气<");
    const yinYang = markup.indexOf(">阴阳<");
    const moonPhase = markup.indexOf(">月相<");
    const elements = markup.indexOf(">五行<");

    expect(imagery).toBeGreaterThan(-1);
    expect(imagery).toBeLessThan(solarTerm);
    expect(solarTerm).toBeLessThan(yinYang);
    expect(yinYang).toBeLessThan(moonPhase);
    expect(moonPhase).toBeLessThan(elements);
  });

  it("has no default narrative, runtime AI or technical metadata in the ordinary component", () => {
    const catalogSource = readFileSync("src/lib/domain/baziMoonPhaseNarratives.ts", "utf8");
    const componentSource = readFileSync("src/components/BaziMainlinePanel.tsx", "utf8");
    const workspaceSource = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");

    expect(catalogSource).not.toMatch(/@\/lib\/ai|openai|anthropic|generateText|chatCompletion|fallback|defaultNarrative/);
    expect(componentSource).not.toMatch(/previousNewMoonAtUtc|nextNewMoonAtUtc|algorithmVersion|SourceRuleId|技术追溯|候选月相/);
    expect(workspaceSource).toContain("birthMoonPhaseFacts");
    expect(workspaceSource).toContain("buildBaziMainlineNarrative(");
  });
});
