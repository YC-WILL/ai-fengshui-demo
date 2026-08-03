import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi, type BaziChart } from "@/lib/domain/bazi";
import {
  BAZI_BIRTH_SOLAR_TERM_ALGORITHM_VERSION,
  BAZI_BIRTH_SOLAR_TERM_FACTS_VERSION,
  BAZI_BIRTH_SOLAR_TERM_SOURCE_RULE_ID,
  SOLAR_TERM_NAMES,
  buildBaziBirthSolarTermFacts
} from "@/lib/domain/baziBirthSolarTermFacts";
import { buildBaziMainlineNarrative } from "@/lib/domain/baziMainlineNarrative";
import {
  BAZI_SOLAR_TERM_BIRTH_FLOW_ENDING,
  BAZI_SOLAR_TERM_EXPRESSION_RULES,
  BAZI_SOLAR_TERM_NARRATIVE_CATALOG,
  JING_ZHE_BIRTH_NARRATIVE,
  selectBaziSolarTermNarrative
} from "@/lib/domain/baziSolarTermNarratives";
import type { BaziInput } from "@/lib/types";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
const calculatedAt = new Date("2026-08-02T02:00:00.000Z");
const baseInput: BaziInput = {
  gender: "other",
  birthDate: "2024-03-05",
  birthTime: "10:23",
  birthLocation: "虚构测试城市",
  timezone: "Asia/Shanghai",
  unknownTime: false
};

function chart(overrides: Partial<BaziInput> = {}) {
  return computeBazi({ ...baseInput, ...overrides });
}

function professionalFacts(value: BaziChart) {
  return buildProfessionalBaziFactsOnServer(value, calculatedAt).professionalFacts;
}

function mainline(value: BaziChart) {
  const narrative = buildBaziMainlineNarrative(
    professionalFacts(value),
    buildBaziBirthSolarTermFacts(value)
  );
  expect(narrative).not.toBeNull();
  return narrative!;
}

describe("Bazi birth solar-term facts", () => {
  it("switches from Yu Shui to Jing Zhe at the precise boundary moment", () => {
    const before = buildBaziBirthSolarTermFacts(chart({ birthTime: "10:21" }));
    const after = buildBaziBirthSolarTermFacts(chart({ birthTime: "10:23" }));

    expect(before).toMatchObject({
      certainty: "confirmed",
      currentTerm: "雨水",
      nextTerm: "惊蛰",
      nextTermStartsAt: "2024-03-05T02:22:45.000Z"
    });
    expect(after).toMatchObject({
      certainty: "confirmed",
      currentTerm: "惊蛰",
      currentTermStartedAt: "2024-03-05T02:22:45.000Z",
      nextTerm: "春分",
      nextTermStartsAt: "2024-03-20T03:06:25.000Z"
    });
  });

  it("resolves the same real instant to the same term across timezones", () => {
    const shanghai = buildBaziBirthSolarTermFacts(chart({
      birthDate: "2024-03-05",
      birthTime: "10:23",
      timezone: "Asia/Shanghai"
    }));
    const newYork = buildBaziBirthSolarTermFacts(chart({
      birthDate: "2024-03-04",
      birthTime: "21:23",
      timezone: "America/New_York"
    }));

    expect([
      newYork.currentTerm,
      newYork.currentTermStartedAt,
      newYork.nextTerm,
      newYork.nextTermStartsAt
    ]).toEqual([
      shanghai.currentTerm,
      shanghai.currentTermStartedAt,
      shanghai.nextTerm,
      shanghai.nextTermStartsAt
    ]);
    expect(newYork.timezone).toBe("America/New_York");
  });

  it("confirms an unknown-time date that remains in one solar term all day", () => {
    const facts = buildBaziBirthSolarTermFacts(chart({
      birthDate: "2024-03-06",
      birthTime: "",
      unknownTime: true
    }));

    expect(facts).toMatchObject({
      certainty: "confirmed",
      currentTerm: "惊蛰",
      nextTerm: "春分",
      candidates: []
    });
  });

  it("keeps both candidates when an unknown-time date contains a boundary", () => {
    const facts = buildBaziBirthSolarTermFacts(chart({
      birthDate: "2024-03-05",
      birthTime: "",
      unknownTime: true
    }));

    expect(facts.certainty).toBe("uncertain");
    expect(facts.currentTerm).toBeNull();
    expect(facts.nextTerm).toBeNull();
    expect(facts.candidates).toEqual([
      { name: "雨水", startedAt: "2024-02-19T04:13:12.000Z" },
      { name: "惊蛰", startedAt: "2024-03-05T02:22:45.000Z" }
    ]);
  });

  it("returns unavailable rather than guessing when calculation cannot complete", () => {
    const invalid = structuredClone(chart());
    invalid.inputSnapshot.birthDate = "invalid";
    const facts = buildBaziBirthSolarTermFacts(invalid);

    expect(facts).toMatchObject({
      certainty: "unavailable",
      currentTerm: null,
      nextTerm: null,
      candidates: [],
      unavailableReason: "calculation_failed"
    });
  });

  it("records the independent traceable contract and exact calculation source", () => {
    const facts = buildBaziBirthSolarTermFacts(chart());

    expect(facts).toMatchObject({
      schemaVersion: BAZI_BIRTH_SOLAR_TERM_FACTS_VERSION,
      algorithmVersion: BAZI_BIRTH_SOLAR_TERM_ALGORITHM_VERSION,
      sourceRuleId: BAZI_BIRTH_SOLAR_TERM_SOURCE_RULE_ID,
      timezone: "Asia/Shanghai"
    });
    expect(facts.calculationConvention).toMatch(/IANA.*真实时刻.*精确交节时刻/);
  });
});

describe("Bazi birth solar-term reviewed narrative", () => {
  it("covers exactly the 24 canonical terms with reviewed current-to-next bindings", () => {
    const catalogKeys = Object.keys(BAZI_SOLAR_TERM_NARRATIVE_CATALOG);

    expect(catalogKeys).toHaveLength(24);
    expect(catalogKeys).toEqual([...SOLAR_TERM_NAMES]);
    SOLAR_TERM_NAMES.forEach((solarTerm, index) => {
      const nextSolarTerm = SOLAR_TERM_NAMES[(index + 1) % SOLAR_TERM_NAMES.length];
      expect(BAZI_SOLAR_TERM_NARRATIVE_CATALOG[solarTerm]).toMatchObject({
        solarTerm,
        nextSolarTerm,
        reviewStatus: "human_reviewed_approved"
      });
    });
    expect(BAZI_SOLAR_TERM_NARRATIVE_CATALOG["冬至"].nextSolarTerm).toBe("小寒");
    expect(new Set(Object.values(BAZI_SOLAR_TERM_NARRATIVE_CATALOG).map(entry => entry.narrative)).size).toBe(24);
    Object.values(BAZI_SOLAR_TERM_NARRATIVE_CATALOG).forEach(entry => {
      expect(entry.narrative.endsWith(BAZI_SOLAR_TERM_BIRTH_FLOW_ENDING)).toBe(true);
      expect(entry.narrative.split(BAZI_SOLAR_TERM_BIRTH_FLOW_ENDING)).toHaveLength(2);
    });
  });

  it("selects and renders every confirmed term with its own reviewed narrative", () => {
    const basis = buildBaziBirthSolarTermFacts(chart());
    const facts = professionalFacts(chart());

    SOLAR_TERM_NAMES.forEach((currentTerm, index) => {
      const nextTerm = SOLAR_TERM_NAMES[(index + 1) % SOLAR_TERM_NAMES.length];
      const birthSolarTermFacts = { ...basis, certainty: "confirmed" as const, currentTerm, nextTerm };
      const selection = selectBaziSolarTermNarrative(birthSolarTermFacts);

      expect(selection.status).toBe("available");
      expect(selection.status === "available" && selection.entry).toEqual(
        BAZI_SOLAR_TERM_NARRATIVE_CATALOG[currentTerm]
      );
      const narrative = buildBaziMainlineNarrative(facts, birthSolarTermFacts);
      expect(narrative).not.toBeNull();
      const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative: narrative! }));
      expect(markup).toContain('id="bazi-direct-solar-term-title">节气</h3>');
      expect(markup).toContain(BAZI_SOLAR_TERM_NARRATIVE_CATALOG[currentTerm].narrative);
    });
  });

  it("uses the newly approved Jing Zhe text verbatim", () => {
    const selection = selectBaziSolarTermNarrative(buildBaziBirthSolarTermFacts(chart()));

    expect(selection.status).toBe("available");
    expect(selection.status === "available" && selection.entry).toMatchObject({
      solarTerm: "惊蛰",
      nextSolarTerm: "春分",
      reviewStatus: "human_reviewed_approved",
      narrative: JING_ZHE_BIRTH_NARRATIVE
    });
    expect(JING_ZHE_BIRTH_NARRATIVE).toBe("你降生之时恰逢惊蛰，大地刚刚惊醒蛰伏万物，寒气尚未完全褪去，生机却已经破土萌发。这是大自然给予你的专属意象，同时也伴随你来到这个世界，你的生命由此开始流动。");
  });

  it("does not render uncertain or unavailable facts", () => {
    const uncertainChart = chart({ birthTime: "", unknownTime: true });
    const uncertainFacts = buildBaziBirthSolarTermFacts(uncertainChart);
    const unavailableFacts = { ...uncertainFacts, certainty: "unavailable" as const, candidates: [] };

    expect(selectBaziSolarTermNarrative(uncertainFacts)).toEqual({
      status: "not_available",
      reason: "facts_uncertain"
    });
    expect(selectBaziSolarTermNarrative(unavailableFacts)).toEqual({
      status: "not_available",
      reason: "facts_unavailable"
    });

    [uncertainFacts, unavailableFacts].forEach(facts => {
      const narrative = buildBaziMainlineNarrative(professionalFacts(uncertainChart), facts);
      expect(narrative).not.toBeNull();
      const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative: narrative! }));
      expect(markup).not.toContain('id="bazi-direct-solar-term-title"');
      expect(markup).not.toContain(JING_ZHE_BIRTH_NARRATIVE);
      expect(markup).not.toMatch(/资料不足|暂不展示|存在不确定性|候选节气/);
    });
  });

  it("contains no fallback, default narrative or runtime AI path", () => {
    const source = readFileSync("src/lib/domain/baziSolarTermNarratives.ts", "utf8");
    expect(source).not.toMatch(/@\/lib\/ai|openai|anthropic|generateText|chatCompletion|fallback|defaultNarrative/);
  });

  it("renders confirmed Jing Zhe verbatim and renders another reviewed term independently", () => {
    const jingZheMarkup = renderToStaticMarkup(createElement(BaziMainlinePanel, {
      narrative: mainline(chart())
    }));
    const springEquinoxMarkup = renderToStaticMarkup(createElement(BaziMainlinePanel, {
      narrative: mainline(chart({ birthDate: "2024-03-21", birthTime: "12:00" }))
    }));

    expect(jingZheMarkup).toContain('id="bazi-direct-solar-term-title">节气</h3>');
    expect(jingZheMarkup).toContain(JING_ZHE_BIRTH_NARRATIVE);
    expect(springEquinoxMarkup).toContain('class="bazi-direct-section bazi-direct-solar-term"');
    expect(springEquinoxMarkup).toContain(BAZI_SOLAR_TERM_NARRATIVE_CATALOG["春分"].narrative);
    expect(springEquinoxMarkup).not.toContain(JING_ZHE_BIRTH_NARRATIVE);
  });

  it("places the optional solar-term section after imagery and before yin-yang", () => {
    const jingZheNarrative = mainline(chart());
    const imageryNarrative = mainline(chart({
      birthDate: "1980-09-09",
      birthTime: "10:00"
    }));
    const layoutFixture = {
      ...jingZheNarrative,
      directNarrative: imageryNarrative.directNarrative
    };
    const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, {
      narrative: layoutFixture
    }));
    const imagery = markup.indexOf(">物象<");
    const solarTerm = markup.indexOf(">节气<");
    const yinYang = markup.indexOf(">阴阳<");

    expect(imagery).toBeGreaterThan(-1);
    expect(imagery).toBeLessThan(solarTerm);
    expect(solarTerm).toBeLessThan(yinYang);
    expect(markup).not.toMatch(/<details|<summary/);
  });

  it("keeps the expression contract direct, reviewed and technically silent", () => {
    expect(BAZI_SOLAR_TERM_EXPRESSION_RULES).toEqual({
      voice: "second_person",
      sequence: ["confirmed_birth_term", "current_term_natural_scene"],
      requireConfirmedFacts: true,
      requireHumanReview: true,
      forbidUncertainFallback: true,
      keepTechnicalMetadataInternal: true
    });
    const workspaceSource = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
    expect(workspaceSource).toContain("buildBaziBirthSolarTermFacts(chart)");
    expect(workspaceSource).toContain("birthMoonPhaseFacts");
  });
});
