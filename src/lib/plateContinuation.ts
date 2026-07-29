import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  PLATE_ENGINE_VERSIONS,
  PLATE_PROTOCOL_VERSION,
  type PlateType
} from "@/lib/plateVersions";
import type {
  HomeAreaId,
  HomeIssueId,
  HomeSpaceInput
} from "@/lib/domain/homeSpaceObservations";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";
import type { DateSelectionEvent } from "@/lib/types";

const dateKeySchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isRealDateKey);

const relationInputSchema = z.object({
  relationshipType: z.enum(["partner", "family", "friend", "cooperation"]),
  otherBirthDate: dateKeySchema,
  otherNickname: z.string().trim().max(40).transform(value => value || undefined).optional()
}).strict();

const AREA_ISSUES = {
  entry: [
    "entry_clutter",
    "entry_passage_blocked",
    "entry_dim",
    "entry_door_collision",
    "entry_emergency_exit_blocked"
  ],
  rest: [
    "rest_persistent_noise",
    "rest_night_strong_light",
    "rest_poor_ventilation",
    "rest_damp_mold",
    "rest_bump_passage",
    "rest_insufficient_privacy"
  ],
  kitchen: [
    "kitchen_poor_exhaust",
    "kitchen_workspace_interference",
    "kitchen_backtracking",
    "kitchen_heat_hazard",
    "kitchen_passage_blocked"
  ]
} as const;

function areaSchema<T extends readonly [string, ...string[]]>(values: T) {
  return z.object({
    reviewed: z.literal(true),
    issues: z.array(z.enum(values)).transform(items => [...new Set(items)].sort())
  }).strict();
}

const homeInputSchema = z.object({
  areas: z.object({
    entry: areaSchema(AREA_ISSUES.entry).optional(),
    rest: areaSchema(AREA_ISSUES.rest).optional(),
    kitchen: areaSchema(AREA_ISSUES.kitchen).optional()
  }).strict().refine(
    areas => Object.values(areas).some(area => area?.reviewed === true),
    "至少需要一处已确认区域"
  )
}).strict();

const timingInputSchema = z.object({
  event: z.enum(["wedding", "moving", "opening", "signing", "travel", "renovation_start"]),
  startDate: dateKeySchema,
  rangeDays: z.union([z.literal(7), z.literal(30)]),
  selectedDate: dateKeySchema.optional()
}).strict();

const ENVELOPE_SCHEMAS = {
  BAZI: z.object({ input: z.object({}).strict() }).passthrough(),
  RELATION: z.object({ input: relationInputSchema }).passthrough(),
  HOME: z.object({ input: homeInputSchema }).passthrough(),
  TIMING: z.object({ input: timingInputSchema }).passthrough()
} as const;

export type PlateContinuation =
  | { sourceId: string; plateType: "BAZI"; input: Record<string, never> }
  | {
      sourceId: string;
      plateType: "RELATION";
      input: {
        relationshipType: RelationshipType;
        otherBirthDate: string;
        otherNickname?: string;
      };
    }
  | { sourceId: string; plateType: "HOME"; input: { areas: HomeSpaceInput } }
  | {
      sourceId: string;
      plateType: "TIMING";
      input: {
        event: DateSelectionEvent;
        startDate: string;
        rangeDays: 7 | 30;
        selectedDate?: string;
      };
    };

export type TimingContinuationMode = "original" | "today";

export interface TimingContinuationInitial {
  sourceId: string;
  event: DateSelectionEvent;
  startDate: string;
  rangeDays: 7 | 30;
  preferredSelectedDate: string | null;
  mode: TimingContinuationMode;
}

export async function loadPlateContinuation(
  userId: string,
  snapshotId: string,
  expectedPlateType: PlateType,
  client: PlateContinuationClient = prisma as unknown as PlateContinuationClient
): Promise<PlateContinuation | null> {
  if (!z.string().uuid().safeParse(snapshotId).success) return null;
  const snapshot = await client.plateSnapshot.findFirst({
    where: { id: snapshotId, userId },
    select: {
      id: true,
      plateType: true,
      protocolVersion: true,
      engineVersion: true,
      inputSnapshot: true
    }
  });
  if (
    !snapshot ||
    snapshot.plateType !== expectedPlateType ||
    snapshot.protocolVersion !== PLATE_PROTOCOL_VERSION ||
    snapshot.engineVersion !== PLATE_ENGINE_VERSIONS[expectedPlateType]
  ) {
    return null;
  }

  const envelope = ENVELOPE_SCHEMAS[expectedPlateType].safeParse(snapshot.inputSnapshot);
  if (!envelope.success) return null;

  if (expectedPlateType === "BAZI") {
    return { sourceId: snapshot.id, plateType: "BAZI", input: {} };
  }
  if (expectedPlateType === "RELATION") {
    const input = relationInputSchema.parse(envelope.data.input);
    return { sourceId: snapshot.id, plateType: "RELATION", input };
  }
  if (expectedPlateType === "HOME") {
    const input = homeInputSchema.parse(envelope.data.input);
    return {
      sourceId: snapshot.id,
      plateType: "HOME",
      input: { areas: cloneHomeInput(input.areas as HomeSpaceInput) }
    };
  }
  const input = timingInputSchema.parse(envelope.data.input);
  return { sourceId: snapshot.id, plateType: "TIMING", input };
}

export function resolveTimingContinuation(
  continuation: Extract<PlateContinuation, { plateType: "TIMING" }>,
  mode: TimingContinuationMode,
  today: string
): TimingContinuationInitial {
  if (!dateKeySchema.safeParse(today).success) {
    throw new Error("当前日期不可用");
  }
  return {
    sourceId: continuation.sourceId,
    event: continuation.input.event,
    startDate: mode === "original" ? continuation.input.startDate : today,
    rangeDays: continuation.input.rangeDays,
    preferredSelectedDate: mode === "original"
      ? continuation.input.selectedDate ?? null
      : null,
    mode
  };
}

export function resolveTimingCandidatePreference(
  candidateDates: string[],
  preferredSelectedDate: string | null
): {
  selectedDate: string | null;
  warning: string | null;
} {
  if (!preferredSelectedDate) {
    return { selectedDate: candidateDates[0] ?? null, warning: null };
  }
  if (candidateDates.includes(preferredSelectedDate)) {
    return { selectedDate: preferredSelectedDate, warning: null };
  }
  if (candidateDates.length === 0) {
    return {
      selectedDate: null,
      warning: "原选中日期已不在当前候选中，当前也没有可选日期。"
    };
  }
  return {
    selectedDate: candidateDates[0] ?? null,
    warning: "原选中日期已不在当前候选中，已改为当前第一个候选。"
  };
}

export function cloneHomeInput(input: HomeSpaceInput): HomeSpaceInput {
  const output: HomeSpaceInput = {};
  for (const area of ["entry", "rest", "kitchen"] as HomeAreaId[]) {
    const value = input[area];
    if (!value) continue;
    output[area] = {
      reviewed: true,
      issues: [...value.issues] as HomeIssueId[]
    };
  }
  return output;
}

interface PlateContinuationSnapshot {
  id: string;
  plateType: string;
  protocolVersion: string;
  engineVersion: string;
  inputSnapshot: unknown;
}

export interface PlateContinuationClient {
  plateSnapshot: {
    findFirst(args: {
      where: { id: string; userId: string };
      select: {
        id: true;
        plateType: true;
        protocolVersion: true;
        engineVersion: true;
        inputSnapshot: true;
      };
    }): Promise<PlateContinuationSnapshot | null>;
  };
}

function isRealDateKey(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}
