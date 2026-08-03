import { ShouXingUtil } from "lunar-typescript";
import {
  civilTimeToInstant,
  type BaziChart,
  type CivilTime
} from "./bazi";

export const BAZI_BIRTH_MOON_PHASE_FACTS_VERSION = "bazi-birth-moon-phase-facts-v1" as const;
export const BAZI_BIRTH_MOON_PHASE_ALGORITHM_VERSION = "lunar-typescript@1.8.6" as const;
export const BAZI_BIRTH_MOON_PHASE_ASTRONOMY_SOURCE_RULE_ID = "dependency:lunar-typescript:ShouXingUtil:msaLon:msaLonT:dtT" as const;
export const BAZI_BIRTH_MOON_PHASE_CLASSIFICATION_RULE_ID = "project:eight-phase-elongation-sectors-v1" as const;

export const MOON_PHASE_NAMES = [
  "new_moon",
  "waxing_crescent",
  "first_quarter",
  "waxing_gibbous",
  "full_moon",
  "waning_gibbous",
  "last_quarter",
  "waning_crescent"
] as const;

export type MoonPhaseName = (typeof MOON_PHASE_NAMES)[number];
export type BaziBirthMoonPhaseCertainty = "confirmed" | "uncertain" | "unavailable";

export interface BaziBirthMoonPhaseCandidate {
  sampledAtUtc: string;
  elongationDegrees: number;
  moonAgeDays: number;
  phase: MoonPhaseName;
}

export interface BaziBirthMoonPhaseFactsV1 {
  schemaVersion: typeof BAZI_BIRTH_MOON_PHASE_FACTS_VERSION;
  certainty: BaziBirthMoonPhaseCertainty;
  birthTimezone: string;
  birthInstantUtc: string | null;
  elongationDegrees: number | null;
  moonAgeDays: number | null;
  phase: MoonPhaseName | null;
  previousNewMoonAtUtc: string | null;
  nextNewMoonAtUtc: string | null;
  lunationLengthDays: number | null;
  candidates: BaziBirthMoonPhaseCandidate[];
  calculationConvention: "出生地民用时刻按 IANA 时区还原为 UTC 瞬间，换算为 TT 儒略世纪后计算月亮减太阳的黄经差，并以相邻天文朔时计算月龄";
  phaseClassificationConvention: "以日月黄经差归一化至 0≤角度<360°，按以 0°、45°、90°、135°、180°、225°、270°、315° 为中心的八个等宽 45° 扇区分类";
  algorithmVersion: typeof BAZI_BIRTH_MOON_PHASE_ALGORITHM_VERSION;
  astronomySourceRuleId: typeof BAZI_BIRTH_MOON_PHASE_ASTRONOMY_SOURCE_RULE_ID;
  classificationRuleId: typeof BAZI_BIRTH_MOON_PHASE_CLASSIFICATION_RULE_ID;
  unavailableReason: "calculation_failed" | null;
}

interface MoonPhaseSnapshot {
  instant: Date;
  elongationDegrees: number;
  moonAgeDays: number;
  phase: MoonPhaseName;
  previousNewMoonAt: Date;
  nextNewMoonAt: Date;
  lunationLengthDays: number;
}

const CALCULATION_CONVENTION = "出生地民用时刻按 IANA 时区还原为 UTC 瞬间，换算为 TT 儒略世纪后计算月亮减太阳的黄经差，并以相邻天文朔时计算月龄" as const;
const PHASE_CLASSIFICATION_CONVENTION = "以日月黄经差归一化至 0≤角度<360°，按以 0°、45°、90°、135°、180°、225°、270°、315° 为中心的八个等宽 45° 扇区分类" as const;
const JULIAN_DAY_UNIX_EPOCH = 2440587.5;
const JULIAN_DAY_J2000 = 2451545;
const DAYS_PER_JULIAN_CENTURY = 36525;
const MILLISECONDS_PER_DAY = 86400000;
const FULL_CIRCLE_RADIANS = Math.PI * 2;
const RADIANS_TO_DEGREES = 180 / Math.PI;

function round(value: number, decimalPlaces: number) {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

export function classifyMoonPhase(elongationDegrees: number): MoonPhaseName {
  if (!Number.isFinite(elongationDegrees)) throw new Error("invalid elongation");
  const normalized = normalizeDegrees(elongationDegrees);
  const sector = Math.floor(((normalized + 22.5) % 360) / 45);
  return MOON_PHASE_NAMES[sector];
}

function julianDaysFromJ2000(instant: Date) {
  return instant.getTime() / MILLISECONDS_PER_DAY
    + JULIAN_DAY_UNIX_EPOCH
    - JULIAN_DAY_J2000;
}

function terrestrialTimeCenturies(instant: Date) {
  const utcDays = julianDaysFromJ2000(instant);
  return (utcDays + ShouXingUtil.dtT(utcDays)) / DAYS_PER_JULIAN_CENTURY;
}

function utcInstantFromTerrestrialTimeCenturies(ttCenturies: number) {
  const ttDays = ttCenturies * DAYS_PER_JULIAN_CENTURY;
  let utcDays = ttDays - ShouXingUtil.dtT(ttDays);
  utcDays = ttDays - ShouXingUtil.dtT(utcDays);
  const unixMilliseconds = (
    JULIAN_DAY_J2000
    + utcDays
    - JULIAN_DAY_UNIX_EPOCH
  ) * MILLISECONDS_PER_DAY;
  return new Date(Math.round(unixMilliseconds / 1000) * 1000);
}

function newMoonInstant(cycleAngleRadians: number) {
  return utcInstantFromTerrestrialTimeCenturies(
    ShouXingUtil.msaLonT(cycleAngleRadians)
  );
}

function snapshotAtInstant(instant: Date): MoonPhaseSnapshot {
  if (!Number.isFinite(instant.getTime())) throw new Error("invalid instant");
  const ttCenturies = terrestrialTimeCenturies(instant);
  const rawElongationRadians = ShouXingUtil.msaLon(ttCenturies, -1, 60);
  const normalizedElongationRadians = (
    (rawElongationRadians % FULL_CIRCLE_RADIANS)
    + FULL_CIRCLE_RADIANS
  ) % FULL_CIRCLE_RADIANS;
  let cycleIndex = Math.floor(rawElongationRadians / FULL_CIRCLE_RADIANS);
  let previousNewMoonAt = newMoonInstant(cycleIndex * FULL_CIRCLE_RADIANS);

  if (previousNewMoonAt.getTime() > instant.getTime()) {
    cycleIndex -= 1;
    previousNewMoonAt = newMoonInstant(cycleIndex * FULL_CIRCLE_RADIANS);
  }
  let nextNewMoonAt = newMoonInstant((cycleIndex + 1) * FULL_CIRCLE_RADIANS);
  if (nextNewMoonAt.getTime() <= instant.getTime()) {
    cycleIndex += 1;
    previousNewMoonAt = nextNewMoonAt;
    nextNewMoonAt = newMoonInstant((cycleIndex + 1) * FULL_CIRCLE_RADIANS);
  }

  const elongationDegrees = normalizedElongationRadians * RADIANS_TO_DEGREES;
  return {
    instant,
    elongationDegrees: round(elongationDegrees, 3),
    moonAgeDays: round(
      (instant.getTime() - previousNewMoonAt.getTime()) / MILLISECONDS_PER_DAY,
      4
    ),
    phase: classifyMoonPhase(elongationDegrees),
    previousNewMoonAt,
    nextNewMoonAt,
    lunationLengthDays: round(
      (nextNewMoonAt.getTime() - previousNewMoonAt.getTime()) / MILLISECONDS_PER_DAY,
      4
    )
  };
}

function parseBirthDate(birthDate: string) {
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("invalid birth date");
  const value = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
  const check = new Date(Date.UTC(value.year, value.month - 1, value.day));
  if (
    check.getUTCFullYear() !== value.year
    || check.getUTCMonth() !== value.month - 1
    || check.getUTCDate() !== value.day
  ) {
    throw new Error("invalid birth date");
  }
  return value;
}

function instantForLocalTime(
  date: ReturnType<typeof parseBirthDate>,
  hour: number,
  minute: number,
  second: number,
  timezone: string
) {
  const civil: CivilTime = { ...date, hour, minute, second };
  return civilTimeToInstant(civil, timezone);
}

function candidate(snapshot: MoonPhaseSnapshot): BaziBirthMoonPhaseCandidate {
  return {
    sampledAtUtc: snapshot.instant.toISOString(),
    elongationDegrees: snapshot.elongationDegrees,
    moonAgeDays: snapshot.moonAgeDays,
    phase: snapshot.phase
  };
}

function baseFacts(birthTimezone: string): Pick<
  BaziBirthMoonPhaseFactsV1,
  | "schemaVersion"
  | "birthTimezone"
  | "calculationConvention"
  | "phaseClassificationConvention"
  | "algorithmVersion"
  | "astronomySourceRuleId"
  | "classificationRuleId"
> {
  return {
    schemaVersion: BAZI_BIRTH_MOON_PHASE_FACTS_VERSION,
    birthTimezone,
    calculationConvention: CALCULATION_CONVENTION,
    phaseClassificationConvention: PHASE_CLASSIFICATION_CONVENTION,
    algorithmVersion: BAZI_BIRTH_MOON_PHASE_ALGORITHM_VERSION,
    astronomySourceRuleId: BAZI_BIRTH_MOON_PHASE_ASTRONOMY_SOURCE_RULE_ID,
    classificationRuleId: BAZI_BIRTH_MOON_PHASE_CLASSIFICATION_RULE_ID
  };
}

export function buildBaziBirthMoonPhaseFacts(
  chart: BaziChart
): BaziBirthMoonPhaseFactsV1 {
  const birthTimezone = chart.calculation.timezone;
  const common = baseFacts(birthTimezone);
  try {
    const date = parseBirthDate(chart.inputSnapshot.birthDate);
    if (!chart.calculation.timeKnown) {
      const start = snapshotAtInstant(instantForLocalTime(
        date, 0, 0, 0, birthTimezone
      ));
      const end = snapshotAtInstant(instantForLocalTime(
        date, 23, 59, 59, birthTimezone
      ));
      return {
        ...common,
        certainty: "uncertain",
        birthInstantUtc: null,
        elongationDegrees: null,
        moonAgeDays: null,
        phase: null,
        previousNewMoonAtUtc: null,
        nextNewMoonAtUtc: null,
        lunationLengthDays: null,
        candidates: [candidate(start), candidate(end)],
        unavailableReason: null
      };
    }

    const timeMatch = chart.inputSnapshot.birthTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) throw new Error("invalid birth time");
    const snapshot = snapshotAtInstant(instantForLocalTime(
      date,
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      0,
      birthTimezone
    ));
    return {
      ...common,
      certainty: "confirmed",
      birthInstantUtc: snapshot.instant.toISOString(),
      elongationDegrees: snapshot.elongationDegrees,
      moonAgeDays: snapshot.moonAgeDays,
      phase: snapshot.phase,
      previousNewMoonAtUtc: snapshot.previousNewMoonAt.toISOString(),
      nextNewMoonAtUtc: snapshot.nextNewMoonAt.toISOString(),
      lunationLengthDays: snapshot.lunationLengthDays,
      candidates: [],
      unavailableReason: null
    };
  } catch {
    return {
      ...common,
      certainty: "unavailable",
      birthInstantUtc: null,
      elongationDegrees: null,
      moonAgeDays: null,
      phase: null,
      previousNewMoonAtUtc: null,
      nextNewMoonAtUtc: null,
      lunationLengthDays: null,
      candidates: [],
      unavailableReason: "calculation_failed"
    };
  }
}
