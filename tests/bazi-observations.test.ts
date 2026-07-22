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
      expect(card.watchout).toMatch(/可以观察自己是否/);
      expect(card.action).toMatch(/分钟/);
      expect(card.evidence.length).toBeGreaterThanOrEqual(2);
      expect(new Set(card.evidence.map(item => item.source)).size).toBeGreaterThanOrEqual(2);
      expect(card.evidence.every(item => /年柱|月柱|日柱|时柱/.test(item.source))).toBe(true);
    });

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

  it("puts life observations before professional facts and removes the personal flow presentation", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/MethodWorkspaces.tsx"), "utf8");
    const observations = source.indexOf("这张生辰盘，建议你先观察三件事");
    const professional = source.indexOf("查看我的专业命盘");
    const tabs = source.indexOf("八字盘内容层级");
    const timeComparison = source.indexOf("最后再看 · 时间对照");

    expect(observations).toBeGreaterThan(-1);
    expect(observations).toBeLessThan(professional);
    expect(professional).toBeLessThan(tabs);
    expect(tabs).toBeLessThan(timeComparison);
    expect(source).not.toMatch(/我的命局主线|这张盘的力量怎样流动|这张盘里的十神怎样接力/);
    expect(source).toContain("这是通用的十神关系说明，不是本命盘独有的力量流动");
  });
});
