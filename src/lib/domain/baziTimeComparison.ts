import { computeBazi, pillarForGanzhiYear, pillarForSolarMonth, type BaziChart, type Pillar } from "./bazi";
import { currentSolarTerm, solarTermTimeline } from "./dailyCorrespondence";
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
  const timeline = solarTermTimeline(dateKey);
  const term = currentSolarTerm(dateKey);
  const liChun = timeline.yearTerms.find(item => item.name === "立春");
  if (!liChun) throw new Error("无法确定当年立春日期");
  const calendarYear = Number(dateKey.slice(0, 4));
  const ganzhiYear = dateKey < liChun.date ? calendarYear - 1 : calendarYear;
  const yearPillar = pillarForGanzhiYear(ganzhiYear);
  const monthPillar = pillarForSolarMonth(yearPillar.stem, term.monthBranch);
  const dayPillar = computeBazi({
    gender: "other",
    birthDate: dateKey,
    birthTime: "12:00",
    unknownTime: false
  }).day;

  return [
    makeLayer(natal, "today", "今日", dateKey, dayPillar, "当日干支", "日柱按公历日期换日；本层不使用时辰。"),
    makeLayer(natal, "month", "当月", `${term.name} · ${term.monthBranch}月`, monthPillar, `${term.name}后的节气月`, "月柱按北京时间节气月支与流年年干推得。"),
    makeLayer(natal, "year", "流年", `${ganzhiYear}年`, yearPillar, "立春后的干支纪年", `流年以${liChun.date}立春为年界，不按公历元旦切换。`)
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
