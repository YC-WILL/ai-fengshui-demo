import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { computeBazi, type BaziChart } from "@/lib/domain/bazi";
import { buildBaziObservationCards, buildBaziWeeklyAction } from "@/lib/domain/baziObservations";
import { buildBaziStructure } from "@/lib/domain/baziStructure";

const matrixDates = [
  "1992-01-03", "1992-01-11", "1992-02-11", "1992-03-19", "1992-04-19", "1992-05-27",
  "1992-07-03", "1992-08-03", "1992-08-11", "1992-10-03", "1992-10-11", "1992-11-11",
  "1992-11-19", "1992-11-27", "1992-12-03", "1993-11-11", "1993-11-19", "1993-11-27",
  "1993-12-03", "1994-11-11", "1994-11-19", "1994-11-27", "1994-12-03", "1995-11-11"
] as const;

const buildChart = (birthDate: string, birthTime = "10:30", timezone = "Asia/Shanghai", unknownTime = false) => computeBazi({
  gender: "other",
  birthDate,
  birthTime: unknownTime ? "" : birthTime,
  timezone,
  unknownTime
});

function chartEvidence(chart: BaziChart) {
  const structure = buildBaziStructure(chart);
  return new Set(structure.pillars.flatMap(pillar => [
    ...(pillar.visibleStem && pillar.visibleStem.role !== "日主"
      ? [`${pillar.visibleStem.source}|${pillar.visibleStem.stem}相对${chart.dayMaster}日主为${pillar.visibleStem.role}`]
      : []),
    ...pillar.hiddenStems.map(hidden => `${hidden.source}|${hidden.stem}相对${chart.dayMaster}日主为${hidden.name}`)
  ]));
}

const forbiddenClaims = /天生|注定|必然|一定会|命好|命差|旺夫|克夫|克妻|发财|破财|疾病|灾祸|离婚|改命|补五行|幸运颜色|适合.{0,5}职业|不适合.{0,5}职业/;

describe("bazi observation acceptance matrix", () => {
  it("covers 24 deterministic charts across all day masters and month branches", () => {
    const charts = matrixDates.map(date => buildChart(date));

    expect(new Set(charts.map(chart => chart.dayMaster))).toEqual(new Set("甲乙丙丁戊己庚辛壬癸"));
    expect(new Set(charts.map(chart => chart.month.branch))).toEqual(new Set("子丑寅卯辰巳午未申酉戌亥"));
  });

  it("keeps every matrix conclusion traceable to two real, independent chart facts", () => {
    for (const date of matrixDates) {
      const chart = buildChart(date);
      const knownEvidence = chartEvidence(chart);
      const cards = buildBaziObservationCards(chart);
      const weekly = buildBaziWeeklyAction(cards);

      expect(cards).toHaveLength(3);
      for (const card of cards) {
        expect(card.evidence.length).toBeGreaterThanOrEqual(2);
        expect(new Set(card.evidence.map(item => item.source)).size).toBeGreaterThanOrEqual(2);
        expect(card.evidence.every(item => knownEvidence.has(`${item.source}|${item.fact}`))).toBe(true);
        expect(JSON.stringify(card)).not.toMatch(forbiddenClaims);
        expect(card.action).toMatch(/分钟/);
        expect(card.evidence.filter(item => item.role === "primary")).toHaveLength(1);
        expect(card.evidence.filter(item => item.role === "supporting").length).toBeGreaterThanOrEqual(1);
      }
      expect(weekly).not.toBeNull();
      expect(cards.some(card => card.id === weekly?.sourceCardId && card.action === weekly.action)).toBe(true);
    }
  });

  it("removes hour evidence when the same birth data changes to unknown time", () => {
    const knownCards = buildBaziObservationCards(buildChart("2006-10-03", "01:00"));
    const unknownCards = buildBaziObservationCards(buildChart("2006-10-03", "", "Asia/Shanghai", true));

    expect(unknownCards.every(card => card.confidence === "部分资料")).toBe(true);
    expect(unknownCards.flatMap(card => card.evidence).every(item => !item.source.startsWith("时柱"))).toBe(true);
    expect(unknownCards.map(card => card.conclusion)).toEqual(knownCards.map(card => card.conclusion));
    expect(unknownCards.map(card => card.action)).toEqual(knownCards.map(card => card.action));
  });

  it("stops boundary-dependent observations for unknown time at Li Chun and a monthly term", () => {
    for (const date of ["2024-02-04", "2024-03-05"]) {
      const chart = buildChart(date, "", "Asia/Shanghai", true);
      const cards = buildBaziObservationCards(chart);

      expect(chart.calculation.uncertainty).toBeTruthy();
      expect(cards.every(card => card.confidence === "暂不判断")).toBe(true);
      expect(cards.every(card => card.evidence.length === 0)).toBe(true);
      expect(cards.every(card => /不输出|暂不判断/.test([card.conclusion, card.strength, card.watchout].join("|")))).toBe(true);
      expect(buildBaziWeeklyAction(cards)).toBeNull();
    }
  });

  it("changes only hour evidence when only the known birth hour changes", () => {
    const early = buildBaziObservationCards(buildChart("2006-10-03", "01:00"));
    const late = buildBaziObservationCards(buildChart("2006-10-03", "21:00"));

    expect(early.map(card => [card.conclusion, card.trigger, card.strength, card.watchout, card.action]))
      .toEqual(late.map(card => [card.conclusion, card.trigger, card.strength, card.watchout, card.action]));
    expect(early.slice(0, 2).map(card => card.evidence)).toEqual(late.slice(0, 2).map(card => card.evidence));
    expect(early[2].evidence.at(-1)?.source).toBe("时柱天干");
    expect(late[2].evidence.at(-1)?.source).toBe("时柱天干");
  });

  it("does not depend on hidden zodiac models or custom scoring", () => {
    const observationSource = readFileSync(resolve(process.cwd(), "src/lib/domain/baziObservations.ts"), "utf8");
    const workspaceSource = readFileSync(resolve(process.cwd(), "src/components/MethodWorkspaces.tsx"), "utf8");

    expect(observationSource).not.toMatch(/behavioralAccent|relationshipAccent/);
    expect(observationSource).not.toMatch(/白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼/);
    expect(observationSource).not.toMatch(/channelScore|明干.{0,20}[+*]|本气.{0,20}[+*]|中气.{0,20}[+*]|余气.{0,20}[+*]/);
    expect(workspaceSource).not.toMatch(/我的命局主线|这张盘的力量怎样流动|本命盘独有的力量流动[^<]*$/m);
    expect(workspaceSource).toContain("这是通用的十神关系说明，不是本命盘独有的力量流动");
  });

  it("produces materially varied three-card readings across the fixed matrix", () => {
    const readings = matrixDates.map(date => buildBaziObservationCards(buildChart(date)));
    const fullSignatures = readings.map(cards => cards.map(card => [
      card.conclusion, card.trigger, card.strength, card.watchout, card.action
    ].join("|")).join("###"));
    const conclusionSignatures = readings.map(cards => cards.map(card => card.conclusion).join("###"));

    expect(new Set(fullSignatures).size).toBeGreaterThanOrEqual(20);
    expect(new Set(conclusionSignatures).size).toBeGreaterThanOrEqual(20);
  });
});
