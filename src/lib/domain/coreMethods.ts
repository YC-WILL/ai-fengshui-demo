import { computeBazi } from "./bazi";
import { phaseRelation, type FivePhaseRelation } from "./dailyCorrespondence";
import { KE, SHENG, STEM_ELEMENT, type Branch, type Element } from "./elements";
import type { DateSelectionEvent } from "../types";

export interface PairStructure {
  first: { pillar: string; element: Element };
  second: { pillar: string; element: Element };
  stemRelation: string;
  branchRelation: string;
}

const BRANCH_RELATIONS: Array<{ label: string; pairs: Array<[Branch, Branch]> }> = [
  { label: "六合", pairs: [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]] },
  { label: "六冲", pairs: [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]] },
  { label: "六害", pairs: [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]] },
  { label: "六破", pairs: [["子", "酉"], ["丑", "辰"], ["寅", "亥"], ["卯", "午"], ["巳", "申"], ["未", "戌"]] }
];

const RELATION_LABEL: Record<FivePhaseRelation, string> = {
  same: "同类",
  generates: "我生彼",
  generated_by: "彼生我",
  controls: "我克彼",
  controlled_by: "彼克我"
};

export function buildPairStructure(firstBirthDate: string, secondBirthDate: string): PairStructure {
  const first = computeBazi({ gender: "other", birthDate: firstBirthDate, birthTime: "", unknownTime: true });
  const second = computeBazi({ gender: "other", birthDate: secondBirthDate, birthTime: "", unknownTime: true });
  const found = BRANCH_RELATIONS.find(relation => relation.pairs.some(([a, b]) =>
    (a === first.day.branch && b === second.day.branch) || (b === first.day.branch && a === second.day.branch)));
  return {
    first: { pillar: first.day.pillarLabel, element: first.day.stemElement },
    second: { pillar: second.day.pillarLabel, element: second.day.stemElement },
    stemRelation: RELATION_LABEL[phaseRelation(first.day.stemElement, second.day.stemElement)],
    branchRelation: first.day.branch === second.day.branch ? "同支" : found?.label ?? "无特定合冲"
  };
}

export const HOME_DIRECTIONS = [
  { direction: "北", trigram: "坎", element: "水", binary: "010" },
  { direction: "东北", trigram: "艮", element: "土", binary: "001" },
  { direction: "东", trigram: "震", element: "木", binary: "100" },
  { direction: "东南", trigram: "巽", element: "木", binary: "011" },
  { direction: "南", trigram: "离", element: "火", binary: "101" },
  { direction: "西南", trigram: "坤", element: "土", binary: "000" },
  { direction: "西", trigram: "兑", element: "金", binary: "110" },
  { direction: "西北", trigram: "乾", element: "金", binary: "111" }
] as const;

export interface CoreDateCandidate {
  date: string;
  ganzhiDay: string;
  reason: string;
  score: number;
}

export function selectCoreDates(birthDate: string, startDate: string, days: number, event: DateSelectionEvent): CoreDateCandidate[] {
  const user = computeBazi({ gender: "other", birthDate, birthTime: "", unknownTime: true });
  const candidates = Array.from({ length: Math.min(30, Math.max(1, days)) }, (_, offset) => {
    const date = offsetDate(startDate, offset);
    const chart = computeBazi({ gender: "other", birthDate: date, birthTime: "12:00", unknownTime: false });
    const dayElement = chart.day.stemElement;
    const userElement = STEM_ELEMENT[user.dayMaster];
    let score = 50;
    let reason = "当日日干与本人日干关系平稳";
    if (dayElement === userElement) { score += 5; reason = "当日日干与本人日干同类"; }
    else if (SHENG[userElement] === dayElement) { score += 10; reason = "本人日干生当日日干"; }
    else if (SHENG[dayElement] === userElement) { score += 5; reason = "当日日干生本人日干"; }
    else if (KE[userElement] === dayElement) { score -= 10; reason = "本人日干克当日日干"; }
    else if (KE[dayElement] === userElement) { score -= 15; reason = "当日日干克本人日干"; }

    if (isSixClash(user.year.branch, chart.day.branch)) score -= 15;
    if (event === "wedding" && (chart.day.branch === "卯" || chart.day.branch === "酉")) score += 5;
    if (event === "moving" && (chart.day.branch === "寅" || chart.day.branch === "午")) score += 5;
    if (event === "opening" && (chart.day.stem === "甲" || chart.day.stem === "丙")) score += 5;
    return { date, ganzhiDay: chart.day.pillarLabel, reason, score };
  });
  return candidates.filter(item => item.score >= 60).sort((a, b) => b.score - a.score || a.date.localeCompare(b.date)).slice(0, 3);
}

function isSixClash(first: Branch, second: Branch) {
  const pairs: Array<[Branch, Branch]> = [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]];
  return pairs.some(([a, b]) => (a === first && b === second) || (b === first && a === second));
}

function offsetDate(dateKey: string, offset: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
