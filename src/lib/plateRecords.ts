import { z } from "zod";
import { prisma } from "@/lib/db";
import { dateKeyInTimeZone } from "@/lib/time";
import { normalizeProfileGender } from "@/lib/profileGender";
import { DEFAULT_BIRTH_TIMEZONE, isSupportedBirthTimezone } from "@/lib/domain/birthTimezone";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziMainline, buildBaziStructure } from "@/lib/domain/baziStructure";
import { buildBaziObservationCards, buildBaziWeeklyAction } from "@/lib/domain/baziObservations";
import { buildBaziTimeLayers } from "@/lib/domain/baziTimeComparison";
import {
  buildPairInteractionFacts,
  buildRelationshipJointAction,
  buildRelationshipObservationCards
} from "@/lib/domain/relationshipInteractions";
import { buildHomeSpaceAssessment } from "@/lib/domain/homeSpaceObservations";
import { buildTimingSelection } from "@/lib/domain/timingSelection";

export const PLATE_PROTOCOL_VERSION = "plate-snapshot-v1";
export const PLATE_ENGINE_VERSIONS = {
  BAZI: "bazi-deterministic-v1",
  RELATION: "relation-deterministic-v1",
  HOME: "home-deterministic-v1",
  TIMING: "timing-deterministic-v1"
} as const;

export type PlateType = keyof typeof PLATE_ENGINE_VERSIONS;

const dateKeySchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期必须使用 YYYY-MM-DD 格式")
  .refine(isRealDateKey, "日期不存在");

const relationshipTypeSchema = z.enum(["partner", "family", "friend", "cooperation"]);
const timingEventSchema = z.enum([
  "wedding",
  "moving",
  "opening",
  "signing",
  "travel",
  "renovation_start"
]);

const nicknameSchema = z.string()
  .trim()
  .max(40, "称呼或昵称最多 40 个字符")
  .transform(value => value || undefined)
  .optional();

const entryIssueSchema = z.enum([
  "entry_clutter",
  "entry_passage_blocked",
  "entry_dim",
  "entry_door_collision",
  "entry_emergency_exit_blocked"
]);
const restIssueSchema = z.enum([
  "rest_persistent_noise",
  "rest_night_strong_light",
  "rest_poor_ventilation",
  "rest_damp_mold",
  "rest_bump_passage",
  "rest_insufficient_privacy"
]);
const kitchenIssueSchema = z.enum([
  "kitchen_poor_exhaust",
  "kitchen_workspace_interference",
  "kitchen_backtracking",
  "kitchen_heat_hazard",
  "kitchen_passage_blocked"
]);

function areaSchema<T extends [string, ...string[]]>(issueSchema: z.ZodEnum<T>) {
  return z.object({
    reviewed: z.literal(true),
    issues: z.array(issueSchema).transform(values => [...new Set(values)].sort())
  }).strict();
}

const baziRequestSchema = z.object({
  requestId: z.string().uuid(),
  plateType: z.literal("BAZI"),
  input: z.object({}).strict()
}).strict();

const relationRequestSchema = z.object({
  requestId: z.string().uuid(),
  plateType: z.literal("RELATION"),
  input: z.object({
    relationshipType: relationshipTypeSchema,
    otherBirthDate: dateKeySchema,
    otherNickname: nicknameSchema
  }).strict()
}).strict();

const homeRequestSchema = z.object({
  requestId: z.string().uuid(),
  plateType: z.literal("HOME"),
  input: z.object({
    areas: z.object({
      entry: areaSchema(entryIssueSchema).optional(),
      rest: areaSchema(restIssueSchema).optional(),
      kitchen: areaSchema(kitchenIssueSchema).optional()
    }).strict().refine(
      areas => Object.values(areas).some(area => area?.reviewed === true),
      "至少确认一处区域"
    )
  }).strict()
}).strict();

const timingRequestSchema = z.object({
  requestId: z.string().uuid(),
  plateType: z.literal("TIMING"),
  input: z.object({
    event: timingEventSchema,
    startDate: dateKeySchema,
    rangeDays: z.union([z.literal(7), z.literal(30)]),
    selectedDate: dateKeySchema.optional()
  }).strict()
}).strict();

export const plateRecordRequestSchema = z.discriminatedUnion("plateType", [
  baziRequestSchema,
  relationRequestSchema,
  homeRequestSchema,
  timingRequestSchema
]);

export const plateRecordIdSchema = z.string().uuid();
export type PlateRecordRequest = z.infer<typeof plateRecordRequestSchema>;

interface ProfileRecord {
  birthDate: string | null;
  birthTime: string | null;
  birthLocation: string | null;
  timezone: string | null;
  gender: string | null;
  updatedAt: Date;
}

export interface PlateSnapshotRecord {
  id: string;
  requestId: string;
  userId: string;
  plateType: string;
  protocolVersion: string;
  engineVersion: string;
  inputSnapshot: unknown;
  resultSnapshot: unknown;
  resultDate: string | null;
  profileUpdatedAt: Date | null;
  calculatedAt: Date;
  createdAt: Date;
}

export interface PlateRecordClient {
  userProfile: {
    findUnique(args: {
      where: { userId: string };
      select: {
        birthDate: true;
        birthTime: true;
        birthLocation: true;
        timezone: true;
        gender: true;
        updatedAt: true;
      };
    }): Promise<ProfileRecord | null>;
  };
  plateSnapshot: {
    create(args: { data: Record<string, unknown> }): Promise<PlateSnapshotRecord>;
    findUnique(args: { where: { requestId: string } }): Promise<PlateSnapshotRecord | null>;
    findFirst(args: { where: { id: string; userId: string } }): Promise<PlateSnapshotRecord | null>;
    deleteMany(args: { where: { id: string; userId: string } }): Promise<{ count: number }>;
  };
}

type Clock = () => Date;

export class PlateRecordError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409 | 503,
    message: string
  ) {
    super(message);
    this.name = "PlateRecordError";
  }
}

export async function createPlateSnapshotForUser(
  userId: string,
  request: PlateRecordRequest,
  client: PlateRecordClient = prisma as unknown as PlateRecordClient,
  clock: Clock = () => new Date()
): Promise<{ snapshot: PlateSnapshotRecord; replayed: boolean }> {
  const calculatedAt = clock();
  const prepared = await prepareSnapshot(userId, request, client, calculatedAt);
  const createData = {
    requestId: request.requestId,
    userId,
    plateType: request.plateType,
    protocolVersion: PLATE_PROTOCOL_VERSION,
    engineVersion: PLATE_ENGINE_VERSIONS[request.plateType],
    inputSnapshot: prepared.inputSnapshot,
    resultSnapshot: prepared.resultSnapshot,
    resultDate: dateKeyInTimeZone(calculatedAt, "Asia/Shanghai"),
    profileUpdatedAt: prepared.profileUpdatedAt,
    calculatedAt
  };

  try {
    const snapshot = await client.plateSnapshot.create({ data: createData });
    return { snapshot, replayed: false };
  } catch (error: unknown) {
    if (!isUniqueConstraintError(error)) {
      throw new PlateRecordError(503, "记录服务暂时不可用，请稍后重试。");
    }

    let existing: PlateSnapshotRecord | null;
    try {
      existing = await client.plateSnapshot.findUnique({
        where: { requestId: request.requestId }
      });
    } catch {
      throw new PlateRecordError(503, "记录服务暂时不可用，请稍后重试。");
    }

    if (!existing || !isSameSaveAttempt(existing, createData)) {
      throw new PlateRecordError(409, "这个保存请求已被使用，请重新发起保存。");
    }
    return { snapshot: existing, replayed: true };
  }
}

export async function getPlateSnapshotForUser(
  userId: string,
  id: string,
  client: PlateRecordClient = prisma as unknown as PlateRecordClient
): Promise<PlateSnapshotRecord> {
  try {
    const snapshot = await client.plateSnapshot.findFirst({ where: { id, userId } });
    if (!snapshot) throw new PlateRecordError(404, "记录不存在。");
    return snapshot;
  } catch (error: unknown) {
    if (error instanceof PlateRecordError) throw error;
    throw new PlateRecordError(503, "记录服务暂时不可用，请稍后重试。");
  }
}

export async function deletePlateSnapshotForUser(
  userId: string,
  id: string,
  client: PlateRecordClient = prisma as unknown as PlateRecordClient
): Promise<void> {
  try {
    const result = await client.plateSnapshot.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new PlateRecordError(404, "记录不存在。");
  } catch (error: unknown) {
    if (error instanceof PlateRecordError) throw error;
    throw new PlateRecordError(503, "记录服务暂时不可用，请稍后重试。");
  }
}

async function prepareSnapshot(
  userId: string,
  request: PlateRecordRequest,
  client: PlateRecordClient,
  calculatedAt: Date
): Promise<{
  inputSnapshot: unknown;
  resultSnapshot: unknown;
  profileUpdatedAt: Date | null;
}> {
  if (request.plateType === "HOME") {
    const assessment = buildHomeSpaceAssessment(request.input.areas);
    return {
      inputSnapshot: toJsonValue({ input: request.input }),
      resultSnapshot: toJsonValue({ assessment }),
      profileUpdatedAt: null
    };
  }

  const profile = await loadRequiredProfile(userId, client);
  const profileSnapshot = {
    gender: normalizeProfileGender(profile.gender),
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    timezone: profile.timezone ?? DEFAULT_BIRTH_TIMEZONE,
    unknownTime: !profile.birthTime
  };
  const selfChartInput = {
    ...profileSnapshot,
    birthLocation: profileSnapshot.birthLocation ?? undefined,
    birthTime: profileSnapshot.birthTime ?? "",
    timezone: profileSnapshot.timezone
  };

  try {
    if (request.plateType === "BAZI") {
      const chart = computeBazi(selfChartInput);
      const structure = buildBaziStructure(chart);
      const mainline = buildBaziMainline(chart);
      const observations = buildBaziObservationCards(chart);
      const weeklyAction = buildBaziWeeklyAction(observations);
      const timeLayers = buildBaziTimeLayers(
        chart,
        dateKeyInTimeZone(calculatedAt, "Asia/Shanghai")
      );
      return {
        inputSnapshot: toJsonValue({ input: request.input, profile: profileSnapshot }),
        resultSnapshot: toJsonValue({
          chart,
          structure,
          mainline,
          observations,
          weeklyAction,
          timeLayers
        }),
        profileUpdatedAt: profile.updatedAt
      };
    }

    if (request.plateType === "RELATION") {
      const selfChart = computeBazi(selfChartInput);
      const otherChart = computeBazi({
        gender: "other",
        birthDate: request.input.otherBirthDate,
        birthTime: "",
        timezone: "Asia/Shanghai",
        unknownTime: true
      });
      const interactionFacts = buildPairInteractionFacts(selfChart, otherChart);
      const observations = buildRelationshipObservationCards(
        interactionFacts,
        request.input.relationshipType
      );
      const jointAction = buildRelationshipJointAction(observations);
      return {
        inputSnapshot: toJsonValue({ input: request.input, profile: profileSnapshot }),
        resultSnapshot: toJsonValue({
          selfChart,
          otherChart,
          interactionFacts,
          observations,
          jointAction
        }),
        profileUpdatedAt: profile.updatedAt
      };
    }

    const selection = buildTimingSelection({
      event: request.input.event,
      startDate: request.input.startDate,
      rangeDays: request.input.rangeDays,
      birthDate: profileSnapshot.birthDate,
      birthTime: profileSnapshot.birthTime,
      birthLocation: profileSnapshot.birthLocation,
      timezone: profileSnapshot.timezone,
      unknownTime: profileSnapshot.unknownTime
    });
    const selectedCandidate = request.input.selectedDate
      ? selection.candidates.find(candidate => candidate.date === request.input.selectedDate)
      : undefined;
    if (request.input.selectedDate && !selectedCandidate) {
      throw new PlateRecordError(409, "所选日期不在本次服务端计算的候选日期中。");
    }
    return {
      inputSnapshot: toJsonValue({ input: request.input, profile: profileSnapshot }),
      resultSnapshot: toJsonValue({ selection, selectedCandidate: selectedCandidate ?? null }),
      profileUpdatedAt: profile.updatedAt
    };
  } catch (error: unknown) {
    if (error instanceof PlateRecordError) throw error;
    throw new PlateRecordError(409, "基础资料暂时无法完成计算，请检查后重试。");
  }
}

async function loadRequiredProfile(
  userId: string,
  client: PlateRecordClient
): Promise<ProfileRecord & { birthDate: string }> {
  let profile: ProfileRecord | null;
  try {
    profile = await client.userProfile.findUnique({
      where: { userId },
      select: {
        birthDate: true,
        birthTime: true,
        birthLocation: true,
        timezone: true,
        gender: true,
        updatedAt: true
      }
    });
  } catch {
    throw new PlateRecordError(503, "基础资料服务暂时不可用，请稍后重试。");
  }

  if (
    !profile ||
    !profile.birthDate ||
    !isRealDateKey(profile.birthDate) ||
    (profile.timezone && !isSupportedBirthTimezone(profile.timezone))
  ) {
    throw new PlateRecordError(409, "请先补全有效的出生资料，再保存这次查看。");
  }
  return profile as ProfileRecord & { birthDate: string };
}

function isSameSaveAttempt(
  existing: PlateSnapshotRecord,
  expected: Record<string, unknown>
): boolean {
  if (existing.userId !== expected.userId || existing.plateType !== expected.plateType) {
    return false;
  }
  const expectedProfileTime = expected.profileUpdatedAt instanceof Date
    ? expected.profileUpdatedAt.getTime()
    : null;
  const existingProfileTime = existing.profileUpdatedAt?.getTime() ?? null;
  return existingProfileTime === expectedProfileTime &&
    canonicalJson(existing.inputSnapshot) === canonicalJson(expected.inputSnapshot);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
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

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function isRealDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}
