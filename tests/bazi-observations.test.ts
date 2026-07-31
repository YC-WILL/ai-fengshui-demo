import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziObservationCards, buildBaziWeeklyAction } from "@/lib/domain/baziObservations";

const forbiddenClaims = /你就是|天生|注定|必然|一定|命好|命差|焦虑症|抑郁症|人格障碍/;
const zodiacModel = /星座|白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼|behavioralAccent|relationshipAccent/;

describe("bazi life observation cards", () => {
  it("builds three complete, actionable cards from a known birth time", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2006-10-03",
      birthTime: "09:00",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const cards = buildBaziObservationCards(chart);

    expect(cards.map(card => card.id)).toEqual(["starting", "pressure", "collaboration"]);
    expect(cards.every(card => card.confidence === "完整资料")).toBe(true);
    cards.forEach(card => {
      expect(card.conclusion).toMatch(/^当.+时，你可能/);
      expect(card.trigger).toBeTruthy();
      expect(card.strength).toMatch(/优势|适度使用|可能/);
      expect(card.watchout).toMatch(/可以观察.*是否出现/);
      expect(card.action).toMatch(/分钟/);
      expect(card.evidence.length).toBeGreaterThanOrEqual(2);
      expect(new Set(card.evidence.map(item => item.source)).size).toBeGreaterThanOrEqual(2);
      expect(card.evidence.every(item => /年柱|月柱|日柱|时柱/.test(item.source))).toBe(true);
      expect(card.evidence.filter(item => item.role === "primary")).toHaveLength(1);
      expect(card.evidence.filter(item => item.role === "supporting").length).toBeGreaterThanOrEqual(1);
      expect(card.evidence.find(item => item.role === "primary")?.affectsConclusion).toBe(true);
    });
    const hourEvidence = cards.flatMap(card => card.evidence).find(item => item.source === "时柱天干");
    expect(hourEvidence).toMatchObject({ role: "supporting", affectsConclusion: false });
    expect(hourEvidence?.explanation).toMatch(/没有改变本卡的结论、触发条件、优势、风险和行动/);

    const weekly = buildBaziWeeklyAction(cards);
    expect(weekly).toMatchObject({ sourceCardId: "starting", action: cards[0].action });
    expect(weekly?.action).toMatch(/分钟|完成条件|写完|立即/);
  });

  it("uses partial data without inventing any hour-pillar evidence", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1985-03-22",
      birthTime: "",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const cards = buildBaziObservationCards(chart);

    expect(cards).toHaveLength(3);
    expect(cards.every(card => card.confidence === "部分资料")).toBe(true);
    expect(cards.every(card => card.limitation?.match(/时柱及其藏干未参与/))).toBe(true);
    expect(cards.flatMap(card => card.evidence).every(item => !item.source.startsWith("时柱"))).toBe(true);
  });

  it("does not produce life conclusions on an unknown-time solar-term boundary", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-02-04",
      birthTime: "",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const cards = buildBaziObservationCards(chart);

    expect(chart.calculation.uncertainty).toBeTruthy();
    expect(cards.every(card => card.confidence === "暂不判断")).toBe(true);
    expect(cards.every(card => card.evidence.length === 0)).toBe(true);
    expect(cards.every(card => card.conclusion === "边界资料待确认，本项暂不判断。")).toBe(true);
    expect(cards.every(card => card.limitation?.match(/年柱和月柱尚不能唯一确定/))).toBe(true);
    expect(buildBaziWeeklyAction(cards)).toBeNull();
  });

  it("keeps copy conditional and independent from zodiac behavior templates", () => {
    const cards = buildBaziObservationCards(computeBazi({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    }));
    const text = JSON.stringify(cards);

    expect(text).not.toMatch(forbiddenClaims);
    expect(text).not.toMatch(zodiacModel);
    expect(text).not.toMatch(/职业|财富|婚姻|疾病|灾祸|改运|幸运颜色|补五行/);
  });

  it("changes the three-card reading when the chart structure changes", () => {
    const first = buildBaziObservationCards(computeBazi({
      gender: "other", birthDate: "2006-10-03", birthTime: "09:00", unknownTime: false
    }));
    const second = buildBaziObservationCards(computeBazi({
      gender: "other", birthDate: "1990-06-15", birthTime: "10:30", unknownTime: false
    }));

    expect(first.map(card => card.conclusion)).not.toEqual(second.map(card => card.conclusion));
    expect(first.map(card => card.action)).not.toEqual(second.map(card => card.action));
    expect(first.map(card => card.evidence.map(item => item.fact))).not.toEqual(second.map(card => card.evidence.map(item => item.fact)));
  });

  it("keeps legacy observation calculations compatible but removes them from the Bazi front end", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/MethodWorkspaces.tsx"), "utf8");
    const pageSource = readFileSync(resolve(process.cwd(), "src/app/bazi/page.tsx"), "utf8");
    const baziWorkspace = source.slice(
      source.indexOf("export function BaziWorkspace"),
      source.indexOf("export function RelationWorkspace")
    );
    const viewSwitch = source.indexOf("bazi-view-switch");
    const mainline = source.indexOf("<BaziMainlinePanel");
    const professional = source.indexOf("<ProfessionalBaziPanel");

    expect(viewSwitch).toBeGreaterThan(-1);
    expect(mainline).toBeGreaterThan(-1);
    expect(viewSwitch).toBeLessThan(mainline);
    expect(mainline).toBeLessThan(professional);
    expect(baziWorkspace).not.toMatch(/buildBaziObservationCards|buildBaziWeeklyAction/);
    expect(baziWorkspace).not.toMatch(/与我的生活经历对照|三项条件式生活观察|20 分钟内能开始|本周行动/);
    expect(pageSource).toContain("如有已确认的本命地支关系");
  });

  it("marks the real evidence roles without claiming full joint inference", () => {
    const cards = buildBaziObservationCards(computeBazi({
      gender: "other", birthDate: "2006-10-03", birthTime: "09:00", unknownTime: false
    }));

    cards.forEach(card => {
      const [primary, secondary, hour] = card.evidence;
      expect(primary).toMatchObject({ role: "primary", affectsConclusion: true });
      expect(secondary).toMatchObject({ role: "supporting", affectsConclusion: true });
      expect(primary.explanation).toMatch(/确定本卡的主要观察方向/);
      expect(secondary.explanation).toMatch(/补充结论中的另一条观察线索/);
      expect(secondary.explanation).toMatch(/没有单独改写本卡的触发条件、优势、风险和行动/);
      if (hour) expect(hour).toMatchObject({ role: "supporting", affectsConclusion: false });
    });
    expect(JSON.stringify(cards)).not.toMatch(/综合.*共同判断|共同得出完整结论/);
  });
});
