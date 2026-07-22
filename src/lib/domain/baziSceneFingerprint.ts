import type { BaziChart } from "./bazi";
import { buildBaziTemporalFacts, type BaziTemporalOccurrence, type NatalBranchRelation } from "./baziTemporalFacts";
import type { BaziLifeSceneId } from "./baziLifeScenes";
import type { PillarName, TenGodName } from "./baziStructure";

export interface BaziSceneSignal {
  tenGod: TenGodName;
  score: number;
  leadingOccurrence: BaziTemporalOccurrence;
  occurrences: BaziTemporalOccurrence[];
}

export interface BaziSceneFingerprint {
  scene: BaziLifeSceneId;
  primary: BaziSceneSignal;
  secondary: BaziSceneSignal;
  relation?: NatalBranchRelation;
  dayMaster: BaziChart["dayMaster"];
  dayBranchElement: BaziChart["day"]["branchElement"];
  monthCommandTenGod: TenGodName;
  timeKnown: boolean;
  signature: string;
}

const POSITION_WEIGHT: Record<BaziLifeSceneId, Record<PillarName, number>> = {
  social: { 年柱: 1.65, 月柱: 1.45, 日柱: 0.95, 时柱: 0.55 },
  solitude: { 年柱: 0.55, 月柱: 0.85, 日柱: 1.75, 时柱: 1.35 },
  work: { 年柱: 0.9, 月柱: 1.85, 日柱: 0.8, 时柱: 1.25 },
  own_time: { 年柱: 0.5, 月柱: 0.75, 日柱: 1.55, 时柱: 1.8 }
};

const VISIBILITY_WEIGHT: Record<BaziLifeSceneId, Record<BaziTemporalOccurrence["visibility"], number>> = {
  social: { 天干明现: 1.45, 地支藏干: 0.85 },
  solitude: { 天干明现: 0.8, 地支藏干: 1.5 },
  work: { 天干明现: 1.4, 地支藏干: 0.9 },
  own_time: { 天干明现: 0.85, 地支藏干: 1.35 }
};

function occurrenceBase(item: BaziTemporalOccurrence) {
  if (item.visibility === "天干明现") return 3;
  if (item.qiLevel === "本气") return 2;
  if (item.qiLevel === "中气") return 1.25;
  return 0.75;
}

function occurrenceScore(scene: BaziLifeSceneId, item: BaziTemporalOccurrence) {
  const monthBoost = item.isMonthCommand ? (scene === "work" ? 2.2 : 1.45) : 0;
  return occurrenceBase(item) * POSITION_WEIGHT[scene][item.pillar] * VISIBILITY_WEIGHT[scene][item.visibility] + monthBoost;
}

function buildSignals(scene: BaziLifeSceneId, occurrences: BaziTemporalOccurrence[]) {
  const grouped = new Map<TenGodName, BaziTemporalOccurrence[]>();
  occurrences.forEach(item => {
    if (item.tenGod === "日主") return;
    const current = grouped.get(item.tenGod) ?? [];
    current.push(item);
    grouped.set(item.tenGod, current);
  });

  return [...grouped.entries()].map(([tenGod, items]) => {
    const ranked = [...items].sort((first, second) => occurrenceScore(scene, second) - occurrenceScore(scene, first));
    return {
      tenGod,
      score: items.reduce((sum, item) => sum + occurrenceScore(scene, item), 0),
      leadingOccurrence: ranked[0],
      occurrences: ranked
    } satisfies BaziSceneSignal;
  }).sort((first, second) => second.score - first.score || first.tenGod.localeCompare(second.tenGod, "zh-CN"));
}

function relationWeight(scene: BaziLifeSceneId, relation: NatalBranchRelation) {
  const positions = [relation.firstPillar, relation.secondPillar];
  return positions.reduce((sum, position) => sum + POSITION_WEIGHT[scene][position], 0);
}

/** 为每个场景保留具体十神、柱位、显藏和盘内地支关系，避免五类压缩。 */
export function buildBaziSceneFingerprint(chart: BaziChart, scene: BaziLifeSceneId): BaziSceneFingerprint {
  const facts = buildBaziTemporalFacts(chart);
  const signals = buildSignals(scene, facts.occurrences);
  const primary = signals[0];
  const secondary = signals[1] ?? signals[0];
  if (!primary || !secondary) throw new Error("命盘没有足够的场景结构线索");
  const relation = [...facts.branchRelations]
    .sort((first, second) => relationWeight(scene, second) - relationWeight(scene, first))[0];

  return {
    scene,
    primary,
    secondary,
    relation,
    dayMaster: chart.dayMaster,
    dayBranchElement: chart.day.branchElement,
    monthCommandTenGod: facts.monthCommand.mainTenGod,
    timeKnown: facts.input.timeKnown,
    signature: [
      scene,
      facts.signature,
      `${primary.tenGod}@${primary.leadingOccurrence.pillar}:${primary.leadingOccurrence.visibility}`,
      `${secondary.tenGod}@${secondary.leadingOccurrence.pillar}:${secondary.leadingOccurrence.visibility}`,
      relation ? `${relation.firstPillar}${relation.name}${relation.secondPillar}` : "无显著支关系"
    ].join("#")
  };
}
