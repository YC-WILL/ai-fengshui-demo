import {
  RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION,
  type RelationshipImageryInteractionInputSelection
} from "./relationshipImageryInteractionInput";

export const RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE_VERSION =
  "relationship-imagery-season-control-sample-v2" as const;

export interface RelationshipImagerySeasonControlSampleEntry {
  id: string;
  relationshipTypeId: "cooperation";
  relationshipContextLabel: "工作";
  controlDesign: {
    baselineSelectionKeys: ["丙-午", "癸-子"];
    controlSelectionKeys: ["丙-子", "癸-午"];
    heldConstant: {
      personADayStem: "丙";
      personBDayStem: "癸";
      personADayStemFamily: "日光";
      personBDayStemFamily: "雨露细流";
      elementRelation: "b_controls_a";
      yinYangRelation: "different";
      personATenGod: "正官";
      personBTenGod: "正财";
    };
    changedVariable: "month_branch_season_and_approved_core_imagery";
    personAMonthBranchSeason: "仲冬";
    personBMonthBranchSeason: "盛夏";
  };
  sections: {
    commonality: string;
    difference: string;
    interactionState: string;
  };
  reviewStatus: "human_reviewed_approved";
  contentKind: "modern_relationship_season_control";
  contentVersion: typeof RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE_VERSION;
}

const PRIVATE_SEASON_CONTROL_DRAFT: RelationshipImagerySeasonControlSampleEntry = {
  id: "relationship-imagery-season-control:cooperation:丙-子:癸-午:v2",
  relationshipTypeId: "cooperation",
  relationshipContextLabel: "工作",
  controlDesign: {
    baselineSelectionKeys: ["丙-午", "癸-子"],
    controlSelectionKeys: ["丙-子", "癸-午"],
    heldConstant: {
      personADayStem: "丙",
      personBDayStem: "癸",
      personADayStemFamily: "日光",
      personBDayStemFamily: "雨露细流",
      elementRelation: "b_controls_a",
      yinYangRelation: "different",
      personATenGod: "正官",
      personBTenGod: "正财"
    },
    changedVariable: "month_branch_season_and_approved_core_imagery",
    personAMonthBranchSeason: "仲冬",
    personBMonthBranchSeason: "盛夏"
  },
  sections: {
    commonality:
      "共事协作时，仲冬柔光与盛夏雨云，都擅长在波动多变的工作环境里锚定出清晰可落地的处理重心。\n\n你会在客观条件受限的范围之内，把核心方向与关键要点稳定呈现出来；对方会面对堆叠上来的任务与上升的压力，筛选梳理信息，分辨事情的轻重层级。你们二者都不会急于一次性铺开全部工作内容，优先把当下真正需要处理的部分梳理显露出来，避免事务陷入混沌无序。",
    difference:
      "属于仲冬柔光的你，会依托既有的规则与边界开展工作，在既定秩序之中维持持续、温和的输出，让核心方向平稳、持续地被团队看见。\n\n属于盛夏雨云的对方，对环境压力、事务密度的变化十分敏感，习惯先把四散繁杂的事项收拢归集，梳理出层级之后，再去确认处理的先后顺序。\n\n你切入事务的起点，是守住边界、稳住既有方向；对方切入事务的起点，是整合纷繁信息、拆解事务优先级。面对同样的工作变局，你们启动处理的优先环节各不相同。",
    interactionState:
      "当工作边界划分清晰，团队内部对任务优先级已经达成共识，你持续输出的稳定重点，和对方梳理收拢后的信息，可以对齐到同一条工作推进线上，让双方围绕相同的任务重点继续推进。\n\n一旦任务突然大量涌入，优先级还没有梳理成型，节奏错位就会显现：你会优先守住现有的方向与输出尺度，不轻易打乱既定表达；对方则会先着手整理扎堆涌来的各类事项，厘清次序之后，再确定后续行动的落点。\n\n这一组的互动，更像稳定柔光输出与密集事务中信息聚拢两种节奏之间的互相牵动。彼此会在守住方向与重新排序之间不断校准，不存在谁主导谁，只是两套处事逻辑的自然碰撞。"
  },
  reviewStatus: "human_reviewed_approved",
  contentKind: "modern_relationship_season_control",
  contentVersion: RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE_VERSION
};

export const RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE = {
  ...PRIVATE_SEASON_CONTROL_DRAFT,
  controlDesign: {
    ...PRIVATE_SEASON_CONTROL_DRAFT.controlDesign,
    baselineSelectionKeys: [
      ...PRIVATE_SEASON_CONTROL_DRAFT.controlDesign.baselineSelectionKeys
    ],
    controlSelectionKeys: [
      ...PRIVATE_SEASON_CONTROL_DRAFT.controlDesign.controlSelectionKeys
    ],
    heldConstant: {
      ...PRIVATE_SEASON_CONTROL_DRAFT.controlDesign.heldConstant
    }
  },
  sections: { ...PRIVATE_SEASON_CONTROL_DRAFT.sections }
} satisfies RelationshipImagerySeasonControlSampleEntry;

function inputMatchesControlDesign(
  input: Extract<RelationshipImageryInteractionInputSelection, { status: "available" }>
): boolean {
  const [personA, personB] = input.modernImageryMetadata.participants;
  const element = input.professionalRelationshipFacts.dayMasterElementRelation;
  const yinYang = input.professionalRelationshipFacts.dayMasterYinYangRelation;
  const [personATenGod, personBTenGod] =
    input.professionalRelationshipFacts.directionalDayStemTenGods;
  const design = PRIVATE_SEASON_CONTROL_DRAFT.controlDesign;
  return (
    input.contractVersion === RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION
    && input.relationshipContext.relationshipTypeId === "cooperation"
    && input.relationshipContext.label === "工作"
    && input.coreImagery.participants[0].selectionKey ===
      design.controlSelectionKeys[0]
    && input.coreImagery.participants[1].selectionKey ===
      design.controlSelectionKeys[1]
    && personA.selectionKey === design.controlSelectionKeys[0]
    && personA.dayStemFamily.dayStem === design.heldConstant.personADayStem
    && personA.dayStemFamily.value === design.heldConstant.personADayStemFamily
    && personA.monthBranchSeason.value === design.personAMonthBranchSeason
    && personB.selectionKey === design.controlSelectionKeys[1]
    && personB.dayStemFamily.dayStem === design.heldConstant.personBDayStem
    && personB.dayStemFamily.value === design.heldConstant.personBDayStemFamily
    && personB.monthBranchSeason.value === design.personBMonthBranchSeason
    && element.certainty === "confirmed"
    && element.value.personAElement === "火"
    && element.value.personBElement === "水"
    && element.value.relation === design.heldConstant.elementRelation
    && yinYang.certainty === "confirmed"
    && yinYang.value.personA === "阳"
    && yinYang.value.personB === "阴"
    && yinYang.value.relation === design.heldConstant.yinYangRelation
    && personATenGod.certainty === "confirmed"
    && personATenGod.value.perspective === "personA"
    && personATenGod.value.referenceDayMaster === design.heldConstant.personADayStem
    && personATenGod.value.observedStem === design.heldConstant.personBDayStem
    && personATenGod.value.tenGod === design.heldConstant.personATenGod
    && personBTenGod.certainty === "confirmed"
    && personBTenGod.value.perspective === "personB"
    && personBTenGod.value.referenceDayMaster === design.heldConstant.personBDayStem
    && personBTenGod.value.observedStem === design.heldConstant.personADayStem
    && personBTenGod.value.tenGod === design.heldConstant.personBTenGod
  );
}

function publicDraftMatchesPrivate(): boolean {
  return (
    RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.id === PRIVATE_SEASON_CONTROL_DRAFT.id
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.relationshipTypeId ===
      PRIVATE_SEASON_CONTROL_DRAFT.relationshipTypeId
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.relationshipContextLabel ===
      PRIVATE_SEASON_CONTROL_DRAFT.relationshipContextLabel
    && JSON.stringify(RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.controlDesign) ===
      JSON.stringify(PRIVATE_SEASON_CONTROL_DRAFT.controlDesign)
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections.commonality ===
      PRIVATE_SEASON_CONTROL_DRAFT.sections.commonality
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections.difference ===
      PRIVATE_SEASON_CONTROL_DRAFT.sections.difference
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.sections.interactionState ===
      PRIVATE_SEASON_CONTROL_DRAFT.sections.interactionState
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.reviewStatus ===
      PRIVATE_SEASON_CONTROL_DRAFT.reviewStatus
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.contentKind ===
      PRIVATE_SEASON_CONTROL_DRAFT.contentKind
    && RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE.contentVersion ===
      PRIVATE_SEASON_CONTROL_DRAFT.contentVersion
  );
}

export type RelationshipImagerySeasonControlSampleSelection =
  | { status: "available"; entry: RelationshipImagerySeasonControlSampleEntry }
  | { status: "not_available"; reason: "input_unavailable" };

export function selectRelationshipImagerySeasonControlSample(
  input: RelationshipImageryInteractionInputSelection
): RelationshipImagerySeasonControlSampleSelection {
  if (
    input.status !== "available"
    || !inputMatchesControlDesign(input)
    || !publicDraftMatchesPrivate()
  ) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  return {
    status: "available",
    entry: RELATIONSHIP_IMAGERY_SEASON_CONTROL_SAMPLE
  };
}
