import {
  RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION,
  RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION,
  RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES,
  type RelationshipImageryInteractionInputSelection
} from "./relationshipImageryInteractionInput";

export const RELATIONSHIP_IMAGERY_INTERACTION_SAMPLE_VERSION =
  "relationship-imagery-interaction-sample-v2" as const;

type SampleRelationshipType = "partner" | "cooperation" | "family" | "friend";

export interface RelationshipImageryInteractionNarrativeSampleEntry {
  id: string;
  relationshipTypeId: SampleRelationshipType;
  relationshipContextLabel: "情感" | "工作" | "家人" | "朋友";
  personASelectionKey: "甲-辰";
  personBSelectionKey: "癸-未";
  sections: {
    commonality: string;
    difference: string;
    interactionState: string;
  };
  reviewStatus: "human_reviewed_approved";
  contentKind: "modern_relationship_interpretation";
  contentVersion: typeof RELATIONSHIP_IMAGERY_INTERACTION_SAMPLE_VERSION;
}

function approvedNarrative(
  value: Omit<
    RelationshipImageryInteractionNarrativeSampleEntry,
    "reviewStatus" | "contentKind" | "contentVersion"
  >
): RelationshipImageryInteractionNarrativeSampleEntry {
  return {
    ...value,
    reviewStatus: "human_reviewed_approved",
    contentKind: "modern_relationship_interpretation",
    contentVersion: RELATIONSHIP_IMAGERY_INTERACTION_SAMPLE_VERSION
  };
}

const APPROVED_RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLES = {
  partner: approvedNarrative({
    id: "relationship-imagery-interaction-sample:partner:甲-辰:癸-未:v2",
    relationshipTypeId: "partner",
    relationshipContextLabel: "情感",
    personASelectionKey: "甲-辰",
    personBSelectionKey: "癸-未",
    sections: {
      commonality:
        "恋爱相处当中，春末乔木与夏末清露，都不满足于浮于表面的短暂好感。\n\n你会把细碎的相处片段、彼此的需求慢慢收拢，梳理出两个人关系的主线；对方会依托相处里真实发生的点滴，一点点消化、建立属于自己对这段感情的认知。你们二人都看重长久陪伴，希望感情可以一步步生长出清晰、可感知的相处模样，而非只依靠一时的情绪冲动。",
      difference:
        "属于乔木的你，视角偏向向外舒展。面对感情，你习惯先看清两个人关系的大方向，再把生活里大大小小的矛盾、细碎的日常，串联到这条主线之上。\n\n属于清露的对方，视角偏向向内沉淀。不会急于下定论，会顺着已经发生过的相处细节反复感受确认，把一次次的体验慢慢内化，形成自己对亲密关系的判断。\n\n你们走向彼此的路径本就不一样：你是先搭建整体的图景，再填充细节；对方是接住每一段真实经历，慢慢拼凑出完整认知。",
      interactionState:
        "如果两个人对感情的走向达成共识，你的统筹串联，和对方慢慢沉淀感受的节奏，可以很好地并行。你在往前规划两个人的相处，对方在同步消化感受这份亲密。\n\n可处在关系摇摆、变化动荡的阶段，就会出现节奏差：你会主动把纷乱的情绪、矛盾的事件梳理整合，试图看清关系的全貌；而对方不会立刻跟上新的变化，会依旧基于已经发生过的过往，一点点消化确认现状。\n\n这段关系里不存在谁主导谁、谁带着谁往前走，只是向外舒展、向内沉淀两种不同的节奏，不断相遇、磨合。"
    }
  }),
  cooperation: approvedNarrative({
    id: "relationship-imagery-interaction-sample:cooperation:甲-辰:癸-未:v2",
    relationshipTypeId: "cooperation",
    relationshipContextLabel: "工作",
    personASelectionKey: "甲-辰",
    personBSelectionKey: "癸-未",
    sections: {
      commonality:
        "共事协作时，春末乔木与夏末清露，都追求工作可以落地，拒绝悬浮空想。\n\n你擅长把分散的资源、信息收拢对齐到共同目标；对方习惯依托现成的规则、过往经验梳理出可执行的步骤。你们都希望零散的任务、碎片化信息，最终可以搭建出一套稳定可持续的做事框架，把项目实实在在推进下去。",
      difference:
        "乔木特质的你，优先看见全局骨架。会先判断整体目标，再统筹多条支线，把人力、信息、外部条件相互打通，更擅长向外拓展、串联各方资源。\n\n清露特质的对方，优先看重承接的基础。会立足现有的制度、流程与参考经验，一步步验证、吸收信息，再沉淀成可落地的操作方式。\n\n简单来说，你思考的是整件事该如何铺开；对方思考的是内容如何稳妥装进现有的体系当中。",
      interactionState:
        "当项目目标清晰、现有流程足以支撑业务推进，你的全局资源统筹，搭配对方严谨的步骤沉淀，可以形成很好的配合，一同把任务落地。\n\n但如果业务方向频繁调整，旧流程已经跟不上新目标，节奏落差就会显现：你已经开始对接新资源、开拓新的工作支线；对方还需要时间，来适应新的参照标准，确认新的做事落点。\n\n你们的协作，就是整体开拓与循序承接两种节奏互相适配的过程。"
    }
  }),
  family: approvedNarrative({
    id: "relationship-imagery-interaction-sample:family:甲-辰:癸-未:v2",
    relationshipTypeId: "family",
    relationshipContextLabel: "家人",
    personASelectionKey: "甲-辰",
    personBSelectionKey: "癸-未",
    sections: {
      commonality:
        "面对家庭日常，春末乔木与夏末清露，都期盼家庭生活拥有安稳的秩序。\n\n你会关注家里大大小小的事务，思考如何把各方诉求收拢到统一的家庭方向；对方会在日复一日的烟火日常里，慢慢接纳、消化家庭当中的种种经历。你们都看重长久积累下来的亲情羁绊，不会单凭某一件突发小事就评判整个家庭。",
      difference:
        "乔木的你，习惯站在整体视角看待家庭。会把家庭成员各自的诉求、家里的琐事、资源统筹在一起，试图找到可以兼顾多方的处理思路。\n\n清露的对方，更扎根在日复一日的现实生活。顺着长久以来熟悉的家庭相处模式，一件一件事情去感受确认，在反复的日常当中建立自己对家庭的理解。\n\n你是透过家庭整体结构看待生活；对方是在一桩桩具体家事里感受家庭秩序。",
      interactionState:
        "当家庭目标统一，大事方向明确，你的统筹规划，和对方循序渐进接纳磨合的状态，能够互不冲突，一同维系家庭运转。\n\n若是家庭还没有形成统一共识，很多事情悬而未决，节奏差就会出现：你会主动出面，尝试把各方分散诉求整合起来；对方会更倾向守在自己熟悉的范围内，只确认已经看得见、摸得着的现实部分。\n\n一边向外铺展统筹全局，一边顺着熟悉边界向内沉淀，两种节奏共同构成家庭里的相处模式。"
    }
  }),
  friend: approvedNarrative({
    id: "relationship-imagery-interaction-sample:friend:甲-辰:癸-未:v2",
    relationshipTypeId: "friend",
    relationshipContextLabel: "朋友",
    personASelectionKey: "甲-辰",
    personBSelectionKey: "癸-未",
    sections: {
      commonality:
        "友情往来之间，春末乔木与夏末清露，都不满足于浅层的闲聊寒暄。\n\n你乐于把不同见闻、不同视角串联起来；对方会把交流得到的信息，慢慢内化为自己的感悟。你们都希望彼此的交往不止是碎片化的碎片对话，聊天的内容可以沉淀下来，成为往后继续相处的线索。",
      difference:
        "乔木的你偏向向外拓展。可以从几段不同经历当中提炼共通的逻辑，把各式各样想法见闻，放进更宏大的视角里看待，擅长拓宽对话的广度。\n\n清露的对方偏向向内消化。会依托自己固有的认知，慢慢消化每一次聊天收获的内容，让每一份见闻找到属于自己的安放位置，侧重把接收来的信息沉淀内化。\n\n你更偏向拓宽交流的边界，对方更偏向沉淀交流带来的感悟。",
      interactionState:
        "当你们聊天话题契合，关注点趋同，你的发散联想，和对方慢慢消化感悟的节奏，就会围绕同一个话题共振，聊得十分同频。\n\n但如果话题跳转很快，短时间涌入大量新信息，节奏差就会显现：你已经顺着新思路，开启新的话题支线；对方会先停下来，把刚刚接收的内容梳理消化完毕，再继续跟进。\n\n你们的友谊，就是不断拓宽视野与向内沉淀感悟两种节奏的交织。"
    }
  })
} as const satisfies Record<
  SampleRelationshipType,
  RelationshipImageryInteractionNarrativeSampleEntry
>;

function copyApprovedNarrative(
  entry: RelationshipImageryInteractionNarrativeSampleEntry
): RelationshipImageryInteractionNarrativeSampleEntry {
  return {
    ...entry,
    sections: { ...entry.sections }
  };
}

export const RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG = {
  partner: copyApprovedNarrative(
    APPROVED_RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLES.partner
  ),
  cooperation: copyApprovedNarrative(
    APPROVED_RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLES.cooperation
  ),
  family: copyApprovedNarrative(
    APPROVED_RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLES.family
  ),
  friend: copyApprovedNarrative(
    APPROVED_RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLES.friend
  )
} as const satisfies Record<
  SampleRelationshipType,
  RelationshipImageryInteractionNarrativeSampleEntry
>;

export type RelationshipImageryInteractionNarrativeSampleSelection =
  | {
      status: "available";
      entry: RelationshipImageryInteractionNarrativeSampleEntry;
    }
  | { status: "not_available"; reason: "input_unavailable" };

function entryMatchesApprovedNarrative(
  entry: RelationshipImageryInteractionNarrativeSampleEntry,
  approved: RelationshipImageryInteractionNarrativeSampleEntry
): boolean {
  return (
    entry.id === approved.id
    && entry.relationshipTypeId === approved.relationshipTypeId
    && entry.relationshipContextLabel === approved.relationshipContextLabel
    && entry.personASelectionKey === approved.personASelectionKey
    && entry.personBSelectionKey === approved.personBSelectionKey
    && entry.sections.commonality === approved.sections.commonality
    && entry.sections.difference === approved.sections.difference
    && entry.sections.interactionState === approved.sections.interactionState
    && entry.reviewStatus === approved.reviewStatus
    && entry.contentKind === approved.contentKind
    && entry.contentVersion === approved.contentVersion
  );
}

function inputMatchesSampleFacts(
  input: Extract<RelationshipImageryInteractionInputSelection, { status: "available" }>
): boolean {
  const [personA, personB] = input.coreImagery.participants;
  const [personAMetadata, personBMetadata] =
    input.modernImageryMetadata.participants;
  const element = input.professionalRelationshipFacts.dayMasterElementRelation;
  const yinYang = input.professionalRelationshipFacts.dayMasterYinYangRelation;
  const [personATenGod, personBTenGod] =
    input.professionalRelationshipFacts.directionalDayStemTenGods;
  return (
    input.contractVersion === RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION
    && personA.id === "personA"
    && personA.label === "你"
    && personA.selectionKey === "甲-辰"
    && personB.id === "personB"
    && personB.label === "对方"
    && personB.selectionKey === "癸-未"
    && input.modernImageryMetadata.kind === "modern_product_metadata"
    && input.modernImageryMetadata.version ===
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
    && personAMetadata.selectionKey === "甲-辰"
    && personAMetadata.dayStemFamily.value === "乔木"
    && personAMetadata.dayStemFamily.sourceRuleId ===
      RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.dayStemFamily
    && personAMetadata.dayStemFamily.version ===
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
    && personAMetadata.monthBranchSeason.value === "春末"
    && personAMetadata.monthBranchSeason.sourceRuleId ===
      RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.monthBranchSeason
    && personAMetadata.monthBranchSeason.version ===
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
    && personBMetadata.selectionKey === "癸-未"
    && personBMetadata.dayStemFamily.value === "雨露细流"
    && personBMetadata.dayStemFamily.sourceRuleId ===
      RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.dayStemFamily
    && personBMetadata.dayStemFamily.version ===
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
    && personBMetadata.monthBranchSeason.value === "夏末"
    && personBMetadata.monthBranchSeason.sourceRuleId ===
      RELATIONSHIP_IMAGERY_STRUCTURE_SOURCE_RULES.monthBranchSeason
    && personBMetadata.monthBranchSeason.version ===
      RELATIONSHIP_IMAGERY_STRUCTURE_METADATA_VERSION
    && input.professionalRelationshipFacts.kind === "traditional_computed_facts"
    && element.certainty === "confirmed"
    && element.value.personAElement === "木"
    && element.value.personBElement === "水"
    && element.value.relation === "b_generates_a"
    && yinYang.certainty === "confirmed"
    && yinYang.value.personA === "阳"
    && yinYang.value.personB === "阴"
    && yinYang.value.relation === "different"
    && personATenGod.certainty === "confirmed"
    && personATenGod.value.perspective === "personA"
    && personATenGod.value.referenceDayMaster === "甲"
    && personATenGod.value.observedStem === "癸"
    && personATenGod.value.tenGod === "正印"
    && personBTenGod.certainty === "confirmed"
    && personBTenGod.value.perspective === "personB"
    && personBTenGod.value.referenceDayMaster === "癸"
    && personBTenGod.value.observedStem === "甲"
    && personBTenGod.value.tenGod === "伤官"
  );
}

export function selectRelationshipImageryInteractionNarrativeSample(
  input: RelationshipImageryInteractionInputSelection
): RelationshipImageryInteractionNarrativeSampleSelection {
  if (input.status !== "available" || !inputMatchesSampleFacts(input)) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  const entry =
    RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG[
      input.relationshipContext.relationshipTypeId as SampleRelationshipType
    ];
  const approved =
    APPROVED_RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLES[
      input.relationshipContext.relationshipTypeId as SampleRelationshipType
    ];
  if (
    !entry
    || !approved
    || input.relationshipContext.label !== approved.relationshipContextLabel
    || !entryMatchesApprovedNarrative(entry, approved)
  ) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  return { status: "available", entry };
}
