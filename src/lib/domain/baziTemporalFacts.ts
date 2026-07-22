import type { BaziChart } from "./bazi";
import {
  buildBaziStructure,
  type PillarName,
  type QiLevel,
  type TenGodName
} from "./baziStructure";
import type { Branch, Element, Stem } from "./elements";

export type BaziVisibility = "天干明现" | "地支藏干";
export type NatalBranchRelationName = "同支" | "六合" | "六冲" | "六害" | "六破" | "刑";

export interface BaziTemporalOccurrence {
  tenGod: TenGodName | "日主";
  pillar: PillarName;
  stem: Stem;
  visibility: BaziVisibility;
  qiLevel?: QiLevel;
  isMonthCommand: boolean;
  source: string;
}

export interface NatalBranchRelation {
  name: NatalBranchRelationName;
  firstPillar: PillarName;
  secondPillar: PillarName;
  firstBranch: Branch;
  secondBranch: Branch;
}

export interface BaziTemporalFacts {
  input: {
    localDate: string;
    localTime?: string;
    timezone: string;
    birthLocation?: string;
    timeKnown: boolean;
  };
  dayMaster: { stem: Stem; element: Element };
  dayBranch: { branch: Branch; element: Element };
  monthCommand: { branch: Branch; mainStem: Stem; mainTenGod: TenGodName };
  pillars: Array<{ name: PillarName; label: string | null }>;
  occurrences: BaziTemporalOccurrence[];
  branchRelations: NatalBranchRelation[];
  signature: string;
}

const SIX_HARMONY: Array<[Branch, Branch]> = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]
];
const CLASHES: Array<[Branch, Branch]> = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]
];
const HARMS: Array<[Branch, Branch]> = [
  ["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]
];
const BREAKS: Array<[Branch, Branch]> = [
  ["子", "酉"], ["丑", "辰"], ["寅", "亥"], ["卯", "午"], ["巳", "申"], ["未", "戌"]
];
const PUNISHMENTS: Array<[Branch, Branch]> = [
  ["子", "卯"], ["寅", "巳"], ["巳", "申"], ["申", "寅"],
  ["丑", "戌"], ["戌", "未"], ["未", "丑"]
];
const SELF_PUNISHMENTS = new Set<Branch>(["辰", "午", "酉", "亥"]);

function pairMatches(pair: [Branch, Branch], first: Branch, second: Branch) {
  return (pair[0] === first && pair[1] === second) || (pair[0] === second && pair[1] === first);
}

function relationNames(first: Branch, second: Branch): NatalBranchRelationName[] {
  const names: NatalBranchRelationName[] = [];
  if (first === second) names.push("同支");
  if (SIX_HARMONY.some(pair => pairMatches(pair, first, second))) names.push("六合");
  if (CLASHES.some(pair => pairMatches(pair, first, second))) names.push("六冲");
  if (HARMS.some(pair => pairMatches(pair, first, second))) names.push("六害");
  if (BREAKS.some(pair => pairMatches(pair, first, second))) names.push("六破");
  if (
    PUNISHMENTS.some(pair => pairMatches(pair, first, second)) ||
    (first === second && SELF_PUNISHMENTS.has(first))
  ) names.push("刑");
  return names;
}

/**
 * 把可核验的出生时间与四柱事实整理成场景层唯一允许使用的事实输入。
 * 这里不写人格结论，也不从出生地或性别推断行为。
 */
export function buildBaziTemporalFacts(chart: BaziChart): BaziTemporalFacts {
  const structure = buildBaziStructure(chart);
  const monthMain = structure.monthCommand.hiddenStems[0];
  const occurrences: BaziTemporalOccurrence[] = [];

  structure.pillars.forEach(pillar => {
    if (pillar.visibleStem) {
      occurrences.push({
        tenGod: pillar.visibleStem.role,
        pillar: pillar.name,
        stem: pillar.visibleStem.stem,
        visibility: "天干明现",
        isMonthCommand: false,
        source: pillar.visibleStem.source
      });
    }
    pillar.hiddenStems.forEach(hidden => occurrences.push({
      tenGod: hidden.name,
      pillar: pillar.name,
      stem: hidden.stem,
      visibility: "地支藏干",
      qiLevel: hidden.qiLevel,
      isMonthCommand: pillar.name === "月柱" && hidden.stem === monthMain.stem && hidden.qiLevel === "本气",
      source: hidden.source
    }));
  });

  const availableBranches = structure.pillars.flatMap(pillar => pillar.branch
    ? [{ pillar: pillar.name, branch: pillar.branch.branch }]
    : []);
  const branchRelations: NatalBranchRelation[] = [];
  for (let firstIndex = 0; firstIndex < availableBranches.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < availableBranches.length; secondIndex += 1) {
      const first = availableBranches[firstIndex];
      const second = availableBranches[secondIndex];
      relationNames(first.branch, second.branch).forEach(name => branchRelations.push({
        name,
        firstPillar: first.pillar,
        secondPillar: second.pillar,
        firstBranch: first.branch,
        secondBranch: second.branch
      }));
    }
  }

  const pillarSignature = structure.pillars.map(pillar => pillar.pillar?.pillarLabel ?? "--").join("|");
  const occurrenceSignature = occurrences
    .map(item => `${item.pillar}:${item.tenGod}:${item.visibility}:${item.qiLevel ?? "明"}${item.isMonthCommand ? ":令" : ""}`)
    .join("|");

  return {
    input: {
      localDate: chart.inputSnapshot.birthDate,
      localTime: chart.calculation.timeKnown ? chart.inputSnapshot.birthTime : undefined,
      timezone: chart.calculation.timezone,
      birthLocation: chart.calculation.birthLocation,
      timeKnown: chart.calculation.timeKnown
    },
    dayMaster: { stem: chart.dayMaster, element: chart.day.stemElement },
    dayBranch: { branch: chart.day.branch, element: chart.day.branchElement },
    monthCommand: {
      branch: structure.monthCommand.branch,
      mainStem: monthMain.stem,
      mainTenGod: monthMain.name
    },
    pillars: structure.pillars.map(pillar => ({ name: pillar.name, label: pillar.pillar?.pillarLabel ?? null })),
    occurrences,
    branchRelations,
    signature: `${pillarSignature}#${occurrenceSignature}`
  };
}
