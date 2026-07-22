import type { BaziChart } from "./bazi";
import { buildBaziSceneFingerprint, type BaziSceneSignal } from "./baziSceneFingerprint";
import type { NatalBranchRelation } from "./baziTemporalFacts";
import type { TenGodName } from "./baziStructure";
import {
  DAY_BRANCH_RECOVERY,
  DAY_MASTER_ACTION_STYLE,
  PILLAR_SCENE_LENS,
  TEN_GOD_BEHAVIOR_ATOMS,
  VISIBILITY_LENS
} from "../knowledge/baziSceneCatalog";

export type BaziLifeSceneId = "social" | "solitude" | "work" | "own_time";

export interface BaziLifeScene {
  id: BaziLifeSceneId;
  label: string;
  shortLabel: string;
  lead: string;
  moments: Array<{
    id: "entry" | "active" | "pressure";
    label: string;
    title: string;
    body: string;
  }>;
  evidenceSummary: string;
  evidence: string[];
  fingerprint: string;
}

const SCENE_ORDER: BaziLifeSceneId[] = ["social", "solitude", "work", "own_time"];

const SCENE_META: Record<BaziLifeSceneId, {
  label: string;
  shortLabel: string;
  stages: Record<"entry" | "active" | "pressure", string>;
}> = {
  social: {
    label: "社交中的你",
    shortLabel: "社交",
    stages: { entry: "刚进入关系", active: "逐渐熟悉以后", pressure: "出现分歧时" }
  },
  solitude: {
    label: "独处时的你",
    shortLabel: "独处",
    stages: { entry: "刚停下来", active: "真正安静以后", pressure: "思绪积压时" }
  },
  work: {
    label: "工作与做事",
    shortLabel: "工作与做事",
    stages: { entry: "接到事情时", active: "真正推进时", pressure: "条件变化时" }
  },
  own_time: {
    label: "自己的日子",
    shortLabel: "自己的日子",
    stages: { entry: "没有任务时", active: "有了兴趣以后", pressure: "生活失去节奏时" }
  }
};

const SIGNAL_LABEL: Record<TenGodName, string> = {
  比肩: "自己的位置",
  劫财: "协作与分配",
  食神: "稳定的表达出口",
  伤官: "需要改进的地方",
  偏财: "现场的机会与资源",
  正财: "现实安排",
  七杀: "眼前压力",
  正官: "规则与责任",
  偏印: "不明显的线索",
  正印: "依据与来路"
};

function visibilitySentence(signal: BaziSceneSignal) {
  if (signal.leadingOccurrence.isMonthCommand) return VISIBILITY_LENS.monthMain;
  return signal.leadingOccurrence.visibility === "天干明现" ? VISIBILITY_LENS.visible : VISIBILITY_LENS.hidden;
}

function relationSentence(relation: NatalBranchRelation | undefined) {
  if (!relation) return "盘内没有需要强行放大的地支关系，这里以实际显藏和柱位为主";
  const positions = `${relation.firstPillar}与${relation.secondPillar}`;
  const sentences: Record<NatalBranchRelation["name"], string> = {
    同支: `${positions}出现同支，类似的节奏会在两个生活位置重复出现`,
    六合: `${positions}形成六合，两处安排较容易彼此牵动，处理一端时也会带到另一端`,
    六冲: `${positions}形成六冲，两处节奏方向不同，压力下更需要调整先后与位置`,
    六害: `${positions}形成六害，一处顾及另一处时，可能出现不容易当场说清的牵扯`,
    六破: `${positions}形成六破，原有节奏可能被细节打断，需要重新把前后衔接起来`,
    刑: `${positions}形成刑的结构，两处要求被同时启动时，容易反复检查或持续用力`
  };
  return sentences[relation.name];
}

function signalEvidence(signal: BaziSceneSignal) {
  const leading = signal.leadingOccurrence;
  const qi = leading.qiLevel ? `·${leading.qiLevel}` : "";
  const otherPositions = [...new Set(signal.occurrences.slice(1).map(item => item.source))];
  return `${signal.tenGod}：主线来自${leading.source}${qi}${leading.isMonthCommand ? "，同时为月令本气" : ""}${otherPositions.length ? `；另见${otherPositions.slice(0, 2).join("、")}` : ""}`;
}

function buildScene(chart: BaziChart, id: BaziLifeSceneId): BaziLifeScene {
  const meta = SCENE_META[id];
  const fingerprint = buildBaziSceneFingerprint(chart, id);
  const primaryAtom = TEN_GOD_BEHAVIOR_ATOMS[fingerprint.primary.tenGod];
  const secondaryAtom = TEN_GOD_BEHAVIOR_ATOMS[fingerprint.secondary.tenGod];
  const primaryOccurrence = fingerprint.primary.leadingOccurrence;
  const secondaryOccurrence = fingerprint.secondary.leadingOccurrence;
  const relation = relationSentence(fingerprint.relation);

  return {
    id,
    label: meta.label,
    shortLabel: meta.shortLabel,
    lead: `在这个场景里，你较容易先把“${primaryAtom.focus[id]}”放在前面。真正行动时，${DAY_MASTER_ACTION_STYLE[fingerprint.dayMaster]}。`,
    moments: [
      {
        id: "entry",
        label: meta.stages.entry,
        title: `先看${SIGNAL_LABEL[fingerprint.primary.tenGod]}`,
        body: `${primaryAtom.entry}。${PILLAR_SCENE_LENS[id][primaryOccurrence.pillar]}；${visibilitySentence(fingerprint.primary)}。`
      },
      {
        id: "active",
        label: meta.stages.active,
        title: `${SIGNAL_LABEL[fingerprint.secondary.tenGod]}开始接手`,
        body: `${secondaryAtom.active}。放在这里，你会更在意“${secondaryAtom.focus[id]}”。${PILLAR_SCENE_LENS[id][secondaryOccurrence.pillar]}。`
      },
      {
        id: "pressure",
        label: meta.stages.pressure,
        title: `当${SIGNAL_LABEL[fingerprint.primary.tenGod]}反复被牵动`,
        body: `${primaryAtom.pressure}。${relation}；${DAY_BRANCH_RECOVERY[fingerprint.dayBranchElement]}。`
      }
    ],
    evidenceSummary: `本场景没有把十神先合并成五类，而是以${fingerprint.primary.tenGod}和${fingerprint.secondary.tenGod}的具体柱位、显藏与月令关系组织行为顺序。`,
    evidence: [
      `日主：${chart.dayMaster}${chart.day.stemElement}，用于校准行动方式，不单独定义性格`,
      `月令：${chart.month.branch}月，本气对应${fingerprint.monthCommandTenGod}`,
      signalEvidence(fingerprint.primary),
      signalEvidence(fingerprint.secondary),
      fingerprint.relation
        ? `盘内关系：${fingerprint.relation.firstPillar}${fingerprint.relation.firstBranch}与${fingerprint.relation.secondPillar}${fingerprint.relation.secondBranch}形成${fingerprint.relation.name}`
        : "盘内关系：未用单一合冲关系扩写现实结论",
      chart.hour ? `时柱：${chart.hour.pillarLabel}，已参与本场景的柱位排序` : "出生时间未知：只使用年、月、日三柱，时柱没有补猜"
    ],
    fingerprint: fingerprint.signature
  };
}

/**
 * 四场景分别读取完整十神、柱位、显藏、月令与盘内关系。
 * 文案由事实原子组合，不再从五类力量中抽取两段固定正文。
 */
export function buildBaziLifeScenes(chart: BaziChart): BaziLifeScene[] {
  return SCENE_ORDER.map(id => buildScene(chart, id));
}
