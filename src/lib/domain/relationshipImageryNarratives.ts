import type { RelationshipType } from "./relationshipInteractions";
import type { RelationshipImageryInput } from "./relationshipMainlineFoundation";
import { BAZI_DIRECT_NARRATIVE_CATALOG } from "./baziDirectNarratives";

export const RELATIONSHIP_IMAGERY_NARRATIVE_VERSION =
  "relationship-imagery-narrative-v1" as const;

export interface RelationshipImageryNarrativeEntry {
  id: string;
  relationshipTypeId: RelationshipType;
  personASelectionKey: keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG;
  personBSelectionKey: keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG;
  title: string;
  imagery: { personA: string; personB: string };
  narrative: string;
  reviewStatus: "human_reviewed_approved";
  contentVersion: typeof RELATIONSHIP_IMAGERY_NARRATIVE_VERSION;
}

function approvedEntry(
  value: Omit<RelationshipImageryNarrativeEntry, "reviewStatus" | "contentVersion">
): RelationshipImageryNarrativeEntry {
  return {
    ...value,
    reviewStatus: "human_reviewed_approved",
    contentVersion: RELATIONSHIP_IMAGERY_NARRATIVE_VERSION
  };
}

export const RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG = {
  "cooperation:甲-寅:乙-酉": approvedEntry({
    id: "relationship-imagery:cooperation:甲-寅:乙-酉:v1",
    relationshipTypeId: "cooperation", personASelectionKey: "甲-寅", personBSelectionKey: "乙-酉",
    title: "乔木与藤蔓", imagery: { personA: "挺拔乔木", personB: "韧细藤蔓" },
    narrative: [
      "你如同春日长势挺拔的乔木，主干笔直、脉络清晰，有着自己的生长节奏，顺着内在方向稳步舒展、向上延伸。作为共事的同事，你做事自带笃定的步调，习惯围绕核心思路稳步推进。",
      "对方如同秋日循着肌理延展的柔韧藤蔓，枝叶舒展，善于观察周围结构，从既有脉络中找到可以继续生长的路径。作为共事的同事，对方能够理解已有规则与工作节奏，再从中找到适合自己的衔接方式。",
      "你们二人的相通之处，是同属木性基底，都带着持续生长、踏实推进的特质，在共事过程中拥有相近的节奏底色。",
      "你更偏向沿着清晰主干自主前行，对方则善于在周围环境中辨认可供延展的脉络。两种生长方式各有自己的方向与节奏。",
      "当两条生长路径朝向接近时，乔木与藤蔓会在同一片空间里各自舒展；当彼此关注的方向不同，两种行事节奏也会显出各自的层次。乔木守住向上的主线，藤蔓延续灵活伸展的路径，两种木性彼此对照，也各自保留原本的生长方式。"
    ].join("\n\n")
  }),
  "partner:丙-午:癸-子": approvedEntry({
    id: "relationship-imagery:partner:丙-午:癸-子:v1",
    relationshipTypeId: "partner", personASelectionKey: "丙-午", personBSelectionKey: "癸-子",
    title: "日光与静水", imagery: { personA: "盛夏烈阳", personB: "深冬静湖清流" },
    narrative: [
      "你如同盛夏明朗铺展的日光，明亮温热，向外舒展时自然呈现自己的光芒。作为亲密伴侣，你的情绪与状态更容易被人感受到，表达方式坦荡清楚。",
      "对方如同深冬静谧的湖面清流，外在安稳平和，不张扬，内里却保留着细密绵长的流动。作为亲密伴侣，对方更习惯把心绪安放在内里，以从容舒缓的方式呈现自己。",
      "你像向外铺展的日光，对方像静静流动的湖水；一个明朗可见，一个含蓄内收，却都保留着清晰的自身轮廓。",
      "你的表达更容易向外展开，情绪和状态清楚可见；对方的感受则更多留存在安静的内在流动之中。一种明朗，一种静谧，呈现自我的方式各有不同。",
      "日光落在静水之上，一明一静的两种质感并置在同一幅画面里，彼此映照，也不遮住对方原有的样子。"
    ].join("\n\n")
  }),
  "family:戊-辰:庚-申": approvedEntry({
    id: "relationship-imagery:family:戊-辰:庚-申:v1",
    relationshipTypeId: "family", personASelectionKey: "戊-辰", personBSelectionKey: "庚-申",
    title: "山峦与原铁", imagery: { personA: "厚重山峦", personB: "坚实原铁" },
    narrative: [
      "你如同沉稳厚重的山峦，轮廓宽厚，安稳地延展在大地之上。作为家人，你重视每个人都有清晰的立足之处，也愿意在共同事务中分担重量、理顺彼此交叠的部分。",
      "对方如同山间质地纯粹的原铁，结构坚实，轮廓清楚，自带笃定而直接的质感。作为家人，对方习惯坦率表达自己的立场，也看重每个人把属于自己的责任承担清楚。",
      "你们二人的相通之处，是都带着沉稳踏实、质地坚定的底色。山峦稳稳承载自身重量，原铁也保留着清晰完整的结构。",
      "你的物象更显宽厚延展，对方的物象更显清晰凝练；一边是连绵展开的山势，一边是轮廓分明的原铁，各自呈现不同的稳定方式。",
      "山峦与原铁同处一片大地，一种以宽厚地势展开，一种以清晰质地存在。两种稳重的物象彼此对照，也各自保留原有的轮廓与立足之处。"
    ].join("\n\n")
  }),
  "friend:丁-巳:辛-酉": approvedEntry({
    id: "relationship-imagery:friend:丁-巳:辛-酉:v1",
    relationshipTypeId: "friend", personASelectionKey: "丁-巳", personBSelectionKey: "辛-酉",
    title: "灯火与银饰", imagery: { personA: "初夏灯火", personB: "温润银饰" },
    narrative: [
      "你如同初夏明亮暖意里找准落点的一盏灯火，周围热度渐盛，你仍把光稳稳聚在自己需要照亮的地方。作为彼此的朋友，你待人温和真诚，状态稳定绵长，相处时自带温润专注的气质。",
      "对方如同月光下细细打磨的银饰，质地细腻通透，肌理精致独特，自带干净温润的光泽，质感精致有度、内敛好看。作为彼此的朋友，对方性情细腻通透，处事精致有度，自带干净纯粹的个人特质。",
      "你们的物象都带着温润、克制而不张扬的质感，只是灯火更专注聚拢，银饰更细腻通透。",
      "你们二人的不同之处十分明晰：你的特质是温和聚拢、持续舒展，状态专一且稳定，始终保持均匀温润的质感；对方的特质是细腻多元、肌理独特，层次丰富且精致，自带独有的细腻光泽。一人温润专注，一人细腻精致，个人特质差异鲜明。",
      "在朋友相处的过程中，你温润聚拢的气质贴合对方细腻通透的特质，会形成柔和的质感反差。你始终维持温和专注的状态，对方始终保留细腻精致的特质，两种干净温润的气质相互对照、彼此映衬，各自保持独有的相处质感。"
    ].join("\n\n")
  }),
  "family:壬-亥:己-丑": approvedEntry({
    id: "relationship-imagery:family:壬-亥:己-丑:v1",
    relationshipTypeId: "family", personASelectionKey: "壬-亥", personBSelectionKey: "己-丑",
    title: "水脉与育苗土", imagery: { personA: "开阔水脉", personB: "温润育苗土" },
    narrative: [
      "你如同平原上绵延舒展的水脉，脉络开阔通畅，姿态自由柔和，也始终保有自己的流向。作为家人，你愿意交换经验、共享资源，也重视每个人都能保有自己的方向。",
      "对方如同细腻温润的育苗软土，肌理细密厚实，安静承托着彼此相邻的种子，也留意着那些缓慢发生的细微变化。作为家人，对方重视熟悉关系里的平等陪伴，也愿意用耐心守候尚未显露的新生。",
      "你们二人的相通之处，是都愿意为熟悉的人留出空间。水脉在汇流之中不掩盖每一道来路，育苗土也让彼此相邻的种子各自生长。",
      "水脉在汇流中依然保有自己的去向，育苗土则在安静陪伴中守候变化；一个看重并行拓展，一个看重耐心照料。",
      "在家人相处的画面里，开阔水脉带来向外延展的方向，育苗土则把注意力放在长久陪伴和细微变化上。两种节奏并置时，一个不断拓宽共同经验，一个耐心守住正在生长的部分，各自保有原本的脉络。"
    ].join("\n\n")
  }),
  "cooperation:乙-卯:庚-子": approvedEntry({
    id: "relationship-imagery:cooperation:乙-卯:庚-子:v1",
    relationshipTypeId: "cooperation", personASelectionKey: "乙-卯", personBSelectionKey: "庚-子",
    title: "花枝与冰纹", imagery: { personA: "仲春花枝", personB: "冰纹" },
    narrative: [
      "你如同仲春持续生长的花枝，枝条柔软舒展，沿着自己的脉络不断生发、更新。作为共事的同事，你的思路容易向外延展，能够在已有基础上继续拓宽新的方向。",
      "对方的物象，如同刻刀在冰面上逐渐留下的清晰纹路。落点利落，却不会照搬现成答案；它会从不同角度试探，把已有线索拆开重组，在熟悉的事物中显出新的脉络。作为共事的同事，对方习惯先听清问题、理顺线索，再通过反复探索形成自己的清晰表达。",
      "花枝持续生发，冰纹也在一次次试探中逐渐显现。两种物象都不会停留在现成形态里，而是通过各自的方式向新的位置展开。",
      "你沿着自身脉络不断延展，对方则通过多角度探索，让原本隐藏的纹路逐渐清晰；一个从生长中拓新，一个从拆解重组中发现新的路径。",
      "花枝沿着自己的脉络持续舒展，冰面上的纹路也在一次次探索中逐渐展开。两种物象都在向新处推进，只是一个通过生长打开空间，一个通过重组显出路径。"
    ].join("\n\n")
  })
} as const;

export type RelationshipImageryNarrativeSelection =
  | { status: "available"; entry: RelationshipImageryNarrativeEntry }
  | { status: "not_available"; reason: "input_unavailable" | "combination_not_reviewed" };

export function selectRelationshipImageryNarrative(
  input: RelationshipImageryInput
): RelationshipImageryNarrativeSelection {
  if (input.status !== "available") {
    return { status: "not_available", reason: "input_unavailable" };
  }
  const participantsMatchApprovedSources = input.participants.every(participant => (
    participant.entry === BAZI_DIRECT_NARRATIVE_CATALOG[participant.selectionKey]
    && participant.entry.reviewStatus === "human_reviewed_approved"
  ));
  if (!participantsMatchApprovedSources) {
    return { status: "not_available", reason: "input_unavailable" };
  }
  const key = `${input.relationshipTypeId}:${input.participants[0].selectionKey}:${input.participants[1].selectionKey}` as keyof typeof RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG;
  const entry = RELATIONSHIP_IMAGERY_NARRATIVE_CATALOG[key];
  if (!entry || entry.reviewStatus !== "human_reviewed_approved") {
    return { status: "not_available", reason: "combination_not_reviewed" };
  }
  return { status: "available", entry };
}
