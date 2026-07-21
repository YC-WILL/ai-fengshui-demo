import { computeBazi, pillarForGanzhiYear, type BaziChart, type Pillar } from "./bazi";
import { currentSolarTerm } from "./dailyCorrespondence";
import { tenGodFor, type PillarName, type TenGodName, type TenGodRelation } from "./baziStructure";
import type { Branch } from "./elements";

export type BaziTimeLayerId = "today" | "month" | "year";

export interface BaziTimeLayer {
  id: BaziTimeLayerId;
  label: "今日" | "当月" | "流年";
  period: string;
  pillar: Pillar;
  source: string;
  stemRole: TenGodName;
  stemRelation: TenGodRelation;
  sameStemPositions: PillarName[];
  branchLinks: Array<{ position: PillarName; natalBranch: Branch; relation: string }>;
  precision: string;
}

const BRANCH_RELATIONS: Array<{ name: string; pairs: Array<[Branch, Branch]> }> = [
  { name: "六合", pairs: [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]] },
  { name: "六冲", pairs: [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]] },
  { name: "六害", pairs: [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]] },
  { name: "六破", pairs: [["子", "酉"], ["丑", "辰"], ["寅", "亥"], ["卯", "午"], ["巳", "申"], ["未", "戌"]] }
];

export function buildBaziTimeLayers(natal: BaziChart, dateKey: string): BaziTimeLayer[] {
  const term = currentSolarTerm(dateKey);
  const currentChart = computeBazi({
    gender: "other",
    birthDate: dateKey,
    birthTime: "12:00",
    timezone: "Asia/Shanghai",
    unknownTime: false
  });
  const calendarYear = Number(dateKey.slice(0, 4));
  const ganzhiYear = currentChart.year.pillarLabel === pillarForGanzhiYear(calendarYear).pillarLabel
    ? calendarYear
    : calendarYear - 1;

  return [
    makeLayer(natal, "today", "今日", dateKey, currentChart.day, "当日干支", "日柱按当天中国标准时间 12:00 取值；本层不作为出生时柱。"),
    makeLayer(natal, "month", "当月", `${term.name} · ${currentChart.month.branch}月`, currentChart.month, "十二节交接后的月柱", "月柱按实际节气交接时刻切换；本层以当天中国标准时间 12:00 为观察点。"),
    makeLayer(natal, "year", "流年", `${ganzhiYear}年`, currentChart.year, "立春交接后的干支纪年", "流年按立春实际交接时刻切换，不按公历元旦或农历正月初一切换。")
  ];
}

function makeLayer(
  natal: BaziChart,
  id: BaziTimeLayerId,
  label: BaziTimeLayer["label"],
  period: string,
  pillar: Pillar,
  source: string,
  precision: string
): BaziTimeLayer {
  const role = tenGodFor(natal.dayMaster, pillar.stem);
  const natalPillars = [
    ["年柱", natal.year],
    ["月柱", natal.month],
    ["日柱", natal.day],
    ["时柱", natal.hour]
  ] as const;
  const sameStemPositions = natalPillars
    .filter((entry): entry is readonly [PillarName, Pillar] => Boolean(entry[1]) && entry[1]?.stem === pillar.stem)
    .map(([name]) => name);
  const branchLinks = natalPillars.flatMap(([position, natalPillar]) => {
    if (!natalPillar) return [];
    const relation = branchRelation(pillar.branch, natalPillar.branch);
    return relation ? [{ position, natalBranch: natalPillar.branch, relation }] : [];
  });

  return {
    id,
    label,
    period,
    pillar,
    source,
    stemRole: role.name,
    stemRelation: role.relation,
    sameStemPositions,
    branchLinks,
    precision
  };
}

function branchRelation(current: Branch, natal: Branch): string | null {
  if (current === natal) return "同支";
  const names = BRANCH_RELATIONS
    .filter(item => item.pairs.some(pair => pair.includes(current) && pair.includes(natal)))
    .map(item => item.name);
  return names.length ? names.join("、") : null;
}
