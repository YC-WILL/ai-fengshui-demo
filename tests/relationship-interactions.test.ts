import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import {
  buildPairInteractionFacts,
  buildRelationshipJointAction,
  buildRelationshipObservationCards,
  findDayBranchRelations,
  type RelationshipType
} from "@/lib/domain/relationshipInteractions";
import type { Branch } from "@/lib/domain/elements";

function chart(date: string, time = "12:00", timezone = "Asia/Shanghai") {
  return computeBazi({ gender: "other", birthDate: date, birthTime: time, timezone, unknownTime: false });
}

const PAIR_MATRIX: Array<{ first: string; second: string; type: RelationshipType; timezone?: string; time?: string }> = [
  { first: "1952-02-03", second: "1981-08-16", type: "family" },
  { first: "1958-06-21", second: "1987-06-08", type: "family" },
  { first: "1963-11-02", second: "1992-11-27", type: "family" },
  { first: "1968-03-19", second: "1998-03-03", type: "family" },
  { first: "1972-09-14", second: "2001-09-25", type: "family" },
  { first: "1976-01-31", second: "2005-02-01", type: "family" },
  { first: "1984-04-10", second: "1986-04-29", type: "family" },
  { first: "1990-07-06", second: "1993-07-18", type: "family" },
  { first: "1988-12-12", second: "1988-12-29", type: "family" },
  { first: "1995-05-07", second: "1995-06-02", type: "family" },
  { first: "1991-02-03", second: "1991-02-05", type: "friend", time: "23:30" },
  { first: "2000-03-04", second: "2000-03-06", type: "friend" },
  { first: "1992-04-10", second: "1994-09-22", type: "partner" },
  { first: "1985-10-01", second: "1989-01-17", type: "partner" },
  { first: "1997-08-30", second: "1999-12-11", type: "partner" },
  { first: "1979-03-23", second: "1982-06-15", type: "partner" },
  { first: "2002-11-09", second: "2003-01-28", type: "partner" },
  { first: "1980-07-20", second: "1980-07-20", type: "partner" },
  { first: "1993-01-04", second: "1996-05-19", type: "cooperation" },
  { first: "1986-02-14", second: "1990-10-31", type: "cooperation" },
  { first: "1975-12-07", second: "1983-04-05", type: "cooperation" },
  { first: "2001-06-12", second: "2004-08-26", type: "cooperation" },
  { first: "1998-02-04", second: "2002-02-03", type: "cooperation" },
  { first: "1989-03-05", second: "1993-03-06", type: "cooperation" },
  { first: "1971-01-19", second: "1999-10-08", type: "friend", timezone: "America/New_York" },
  { first: "1983-05-28", second: "2000-01-01", type: "friend", timezone: "Europe/London" },
  { first: "1996-09-09", second: "1996-09-09", type: "friend", timezone: "America/Los_Angeles" },
  { first: "2003-02-04", second: "2003-02-04", type: "family", timezone: "Asia/Tokyo" },
  { first: "1966-10-17", second: "1994-02-04", type: "family" },
  { first: "1977-08-07", second: "2006-08-08", type: "family" },
  { first: "1988-06-30", second: "1988-07-01", type: "cooperation" },
  { first: "1999-11-30", second: "1999-12-01", type: "partner" }
];

describe("relationship interaction facts", () => {
  it("keeps both day pillars and the two ten-god directions exact", () => {
    const first = chart("1992-04-10");
    const second = chart("1994-09-22");
    const facts = buildPairInteractionFacts(first, second);
    expect(facts.first.pillar).toBe(first.day.pillarLabel);
    expect(facts.second.pillar).toBe(second.day.pillarLabel);
    expect(facts.firstPerspective.fact).toContain(`对方日干${second.day.stem}相对你的日干${first.day.stem}`);
    expect(facts.secondPerspective.fact).toContain(`你的日干${first.day.stem}相对对方的日干${second.day.stem}`);
    expect(facts.samePolarity).toBe(facts.first.polarity === facts.second.polarity);
    expect(facts.polarityFact).toContain(facts.samePolarity ? "同阴阳" : "一阴一阳");
  });

  it("reverses directional roles when the two people are exchanged", () => {
    const first = chart("1985-10-01");
    const second = chart("1989-01-17");
    const normal = buildPairInteractionFacts(first, second);
    const swapped = buildPairInteractionFacts(second, first);
    expect(swapped.first.pillar).toBe(normal.second.pillar);
    expect(swapped.firstPerspective.tenGod).toBe(normal.secondPerspective.tenGod);
    expect(swapped.secondPerspective.tenGod).toBe(normal.firstPerspective.tenGod);
    expect(swapped.elementRelation.fact).toBe(normal.elementRelation.fact);
    expect(swapped.elementRelation.kind).not.toBe(normal.elementRelation.kind);
  });

  it.each([
    ["子", "子", ["同支"]],
    ["子", "丑", ["六合"]],
    ["子", "午", ["六冲"]],
    ["子", "未", ["六害"]],
    ["子", "酉", ["六破"]],
    ["子", "卯", ["相刑"]],
    ["巳", "申", ["六合", "六破", "刑的一部分"]],
    ["午", "午", ["同支", "自刑"]],
    ["子", "寅", ["无直接关系"]]
  ] as Array<[Branch, Branch, string[]]>)("finds all supported day-branch relations for %s/%s", (first, second, labels) => {
    expect(findDayBranchRelations(first, second).map(item => item.label)).toEqual(labels);
  });

  it("does not promote partial punishment into a complete three-branch structure", () => {
    const text = JSON.stringify(findDayBranchRelations("寅", "巳"));
    expect(text).toContain("三刑组合的一部分");
    expect(text).toContain("不能当作完整三刑");
  });
});

describe("relationship observation cards", () => {
  const facts = buildPairInteractionFacts(chart("1992-04-10"), chart("1994-09-22"));
  const cards = buildRelationshipObservationCards(facts, "partner");

  it("builds three cross-person cards with complete behavioral fields", () => {
    expect(cards.map(card => card.id)).toEqual(["connection", "friction", "collaboration"]);
    for (const card of cards) {
      expect(card.conclusion).toMatch(/你们|你这边|对方/);
      expect(card.trigger.length).toBeGreaterThan(10);
      expect(card.strength.length).toBeGreaterThan(10);
      expect(card.watchout.length).toBeGreaterThan(10);
      expect(card.action.length).toBeGreaterThan(10);
      expect(card.durationMinutes).toBeLessThanOrEqual(15);
      expect(card.limitation).toMatch(/双方日柱|出生时辰.*未参与/);
      expect(new Set(card.evidence.map(item => `${item.source}:${item.fact}`)).size).toBeGreaterThanOrEqual(2);
      expect(card.evidence.some(item => item.role === "primary")).toBe(true);
    }
  });

  it("derives the shared action from an existing card and gives a completion condition", () => {
    const action = buildRelationshipJointAction(cards);
    expect(action).not.toBeNull();
    expect(cards.find(card => card.id === action?.sourceCardId)?.action).toBe(action?.action);
    expect(action?.durationMinutes).toBeLessThanOrEqual(15);
    expect(action?.doneWhen).toMatch(/双方|共同/);
  });

  it("returns no cards or invented action when pair facts are absent", () => {
    const emptyCards = buildRelationshipObservationCards(null, "family");
    expect(emptyCards).toEqual([]);
    expect(buildRelationshipJointAction(emptyCards)).toBeNull();
  });

  it("uses relationship type only to translate the scene, not to change day-pillar facts", () => {
    const outputs = (["partner", "family", "friend", "cooperation"] as RelationshipType[]).map(type => buildRelationshipObservationCards(facts, type));
    expect(new Set(outputs.map(output => output[0].conclusion)).size).toBe(4);
    expect(outputs.every(output => output[0].evidence[0].fact === outputs[0][0].evidence[0].fact)).toBe(true);
  });

  it("does not turn same pillars, harmony or clash into a relationship verdict", () => {
    for (const pair of [["子", "子"], ["子", "丑"], ["子", "午"]] as Array<[Branch, Branch]>) {
      const text = JSON.stringify(findDayBranchRelations(...pair));
      expect(text).not.toMatch(/天生|注定|必然|命好|命差|正缘|孽缘|合适|不合适/);
    }
  });

  it("keeps all generated user-facing text within the safety boundary", () => {
    const generated = PAIR_MATRIX.flatMap(sample => {
      const timezone = sample.timezone ?? "Asia/Shanghai";
      const pairFacts = buildPairInteractionFacts(chart(sample.first, sample.time, timezone), chart(sample.second, sample.time, timezone));
      return buildRelationshipObservationCards(pairFacts, sample.type);
    });
    expect(JSON.stringify(generated)).not.toMatch(/天生|注定|必然|一定会|命好|命差|旺夫|克夫|克妻|发财|破财|疾病|灾祸|离婚|改命|补五行|幸运颜色|适合.{0,4}职业|不适合.{0,4}职业/);
  });

  it("produces materially varied structures across a 32-pair deterministic matrix", () => {
    expect(PAIR_MATRIX.length).toBeGreaterThanOrEqual(30);
    const signatures = PAIR_MATRIX.map(sample => {
      const timezone = sample.timezone ?? "Asia/Shanghai";
      const pairFacts = buildPairInteractionFacts(chart(sample.first, sample.time, timezone), chart(sample.second, sample.time, timezone));
      const pairCards = buildRelationshipObservationCards(pairFacts, sample.type);
      return [
        pairFacts.firstPerspective.tenGod,
        pairFacts.secondPerspective.tenGod,
        pairFacts.elementRelation.kind,
        pairFacts.branchRelations.map(item => item.id).join("+"),
        ...pairCards.map(card => `${card.conclusion}|${card.action}`)
      ].join("::");
    });
    expect(new Set(signatures).size).toBeGreaterThanOrEqual(20);
  });

  it("covers the required stem and branch relation categories in deterministic checks", () => {
    const matrixFacts = PAIR_MATRIX.map(sample => {
      const timezone = sample.timezone ?? "Asia/Shanghai";
      return buildPairInteractionFacts(chart(sample.first, sample.time, timezone), chart(sample.second, sample.time, timezone));
    });
    expect(matrixFacts.some(fact => fact.first.stem === fact.second.stem)).toBe(true);
    expect(matrixFacts.some(fact => fact.first.element === fact.second.element && fact.first.polarity !== fact.second.polarity)).toBe(true);
    expect(matrixFacts.some(fact => fact.elementRelation.kind.includes("generates"))).toBe(true);
    expect(matrixFacts.some(fact => fact.elementRelation.kind.includes("controls"))).toBe(true);
    expect(matrixFacts.some(fact => fact.firstPerspective.tenGod !== fact.secondPerspective.tenGod)).toBe(true);
    expect(matrixFacts.some(fact => fact.first.pillar === fact.second.pillar)).toBe(true);
    expect(new Set(PAIR_MATRIX.filter(sample => sample.timezone).map(sample => sample.timezone)).size).toBeGreaterThanOrEqual(2);
  });

  it("explains output changes when only one person's date changes", () => {
    const first = chart("1992-04-10");
    const before = buildPairInteractionFacts(first, chart("1994-09-22"));
    const after = buildPairInteractionFacts(first, chart("1994-09-23"));
    expect(after.first).toEqual(before.first);
    expect(after.second.pillar).not.toBe(before.second.pillar);
    expect(`${after.secondPerspective.tenGod}:${after.branchRelations.map(item => item.id)}`).not.toBe(`${before.secondPerspective.tenGod}:${before.branchRelations.map(item => item.id)}`);
  });

  it("changes only scene wording when the relationship type changes", () => {
    const partner = buildRelationshipObservationCards(facts, "partner");
    const cooperation = buildRelationshipObservationCards(facts, "cooperation");
    expect(partner[1]).toEqual(cooperation[1]);
    expect(partner[0].evidence).toEqual(cooperation[0].evidence);
    expect(partner[0].conclusion).not.toBe(cooperation[0].conclusion);
    expect(partner[2].conclusion).not.toBe(cooperation[2].conclusion);
  });

  it("does not depend on personal Bazi cards, zodiac accents, scores or three-harmony theory", () => {
    const source = readFileSync("src/lib/domain/relationshipInteractions.ts", "utf8");
    expect(source).not.toMatch(/buildBaziObservationCards|behavioralAccent|relationshipAccent|channelScore|personalNarrativeFacts|SANHE|三合|三会/);
  });
});

describe("relationship page boundaries", () => {
  it("renders relationship observations before professional day-pillar facts", () => {
    const source = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
    const workspace = source.slice(source.indexOf("export function RelationWorkspace"), source.indexOf("const ROOMS"));
    expect(workspace.indexOf("relationship-card-grid")).toBeLessThan(workspace.indexOf("relationship-professional"));
    expect(workspace.indexOf("relationship-joint-action")).toBeLessThan(workspace.indexOf("relationship-professional"));
    expect(workspace).not.toMatch(/buildBaziObservationCards|RELATION_DIMENSIONS|保存入口/);
    expect(workspace).toContain("把双方日干互相作为参照得到的结构观察");
    expect(workspace).toContain("不代表双方在现实中固定承担某种角色");
    expect(workspace).toContain("不等于完整四柱合参");
    expect(workspace).toContain("同一对日支可能同时出现多种传统关系名称");
    expect(workspace).toContain("不自动互相抵消，也不共同生成吉凶结论");
  });
});
