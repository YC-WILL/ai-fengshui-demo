import type { BaziChart } from "./bazi";
import { buildBaziStructure, type HiddenStemFact, type TenGodName } from "./baziStructure";

export type BaziObservationCardId = "starting" | "pressure" | "collaboration";
export type BaziObservationConfidence = "完整资料" | "部分资料" | "暂不判断";
export type BaziObservationEvidenceRole = "primary" | "supporting";

export interface BaziObservationEvidence {
  source: string;
  fact: string;
  explanation: string;
  role: BaziObservationEvidenceRole;
  affectsConclusion: boolean;
}

export interface BaziObservationCard {
  id: BaziObservationCardId;
  title: string;
  conclusion: string;
  trigger: string;
  strength: string;
  watchout: string;
  action: string;
  evidence: BaziObservationEvidence[];
  confidence: BaziObservationConfidence;
  limitation?: string;
}

export interface BaziWeeklyAction {
  sourceCardId: BaziObservationCardId;
  sourceTitle: string;
  action: string;
}

type BehaviorFamily = "self" | "resource" | "output" | "reality" | "constraint";

interface SceneCopy {
  trigger: string;
  response: string;
  strength: string;
  watchout: string;
  action: string;
}

const FAMILY_BY_TEN_GOD: Record<TenGodName, BehaviorFamily> = {
  比肩: "self", 劫财: "self",
  偏印: "resource", 正印: "resource",
  食神: "output", 伤官: "output",
  偏财: "reality", 正财: "reality",
  七杀: "constraint", 正官: "constraint"
};

const STARTING_COPY: Record<BehaviorFamily, SceneCopy> = {
  resource: {
    trigger: "任务有参考资料、前例或可以请教的人",
    response: "先收集关键信息，确认依据后再开始",
    strength: "减少在方向未明时的重复返工",
    watchout: "资料持续增加时，可能把继续查找当成已经推进",
    action: "给资料收集设 10 分钟上限；写下三条已知事实后，立即完成一个不超过 10 分钟的起步步骤。"
  },
  self: {
    trigger: "任务允许自己决定方法，并且责任边界说得清楚",
    response: "先形成自己的判断，再决定是否邀请别人加入",
    strength: "启动时不容易被多头意见反复带走",
    watchout: "不同意见同时出现时，可能花较久时间守住原方案",
    action: "用 5 分钟写下自己要保留的一点和可调整的一点，再用余下 15 分钟完成第一版。"
  },
  output: {
    trigger: "任务可以先做样稿、试讲或用一个小成果验证方向",
    response: "先表达或做出可见版本，再根据反馈调整",
    strength: "能较快把模糊想法变成可讨论的东西",
    watchout: "急着说清或做完时，可能跳过交付条件的确认",
    action: "先写一份 15 分钟能完成的粗稿；完成条件是有标题、三点内容和一个待确认问题。"
  },
  reality: {
    trigger: "交付物、截止时间和可用资源能够列出来",
    response: "先安排资源与步骤，再进入执行",
    strength: "容易把目标转换成可交付的进度",
    watchout: "条件还在变化时，可能因资源不齐而推迟启动",
    action: "用三行写下交付物、截止时间和现有资源；写完后立即做第一个不超过 15 分钟的步骤。"
  },
  constraint: {
    trigger: "标准、期限和负责人已经明确",
    response: "先确认必须满足的条件，再按边界推进",
    strength: "在要求清楚的任务里较能守住质量和责任",
    watchout: "规则含糊或互相冲突时，可能迟迟不愿落下第一步",
    action: "用 5 分钟分开写“必须满足”和“尚待确认”；随后先做一个不受待确认项影响的 15 分钟步骤。"
  }
};

const PRESSURE_COPY: Record<BehaviorFamily, SceneCopy> = {
  resource: {
    trigger: "条件突然变化或手上信息彼此矛盾",
    response: "先退一步核对事实，再决定回应",
    strength: "能避免在信息不足时仓促表态",
    watchout: "时间紧迫时，可能仍在寻找更完整的依据",
    action: "把纸分成“已确认”和“仍是假设”两栏，各写最多三条；8 分钟后只选一个下一步执行。"
  },
  self: {
    trigger: "意见冲突，并且自己的职责或判断受到挑战",
    response: "先稳住立场，再判断哪些部分可以协商",
    strength: "压力下仍能保留清楚的个人边界",
    watchout: "持续对抗时，可能把讨论变成彼此证明谁更有道理",
    action: "用 3 分钟写下“我的底线、对方诉求、共同目标”各一句，再只回应共同目标中的一个问题。"
  },
  output: {
    trigger: "时间紧迫，或现有做法明显不能解决问题",
    response: "先把问题指出来，并提出一个可见的替代做法",
    strength: "能较快让卡住的议题进入讨论",
    watchout: "语速和判断加快时，表达可能比对方的理解走得更快",
    action: "先用一句话复述事实，再用一句话提出下一步；两句写完后停 2 分钟再发送或开口。"
  },
  reality: {
    trigger: "资源减少、截止时间提前或待办同时堆上来",
    response: "先重排优先级，把注意力放到眼前可完成的部分",
    strength: "较能在限制中维持实际进度",
    watchout: "只顾眼前交付时，可能暂时忽略沟通与恢复",
    action: "列出未来 20 分钟能推进的三件小事，只圈一件；做完并留下完成标记后再重新排序。"
  },
  constraint: {
    trigger: "期限逼近、责任加重或评价标准变严格",
    response: "先收紧步骤，确认哪些要求不能遗漏",
    strength: "关键时刻较能把责任和质量守住",
    watchout: "要求同时增多时，可能把每一项都当成同等紧急",
    action: "用 5 分钟标出唯一的硬期限、决策人和验收条件；余下时间只推进最接近验收的一步。"
  }
};

const COLLABORATION_COPY: Record<BehaviorFamily, SceneCopy> = {
  resource: {
    trigger: "对方愿意交代背景、依据和过去做过的尝试",
    response: "先听完整，再用自己的话确认理解",
    strength: "容易接住复杂背景，减少遗漏",
    watchout: "信息没有说全时，可能各自默认了不同前提",
    action: "下一次分工前，用不超过 10 分钟问一个背景问题，再用两句话复述目标与限制；等对方确认后即完成。"
  },
  self: {
    trigger: "双方都能明确各自负责什么、哪些决定可以自己做",
    response: "先确认彼此边界，再并行推进",
    strength: "分工清楚时容易保持自主，也给对方空间",
    watchout: "边界重叠时，可能出现重复决定或谁也不愿退让",
    action: "用 10 分钟各写一条“我负责”和一条“需要你确认”，互换确认后再开始协作。"
  },
  output: {
    trigger: "讨论允许直接展示草稿、例子或不同意见",
    response: "先把想法摆到桌面，再通过来回反馈修正",
    strength: "容易让隐含问题变得可见、可讨论",
    watchout: "表达密度高时，对方可能只听见结论，没有跟上推理",
    action: "发言前用 5 分钟写三行：“目标、当前方案、希望对方回应什么”；说完后请对方复述最后一行。"
  },
  reality: {
    trigger: "分工能对应具体交付物、时间和负责人",
    response: "先把资源与进度排清，再持续核对结果",
    strength: "容易把合作从讨论推进到实际交付",
    watchout: "任务定义模糊时，双方可能都以为对方会补上细节",
    action: "在一次协作开始前，用 10 分钟写负责人、交付物、截止时间和验收方式；四项都有内容即完成。"
  },
  constraint: {
    trigger: "规则、决策权限和变更方式提前讲清楚",
    response: "先确认共同遵守的边界，再进入配合",
    strength: "多人协作时较能维持秩序和责任清晰",
    watchout: "临时改规则却没有说明原因时，容易产生不信任或僵住",
    action: "用 10 分钟确认三件事：谁决定、谁执行、变化由谁通知；把答案留在双方都能看到的位置。"
  }
};

const SECONDARY_HINT: Record<BehaviorFamily, string> = {
  resource: "同时，另一条线索偏向先核对信息",
  self: "同时，另一条线索偏向保留自己的判断",
  output: "同时，另一条线索偏向尽快说出或做出版本",
  reality: "同时，另一条线索偏向核对资源与交付",
  constraint: "同时，另一条线索偏向确认规则与责任"
};

function evidenceFromHidden(
  item: HiddenStemFact,
  chart: BaziChart,
  use: string,
  role: BaziObservationEvidenceRole,
  affectsConclusion: boolean
): BaziObservationEvidence {
  return {
    source: item.source,
    fact: `${item.stem}相对${chart.dayMaster}日主为${item.name}`,
    explanation: role === "primary"
      ? `${use}；这项依据确定本卡的主要观察方向，不以出现次数判断强弱。`
      : affectsConclusion
        ? `${use}；它补充结论中的另一条观察线索，当前没有单独改写本卡的触发条件、优势、风险和行动。`
        : `${use}；它作为补充参照，当前没有改变本卡的结论、触发条件、优势、风险和行动。`,
    role,
    affectsConclusion
  };
}

function evidenceFromVisible(
  item: NonNullable<ReturnType<typeof buildBaziStructure>["pillars"][number]["visibleStem"]>,
  chart: BaziChart,
  use: string,
  role: BaziObservationEvidenceRole,
  affectsConclusion: boolean
): BaziObservationEvidence {
  return {
    source: item.source,
    fact: `${item.stem}相对${chart.dayMaster}日主为${item.role}`,
    explanation: role === "primary"
      ? `${use}；这项依据确定本卡的主要观察方向，不单独作为固定性格结论。`
      : affectsConclusion
        ? `${use}；它补充结论中的另一条观察线索，当前没有单独改写本卡的触发条件、优势、风险和行动。`
        : `${use}；它作为补充参照，当前没有改变本卡的结论、触发条件、优势、风险和行动。`,
    role,
    affectsConclusion
  };
}

function buildCard(
  id: BaziObservationCardId,
  title: string,
  primary: HiddenStemFact | NonNullable<ReturnType<typeof buildBaziStructure>["pillars"][number]["visibleStem"]>,
  secondary: HiddenStemFact | NonNullable<ReturnType<typeof buildBaziStructure>["pillars"][number]["visibleStem"]>,
  copy: Record<BehaviorFamily, SceneCopy>,
  chart: BaziChart,
  evidence: BaziObservationEvidence[]
): BaziObservationCard {
  const primaryRole = "name" in primary ? primary.name : primary.role === "日主" ? null : primary.role;
  const secondaryRole = "name" in secondary ? secondary.name : secondary.role === "日主" ? null : secondary.role;
  if (!primaryRole || !secondaryRole) throw new Error("生活观察需要两项可比较的十神事实");
  const primaryFamily = FAMILY_BY_TEN_GOD[primaryRole];
  const secondaryFamily = FAMILY_BY_TEN_GOD[secondaryRole];
  const scene = copy[primaryFamily];
  const confidence = chart.hour ? "完整资料" : "部分资料";

  return {
    id,
    title,
    conclusion: `当${scene.trigger}时，你可能${scene.response}。${SECONDARY_HINT[secondaryFamily]}，可以观察两种反应是否会先后出现。`,
    trigger: `在${scene.trigger}时较容易看见；若现实经历不符合，不把它当作固定结论。`,
    strength: `适度使用时，可能${scene.strength}。`,
    watchout: `如果持续使用同一种方式，可以观察以下情况是否出现：${scene.watchout}。`,
    action: scene.action,
    evidence,
    confidence,
    limitation: chart.hour ? "资料显示的是一种观察角度，不代表固定结论。" : "出生时间未知，本次只使用年柱、月柱、日柱；时柱及其藏干未参与。"
  };
}

function pendingCards(chart: BaziChart): BaziObservationCard[] {
  const uncertain = chart.calculation.uncertainty;
  const missing = [uncertain?.yearCandidates ? "年柱" : "", uncertain?.monthCandidates ? "月柱" : ""].filter(Boolean).join("和");
  const limitation = `出生当天处于交节边界，${missing || "相关柱位"}尚不能唯一确定；补充大致出生时段后再生成生活观察。`;
  return ([
    ["starting", "开始一件事"],
    ["pressure", "面对压力"],
    ["collaboration", "与人协作"]
  ] as const).map(([id, title]) => ({
    id,
    title,
    conclusion: "边界资料待确认，本项暂不判断。",
    trigger: "目前不根据未确定的柱位推断触发情境。",
    strength: "目前不输出优势判断。",
    watchout: "目前不输出风险判断。",
    action: "先补充大致出生时段，再生成可执行动作。",
    evidence: [],
    confidence: "暂不判断",
    limitation
  }));
}

/**
 * 从可追溯的月令本气、日支本气和明现天干组合出三张生活观察卡。
 * 不使用权重、出现次数、旺衰、星座或隐藏人格模板。
 */
export function buildBaziObservationCards(chart: BaziChart): BaziObservationCard[] {
  if (chart.calculation.uncertainty) return pendingCards(chart);

  const structure = buildBaziStructure(chart);
  const monthMain = structure.monthCommand.hiddenStems[0];
  const dayMain = structure.pillars[2].hiddenStems[0];
  const monthVisible = structure.pillars[1].visibleStem;
  const yearVisible = structure.pillars[0].visibleStem;
  if (!monthMain || !dayMain || !monthVisible || !yearVisible || monthVisible.role === "日主" || yearVisible.role === "日主") {
    return pendingCards(chart);
  }

  const starting = buildCard("starting", "开始一件事", monthMain, dayMain, STARTING_COPY, chart, [
    evidenceFromHidden(monthMain, chart, "用于观察接到任务时先回应哪类条件", "primary", true),
    evidenceFromHidden(dayMain, chart, "用于交叉核对进入实际行动后的落脚方式", "supporting", true)
  ]);
  const pressure = buildCard("pressure", "面对压力", dayMain, monthVisible, PRESSURE_COPY, chart, [
    evidenceFromHidden(dayMain, chart, "用于观察压力进入日常后较先调动的回应", "primary", true),
    evidenceFromVisible(monthVisible, chart, "用于交叉核对集体任务与外部要求中的表现", "supporting", true)
  ]);
  const collaborationEvidence = [
    evidenceFromVisible(yearVisible, chart, "用于观察对外互动时较容易被看见的协作方式", "primary", true),
    evidenceFromHidden(monthMain, chart, "用于交叉核对进入持续分工后的环境反应", "supporting", true)
  ];
  if (structure.pillars[3].visibleStem) {
    collaborationEvidence.push(evidenceFromVisible(structure.pillars[3].visibleStem, chart, "出生时辰已知，用于补充观察协作向后推进时的表达位置", "supporting", false));
  }
  const collaboration = buildCard("collaboration", "与人协作", yearVisible, monthMain, COLLABORATION_COPY, chart, collaborationEvidence);

  return [starting, pressure, collaboration];
}

export function buildBaziWeeklyAction(cards: BaziObservationCard[]): BaziWeeklyAction | null {
  const source = cards.find(card => card.confidence !== "暂不判断" && card.action.trim());
  return source ? { sourceCardId: source.id, sourceTitle: source.title, action: source.action } : null;
}
