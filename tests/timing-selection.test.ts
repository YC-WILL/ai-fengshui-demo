import { describe, expect, it } from "vitest";
import { buildTimingSelection } from "@/lib/domain/timingSelection";
import type { DateSelectionEvent } from "@/lib/types";

const EVENTS: DateSelectionEvent[] = [
  "wedding",
  "moving",
  "opening",
  "signing",
  "travel",
  "renovation_start"
];

const BIRTH_DATE = "1986-05-29";
const START_DATE = "2026-07-23";

describe("timing selection first-stage loop", () => {
  it("supports all six events with distinct transparent event rules", () => {
    const results = EVENTS.map(event => buildTimingSelection({
      event,
      startDate: START_DATE,
      rangeDays: 30,
      birthDate: BIRTH_DATE
    }));

    expect(results.every(result => result.eventLabel.length > 0)).toBe(true);
    expect(results.every(result => result.candidates.length > 0)).toBe(true);
    expect(new Set(results.map(result => result.candidates[0].evidence.find(item => item.id === "event-rule")?.fact)).size).toBe(6);
  });

  it.each([7, 30] as const)("keeps candidates inside the selected %s-day range and at no more than three", rangeDays => {
    const result = buildTimingSelection({
      event: "travel",
      startDate: START_DATE,
      rangeDays,
      birthDate: BIRTH_DATE
    });

    expect(result.candidates.length).toBeLessThanOrEqual(3);
    expect(result.candidates.every(candidate => (
      candidate.date >= result.startDate && candidate.date <= result.endDate
    ))).toBe(true);
  });

  it("makes every candidate traceable to calendar, birth, exclusion and event facts", () => {
    const result = buildTimingSelection({
      event: "moving",
      startDate: START_DATE,
      rangeDays: 30,
      birthDate: BIRTH_DATE
    });

    for (const candidate of result.candidates) {
      expect(candidate.evidence.map(item => item.id)).toEqual([
        "calendar-day",
        "birth-reference",
        "year-branch-check",
        "event-rule"
      ]);
      expect(candidate.evidence.every(item => item.source && item.fact && item.explanation)).toBe(true);
      expect(candidate.whyCandidate).toContain(candidate.evidence[3].fact);
    }
  });

  it("gives the six events different, low-risk preparation actions", () => {
    const actions = EVENTS.map(event => {
      const result = buildTimingSelection({
        event,
        startDate: START_DATE,
        rangeDays: 30,
        birthDate: BIRTH_DATE
      });
      return result.candidates[0].action;
    });

    expect(new Set(actions.map(action => action.text.replace(/\d+月\d+日（星期.）/, "候选日"))).size).toBe(6);
    expect(actions.every(action => action.durationMinutes <= 20)).toBe(true);
    expect(actions.every(action => action.doneWhen.length > 0)).toBe(true);
    expect(actions.every(action => action.sourceDate && action.sourceEvent)).toBe(true);
  });

  it("keeps candidate wording materially different when their facts differ", () => {
    const result = buildTimingSelection({
      event: "moving",
      startDate: START_DATE,
      rangeDays: 30,
      birthDate: BIRTH_DATE
    });
    const visibleCopies = result.candidates.map(candidate => [
      candidate.date,
      candidate.ganzhiDay,
      candidate.whyCandidate,
      candidate.arrangementFit,
      candidate.confirmBefore,
      candidate.limitation
    ].join("|"));

    expect(result.candidates.length).toBeGreaterThan(1);
    expect(new Set(visibleCopies).size).toBe(result.candidates.length);
    expect(new Set(result.candidates.map(candidate => candidate.whyCandidate)).size).toBeGreaterThan(1);
  });

  it("returns a real empty state instead of weakening rules to fill three dates", () => {
    let emptyResult: ReturnType<typeof buildTimingSelection> | undefined;
    for (let offset = 0; offset < 90 && !emptyResult; offset += 1) {
      const result = buildTimingSelection({
        event: "moving",
        startDate: offsetDate(START_DATE, offset),
        rangeDays: 7,
        birthDate: BIRTH_DATE
      });
      if (result.candidates.length === 0) emptyResult = result;
    }

    expect(emptyResult).toBeDefined();
    expect(emptyResult?.candidates).toEqual([]);
  });

  it("keeps detail content tied to the selected candidate object", () => {
    const result = buildTimingSelection({
      event: "signing",
      startDate: START_DATE,
      rangeDays: 30,
      birthDate: BIRTH_DATE
    });

    for (const candidate of result.candidates) {
      expect(candidate.action.sourceDate).toBe(candidate.date);
      expect(candidate.action.sourceEvent).toBe(result.event);
      expect(candidate.evidence[0].source).toBe(candidate.date);
    }
  });

  it("states the saved-profile scope and the result boundary without result guarantees", () => {
    const result = buildTimingSelection({
      event: "travel",
      startDate: START_DATE,
      rangeDays: 7,
      birthDate: BIRTH_DATE
    });
    const text = JSON.stringify(result);

    expect(result.profileScope).toContain("出生时辰和法定时区只在年柱交接边界");
    expect(result.profileScope).toContain("性别不参与");
    expect(result.boundary).toContain("不代表事情结果");
    expect(text).not.toMatch(/吉凶分数|能量分数|幸运指数|成功概率|红黑榜|最佳|必选|错过|改运|化煞|保证成功/);
  });

  it("stops when an unknown birth time leaves the year branch unresolved", () => {
    const result = buildTimingSelection({
      event: "moving",
      startDate: START_DATE,
      rangeDays: 30,
      birthDate: "2024-02-04",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });

    expect(result.status).toBe("insufficient");
    expect(result.candidates).toEqual([]);
    expect(result.insufficientReason).toContain("年支无法唯一确定");
    expect(result.boundary).toContain("不会用中午结果");
  });
});

function offsetDate(dateKey: string, offset: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
