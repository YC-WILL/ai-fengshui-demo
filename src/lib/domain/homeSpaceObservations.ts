export type HomeAreaId = "entry" | "rest" | "kitchen";

export type HomeIssueId =
  | "entry_clutter"
  | "entry_passage_blocked"
  | "entry_dim"
  | "entry_door_collision"
  | "entry_emergency_exit_blocked"
  | "rest_persistent_noise"
  | "rest_night_strong_light"
  | "rest_poor_ventilation"
  | "rest_damp_mold"
  | "rest_bump_passage"
  | "rest_insufficient_privacy"
  | "kitchen_poor_exhaust"
  | "kitchen_workspace_interference"
  | "kitchen_backtracking"
  | "kitchen_heat_hazard"
  | "kitchen_passage_blocked";

export type HomePriorityLevel = 1 | 2 | 3 | 4;

export interface HomeAreaInput {
  reviewed: true;
  issues: HomeIssueId[];
}

export type HomeSpaceInput = Partial<Record<HomeAreaId, HomeAreaInput>>;

export interface HomeSpaceFact {
  id: string;
  source: string;
  area: HomeAreaId;
  areaLabel: string;
  issueId: HomeIssueId;
  issueLabel: string;
  priority: HomePriorityLevel;
  priorityLabel: string;
  reason: string;
}

export interface HomePriorityItem extends HomeSpaceFact {
  title: string;
}

export interface HomeSpaceAction {
  sourceFactId: string;
  sourceArea: HomeAreaId;
  sourceIssueId: HomeIssueId;
  durationMinutes: number;
  text: string;
  doneWhen: string;
  requiresProfessional: boolean;
}

export interface HomeSpaceAssessment {
  status: "insufficient" | "priority" | "clear";
  reviewedAreas: HomeAreaId[];
  missingAreas: HomeAreaId[];
  coverageNote: string;
  facts: HomeSpaceFact[];
  priority: HomePriorityItem | null;
  otherTopPriorityCount: number;
  selectionNote: string | null;
  action: HomeSpaceAction | null;
}

export interface HomeAreaStatus {
  state: "insufficient" | "clear" | "issues";
  label: string;
  issueCount: number;
}

interface HomeIssueDefinition {
  id: HomeIssueId;
  area: HomeAreaId;
  label: string;
  priority: HomePriorityLevel;
  reason: string;
  action: Omit<HomeSpaceAction, "sourceFactId" | "sourceArea" | "sourceIssueId">;
}

export const HOME_PRIORITY_LABELS: Record<HomePriorityLevel, string> = {
  1: "明显安全问题",
  2: "长期居住条件",
  3: "日常功能与动线",
  4: "传统空间观察"
};

export const HOME_AREA_DEFINITIONS: ReadonlyArray<{
  id: HomeAreaId;
  label: string;
  prompt: string;
  issueIds: HomeIssueId[];
}> = [
  {
    id: "entry",
    label: "入户",
    prompt: "从开门到走进主要房间，实际遇到什么？",
    issueIds: [
      "entry_clutter",
      "entry_passage_blocked",
      "entry_dim",
      "entry_door_collision",
      "entry_emergency_exit_blocked"
    ]
  },
  {
    id: "rest",
    label: "主要休息区",
    prompt: "以最常睡觉或休息的位置为准。",
    issueIds: [
      "rest_persistent_noise",
      "rest_night_strong_light",
      "rest_poor_ventilation",
      "rest_damp_mold",
      "rest_bump_passage",
      "rest_insufficient_privacy"
    ]
  },
  {
    id: "kitchen",
    label: "厨房",
    prompt: "按取、洗、切、烹饪的实际过程检查。",
    issueIds: [
      "kitchen_poor_exhaust",
      "kitchen_workspace_interference",
      "kitchen_backtracking",
      "kitchen_heat_hazard",
      "kitchen_passage_blocked"
    ]
  }
];

const ISSUE_DEFINITIONS: HomeIssueDefinition[] = [
  {
    id: "entry_emergency_exit_blocked",
    area: "entry",
    label: "安全出口受阻",
    priority: 1,
    reason: "你填写的安全出口受阻会直接影响紧急情况下的通行，因此先于采光、收纳和普通动线处理。",
    action: {
      durationMinutes: 20,
      text: "先暂停使用受阻的安全出口，不自行拆改；在20分钟内把具体位置和受阻情况告知物业或合格专业人员。",
      doneWhen: "已说明受阻位置，并取得报修记录、工单或明确回复。",
      requiresProfessional: true
    }
  },
  {
    id: "kitchen_heat_hazard",
    area: "kitchen",
    label: "热源附近有风险物品",
    priority: 1,
    reason: "你填写的风险物品靠近热源，属于需要先停止相关使用并交由专业人员确认的明显安全问题。",
    action: {
      durationMinutes: 20,
      text: "暂停使用相邻热源，不自行拆改或处理原因不明的物品；在20分钟内联系物业或合格专业人员说明位置。",
      doneWhen: "相关热源已停止使用，并取得报修记录、工单或明确回复。",
      requiresProfessional: true
    }
  },
  {
    id: "rest_damp_mold",
    area: "rest",
    label: "潮湿或霉味",
    priority: 2,
    reason: "你填写的潮湿或霉味会持续影响休息区的使用条件，先确认范围和来源，再考虑其他布置。",
    action: {
      durationMinutes: 15,
      text: "用15分钟记录潮湿或霉味最明显的位置、范围和出现时段；如果看到渗水，只拍照记录并联系物业或合格专业人员。",
      doneWhen: "已留下位置与范围记录；发现渗水时已发出报修说明。",
      requiresProfessional: false
    }
  },
  {
    id: "rest_poor_ventilation",
    area: "rest",
    label: "通风不足",
    priority: 2,
    reason: "你填写的通风不足发生在主要休息区，属于长期反复使用时更值得先改善的居住条件。",
    action: {
      durationMinutes: 15,
      text: "在条件允许时打开现有门窗形成15分钟对流，并移开直接挡住门窗或风口的轻便物品。",
      doneWhen: "门窗或风口前没有遮挡，并完成一次15分钟的空气流动观察。",
      requiresProfessional: false
    }
  },
  {
    id: "rest_persistent_noise",
    area: "rest",
    label: "持续噪声",
    priority: 2,
    reason: "你填写的持续噪声发生在主要休息区，先找出来源与持续时段，才能判断后续处理应落在哪里。",
    action: {
      durationMinutes: 15,
      text: "用15分钟记录噪声来源、开始时间，以及关窗前后是否有明显变化。",
      doneWhen: "写下一个明确来源、一个出现时段和一次关窗前后对比。",
      requiresProfessional: false
    }
  },
  {
    id: "rest_night_strong_light",
    area: "rest",
    label: "夜间强光",
    priority: 2,
    reason: "你填写的夜间强光直接落在休息区，属于会长期重复出现的居住条件，而不是一次性的摆设问题。",
    action: {
      durationMinutes: 10,
      text: "用10分钟关掉非必要光源并调整现有窗帘或遮挡，从常用休息位置再看一次光线。",
      doneWhen: "躺下或坐下时，视线里不再有一处直射的强光源。",
      requiresProfessional: false
    }
  },
  {
    id: "rest_insufficient_privacy",
    area: "rest",
    label: "隐私不足",
    priority: 2,
    reason: "你填写的隐私不足发生在高频休息位置，先处理持续暴露的视线，比调整装饰更直接。",
    action: {
      durationMinutes: 15,
      text: "从门口和窗外可能看入的方向各观察一次，用现有窗帘、门扇或家具先错开最直接的一条视线。",
      doneWhen: "常用休息位置不再从最明显的入口或窗面被一眼看全。",
      requiresProfessional: false
    }
  },
  {
    id: "kitchen_poor_exhaust",
    area: "kitchen",
    label: "排烟不足",
    priority: 2,
    reason: "你填写的排烟不足会在每次烹饪时重复出现，先确认现有设备和出风路径，再调整操作习惯。",
    action: {
      durationMinutes: 10,
      text: "不用拆机，用10分钟检查现有排烟设备能否正常启动、出风位置是否被遮挡；无法正常排烟时暂停高油烟烹饪并联系维修。",
      doneWhen: "已记录设备能否启动和出风是否受阻；异常时已停止相关使用并发出维修说明。",
      requiresProfessional: false
    }
  },
  {
    id: "entry_passage_blocked",
    area: "entry",
    label: "通道受阻",
    priority: 3,
    reason: "你填写的入户通道受阻会在每天进出时反复出现，先把常走路线恢复顺畅，比调整装饰更直接。",
    action: {
      durationMinutes: 20,
      text: "用20分钟清空入户到主要房间之间的通道，把临时堆放物移到不占通行的位置。",
      doneWhen: "两个人能够不侧身、不跨越物品通过。",
      requiresProfessional: false
    }
  },
  {
    id: "kitchen_passage_blocked",
    area: "kitchen",
    label: "通道受阻",
    priority: 3,
    reason: "你填写的厨房通道受阻会影响拿取和转身，先恢复通行，再讨论台面与收纳安排。",
    action: {
      durationMinutes: 20,
      text: "用20分钟移开厨房通道中的临时物品，只保留正在使用的操作用品。",
      doneWhen: "从入口到水槽和灶台的路线可以正常转身，不需要跨越物品。",
      requiresProfessional: false
    }
  },
  {
    id: "rest_bump_passage",
    area: "rest",
    label: "通道容易磕碰",
    priority: 3,
    reason: "你填写的磕碰发生在休息区常走路线，先处理突出和绊脚位置，可以直接减少日常绕行。",
    action: {
      durationMinutes: 20,
      text: "沿床边或常走路线走一遍，用20分钟移开轻便的突出物和地面障碍。",
      doneWhen: "从入口走到主要休息位置时，不需要侧身，也不会碰到突出物。",
      requiresProfessional: false
    }
  },
  {
    id: "entry_door_collision",
    area: "entry",
    label: "门扇容易碰撞",
    priority: 3,
    reason: "你填写的门扇碰撞会反复打断进出动作，需要先确认具体冲突位置和开启顺序。",
    action: {
      durationMinutes: 10,
      text: "用10分钟分别开合相关门扇三次，记下发生碰撞的开启顺序，并先约定一次只开一扇。",
      doneWhen: "已经确认碰撞发生在哪个顺序，并能连续开合三次不再相撞。",
      requiresProfessional: false
    }
  },
  {
    id: "kitchen_workspace_interference",
    area: "kitchen",
    label: "操作区互相妨碍",
    priority: 3,
    reason: "你填写的操作区互相妨碍会让洗、切、烹饪同时挤在一起，先腾出一段连续操作面更容易完成一餐。",
    action: {
      durationMinutes: 20,
      text: "用20分钟清出一段只用于备菜的台面，把不属于本次操作的物品移出台面。",
      doneWhen: "台面能完整放下一块砧板和一份待处理食材，旁边不与其他操作重叠。",
      requiresProfessional: false
    }
  },
  {
    id: "kitchen_backtracking",
    area: "kitchen",
    label: "来回折返",
    priority: 3,
    reason: "你填写的来回折返说明高频用品与操作顺序没有对上，先调整一条最常用路线即可观察变化。",
    action: {
      durationMinutes: 20,
      text: "按取、洗、切、烹饪走一遍，把本周最常用的三件用品移到对应步骤附近。",
      doneWhen: "再走一次完整流程时，不需要为了这三件用品回头取用。",
      requiresProfessional: false
    }
  },
  {
    id: "entry_clutter",
    area: "entry",
    label: "容易堆物",
    priority: 3,
    reason: "你填写的入户堆物会占用每天进出时最先经过的位置，先恢复一块可落脚、可放下随身物的区域。",
    action: {
      durationMinutes: 20,
      text: "用20分钟只整理入户地面和最常落物的一小块表面，把不属于这里的物品移回原处。",
      doneWhen: "地面没有临时堆物，并留出一块能放下当天随身物品的空面。",
      requiresProfessional: false
    }
  },
  {
    id: "entry_dim",
    area: "entry",
    label: "入户昏暗",
    priority: 3,
    reason: "你填写的入户昏暗会影响开门、换鞋和辨认物品，先检查现有光源与遮挡情况。",
    action: {
      durationMinutes: 10,
      text: "用10分钟确认现有灯具能否正常开启，并移开遮住灯具或自然光的轻便物品；不要自行拆改电路。",
      doneWhen: "进门后能够清楚看见门锁、地面和换鞋位置；灯具异常时已联系合格专业人员。",
      requiresProfessional: false
    }
  }
];

const AREA_LABELS = Object.fromEntries(HOME_AREA_DEFINITIONS.map(area => [area.id, area.label])) as Record<HomeAreaId, string>;
const ISSUE_BY_ID = new Map(ISSUE_DEFINITIONS.map(issue => [issue.id, issue]));
const PAGE_ISSUE_ORDER = new Map(
  HOME_AREA_DEFINITIONS.flatMap(area => area.issueIds).map((issueId, index) => [issueId, index])
);

export function getHomeIssueDefinition(issueId: HomeIssueId) {
  return ISSUE_BY_ID.get(issueId);
}

export function getHomeAreaStatus(input: HomeSpaceInput, area: HomeAreaId): HomeAreaStatus {
  const areaInput = input[area];
  if (!areaInput?.reviewed) {
    return { state: "insufficient", label: "资料不足", issueCount: 0 };
  }
  if (areaInput.issues.length === 0) {
    return { state: "clear", label: "已检查正常", issueCount: 0 };
  }
  return {
    state: "issues",
    label: `发现${areaInput.issues.length}项`,
    issueCount: areaInput.issues.length
  };
}

export function buildHomeSpaceAssessment(input: HomeSpaceInput): HomeSpaceAssessment {
  const reviewedAreas = HOME_AREA_DEFINITIONS
    .map(area => area.id)
    .filter(area => input[area]?.reviewed === true);
  const missingAreas = HOME_AREA_DEFINITIONS
    .map(area => area.id)
    .filter(area => !reviewedAreas.includes(area));

  if (reviewedAreas.length === 0) {
    return {
      status: "insufficient",
      reviewedAreas,
      missingAreas,
      coverageNote: "三处都还没有填写，暂时没有依据判断先处理哪里。",
      facts: [],
      priority: null,
      otherTopPriorityCount: 0,
      selectionNote: null,
      action: null
    };
  }

  const facts = reviewedAreas.flatMap(area => {
    const issues = input[area]?.issues ?? [];
    return issues.flatMap(issueId => {
      const definition = ISSUE_BY_ID.get(issueId);
      if (!definition || definition.area !== area) return [];
      return [{
        id: `${area}:${issueId}`,
        source: `用户填写 · ${AREA_LABELS[area]} · ${definition.label}`,
        area,
        areaLabel: AREA_LABELS[area],
        issueId,
        issueLabel: definition.label,
        priority: definition.priority,
        priorityLabel: HOME_PRIORITY_LABELS[definition.priority],
        reason: definition.reason
      }];
    });
  }).sort((first, second) => (
    first.priority - second.priority
    || (PAGE_ISSUE_ORDER.get(first.issueId) ?? 999) - (PAGE_ISSUE_ORDER.get(second.issueId) ?? 999)
  ));

  const missingLabels = missingAreas.map(area => AREA_LABELS[area]);
  const coverageNote = missingAreas.length
    ? `已根据${reviewedAreas.map(area => AREA_LABELS[area]).join("、")}判断；${missingLabels.join("、")}资料不足，未参与本次排序。`
    : "入户、主要休息区和厨房均已填写，本次排序只使用这些现实情况。";

  if (facts.length === 0) {
    return {
      status: "clear",
      reviewedAreas,
      missingAreas,
      coverageNote,
      facts,
      priority: null,
      otherTopPriorityCount: 0,
      selectionNote: null,
      action: null
    };
  }

  const first = facts[0];
  const otherTopPriorityCount = facts.filter(fact => fact.priority === first.priority).length - 1;
  const definition = ISSUE_BY_ID.get(first.issueId)!;
  const priority: HomePriorityItem = {
    ...first,
    title: `先处理${first.areaLabel}的“${first.issueLabel}”`
  };

  return {
    status: "priority",
    reviewedAreas,
    missingAreas,
    coverageNote,
    facts,
    priority,
    otherTopPriorityCount,
    selectionNote: otherTopPriorityCount > 0
      ? `另有${otherTopPriorityCount}项同级问题，本次按检查顺序先展示这一项；其他已填写问题没有被忽略。`
      : null,
    action: {
      sourceFactId: first.id,
      sourceArea: first.area,
      sourceIssueId: first.issueId,
      ...definition.action
    }
  };
}
