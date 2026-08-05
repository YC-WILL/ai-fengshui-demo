import type { RelationshipType } from "./relationshipInteractions";
import type {
  ProfessionalRelationshipDayBranchRelationValue,
  ProfessionalRelationshipFact,
  ProfessionalRelationshipFactsV1
} from "./professionalRelationshipFacts";
import type { Branch } from "./elements";

export const RELATIONSHIP_DAY_BRANCH_NARRATIVE_VERSION =
  "relationship-day-branch-narrative-v1" as const;

export type RelationshipDayBranchNarrativeKind =
  | "six_harmony"
  | "six_clash"
  | "six_harm"
  | "six_break"
  | "complete_punishment"
  | "self_punishment"
  | "partial_punishment"
  | "same_branch";

export interface RelationshipDayBranchNarrativeEntry {
  id: string;
  kind: RelationshipDayBranchNarrativeKind;
  title: string;
  narrative: string;
  approvedRelationshipTypes: readonly RelationshipType[];
  reviewStatus: "human_reviewed_approved";
  contentVersion: typeof RELATIONSHIP_DAY_BRANCH_NARRATIVE_VERSION;
}

export interface RelationshipDayBranchNarrativeItem {
  entry: RelationshipDayBranchNarrativeEntry;
  sourceFact: ProfessionalRelationshipFact<ProfessionalRelationshipDayBranchRelationValue>;
}

export type RelationshipDayBranchNarrativeSelection =
  | {
      status: "available";
      relationshipTypeId: RelationshipType;
      personABranch: Branch;
      personBBranch: Branch;
      items: RelationshipDayBranchNarrativeItem[];
    }
  | {
      status: "not_available";
      reason:
        | "facts_unavailable"
        | "no_registered_relation"
        | "narrative_not_reviewed";
    };

const ALL_RELATIONSHIP_TYPES = [
  "partner",
  "cooperation",
  "family",
  "friend"
] as const satisfies readonly RelationshipType[];

function approvedEntry(
  value: Omit<
    RelationshipDayBranchNarrativeEntry,
    "approvedRelationshipTypes" | "reviewStatus" | "contentVersion"
  >
): RelationshipDayBranchNarrativeEntry {
  return {
    ...value,
    approvedRelationshipTypes: ALL_RELATIONSHIP_TYPES,
    reviewStatus: "human_reviewed_approved",
    contentVersion: RELATIONSHIP_DAY_BRANCH_NARRATIVE_VERSION
  };
}

const BRAND_REVIEW_NOTE = "蟾先森在这儿只是以专业角度向您进行说明，不同的个体依旧会存在差异，每个人都有自己独特的经历，性格和处事方式，希望本次的日支关系对您有帮助。";

export const RELATIONSHIP_DAY_BRANCH_NARRATIVE_CATALOG: Record<
  RelationshipDayBranchNarrativeKind,
  RelationshipDayBranchNarrativeEntry
> = {
  six_harmony: approvedEntry({
    id: "relationship-day-branch:six-harmony:v1",
    kind: "six_harmony",
    title: "六合",
    narrative: `双方日支为六合。你们在相处、合作做事时，想法上很容易对上，彼此愿意主动靠近、互相配合，沟通衔接很顺畅。${BRAND_REVIEW_NOTE}`
  }),
  six_clash: approvedEntry({
    id: "relationship-day-branch:six-clash:v1",
    kind: "six_clash",
    title: "六冲",
    narrative: `双方日支为六冲。你们的状态高度联动，若是你变动、行动或改变想法时，另一方可能会受影响。你们如果进入长期相处、共事时，彼此的做事风格、立场和节奏差异，会很快显现出不同。${BRAND_REVIEW_NOTE}`
  }),
  six_harm: approvedEntry({
    id: "relationship-day-branch:six-harm:v1",
    kind: "six_harm",
    title: "六害",
    narrative: `双方日支为六害。你们在沟通、做事时存在隐性错位。你觉得自然好懂的表达方式、做事节奏，对方往往接不住、对不上。大多是心里没完全同频，但不会直白爆发矛盾。${BRAND_REVIEW_NOTE}`
  }),
  six_break: approvedEntry({
    id: "relationship-day-branch:six-break:v1",
    kind: "six_break",
    title: "六破",
    narrative: `双方日支为六破。你们在短期相处时没问题，矛盾可能在长期共事、深度相处时出现。你们磨合好的默契、达成的共识，较容易被小事打乱，需要反复重新对齐想法和做法。${BRAND_REVIEW_NOTE}`
  }),
  complete_punishment: approvedEntry({
    id: "relationship-day-branch:complete-punishment:v1",
    kind: "complete_punishment",
    title: "完整成刑",
    narrative: `双方日支为完整刑。你们在相处时可能会出现反复拉扯、反复纠结的情况，同一件事会来回调整、反复纠结，很难轻松翻篇、放下。${BRAND_REVIEW_NOTE}`
  }),
  self_punishment: approvedEntry({
    id: "relationship-day-branch:self-punishment:v1",
    kind: "self_punishment",
    title: "自刑",
    narrative: `双方日支相同且为自刑。你们在做事、想法上高度相似，既能互相契合，也会放大彼此的共同习惯，导致你们可能会卡在同一个问题上反复打转、原地循环。${BRAND_REVIEW_NOTE}`
  }),
  partial_punishment: approvedEntry({
    id: "relationship-day-branch:partial-punishment:v1",
    kind: "partial_punishment",
    title: "部分刑局",
    narrative: `双方日支仅形成局部刑结构。你们在相处时有轻微拉扯、反复磨合的迹象，但你们并不会有不可调和的矛盾。${BRAND_REVIEW_NOTE}`
  }),
  same_branch: approvedEntry({
    id: "relationship-day-branch:same-branch:v1",
    kind: "same_branch",
    title: "同支",
    narrative: `双方日支完全相同。你们面对事情的反应、做事节奏很像，相处时自带熟悉感、不陌生。同时也会放大彼此相同的做事习惯和思维模式。${BRAND_REVIEW_NOTE}`
  })
};

function dayBranch(
  facts: ProfessionalRelationshipFactsV1,
  participantId: "personA" | "personB"
): Branch | null {
  const pillar = facts.participants[participantId].natalFacts.pillars.find(
    candidate => candidate.position.value === "日柱"
  );
  return pillar?.branch.certainty === "confirmed" && pillar.branch.value
    ? pillar.branch.value
    : null;
}

function narrativeKind(
  value: ProfessionalRelationshipDayBranchRelationValue
): RelationshipDayBranchNarrativeKind | null {
  if (value.relation === "same" && value.scope === "complete_pair") {
    return "same_branch";
  }
  if (value.relation === "six_harmony" && value.scope === "complete_pair") {
    return "six_harmony";
  }
  if (value.relation === "six_clash" && value.scope === "complete_pair") {
    return "six_clash";
  }
  if (value.relation === "six_harm" && value.scope === "complete_pair") {
    return "six_harm";
  }
  if (value.relation === "six_break" && value.scope === "complete_pair") {
    return "six_break";
  }
  if (value.relation !== "punishment") return null;
  if (value.scope === "complete_pair") return "complete_punishment";
  if (value.scope === "self") return "self_punishment";
  if (value.scope === "partial_group") return "partial_punishment";
  return null;
}

export function selectRelationshipDayBranchNarratives(
  facts: ProfessionalRelationshipFactsV1,
  relationshipTypeId: RelationshipType
): RelationshipDayBranchNarrativeSelection {
  const personABranch = dayBranch(facts, "personA");
  const personBBranch = dayBranch(facts, "personB");
  const evaluation = facts.crossChartRelations.dayBranchEvaluation;
  const relations = facts.crossChartRelations.dayBranchRelations;
  if (
    !personABranch
    || !personBBranch
    || evaluation.certainty !== "confirmed"
    || evaluation.value.personABranch !== personABranch
    || evaluation.value.personBBranch !== personBBranch
    || evaluation.value.registeredRelationCount !== relations.length
  ) return { status: "not_available", reason: "facts_unavailable" };
  if (!relations.length) {
    return { status: "not_available", reason: "no_registered_relation" };
  }

  const items: RelationshipDayBranchNarrativeItem[] = [];
  for (const sourceFact of relations) {
    const kind = narrativeKind(sourceFact.value);
    const entry = kind ? RELATIONSHIP_DAY_BRANCH_NARRATIVE_CATALOG[kind] : null;
    if (
      sourceFact.certainty !== "confirmed"
      || sourceFact.value.personABranch !== personABranch
      || sourceFact.value.personBBranch !== personBBranch
      || !entry
      || entry.reviewStatus !== "human_reviewed_approved"
      || !entry.approvedRelationshipTypes.includes(relationshipTypeId)
    ) return { status: "not_available", reason: "narrative_not_reviewed" };
    items.push({ entry, sourceFact });
  }

  return {
    status: "available",
    relationshipTypeId,
    personABranch,
    personBBranch,
    items
  };
}
