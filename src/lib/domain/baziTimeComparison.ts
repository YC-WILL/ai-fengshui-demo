import { computeBazi, pillarForGanzhiYear, type BaziChart, type Pillar } from "./bazi";
import { currentSolarTerm } from "./dailyCorrespondence";
import { TEN_GOD_PLAIN_MEANING, tenGodFor, type PillarName, type TenGodName, type TenGodRelation } from "./baziStructure";
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
  focusTitle: string;
  lifeTheme: string;
  branchTheme: string;
  professionalSummary: string;
  precision: string;
}

const TIME_FOCUS: Record<TenGodName, string> = {
  比肩: "自己拿主意、与同类并肩推进",
  劫财: "协商分配、回应同伴与竞争",
  食神: "把经验有条理地表达出来，做成可见成果",
  伤官: "发现不顺手之处，提出不同做法",
  偏财: "处理流动机会、临时资源和外部往来",
  正财: "安排进度、预算和可持续的日常事务",
  七杀: "回应硬任务、紧迫节点与明确压力",
  正官: "按规则推进，承担职责并确认边界",
  偏印: "从不同角度吸收线索，重新组合信息",
  正印: "接住支持、学习依据并稳住节奏"
};

const BRANCH_RELATION_SCENE: Record<string, string> = {
  同支: "像熟悉的节奏再次出现，原有习惯更容易被唤起",
  六合: "像两条线找到接点，较容易出现配合或衔接的空间",
  六冲: "像两股方向相对的力，需要调整节奏、位置或先后次序",
  六害: "像细处没有完全对齐，适合多确认一次信息与边界",
  六破: "像原有安排出现松动，适合检查哪些环节需要重新扣紧"
};

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
  const focusTitle = id === "today" ? "今天较容易碰到的主题" : id === "month" ? "这个月反复出现的主题" : "这一年的长期背景";
  const lifeTheme = `${TEN_GOD_PLAIN_MEANING[role.name]}放到${label}，可以先留意${TIME_FOCUS[role.name]}这类场景。`;
  const branchTheme = branchLinks.length
    ? branchLinks.map(link => `${pillar.branch}与本命${link.position}${link.natalBranch}形成“${link.relation}”：${BRANCH_RELATION_SCENE[link.relation] ?? "两层结构在这里相遇"}。`).join("")
    : `${pillar.branch}与已知本命地支没有形成这里列出的直接关系，像两条路暂时没有正面交会；不代表没有事情发生，只表示这层结构没有直接撞上本命支位。`;

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
    focusTitle,
    lifeTheme,
    branchTheme,
    professionalSummary: `${pillar.stem}相对日主${natal.dayMaster}为“${role.name}”（${role.relation}）；地支为${pillar.branch}${branchLinks.length ? `，与本命形成${branchLinks.map(link => `${link.position}${link.relation}`).join("、")}` : "，未见同支、六合、六冲、六害或六破"}。`,
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
