import { Solar } from "lunar-typescript";
import {
  civilTimeToInstant,
  partsInTimezone,
  type BaziChart,
  type CivilTime
} from "./bazi";
import { DEFAULT_BIRTH_TIMEZONE } from "./birthTimezone";

export const BAZI_BIRTH_SOLAR_TERM_FACTS_VERSION = "bazi-birth-solar-term-facts-v1" as const;
export const BAZI_BIRTH_SOLAR_TERM_ALGORITHM_VERSION = "lunar-typescript@1.8.6" as const;
export const BAZI_BIRTH_SOLAR_TERM_SOURCE_RULE_ID = "dependency:lunar-typescript:getPrevJieQi:getNextJieQi" as const;

export const SOLAR_TERM_NAMES = [
  "小寒", "大寒", "立春", "雨水", "惊蛰", "春分",
  "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
  "小暑", "大暑", "立秋", "处暑", "白露", "秋分",
  "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
] as const;

export type SolarTermName = (typeof SOLAR_TERM_NAMES)[number];
export type BaziBirthSolarTermCertainty = "confirmed" | "uncertain" | "unavailable";

export interface BaziBirthSolarTermCandidate {
  name: SolarTermName;
  startedAt: string;
}

export interface BaziBirthSolarTermFactsV1 {
  schemaVersion: typeof BAZI_BIRTH_SOLAR_TERM_FACTS_VERSION;
  certainty: BaziBirthSolarTermCertainty;
  currentTerm: SolarTermName | null;
  currentTermStartedAt: string | null;
  nextTerm: SolarTermName | null;
  nextTermStartsAt: string | null;
  timezone: string;
  candidates: BaziBirthSolarTermCandidate[];
  calculationConvention: "出生地民用时刻按 IANA 时区还原为真实时刻，再与中国标准时表达的精确交节时刻比较";
  algorithmVersion: typeof BAZI_BIRTH_SOLAR_TERM_ALGORITHM_VERSION;
  sourceRuleId: typeof BAZI_BIRTH_SOLAR_TERM_SOURCE_RULE_ID;
  unavailableReason: "calculation_failed" | null;
}

interface ResolvedSolarTermMoment {
  current: BaziBirthSolarTermCandidate;
  next: BaziBirthSolarTermCandidate;
}

const CALCULATION_CONVENTION = "出生地民用时刻按 IANA 时区还原为真实时刻，再与中国标准时表达的精确交节时刻比较" as const;
const SOLAR_TERM_NAME_SET = new Set<string>(SOLAR_TERM_NAMES);

function parseBirthDate(birthDate: string) {
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("invalid birth date");
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function solarTermName(value: string): SolarTermName {
  if (!SOLAR_TERM_NAME_SET.has(value)) throw new Error("unknown solar term");
  return value as SolarTermName;
}

function solarMomentToInstant(solar: Solar): Date {
  return civilTimeToInstant({
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    hour: solar.getHour(),
    minute: solar.getMinute(),
    second: solar.getSecond()
  }, DEFAULT_BIRTH_TIMEZONE);
}

function termMoment(name: string, solar: Solar): BaziBirthSolarTermCandidate {
  return {
    name: solarTermName(name),
    startedAt: solarMomentToInstant(solar).toISOString()
  };
}

function resolveAtInstant(instant: Date): ResolvedSolarTermMoment {
  const chinaTime = partsInTimezone(instant, DEFAULT_BIRTH_TIMEZONE);
  const lunar = Solar.fromYmdHms(
    chinaTime.year,
    chinaTime.month,
    chinaTime.day,
    chinaTime.hour,
    chinaTime.minute,
    chinaTime.second
  ).getLunar();
  const current = lunar.getPrevJieQi(false);
  const next = lunar.getNextJieQi(false);
  return {
    current: termMoment(current.getName(), current.getSolar()),
    next: termMoment(next.getName(), next.getSolar())
  };
}

function localMoment(
  date: ReturnType<typeof parseBirthDate>,
  hour: number,
  minute: number,
  second: number,
  timezone: string
) {
  const civil: CivilTime = { ...date, hour, minute, second };
  return civilTimeToInstant(civil, timezone);
}

function baseFacts(timezone: string): Pick<
  BaziBirthSolarTermFactsV1,
  "schemaVersion" | "timezone" | "calculationConvention" | "algorithmVersion" | "sourceRuleId"
> {
  return {
    schemaVersion: BAZI_BIRTH_SOLAR_TERM_FACTS_VERSION,
    timezone,
    calculationConvention: CALCULATION_CONVENTION,
    algorithmVersion: BAZI_BIRTH_SOLAR_TERM_ALGORITHM_VERSION,
    sourceRuleId: BAZI_BIRTH_SOLAR_TERM_SOURCE_RULE_ID
  };
}

export function buildBaziBirthSolarTermFacts(
  chart: BaziChart
): BaziBirthSolarTermFactsV1 {
  const timezone = chart.calculation.timezone;
  const common = baseFacts(timezone);
  try {
    const date = parseBirthDate(chart.inputSnapshot.birthDate);
    if (chart.calculation.timeKnown) {
      const match = chart.inputSnapshot.birthTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      if (!match) throw new Error("invalid birth time");
      const resolved = resolveAtInstant(localMoment(
        date,
        Number(match[1]),
        Number(match[2]),
        0,
        timezone
      ));
      return {
        ...common,
        certainty: "confirmed",
        currentTerm: resolved.current.name,
        currentTermStartedAt: resolved.current.startedAt,
        nextTerm: resolved.next.name,
        nextTermStartsAt: resolved.next.startedAt,
        candidates: [],
        unavailableReason: null
      };
    }

    const start = resolveAtInstant(localMoment(date, 0, 0, 0, timezone));
    const end = resolveAtInstant(localMoment(date, 23, 59, 59, timezone));
    if (
      start.current.name === end.current.name
      && start.current.startedAt === end.current.startedAt
    ) {
      return {
        ...common,
        certainty: "confirmed",
        currentTerm: start.current.name,
        currentTermStartedAt: start.current.startedAt,
        nextTerm: start.next.name,
        nextTermStartsAt: start.next.startedAt,
        candidates: [],
        unavailableReason: null
      };
    }

    return {
      ...common,
      certainty: "uncertain",
      currentTerm: null,
      currentTermStartedAt: null,
      nextTerm: null,
      nextTermStartsAt: null,
      candidates: [start.current, end.current],
      unavailableReason: null
    };
  } catch {
    return {
      ...common,
      certainty: "unavailable",
      currentTerm: null,
      currentTermStartedAt: null,
      nextTerm: null,
      nextTermStartsAt: null,
      candidates: [],
      unavailableReason: "calculation_failed"
    };
  }
}
