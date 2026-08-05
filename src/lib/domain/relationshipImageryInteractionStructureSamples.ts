import {
  RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION,
  type RelationshipImageryInteractionInputSelection
} from "./relationshipImageryInteractionInput";

export const RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_VERSION =
  "relationship-imagery-structure-validation-sample-v2" as const;

type ValidationSampleId =
  | "water_controls_fire"
  | "earth_generates_metal"
  | "fire_controls_metal";

interface ParticipantBinding {
  selectionKey: string;
  dayStemFamily: string;
  monthBranchSeason: string;
}

interface DirectionalTenGodBinding {
  perspective: "personA" | "personB";
  referenceDayMaster: string;
  observedStem: string;
  tenGod: string;
}

export interface RelationshipImageryStructureValidationSampleEntry {
  id: string;
  validationSampleId: ValidationSampleId;
  relationshipTypeId: "cooperation";
  relationshipContextLabel: "工作";
  inputBinding: {
    modernImageryMetadata: {
      personA: ParticipantBinding;
      personB: ParticipantBinding;
    };
    traditionalProfessionalFacts: {
      dayMasterElementRelation: {
        personAElement: string;
        personBElement: string;
        relation: string;
      };
      dayMasterYinYangRelation: {
        personA: string;
        personB: string;
        relation: "same" | "different";
      };
      directionalDayStemTenGods: [
        DirectionalTenGodBinding,
        DirectionalTenGodBinding
      ];
    };
  };
  sections: {
    commonality: string;
    difference: string;
    interactionState: string;
  };
  reviewStatus: "human_reviewed_approved";
  contentKind: "modern_relationship_structure_validation";
  contentVersion: typeof RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_VERSION;
}

function approvedNarrative(
  value: Omit<
    RelationshipImageryStructureValidationSampleEntry,
    "reviewStatus" | "contentKind" | "contentVersion"
  >
): RelationshipImageryStructureValidationSampleEntry {
  return {
    ...value,
    reviewStatus: "human_reviewed_approved",
    contentKind: "modern_relationship_structure_validation",
    contentVersion: RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_VERSION
  };
}

const PRIVATE_STRUCTURE_VALIDATION_SAMPLES = {
  water_controls_fire: approvedNarrative({
    id: "relationship-imagery-structure-validation:cooperation:丙-午:癸-子:v2",
    validationSampleId: "water_controls_fire",
    relationshipTypeId: "cooperation",
    relationshipContextLabel: "工作",
    inputBinding: {
      modernImageryMetadata: {
        personA: {
          selectionKey: "丙-午",
          dayStemFamily: "日光",
          monthBranchSeason: "盛夏"
        },
        personB: {
          selectionKey: "癸-子",
          dayStemFamily: "雨露细流",
          monthBranchSeason: "仲冬"
        }
      },
      traditionalProfessionalFacts: {
        dayMasterElementRelation: {
          personAElement: "火",
          personBElement: "水",
          relation: "b_controls_a"
        },
        dayMasterYinYangRelation: {
          personA: "阳",
          personB: "阴",
          relation: "different"
        },
        directionalDayStemTenGods: [
          {
            perspective: "personA",
            referenceDayMaster: "丙",
            observedStem: "癸",
            tenGod: "正官"
          },
          {
            perspective: "personB",
            referenceDayMaster: "癸",
            observedStem: "丙",
            tenGod: "正财"
          }
        ]
      }
    },
    sections: {
      commonality:
        "在一起共事协作，盛夏日光与仲冬清流，都不愿让信息长期处于模糊悬置的状态。\n\n你习惯把目标、进度、现场的实际状况直接摊开，让所有人看得见当下走到哪一步；对方习惯接收现实反馈，一步步核对现状再往下走。你们双方都不愿让问题藏在迷雾里，都希望把事情梳理得清晰可感知。",
      difference:
        "拥有日光特质的你，偏向向外展开。会优先把方向、核心重点摆到明面上，带着事务向前推进，行动感更强。\n\n拥有清流特质的对方，偏向向内收拢。会先留意现存的规则、边界与现实反馈，把现实条件核对妥当，再决定下一步如何承接。\n\n你是先把目标状态呈现出来再往前走；对方是先确认现实条件再往前走。面对同一场变化，你们优先关注的环节天然不一样。",
      interactionState:
        "当项目目标明确，反馈渠道通畅及时，你的明朗推进，和对方审慎核对确认，可以互相参照，共同服务同一件工作。\n\n一旦方向突然改动、评判标准还没有稳定下来，节奏差就会显现：你会先把新的局面、新的状态摆上台面；对方会优先去核对边界、确认现实落点是否成立。\n\n这是外向推进和内向校准两种节奏的相遇，差异会直接显现在协作过程当中，不存在谁压制谁，只是两套行事逻辑互相碰撞磨合。"
    }
  }),
  earth_generates_metal: approvedNarrative({
    id: "relationship-imagery-structure-validation:cooperation:戊-辰:庚-申:v2",
    validationSampleId: "earth_generates_metal",
    relationshipTypeId: "cooperation",
    relationshipContextLabel: "工作",
    inputBinding: {
      modernImageryMetadata: {
        personA: {
          selectionKey: "戊-辰",
          dayStemFamily: "山地",
          monthBranchSeason: "春末"
        },
        personB: {
          selectionKey: "庚-申",
          dayStemFamily: "原铁器具",
          monthBranchSeason: "初秋"
        }
      },
      traditionalProfessionalFacts: {
        dayMasterElementRelation: {
          personAElement: "土",
          personBElement: "金",
          relation: "a_generates_b"
        },
        dayMasterYinYangRelation: {
          personA: "阳",
          personB: "阳",
          relation: "same"
        },
        directionalDayStemTenGods: [
          {
            perspective: "personA",
            referenceDayMaster: "戊",
            observedStem: "庚",
            tenGod: "食神"
          },
          {
            perspective: "personB",
            referenceDayMaster: "庚",
            observedStem: "戊",
            tenGod: "偏印"
          }
        ]
      }
    },
    sections: {
      commonality:
        "共事协作时，春末山地与初秋原铁，都看重事务要有实在的依据、清晰完整的形态。\n\n你在意整体的底层承载，这片“山地”能不能托住多项任务并行；对方在意产出物本身，结构轮廓是否完整牢靠。你们都倾向把问题摊开到台面上处理，不靠模糊的默契去硬扛工作进度。",
      difference:
        "山地特质的你，思考起点是整体承载。会把人员、资源、各项条件纳入同一个工作底盘，把基础铺垫妥当，再从中生长出成果。\n\n原铁特质的对方，思考起点是事物本身的结构。会去辨析材料、标准、轮廓是否成立，基于结构完整性形成自己的判断。\n\n你优先判断承载底座够不够稳固；对方优先判断成型出来的部分是否经得起审视。",
      interactionState:
        "当底层条件和成果标准能够互相匹配，你铺展开来的工作底盘，和对方校验完成的清晰结构，可以处在同一条推进线上，配合顺畅。\n\n如果底层环境还在持续调整，但外部已经要求产出定型成果，节奏错位就会出现：你会继续投入精力补齐整体环境与基础条件；对方会反复审视当下产出，确认结构是否足够完整可靠。\n\n整体协作就是：基础搭建与结构成型，两者之间不断来回校准、互相适配的过程，并非固定“你做底座，对方只管验收”的分工。"
    }
  }),
  fire_controls_metal: approvedNarrative({
    id: "relationship-imagery-structure-validation:cooperation:丁-巳:辛-酉:v2",
    validationSampleId: "fire_controls_metal",
    relationshipTypeId: "cooperation",
    relationshipContextLabel: "工作",
    inputBinding: {
      modernImageryMetadata: {
        personA: {
          selectionKey: "丁-巳",
          dayStemFamily: "灯火",
          monthBranchSeason: "初夏"
        },
        personB: {
          selectionKey: "辛-酉",
          dayStemFamily: "细金器物",
          monthBranchSeason: "仲秋"
        }
      },
      traditionalProfessionalFacts: {
        dayMasterElementRelation: {
          personAElement: "火",
          personBElement: "金",
          relation: "a_controls_b"
        },
        dayMasterYinYangRelation: {
          personA: "阴",
          personB: "阴",
          relation: "same"
        },
        directionalDayStemTenGods: [
          {
            perspective: "personA",
            referenceDayMaster: "丁",
            observedStem: "辛",
            tenGod: "偏财"
          },
          {
            perspective: "personB",
            referenceDayMaster: "辛",
            observedStem: "丁",
            tenGod: "七杀"
          }
        ]
      }
    },
    sections: {
      commonality:
        "共事协作时，初夏灯火与仲秋银饰，都看重事务的实际落点与细部质感。\n\n你会把精力收拢，聚焦照亮当下需要处理的位置；对方会仔细分辨成果的线条、切面、标准细节。二者都不靠大规模铺张扩张建立价值，更愿意在确定范围之内，一点点打磨内容。",
      difference:
        "灯火特质的你，习惯锁定一个现实落点集中发力，把当前重点维持在清晰可见的状态，持续向前推进。\n\n银饰特质的对方，习惯从多个细节切面去审视成果，分辨哪些地方还需要修整，以此维持整体质感。\n\n你切入事务的方式是聚焦、持续投入；对方切入事务的方式是分辨、细致检视。",
      interactionState:
        "当工作重心、质量标准指向同一个方向，你持续聚拢的注意力，会把需要处理的部分充分显露出来，方便对方检视；而对方对切面、边界的分辨，也会让成果中需要继续确认的部分变得更加清楚，两种观察方式在同一工作过程中彼此牵动。\n\n一旦工作重点频繁跳转，或是评判标准尚未统一，节奏冲突就容易显现：你会守住当下正在处理的落点继续投入；对方会切换不同角度反复检视细节。\n\n整体互动就是聚焦照亮与细致辨形两股力量互相牵动、来回校准的协作节奏。"
    }
  })
} as const satisfies Record<
  ValidationSampleId,
  RelationshipImageryStructureValidationSampleEntry
>;

function copyEntry(
  entry: RelationshipImageryStructureValidationSampleEntry
): RelationshipImageryStructureValidationSampleEntry {
  return {
    ...entry,
    inputBinding: {
      modernImageryMetadata: {
        personA: { ...entry.inputBinding.modernImageryMetadata.personA },
        personB: { ...entry.inputBinding.modernImageryMetadata.personB }
      },
      traditionalProfessionalFacts: {
        dayMasterElementRelation: {
          ...entry.inputBinding.traditionalProfessionalFacts.dayMasterElementRelation
        },
        dayMasterYinYangRelation: {
          ...entry.inputBinding.traditionalProfessionalFacts.dayMasterYinYangRelation
        },
        directionalDayStemTenGods: [
          { ...entry.inputBinding.traditionalProfessionalFacts.directionalDayStemTenGods[0] },
          { ...entry.inputBinding.traditionalProfessionalFacts.directionalDayStemTenGods[1] }
        ]
      }
    },
    sections: { ...entry.sections }
  };
}

export const RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG = {
  water_controls_fire: copyEntry(PRIVATE_STRUCTURE_VALIDATION_SAMPLES.water_controls_fire),
  earth_generates_metal: copyEntry(PRIVATE_STRUCTURE_VALIDATION_SAMPLES.earth_generates_metal),
  fire_controls_metal: copyEntry(PRIVATE_STRUCTURE_VALIDATION_SAMPLES.fire_controls_metal)
} as const;

function interactionInputMatches(
  input: Extract<RelationshipImageryInteractionInputSelection, { status: "available" }>,
  expected: RelationshipImageryStructureValidationSampleEntry
): boolean {
  const [personA, personB] = input.modernImageryMetadata.participants;
  const expectedModern = expected.inputBinding.modernImageryMetadata;
  const element = input.professionalRelationshipFacts.dayMasterElementRelation;
  const yinYang = input.professionalRelationshipFacts.dayMasterYinYangRelation;
  const tenGods = input.professionalRelationshipFacts.directionalDayStemTenGods;
  const expectedTraditional = expected.inputBinding.traditionalProfessionalFacts;
  return (
    input.contractVersion === RELATIONSHIP_IMAGERY_INTERACTION_INPUT_VERSION
    && input.relationshipContext.relationshipTypeId === expected.relationshipTypeId
    && input.relationshipContext.label === expected.relationshipContextLabel
    && input.coreImagery.participants[0].selectionKey ===
      expectedModern.personA.selectionKey
    && input.coreImagery.participants[1].selectionKey ===
      expectedModern.personB.selectionKey
    && personA.selectionKey === expectedModern.personA.selectionKey
    && personA.dayStemFamily.value === expectedModern.personA.dayStemFamily
    && personA.monthBranchSeason.value === expectedModern.personA.monthBranchSeason
    && personB.selectionKey === expectedModern.personB.selectionKey
    && personB.dayStemFamily.value === expectedModern.personB.dayStemFamily
    && personB.monthBranchSeason.value === expectedModern.personB.monthBranchSeason
    && element.certainty === "confirmed"
    && element.value.personAElement ===
      expectedTraditional.dayMasterElementRelation.personAElement
    && element.value.personBElement ===
      expectedTraditional.dayMasterElementRelation.personBElement
    && element.value.relation === expectedTraditional.dayMasterElementRelation.relation
    && yinYang.certainty === "confirmed"
    && yinYang.value.personA === expectedTraditional.dayMasterYinYangRelation.personA
    && yinYang.value.personB === expectedTraditional.dayMasterYinYangRelation.personB
    && yinYang.value.relation === expectedTraditional.dayMasterYinYangRelation.relation
    && tenGods.every((fact, index) => {
      const expectedTenGod = expectedTraditional.directionalDayStemTenGods[index];
      return (
        fact.certainty === "confirmed"
        && fact.value.perspective === expectedTenGod.perspective
        && fact.value.referenceDayMaster === expectedTenGod.referenceDayMaster
        && fact.value.observedStem === expectedTenGod.observedStem
        && fact.value.tenGod === expectedTenGod.tenGod
      );
    })
  );
}

function candidateMatchesPrivateDraft(
  candidate: RelationshipImageryStructureValidationSampleEntry,
  privateDraft: RelationshipImageryStructureValidationSampleEntry
): boolean {
  return (
    candidate.id === privateDraft.id
    && candidate.validationSampleId === privateDraft.validationSampleId
    && candidate.relationshipTypeId === privateDraft.relationshipTypeId
    && candidate.relationshipContextLabel === privateDraft.relationshipContextLabel
    && JSON.stringify(candidate.inputBinding) ===
      JSON.stringify(privateDraft.inputBinding)
    && candidate.sections.commonality === privateDraft.sections.commonality
    && candidate.sections.difference === privateDraft.sections.difference
    && candidate.sections.interactionState === privateDraft.sections.interactionState
    && candidate.reviewStatus === privateDraft.reviewStatus
    && candidate.contentKind === privateDraft.contentKind
    && candidate.contentVersion === privateDraft.contentVersion
  );
}

export type RelationshipImageryStructureValidationSampleSelection =
  | {
      status: "available";
      entry: RelationshipImageryStructureValidationSampleEntry;
    }
  | { status: "not_available"; reason: "input_unavailable" };

export function selectRelationshipImageryStructureValidationSample(
  input: RelationshipImageryInteractionInputSelection
): RelationshipImageryStructureValidationSampleSelection {
  if (input.status !== "available") {
    return { status: "not_available", reason: "input_unavailable" };
  }
  const sampleId = (Object.keys(
    PRIVATE_STRUCTURE_VALIDATION_SAMPLES
  ) as ValidationSampleId[]).find(id =>
    interactionInputMatches(input, PRIVATE_STRUCTURE_VALIDATION_SAMPLES[id])
  );
  if (!sampleId) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  const entry = RELATIONSHIP_IMAGERY_STRUCTURE_VALIDATION_SAMPLE_CATALOG[sampleId];
  if (!candidateMatchesPrivateDraft(
    entry,
    PRIVATE_STRUCTURE_VALIDATION_SAMPLES[sampleId]
  )) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  return { status: "available", entry };
}
