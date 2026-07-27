import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  PLATE_ENGINE_VERSIONS,
  PLATE_PROTOCOL_VERSION,
  type PlateType
} from "@/lib/plateRecords";
import {
  HOME_AREA_DEFINITIONS,
  getHomeIssueDefinition,
  type HomeAreaId
} from "@/lib/domain/homeSpaceObservations";

export const PLATE_LABELS: Record<PlateType, {
  title: string;
  shortTitle: string;
  mark: string;
  eyebrow: string;
  href: string;
}> = {
  BAZI: { title: "八字记录", shortTitle: "八字盘", mark: "命", eyebrow: "识己", href: "/bazi" },
  RELATION: { title: "关系记录", shortTitle: "关系盘", mark: "合", eyebrow: "观合", href: "/marriage" },
  HOME: { title: "宅居记录", shortTitle: "宅居盘", mark: "宅", eyebrow: "安居", href: "/fengshui" },
  TIMING: { title: "择时记录", shortTitle: "择时盘", mark: "时", eyebrow: "择时", href: "/date-selection" }
};

const RELATIONSHIP_LABELS = {
  partner: "伴侣",
  family: "家人",
  friend: "朋友",
  cooperation: "合作"
} as const;

const EVENT_LABELS = {
  wedding: "婚礼",
  moving: "搬家",
  opening: "开业",
  signing: "签约",
  travel: "出行",
  renovation_start: "动工"
} as const;

const text = z.string().trim().min(1).max(10000);
const optionalText = z.string().trim().max(10000).nullable().optional();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pillar = z.object({ pillarLabel: text }).passthrough();

const profileSchema = z.object({
  birthDate: dateKey,
  birthTime: z.string().nullable(),
  birthLocation: z.string().nullable(),
  timezone: z.string(),
  unknownTime: z.boolean()
}).passthrough();

const observationSchema = z.object({
  title: text,
  conclusion: text,
  trigger: text,
  strength: text,
  watchout: text,
  action: text,
  limitation: optionalText
}).passthrough();

const baziInputSchema = z.object({ profile: profileSchema }).passthrough();
const baziResultSchema = z.object({
  chart: z.object({
    year: pillar,
    month: pillar,
    day: pillar,
    hour: pillar.nullable()
  }).passthrough(),
  observations: z.array(observationSchema).max(12),
  weeklyAction: z.object({
    sourceTitle: text,
    action: text
  }).passthrough().nullable(),
  timeLayers: z.array(z.object({
    label: text,
    period: text,
    pillar,
    focusTitle: text,
    lifeTheme: text
  }).passthrough()).max(12)
}).passthrough();

const relationInputSchema = z.object({
  input: z.object({
    relationshipType: z.enum(["partner", "family", "friend", "cooperation"]),
    otherBirthDate: dateKey,
    otherNickname: z.string().trim().max(40).optional()
  }).passthrough(),
  profile: profileSchema
}).passthrough();
const relationResultSchema = z.object({
  selfChart: z.object({ day: pillar }).passthrough(),
  otherChart: z.object({ day: pillar }).passthrough(),
  interactionFacts: z.object({
    firstPerspective: z.object({ fact: text }).passthrough(),
    secondPerspective: z.object({ fact: text }).passthrough(),
    elementRelation: z.object({ label: text, fact: text }).passthrough()
  }).passthrough(),
  observations: z.array(observationSchema).max(12),
  jointAction: z.object({
    title: text,
    action: text,
    doneWhen: text,
    durationMinutes: z.number().int().positive()
  }).passthrough().nullable()
}).passthrough();

const homeAreaSchema = z.object({
  reviewed: z.literal(true),
  issues: z.array(z.string()).max(30)
}).passthrough();
const homeInputSchema = z.object({
  input: z.object({
    areas: z.object({
      entry: homeAreaSchema.optional(),
      rest: homeAreaSchema.optional(),
      kitchen: homeAreaSchema.optional()
    }).passthrough()
  }).passthrough()
}).passthrough();
const homeResultSchema = z.object({
  assessment: z.object({
    status: z.enum(["insufficient", "priority", "clear"]),
    coverageNote: text,
    priority: z.object({
      areaLabel: text,
      issueLabel: text,
      title: text,
      reason: text
    }).passthrough().nullable(),
    action: z.object({
      text,
      doneWhen: text,
      durationMinutes: z.number().int().positive(),
      requiresProfessional: z.boolean()
    }).passthrough().nullable()
  }).passthrough()
}).passthrough();

const timingInputSchema = z.object({
  input: z.object({
    event: z.enum(["wedding", "moving", "opening", "signing", "travel", "renovation_start"]),
    startDate: dateKey,
    rangeDays: z.union([z.literal(7), z.literal(30)]),
    selectedDate: dateKey.optional()
  }).passthrough(),
  profile: profileSchema
}).passthrough();
const timingCandidateSchema = z.object({
  date: dateKey,
  weekday: text,
  whyCandidate: text,
  arrangementFit: text,
  confirmBefore: text,
  limitation: text,
  evidence: z.array(z.object({
    fact: text,
    explanation: text
  }).passthrough()).max(20),
  action: z.object({
    text,
    doneWhen: text,
    durationMinutes: z.number().int().positive()
  }).passthrough()
}).passthrough();
const timingResultSchema = z.object({
  selection: z.object({
    status: z.enum(["ready", "insufficient"]),
    insufficientReason: z.string().optional(),
    candidates: z.array(timingCandidateSchema).max(31),
    boundary: text
  }).passthrough(),
  selectedCandidate: timingCandidateSchema.nullable()
}).passthrough();

export interface PlatePresentationInput {
  id: string;
  plateType: string;
  protocolVersion: string;
  engineVersion: string;
  inputSnapshot: unknown;
  resultSnapshot: unknown;
  resultDate: string | null;
  calculatedAt: Date;
  createdAt: Date;
  action?: {
    id: string;
    actionVersion?: string;
    actionData?: unknown;
    status: string;
    completedAt?: Date | null;
    createdAt: Date;
    reviews?: Array<{
      id: string;
      reviewVersion?: string;
      reviewData: unknown;
      createdAt: Date;
    }>;
  } | null;
}

export interface PlateArchiveItem {
  id: string;
  plateType: PlateType;
  typeTitle: string;
  savedAt: string;
  savedAtIso: string;
  summary: string;
  secondary: string | null;
  actionStatus: string | null;
  displayable: boolean;
}

interface PlateDetailBase {
  id: string;
  idShort: string;
  plateType: PlateType;
  typeTitle: string;
  savedAt: string;
  savedAtIso: string;
  resultDate: string | null;
  protocolLabel: string;
  engineLabel: string;
  actionAvailable: boolean;
  action: PlateActionDetail | null;
}

export type PlateDetail =
  | (PlateDetailBase & { displayable: false; content: null })
  | (PlateDetailBase & { displayable: true; content: PlateDetailContent });

export type PlateDetailContent =
  | {
      kind: "BAZI";
      profile: ProfileDetail;
      pillars: Array<{ label: string; value: string }>;
      observations: ObservationDetail[];
      weeklyAction: { title: string; text: string } | null;
      timeLayers: Array<{ label: string; period: string; pillar: string; title: string; summary: string }>;
    }
  | {
      kind: "RELATION";
      relationshipLabel: string;
      nickname: string | null;
      selfBirthDate: string;
      otherBirthDate: string;
      selfDay: string;
      otherDay: string;
      observations: ObservationDetail[];
      interaction: string[];
      jointAction: { title: string; text: string; doneWhen: string; durationMinutes: number } | null;
    }
  | {
      kind: "HOME";
      areas: Array<{ id: HomeAreaId; label: string; issues: string[] }>;
      status: "insufficient" | "priority" | "clear";
      coverageNote: string;
      priority: { title: string; area: string; issue: string; reason: string } | null;
      action: { text: string; doneWhen: string; durationMinutes: number; requiresProfessional: boolean } | null;
    }
  | {
      kind: "TIMING";
      eventLabel: string;
      startDate: string;
      rangeDays: 7 | 30;
      selectedDate: string | null;
      status: "ready" | "insufficient";
      insufficientReason: string | null;
      candidates: Array<{
        date: string;
        weekday: string;
        why: string;
        fit: string;
        confirmBefore: string;
        limitation: string;
        evidence: string[];
        action: { text: string; doneWhen: string; durationMinutes: number };
      }>;
      boundary: string;
    };

interface ProfileDetail {
  birthDate: string;
  timeLabel: string;
  birthLocation: string | null;
  timezone: string;
}

interface ObservationDetail {
  title: string;
  conclusion: string;
  trigger: string;
  strength: string;
  watchout: string;
  action: string;
  limitation: string | null;
}

export interface PlateActionDetail {
  id: string;
  status: "pending" | "completed" | "dismissed" | "unsupported";
  statusLabel: string;
  completedAt: string | null;
  text: string | null;
  durationMinutes: number | null;
  doneWhen: string | null;
  requiresProfessional: boolean;
  sourceDate: string | null;
  operable: boolean;
  reviews: Array<{
    outcome: string;
    note: string | null;
    createdAt: string;
    createdAtIso: string;
  }>;
}

export function presentPlateArchive(snapshot: PlatePresentationInput): PlateArchiveItem {
  const detail = presentPlateDetail(snapshot);
  const fallback: PlateArchiveItem = {
    id: snapshot.id,
    plateType: detail.plateType,
    typeTitle: detail.typeTitle,
    savedAt: detail.savedAt,
    savedAtIso: detail.savedAtIso,
    summary: "这条记录暂时无法完整展示",
    secondary: `记录 ${detail.idShort}`,
    actionStatus: detail.action?.statusLabel ?? null,
    displayable: false
  };
  if (!detail.displayable) return fallback;

  const content = detail.content;
  if (content.kind === "BAZI") {
    return {
      ...fallback,
      summary: `${content.profile.birthDate} · 八字盘快照`,
      secondary: content.profile.timeLabel,
      displayable: true
    };
  }
  if (content.kind === "RELATION") {
    return {
      ...fallback,
      summary: `${content.nickname ?? "关系记录"} · ${content.relationshipLabel}`,
      secondary: `对方出生日期 ${content.otherBirthDate}`,
      displayable: true
    };
  }
  if (content.kind === "HOME") {
    return {
      ...fallback,
      summary: content.priority
        ? `${content.priority.area} · ${content.priority.issue}`
        : content.status === "clear"
          ? "已检查区域暂未见上述问题"
          : "当时仅保存了部分空间情况",
      secondary: `已确认 ${content.areas.length} 处区域`,
      displayable: true
    };
  }
  return {
    ...fallback,
    summary: `${content.eventLabel} · ${content.startDate} 起 ${content.rangeDays} 天`,
    secondary: content.selectedDate
      ? `当时选中 ${content.selectedDate}`
      : "当时未选出候选日期",
    displayable: true
  };
}

export function presentPlateDetail(snapshot: PlatePresentationInput): PlateDetail {
  const parsedType = parsePlateType(snapshot.plateType);
  const plateType = parsedType.plateType;
  const base: PlateDetailBase = {
    id: snapshot.id,
    idShort: snapshot.id.slice(0, 8),
    plateType,
    typeTitle: parsedType.known ? PLATE_LABELS[plateType].shortTitle : "四盘记录",
    savedAt: formatChinaDateTime(snapshot.createdAt),
    savedAtIso: snapshot.createdAt.toISOString(),
    resultDate: snapshot.resultDate,
    protocolLabel: friendlyProtocol(snapshot.protocolVersion),
    engineLabel: friendlyEngine(plateType, snapshot.engineVersion),
    actionAvailable: false,
    action: presentAction(snapshot.action)
  };

  if (
    !parsedType.known ||
    snapshot.protocolVersion !== PLATE_PROTOCOL_VERSION ||
    snapshot.engineVersion !== PLATE_ENGINE_VERSIONS[plateType]
  ) {
    return { ...base, displayable: false, content: null };
  }

  const content = parseContent(plateType, snapshot.inputSnapshot, snapshot.resultSnapshot);
  return content
    ? {
        ...base,
        actionAvailable: hasAvailableAction(plateType, snapshot.resultSnapshot),
        displayable: true,
        content
      }
    : { ...base, displayable: false, content: null };
}

export async function loadPlateSnapshotDetail(
  userId: string,
  id: string,
  client: PlatePresentationClient = prisma as unknown as PlatePresentationClient
): Promise<PlateDetail | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const snapshot = await client.plateSnapshot.findFirst({
    where: { id, userId },
    include: {
      action: {
        include: { reviews: { orderBy: { createdAt: "asc" } } }
      }
    }
  });
  return snapshot ? presentPlateDetail(snapshot) : null;
}

export interface PlatePresentationClient {
  plateSnapshot: {
    findFirst(args: {
      where: { id: string; userId: string };
      include: {
        action: {
          include: { reviews: { orderBy: { createdAt: "asc" } } };
        };
      };
    }): Promise<PlatePresentationInput | null>;
  };
}

function parseContent(
  plateType: PlateType,
  inputSnapshot: unknown,
  resultSnapshot: unknown
): PlateDetailContent | null {
  if (plateType === "BAZI") {
    const input = baziInputSchema.safeParse(inputSnapshot);
    const result = baziResultSchema.safeParse(resultSnapshot);
    if (!input.success || !result.success) return null;
    return {
      kind: "BAZI",
      profile: presentProfile(input.data.profile),
      pillars: [
        { label: "年柱", value: result.data.chart.year.pillarLabel },
        { label: "月柱", value: result.data.chart.month.pillarLabel },
        { label: "日柱", value: result.data.chart.day.pillarLabel },
        { label: "时柱", value: result.data.chart.hour?.pillarLabel ?? "时辰未定" }
      ],
      observations: result.data.observations.map(presentObservation),
      weeklyAction: result.data.weeklyAction
        ? { title: result.data.weeklyAction.sourceTitle, text: result.data.weeklyAction.action }
        : null,
      timeLayers: result.data.timeLayers.map(item => ({
        label: item.label,
        period: item.period,
        pillar: item.pillar.pillarLabel,
        title: item.focusTitle,
        summary: item.lifeTheme
      }))
    };
  }

  if (plateType === "RELATION") {
    const input = relationInputSchema.safeParse(inputSnapshot);
    const result = relationResultSchema.safeParse(resultSnapshot);
    if (!input.success || !result.success) return null;
    return {
      kind: "RELATION",
      relationshipLabel: RELATIONSHIP_LABELS[input.data.input.relationshipType],
      nickname: input.data.input.otherNickname || null,
      selfBirthDate: input.data.profile.birthDate,
      otherBirthDate: input.data.input.otherBirthDate,
      selfDay: result.data.selfChart.day.pillarLabel,
      otherDay: result.data.otherChart.day.pillarLabel,
      observations: result.data.observations.map(presentObservation),
      interaction: [
        result.data.interactionFacts.firstPerspective.fact,
        result.data.interactionFacts.secondPerspective.fact,
        `${result.data.interactionFacts.elementRelation.label}：${result.data.interactionFacts.elementRelation.fact}`
      ],
      jointAction: result.data.jointAction
        ? {
            title: result.data.jointAction.title,
            text: result.data.jointAction.action,
            doneWhen: result.data.jointAction.doneWhen,
            durationMinutes: result.data.jointAction.durationMinutes
          }
        : null
    };
  }

  if (plateType === "HOME") {
    const input = homeInputSchema.safeParse(inputSnapshot);
    const result = homeResultSchema.safeParse(resultSnapshot);
    if (!input.success || !result.success) return null;
    const areas = HOME_AREA_DEFINITIONS.flatMap(area => {
      const value = input.data.input.areas[area.id];
      if (!value) return [];
      return [{
        id: area.id,
        label: area.label,
        issues: value.issues.map(issueId => getHomeIssueDefinition(issueId as never)?.label ?? "无法识别的问题")
      }];
    });
    return {
      kind: "HOME",
      areas,
      status: result.data.assessment.status,
      coverageNote: result.data.assessment.coverageNote,
      priority: result.data.assessment.priority
        ? {
            title: result.data.assessment.priority.title,
            area: result.data.assessment.priority.areaLabel,
            issue: result.data.assessment.priority.issueLabel,
            reason: result.data.assessment.priority.reason
          }
        : null,
      action: result.data.assessment.action
        ? {
            text: result.data.assessment.action.text,
            doneWhen: result.data.assessment.action.doneWhen,
            durationMinutes: result.data.assessment.action.durationMinutes,
            requiresProfessional: result.data.assessment.action.requiresProfessional
          }
        : null
    };
  }

  const input = timingInputSchema.safeParse(inputSnapshot);
  const result = timingResultSchema.safeParse(resultSnapshot);
  if (!input.success || !result.success) return null;
  return {
    kind: "TIMING",
    eventLabel: EVENT_LABELS[input.data.input.event],
    startDate: input.data.input.startDate,
    rangeDays: input.data.input.rangeDays,
    selectedDate: input.data.input.selectedDate ?? result.data.selectedCandidate?.date ?? null,
    status: result.data.selection.status,
    insufficientReason: result.data.selection.insufficientReason ?? null,
    candidates: result.data.selection.candidates.map(candidate => ({
      date: candidate.date,
      weekday: candidate.weekday,
      why: candidate.whyCandidate,
      fit: candidate.arrangementFit,
      confirmBefore: candidate.confirmBefore,
      limitation: candidate.limitation,
      evidence: candidate.evidence.map(item => `${item.fact}：${item.explanation}`),
      action: {
        text: candidate.action.text,
        doneWhen: candidate.action.doneWhen,
        durationMinutes: candidate.action.durationMinutes
      }
    })),
    boundary: result.data.selection.boundary
  };
}

function parsePlateType(value: string): { plateType: PlateType; known: boolean } {
  if (value === "BAZI" || value === "RELATION" || value === "HOME" || value === "TIMING") {
    return { plateType: value, known: true };
  }
  return { plateType: "BAZI", known: false };
}

function presentProfile(profile: z.infer<typeof profileSchema>): ProfileDetail {
  return {
    birthDate: profile.birthDate,
    timeLabel: profile.unknownTime || !profile.birthTime ? "出生时间未确定" : `出生时间 ${profile.birthTime}`,
    birthLocation: profile.birthLocation,
    timezone: profile.timezone
  };
}

function presentObservation(value: z.infer<typeof observationSchema>): ObservationDetail {
  return {
    title: value.title,
    conclusion: value.conclusion,
    trigger: value.trigger,
    strength: value.strength,
    watchout: value.watchout,
    action: value.action,
    limitation: value.limitation ?? null
  };
}

const actionDataSchema = z.object({
  plateType: z.enum(["BAZI", "RELATION", "HOME", "TIMING"]),
  source: z.object({
    kind: z.enum(["weeklyAction", "jointAction", "homeAction", "timingCandidate"]),
    id: z.string().trim().min(1).max(100).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    date: dateKey.optional()
  }).strict(),
  text: z.string().trim().min(1).max(2000),
  durationMinutes: z.number().int().positive().max(1440).nullable(),
  doneWhen: z.string().trim().min(1).max(1000).nullable(),
  requiresProfessional: z.boolean()
}).strict();

function presentAction(value: PlatePresentationInput["action"]): PlateActionDetail | null {
  if (!value) return null;
  const status = value.status === "pending" || value.status === "completed" || value.status === "dismissed"
    ? value.status
    : "unsupported";
  const actionData = value.actionVersion === "plate-action-v1"
    ? actionDataSchema.safeParse(value.actionData)
    : null;
  return {
    id: value.id,
    status,
    statusLabel: actionStatusLabel(value.status),
    completedAt: value.completedAt ? formatChinaDateTime(value.completedAt) : null,
    text: actionData?.success ? actionData.data.text : null,
    durationMinutes: actionData?.success ? actionData.data.durationMinutes : null,
    doneWhen: actionData?.success ? actionData.data.doneWhen : null,
    requiresProfessional: actionData?.success ? actionData.data.requiresProfessional : false,
    sourceDate: actionData?.success ? actionData.data.source.date ?? null : null,
    operable: status !== "unsupported" && actionData?.success === true,
    reviews: (value.reviews ?? []).map(review => {
      const parsed = review.reviewVersion === "plate-action-review-v1"
        ? z.object({
            outcome: z.enum(["helpful", "mixed", "not_helpful"]),
            note: z.string().max(300).optional()
          }).strict().safeParse(review.reviewData)
        : null;
      return {
        outcome: parsed?.success
          ? ({ helpful: "有帮助", mixed: "部分有帮助", not_helpful: "没有帮助" } as const)[parsed.data.outcome]
          : "复盘内容暂时无法展示",
        note: parsed?.success ? parsed.data.note ?? null : null,
        createdAt: formatChinaDateTime(review.createdAt),
        createdAtIso: review.createdAt.toISOString()
      };
    })
  };
}

export function hasAvailableAction(plateType: PlateType, resultSnapshot: unknown): boolean {
  if (plateType === "BAZI") {
    const result = baziResultSchema.safeParse(resultSnapshot);
    return result.success && result.data.weeklyAction !== null;
  }
  if (plateType === "RELATION") {
    const result = relationResultSchema.safeParse(resultSnapshot);
    return result.success && result.data.jointAction !== null;
  }
  if (plateType === "HOME") {
    const result = homeResultSchema.safeParse(resultSnapshot);
    return result.success && result.data.assessment.action !== null;
  }
  const result = timingResultSchema.safeParse(resultSnapshot);
  return result.success && result.data.selectedCandidate?.action !== undefined;
}

function actionStatusLabel(status: string): string {
  if (status === "completed") return "已完成";
  if (status === "dismissed") return "暂不进行";
  if (status === "pending") return "待进行";
  return "状态暂不可用";
}

function friendlyProtocol(version: string): string {
  return version === PLATE_PROTOCOL_VERSION ? "四盘快照 1.0" : "较早的记录格式";
}

function friendlyEngine(plateType: PlateType, version: string): string {
  return version === PLATE_ENGINE_VERSIONS[plateType] ? "保存时的确定性计算规则" : "较早的计算规则";
}

export function formatChinaDateTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
