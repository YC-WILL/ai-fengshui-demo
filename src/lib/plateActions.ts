import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  PLATE_ENGINE_VERSIONS,
  PLATE_PROTOCOL_VERSION,
  PlateRecordError,
  type PlateSnapshotRecord,
  type PlateType
} from "@/lib/plateRecords";

export const PLATE_ACTION_VERSION = "plate-action-v1";
export const PLATE_ACTION_REVIEW_VERSION = "plate-action-review-v1";

const actionTextSchema = z.string().trim().min(1).max(2000);
const optionalTextSchema = z.string().trim().min(1).max(1000);
const durationSchema = z.number().int().positive().max(1440);

const weeklyActionSchema = z.object({
  sourceCardId: z.string().trim().min(1).max(100),
  sourceTitle: z.string().trim().min(1).max(200),
  action: actionTextSchema
}).strict();

const jointActionSchema = z.object({
  sourceCardId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  action: actionTextSchema,
  doneWhen: optionalTextSchema,
  durationMinutes: durationSchema
}).strict();

const homeActionSchema = z.object({
  sourceFactId: z.string().trim().min(1).max(100),
  sourceArea: z.enum(["entry", "rest", "kitchen"]),
  sourceIssueId: z.string().trim().min(1).max(100),
  durationMinutes: durationSchema,
  text: actionTextSchema,
  doneWhen: optionalTextSchema,
  requiresProfessional: z.boolean()
}).strict();

const timingActionSchema = z.object({
  sourceEvent: z.enum(["wedding", "moving", "opening", "signing", "travel", "renovation_start"]),
  sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: durationSchema,
  text: actionTextSchema,
  doneWhen: optionalTextSchema
}).strict();

const timingCandidateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  action: timingActionSchema
}).passthrough().refine(candidate => candidate.date === candidate.action.sourceDate, {
  message: "候选日期与行动来源日期不一致"
});

const actionDataSchema = z.object({
  plateType: z.enum(["BAZI", "RELATION", "HOME", "TIMING"]),
  source: z.object({
    kind: z.enum(["weeklyAction", "jointAction", "homeAction", "timingCandidate"]),
    id: z.string().trim().min(1).max(100).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }).strict(),
  text: actionTextSchema,
  durationMinutes: durationSchema.nullable(),
  doneWhen: optionalTextSchema.nullable(),
  requiresProfessional: z.boolean()
}).strict();

export const createPlateActionRequestSchema = z.object({}).strict();
export const updatePlateActionRequestSchema = z.object({
  status: z.enum(["pending", "completed", "dismissed"])
}).strict();
export const createPlateActionReviewRequestSchema = z.object({
  requestId: z.string().uuid(),
  outcome: z.enum(["helpful", "mixed", "not_helpful"]),
  note: z.string()
    .trim()
    .max(300, "复盘备注最多 300 个字符")
    .transform(value => value || undefined)
    .optional()
}).strict();
export const plateActionIdSchema = z.string().uuid();

export type PlateActionStatus = z.infer<typeof updatePlateActionRequestSchema>["status"];
export type PlateActionReviewRequest = z.infer<typeof createPlateActionReviewRequestSchema>;
export type PlateActionData = z.infer<typeof actionDataSchema>;

export interface PlateActionRecord {
  id: string;
  snapshotId: string;
  actionVersion: string;
  actionData: unknown;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlateActionReviewRecord {
  id: string;
  requestId: string;
  actionId: string;
  reviewVersion: string;
  reviewData: unknown;
  createdAt: Date;
}

interface ActionWithOwnership extends PlateActionRecord {
  snapshot: { userId: string };
}

interface ReviewWithOwnership extends PlateActionReviewRecord {
  action: { snapshot: { userId: string } };
}

export interface PlateActionClient {
  plateSnapshot: {
    findFirst(args: { where: { id: string; userId: string } }): Promise<PlateSnapshotRecord | null>;
  };
  plateAction: {
    create(args: { data: Record<string, unknown> }): Promise<PlateActionRecord>;
    findUnique(args: {
      where: { snapshotId: string };
      include?: { reviews: { orderBy: { createdAt: "asc" } } };
    }): Promise<(PlateActionRecord & { reviews?: PlateActionReviewRecord[] }) | null>;
    findFirst(args: {
      where: { id: string; snapshot: { userId: string } };
      include?: { snapshot: true };
    }): Promise<ActionWithOwnership | null>;
    update(args: {
      where: { id: string };
      data: { status: PlateActionStatus; completedAt: Date | null };
    }): Promise<PlateActionRecord>;
  };
  plateActionReview: {
    create(args: { data: Record<string, unknown> }): Promise<PlateActionReviewRecord>;
    findUnique(args: {
      where: { requestId: string };
      include: { action: { include: { snapshot: true } } };
    }): Promise<ReviewWithOwnership | null>;
  };
}

type Clock = () => Date;

export function extractActionData(snapshot: PlateSnapshotRecord): PlateActionData {
  const plateType = parseSupportedSnapshotVersion(snapshot);
  let rawAction: PlateActionData;

  if (plateType === "BAZI") {
    const result = z.object({ weeklyAction: weeklyActionSchema.nullable() }).passthrough()
      .safeParse(snapshot.resultSnapshot);
    if (!result.success || !result.data.weeklyAction) throw noActionError();
    rawAction = {
      plateType,
      source: {
        kind: "weeklyAction",
        id: result.data.weeklyAction.sourceCardId,
        title: result.data.weeklyAction.sourceTitle
      },
      text: result.data.weeklyAction.action,
      durationMinutes: null,
      doneWhen: null,
      requiresProfessional: false
    };
  } else if (plateType === "RELATION") {
    const result = z.object({ jointAction: jointActionSchema.nullable() }).passthrough()
      .safeParse(snapshot.resultSnapshot);
    if (!result.success || !result.data.jointAction) throw noActionError();
    rawAction = {
      plateType,
      source: {
        kind: "jointAction",
        id: result.data.jointAction.sourceCardId,
        title: result.data.jointAction.title
      },
      text: result.data.jointAction.action,
      durationMinutes: result.data.jointAction.durationMinutes,
      doneWhen: result.data.jointAction.doneWhen,
      requiresProfessional: false
    };
  } else if (plateType === "HOME") {
    const result = z.object({
      assessment: z.object({ action: homeActionSchema.nullable() }).passthrough()
    }).passthrough().safeParse(snapshot.resultSnapshot);
    if (!result.success || !result.data.assessment.action) throw noActionError();
    rawAction = {
      plateType,
      source: {
        kind: "homeAction",
        id: result.data.assessment.action.sourceFactId
      },
      text: result.data.assessment.action.text,
      durationMinutes: result.data.assessment.action.durationMinutes,
      doneWhen: result.data.assessment.action.doneWhen,
      requiresProfessional: result.data.assessment.action.requiresProfessional
    };
  } else {
    const result = z.object({
      selectedCandidate: timingCandidateSchema.nullable()
    }).passthrough().safeParse(snapshot.resultSnapshot);
    if (!result.success || !result.data.selectedCandidate) throw noActionError();
    rawAction = {
      plateType,
      source: {
        kind: "timingCandidate",
        id: result.data.selectedCandidate.action.sourceEvent,
        date: result.data.selectedCandidate.date
      },
      text: result.data.selectedCandidate.action.text,
      durationMinutes: result.data.selectedCandidate.action.durationMinutes,
      doneWhen: result.data.selectedCandidate.action.doneWhen,
      requiresProfessional: false
    };
  }

  const normalized = actionDataSchema.safeParse(rawAction);
  if (!normalized.success) throw noActionError();
  return normalized.data;
}

export async function createPlateActionForUser(
  userId: string,
  snapshotId: string,
  client: PlateActionClient = prisma as unknown as PlateActionClient
): Promise<{ action: PlateActionRecord; replayed: boolean }> {
  const snapshot = await findOwnedSnapshot(userId, snapshotId, client);
  const actionData = extractActionData(snapshot);
  const createData = {
    snapshotId,
    actionVersion: PLATE_ACTION_VERSION,
    actionData,
    status: "pending"
  };

  try {
    const action = await client.plateAction.create({ data: createData });
    return { action, replayed: false };
  } catch (error: unknown) {
    if (!isUniqueConstraintError(error)) throw serviceUnavailableError();
    let existing: (PlateActionRecord & { reviews?: PlateActionReviewRecord[] }) | null;
    try {
      existing = await client.plateAction.findUnique({ where: { snapshotId } });
    } catch {
      throw serviceUnavailableError();
    }
    if (
      !existing ||
      existing.actionVersion !== PLATE_ACTION_VERSION ||
      canonicalJson(existing.actionData) !== canonicalJson(actionData)
    ) {
      throw new PlateRecordError(409, "该快照已有不同版本的行动，不能覆盖。");
    }
    return { action: existing, replayed: true };
  }
}

export async function getPlateActionForSnapshot(
  userId: string,
  snapshotId: string,
  client: PlateActionClient = prisma as unknown as PlateActionClient
): Promise<{ action: (PlateActionRecord & { reviews: PlateActionReviewRecord[] }) | null }> {
  await findOwnedSnapshot(userId, snapshotId, client);
  try {
    const action = await client.plateAction.findUnique({
      where: { snapshotId },
      include: { reviews: { orderBy: { createdAt: "asc" } } }
    });
    return {
      action: action
        ? { ...action, reviews: [...(action.reviews ?? [])].sort(compareCreatedAt) }
        : null
    };
  } catch {
    throw serviceUnavailableError();
  }
}

export async function updatePlateActionStatusForUser(
  userId: string,
  actionId: string,
  status: PlateActionStatus,
  client: PlateActionClient = prisma as unknown as PlateActionClient,
  clock: Clock = () => new Date()
): Promise<PlateActionRecord> {
  const existing = await findOwnedAction(userId, actionId, client);
  if (existing.status === status) return existing;
  if (!["pending", "completed", "dismissed"].includes(existing.status)) {
    throw new PlateRecordError(409, "当前行动状态无法更新。");
  }
  try {
    return await client.plateAction.update({
      where: { id: actionId },
      data: {
        status,
        completedAt: status === "completed" ? clock() : null
      }
    });
  } catch {
    throw serviceUnavailableError();
  }
}

export async function createPlateActionReviewForUser(
  userId: string,
  actionId: string,
  request: PlateActionReviewRequest,
  client: PlateActionClient = prisma as unknown as PlateActionClient
): Promise<{ review: PlateActionReviewRecord; replayed: boolean }> {
  const action = await findOwnedAction(userId, actionId, client);
  if (action.status !== "completed") {
    throw new PlateRecordError(409, "只有已完成的行动可以复盘。");
  }
  const reviewData = toJsonValue({
    outcome: request.outcome,
    ...(request.note ? { note: request.note } : {})
  });
  const createData = {
    requestId: request.requestId,
    actionId,
    reviewVersion: PLATE_ACTION_REVIEW_VERSION,
    reviewData
  };

  try {
    const review = await client.plateActionReview.create({ data: createData });
    return { review, replayed: false };
  } catch (error: unknown) {
    if (!isUniqueConstraintError(error)) throw serviceUnavailableError();
    let existing: ReviewWithOwnership | null;
    try {
      existing = await client.plateActionReview.findUnique({
        where: { requestId: request.requestId },
        include: { action: { include: { snapshot: true } } }
      });
    } catch {
      throw serviceUnavailableError();
    }
    if (
      !existing ||
      existing.action.snapshot.userId !== userId ||
      existing.actionId !== actionId ||
      existing.reviewVersion !== PLATE_ACTION_REVIEW_VERSION ||
      canonicalJson(existing.reviewData) !== canonicalJson(reviewData)
    ) {
      throw new PlateRecordError(409, "这个复盘请求已被使用，请重新提交。");
    }
    return { review: existing, replayed: true };
  }
}

async function findOwnedSnapshot(
  userId: string,
  snapshotId: string,
  client: PlateActionClient
): Promise<PlateSnapshotRecord> {
  try {
    const snapshot = await client.plateSnapshot.findFirst({
      where: { id: snapshotId, userId }
    });
    if (!snapshot) throw new PlateRecordError(404, "记录不存在。");
    return snapshot;
  } catch (error: unknown) {
    if (error instanceof PlateRecordError) throw error;
    throw serviceUnavailableError();
  }
}

async function findOwnedAction(
  userId: string,
  actionId: string,
  client: PlateActionClient
): Promise<ActionWithOwnership> {
  try {
    const action = await client.plateAction.findFirst({
      where: { id: actionId, snapshot: { userId } },
      include: { snapshot: true }
    });
    if (!action) throw new PlateRecordError(404, "行动不存在。");
    return action;
  } catch (error: unknown) {
    if (error instanceof PlateRecordError) throw error;
    throw serviceUnavailableError();
  }
}

function parseSupportedSnapshotVersion(snapshot: PlateSnapshotRecord): PlateType {
  const plateType = z.enum(["BAZI", "RELATION", "HOME", "TIMING"]).safeParse(snapshot.plateType);
  if (
    !plateType.success ||
    snapshot.protocolVersion !== PLATE_PROTOCOL_VERSION ||
    snapshot.engineVersion !== PLATE_ENGINE_VERSIONS[plateType.data]
  ) {
    throw new PlateRecordError(409, "该记录版本暂不支持创建行动。");
  }
  return plateType.data;
}

function noActionError() {
  return new PlateRecordError(409, "这次查看没有可保存的行动。");
}

function serviceUnavailableError() {
  return new PlateRecordError(503, "行动服务暂时不可用，请稍后重试。");
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function compareCreatedAt(left: PlateActionReviewRecord, right: PlateActionReviewRecord): number {
  return left.createdAt.getTime() - right.createdAt.getTime();
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function toJsonValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}
