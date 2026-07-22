import type { BaziChart } from "./bazi";
import { tenGodFor, type TenGodName } from "./baziStructure";
import {
  KE,
  SHENG,
  STEM_ELEMENT,
  STEM_YIN_YANG,
  type Branch,
  type Element,
  type Stem,
  type YinYang
} from "./elements";

export type RelationshipType = "partner" | "family" | "friend" | "cooperation";
export type RelationshipCardId = "connection" | "friction" | "collaboration";
export type RelationshipEvidenceRole = "primary" | "supporting";

export const RELATIONSHIP_TYPES: ReadonlyArray<{ id: RelationshipType; label: string }> = [
  { id: "partner", label: "伴侣" },
  { id: "family", label: "家人" },
  { id: "friend", label: "朋友" },
  { id: "cooperation", label: "合作" }
];

export interface RelationshipEvidence {
  role: RelationshipEvidenceRole;
  source: "双向日干" | "日干五行" | "双方日支";
  fact: string;
  explanation: string;
}

export interface PairInteractionFacts {
  first: DayPillarFact;
  second: DayPillarFact;
  firstPerspective: DirectionalTenGodFact;
  secondPerspective: DirectionalTenGodFact;
  elementRelation: ElementRelationFact;
  samePolarity: boolean;
  polarityFact: string;
  branchRelations: BranchRelationFact[];
  boundary: string;
}

export interface DayPillarFact {
  pillar: string;
  stem: Stem;
  branch: Branch;
  element: Element;
  polarity: YinYang;
}

export interface DirectionalTenGodFact {
  perspective: "你看对方" | "对方看你";
  tenGod: TenGodName;
  fact: string;
}

export interface ElementRelationFact {
  kind: "same" | "first_generates" | "second_generates" | "first_controls" | "second_controls";
  label: string;
  fact: string;
}

export interface BranchRelationFact {
  id: "same" | "six_harmony" | "six_clash" | "six_harm" | "six_break" | "punishment" | "none";
  label: string;
  fact: string;
  explanation: string;
}

export interface RelationshipObservationCard {
  id: RelationshipCardId;
  title: string;
  conclusion: string;
  trigger: string;
  strength: string;
  watchout: string;
  action: string;
  durationMinutes: number;
  evidence: RelationshipEvidence[];
  limitation: string;
}

export interface RelationshipJointAction {
  sourceCardId: RelationshipCardId;
  title: string;
  action: string;
  doneWhen: string;
  durationMinutes: number;
}

const RELATION_CONTEXT: Record<RelationshipType, string> = {
  partner: "商量共同生活里的安排",
  family: "处理一项家庭安排",
  friend: "商量一次共同活动",
  cooperation: "推进一项共同任务"
};

const ROLE_LANGUAGE: Record<TenGodName, { move: string; value: string; excess: string; contribution: string }> = {
  比肩: { move: "先确认双方是否站在同一立场", value: "把各自立场摆到同一层面讨论", excess: "把相近说法当成已经达成一致", contribution: "陈述自己的立场与可承担范围" },
  劫财: { move: "先划清资源和决定权怎样分", value: "较快看见资源、边界与分配问题", excess: "还没确认共同目标就先争分配", contribution: "列出可共享资源与不能代替决定的边界" },
  食神: { move: "先把想法整理成容易接住的说法", value: "把复杂内容讲成可继续讨论的步骤", excess: "为了让气氛顺畅而略过真正分歧", contribution: "整理说明、步骤与可执行的小项" },
  伤官: { move: "先指出现有做法哪里需要调整", value: "较快看见规则或方案里的不顺手处", excess: "修正来得太快，让对方只听见否定", contribution: "提出不同方案并说明要解决的问题" },
  偏财: { move: "先看现有条件可以怎样调动", value: "在条件变化时较快找到可用资源", excess: "同时打开太多选项，遗漏后续承接", contribution: "寻找替代资源、外部接口与机动选项" },
  正财: { move: "先确认具体交付和日常安排", value: "把讨论落到时间、物品或责任清单", excess: "过早锁定细节，压缩重新协商的空间", contribution: "核对交付、时间与持续维护事项" },
  七杀: { move: "先回应最紧迫的要求和限制", value: "在时间紧或要求明确时较快进入处理", excess: "把仍可讨论的事也当成必须马上完成", contribution: "识别紧急项、硬限制与最先处理的一步" },
  正官: { move: "先确认规则、责任和完成标准", value: "让双方知道什么算完成、由谁负责", excess: "规则尚未共同确认就按自己的标准推进", contribution: "整理规则、责任人与验收标准" },
  偏印: { move: "先收集容易被忽略的侧面信息", value: "补进不同角度和非显眼线索", excess: "线索不断增加，却迟迟不确认下一步", contribution: "补充例外、背景与另一种理解路径" },
  正印: { move: "先确认已有依据和双方需要的支持", value: "把讨论放回可靠信息和承接条件", excess: "等待更多依据或支持，推迟眼前可做的步骤", contribution: "整理依据、前提与需要互相提供的支持" }
};

const LIUHE: Array<[Branch, Branch]> = [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]];
const LIUCHONG: Array<[Branch, Branch]> = [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]];
const LIUHAI: Array<[Branch, Branch]> = [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]];
const LIUPO: Array<[Branch, Branch]> = [["子", "酉"], ["丑", "辰"], ["寅", "亥"], ["卯", "午"], ["巳", "申"], ["未", "戌"]];
const MUTUAL_PUNISHMENT: Array<[Branch, Branch]> = [["子", "卯"]];
const PARTIAL_PUNISHMENT: Array<[Branch, Branch]> = [["寅", "巳"], ["巳", "申"], ["申", "寅"], ["丑", "戌"], ["戌", "未"], ["未", "丑"]];
const SELF_PUNISHMENT = new Set<Branch>(["辰", "午", "酉", "亥"]);

function includesPair(pairs: Array<[Branch, Branch]>, first: Branch, second: Branch) {
  return pairs.some(([a, b]) => (a === first && b === second) || (a === second && b === first));
}

function elementRelation(first: Stem, second: Stem): ElementRelationFact {
  const firstElement = STEM_ELEMENT[first];
  const secondElement = STEM_ELEMENT[second];
  if (firstElement === secondElement) return { kind: "same", label: "同类", fact: `双方日干同属${firstElement}` };
  if (SHENG[firstElement] === secondElement) return { kind: "first_generates", label: "你生对方", fact: `你的日干五行${firstElement}生对方的${secondElement}` };
  if (SHENG[secondElement] === firstElement) return { kind: "second_generates", label: "对方生你", fact: `对方的日干五行${secondElement}生你的${firstElement}` };
  if (KE[firstElement] === secondElement) return { kind: "first_controls", label: `${firstElement}克${secondElement}`, fact: `双方日干五行形成${firstElement}克${secondElement}的结构方向` };
  return { kind: "second_controls", label: `${secondElement}克${firstElement}`, fact: `双方日干五行形成${secondElement}克${firstElement}的结构方向` };
}

export function findDayBranchRelations(first: Branch, second: Branch): BranchRelationFact[] {
  const relations: BranchRelationFact[] = [];
  if (first === second) relations.push({ id: "same", label: "同支", fact: `双方日支同为${first}`, explanation: "同一个日常线索可能较容易被双方同时注意，但不代表两人的反应相同。" });
  if (includesPair(LIUHE, first, second)) relations.push({ id: "six_harmony", label: "六合", fact: `${first}与${second}为六合`, explanation: "传统结构把它看作较容易找到接点；现实中仍要把分工和边界说清。" });
  if (includesPair(LIUCHONG, first, second)) relations.push({ id: "six_clash", label: "六冲", fact: `${first}与${second}为六冲`, explanation: "传统结构提示方向或节奏可能拉开；它不等于关系好坏。" });
  if (includesPair(LIUHAI, first, second)) relations.push({ id: "six_harm", label: "六害", fact: `${first}与${second}为六害`, explanation: "传统结构提示没有说出口的前提可能不一致，需要主动核对。" });
  if (includesPair(LIUPO, first, second)) relations.push({ id: "six_break", label: "六破", fact: `${first}与${second}为六破`, explanation: "传统结构提示约定在执行中可能松动，可以增加中途确认。" });
  if (includesPair(MUTUAL_PUNISHMENT, first, second)) relations.push({ id: "punishment", label: "相刑", fact: `${first}与${second}为子卯相刑`, explanation: "传统结构提示彼此的做法可能反复触发修正；它不表示现实事件。" });
  if (includesPair(PARTIAL_PUNISHMENT, first, second)) relations.push({ id: "punishment", label: "刑的一部分", fact: `${first}与${second}构成三刑组合的一部分`, explanation: "这里只有两个日支，不能当作完整三刑，只保留为需要复核的局部关系。" });
  if (first === second && SELF_PUNISHMENT.has(first)) relations.push({ id: "punishment", label: "自刑", fact: `双方日支同为${first}，也落在自刑支`, explanation: "同类日常线索可能被重复放大；这只是结构名称，不等于现实事件。" });
  return relations.length ? relations : [{ id: "none", label: "无直接关系", fact: `${first}与${second}未见本版采用的同支、合、冲、害、破或刑`, explanation: "没有命名关系时，不据此推断相处容易或困难。" }];
}

export function buildPairInteractionFacts(firstChart: BaziChart, secondChart: BaziChart): PairInteractionFacts {
  const firstTenGod = tenGodFor(firstChart.day.stem, secondChart.day.stem).name;
  const secondTenGod = tenGodFor(secondChart.day.stem, firstChart.day.stem).name;
  return {
    first: {
      pillar: firstChart.day.pillarLabel,
      stem: firstChart.day.stem,
      branch: firstChart.day.branch,
      element: firstChart.day.stemElement,
      polarity: STEM_YIN_YANG[firstChart.day.stem]
    },
    second: {
      pillar: secondChart.day.pillarLabel,
      stem: secondChart.day.stem,
      branch: secondChart.day.branch,
      element: secondChart.day.stemElement,
      polarity: STEM_YIN_YANG[secondChart.day.stem]
    },
    firstPerspective: {
      perspective: "你看对方",
      tenGod: firstTenGod,
      fact: `对方日干${secondChart.day.stem}相对你的日干${firstChart.day.stem}为${firstTenGod}`
    },
    secondPerspective: {
      perspective: "对方看你",
      tenGod: secondTenGod,
      fact: `你的日干${firstChart.day.stem}相对对方的日干${secondChart.day.stem}为${secondTenGod}`
    },
    elementRelation: elementRelation(firstChart.day.stem, secondChart.day.stem),
    samePolarity: STEM_YIN_YANG[firstChart.day.stem] === STEM_YIN_YANG[secondChart.day.stem],
    polarityFact: `你的日干为${STEM_YIN_YANG[firstChart.day.stem]}，对方日干为${STEM_YIN_YANG[secondChart.day.stem]}，属于${STEM_YIN_YANG[firstChart.day.stem] === STEM_YIN_YANG[secondChart.day.stem] ? "同阴阳" : "一阴一阳"}`,
    branchRelations: findDayBranchRelations(firstChart.day.branch, secondChart.day.branch),
    boundary: "关系初见以双方日柱为观察入口，不代表完整合婚，也不判断关系结果。出生时辰、年柱、月柱和两份个人画像均未参与。"
  };
}

function branchBehavior(relations: BranchRelationFact[]) {
  const relation = relations[0];
  const map: Record<BranchRelationFact["id"], { trigger: string; strength: string; watchout: string; action: string }> = {
    same: {
      trigger: "当同一个日常细节同时引起你们注意时",
      strength: "你们可能较快知道讨论对象在哪里",
      watchout: "如果把注意到同一件事当成想法也相同，后面的分歧会被推迟",
      action: "各自用一句话说出自己希望这件事最后变成什么，再比较两句话是否真是同一个目标"
    },
    six_harmony: {
      trigger: "当你们需要先找到一个可以共同推进的接点时",
      strength: "双方可能较快接住彼此话里的可合作部分",
      watchout: "如果因为接得顺就跳过责任边界，执行时仍可能出现落差",
      action: "把刚达成的共识补成两行：各自负责什么、什么情况需要重新商量"
    },
    six_clash: {
      trigger: "当时间安排或推进方向只能选一个时",
      strength: "两种方向会较早被摆到桌面上，不必等到执行后才发现",
      watchout: "如果急着让其中一方立刻改向，讨论容易停在立场碰撞",
      action: "各自写下一个不能退的条件和一个可以调整的条件，再只谈两边都能移动的部分"
    },
    six_harm: {
      trigger: "当一方以为某个前提已经默认成立时",
      strength: "把隐含前提说开后，双方能更早发现信息缺口",
      watchout: "如果只回应表面要求，没有核对各自默认的前提，误解可能累积",
      action: "轮流补完一句“我原本以为你会……”，只核对事实，不立即判断谁对谁错"
    },
    six_break: {
      trigger: "当口头约定进入实际执行时",
      strength: "中途复核可以较快发现哪些环节已经松动",
      watchout: "如果只在开始时说清楚、途中不再确认，小偏差可能拖到最后才看见",
      action: "为当前约定加一个中途检查点，只确认进度、变化和是否需要重新分工"
    },
    punishment: {
      trigger: "当同一个做法被彼此反复纠正时",
      strength: "双方有机会把模糊标准说得更具体",
      watchout: "如果每次都直接纠正做法，却不说明判断标准，容易陷入重复拉扯",
      action: "各自说出一次“我希望调整的是结果还是过程”，确认后只改其中一项"
    },
    none: {
      trigger: "当你们处理一项具体共同事项时",
      strength: "日支没有给出固定的直接关系，可以把判断留给真实互动",
      watchout: "如果把“没有命名关系”误读成自然顺畅或自然困难，会超出盘面事实",
      action: "选一件正在商量的小事，各自说出目标、顾虑和可承担的一步，用实际回应代替预设"
    }
  };
  return map[relation.id];
}

function stemEvidence(facts: PairInteractionFacts): RelationshipEvidence[] {
  return [
    { role: "primary", source: "双向日干", fact: facts.firstPerspective.fact, explanation: `这条方向线索用于观察你这边为何可能${ROLE_LANGUAGE[facts.firstPerspective.tenGod].move}。` },
    { role: "primary", source: "双向日干", fact: facts.secondPerspective.fact, explanation: `这条反向线索用于观察对方为何可能${ROLE_LANGUAGE[facts.secondPerspective.tenGod].move}。` },
    { role: "supporting", source: "日干五行", fact: facts.elementRelation.fact, explanation: "五行生克只补充双方作用方向，不判断谁更强或关系好坏。" }
  ];
}

export function buildRelationshipObservationCards(facts: PairInteractionFacts | null, type: RelationshipType): RelationshipObservationCard[] {
  if (!facts) return [];
  const context = RELATION_CONTEXT[type];
  const firstRole = ROLE_LANGUAGE[facts.firstPerspective.tenGod];
  const secondRole = ROLE_LANGUAGE[facts.secondPerspective.tenGod];
  const branch = branchBehavior(facts.branchRelations);
  const branchEvidence: RelationshipEvidence[] = facts.branchRelations.map((relation, index) => ({
    role: index === 0 ? "primary" : "supporting",
    source: "双方日支",
    fact: relation.fact,
    explanation: relation.explanation
  }));

  return [
    {
      id: "connection",
      title: "你们怎样接上话",
      conclusion: `当你们${context}时，你这边可能会${firstRole.move}；对方则可能会${secondRole.move}。`,
      trigger: `当事项还没有形成共同说法，或者两边掌握的信息不同时，这种先后差异会更明显。`,
      strength: `如果先让两种回应都说完，你们可以一边${firstRole.value}，一边${secondRole.value}。`,
      watchout: `如果各自把自己的第一步当成对方也该先做的事，可能一边出现“${firstRole.excess}”，另一边出现“${secondRole.excess}”。`,
      action: `各用一句话说“我现在先关注的是……”，复述对方的关注点后，再选一个共同要解决的问题。`,
      durationMinutes: 10,
      evidence: stemEvidence(facts),
      limitation: facts.boundary
    },
    {
      id: "friction",
      title: "分歧容易从哪里出现",
      conclusion: `${branch.trigger}，${branch.watchout}。`,
      trigger: branch.trigger,
      strength: branch.strength,
      watchout: branch.watchout,
      action: branch.action,
      durationMinutes: 12,
      evidence: [
        ...branchEvidence,
        { role: "supporting", source: "双向日干", fact: `${facts.firstPerspective.fact}；${facts.secondPerspective.fact}`, explanation: "双向十神用于补看双方进入分歧时各自先处理什么，不替代日支关系。" }
      ],
      limitation: facts.boundary
    },
    {
      id: "collaboration",
      title: "怎样把事一起做完",
      conclusion: `当你们${context}时，可以先让你负责${firstRole.contribution}，让对方负责${secondRole.contribution}，再互相确认一次。`,
      trigger: "当任务同时包含信息、决定和执行，而且分工还没有说清时，这种拆法更容易看见作用方向。",
      strength: `两边的第一反应不同，可以分别补进“${firstRole.value}”与“${secondRole.value}”。`,
      watchout: `这不是固定分工；如果长期只让一方承担同一种位置，盘面线索会被误当成现实角色。`,
      action: `把眼前事项写成两个小项：你先认领“${firstRole.contribution}”，对方先认领“${secondRole.contribution}”；五分钟后交换检查。`,
      durationMinutes: 15,
      evidence: [
        ...stemEvidence(facts),
        { role: "supporting", source: "双方日支", fact: facts.branchRelations.map(item => item.fact).join("；"), explanation: "日支关系用于提醒协作过程中的接点或复核位置，不单独指定固定角色。" }
      ],
      limitation: facts.boundary
    }
  ];
}

export function buildRelationshipJointAction(cards: RelationshipObservationCard[]): RelationshipJointAction | null {
  const source = cards.find(card => card.id === "friction");
  if (!source) return null;
  return {
    sourceCardId: source.id,
    title: "你们可以试试",
    action: source.action,
    doneWhen: "双方都说出或写下自己的部分，并共同确认一个下一步。",
    durationMinutes: Math.min(15, source.durationMinutes)
  };
}
