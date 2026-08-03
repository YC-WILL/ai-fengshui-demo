import { Solar } from "lunar-typescript";
import type { BaziChart } from "./bazi";
import { BRANCHES, type Branch } from "./elements";

export const BAZI_BIRTH_XIU_FACTS_VERSION = "bazi-birth-xiu-facts-v1" as const;
export const BAZI_BIRTH_XIU_ALGORITHM_VERSION = "lunar-typescript@1.8.6" as const;
export const BAZI_BIRTH_XIU_SOURCE_RULE_ID = "dependency:lunar-typescript:Lunar:getXiu:getZheng:getAnimal:getGong:getShou" as const;

export const XIU_NAMES = [
  "角", "亢", "氐", "房", "心", "尾", "箕",
  "斗", "牛", "女", "虚", "危", "室", "壁",
  "奎", "娄", "胃", "昴", "毕", "觜", "参",
  "井", "鬼", "柳", "星", "张", "翼", "轸"
] as const;

export type XiuName = (typeof XIU_NAMES)[number];
export type XiuZheng = "日" | "月" | "火" | "水" | "木" | "金" | "土";
export type XiuGong = "东" | "南" | "西" | "北";
export type XiuShou = "青龙" | "朱雀" | "白虎" | "玄武";

export interface BaziBirthXiuFactsV1 {
  schemaVersion: typeof BAZI_BIRTH_XIU_FACTS_VERSION;
  certainty: "confirmed" | "unavailable";
  calculationKind: "traditional_daily_xiu";
  birthTimezone: string;
  birthCivilDate: string;
  timeKnown: boolean;
  xiu: XiuName | null;
  zheng: XiuZheng | null;
  animal: string | null;
  gong: XiuGong | null;
  shou: XiuShou | null;
  dayBranch: Branch | null;
  weekdayIndex: number | null;
  dayBoundary: "出生地民用日期 00:00 换日";
  calculationConvention: "按出生地民用日期生成传统历法日值，以该日的日支与星期查得二十八宿；本合同不表示出生瞬间月球在天球中的实际星宿位置";
  algorithmVersion: typeof BAZI_BIRTH_XIU_ALGORITHM_VERSION;
  sourceRuleId: typeof BAZI_BIRTH_XIU_SOURCE_RULE_ID;
  unavailableReason: "calculation_failed" | null;
}

const CALCULATION_CONVENTION = "按出生地民用日期生成传统历法日值，以该日的日支与星期查得二十八宿；本合同不表示出生瞬间月球在天球中的实际星宿位置" as const;
const XIU_ZHENG = ["日", "月", "火", "水", "木", "金", "土"] as const;
const XIU_GONG = ["东", "南", "西", "北"] as const;
const XIU_SHOU = ["青龙", "朱雀", "白虎", "玄武"] as const;

function parseBirthDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("invalid birth date");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== day
  ) {
    throw new Error("invalid birth date");
  }
  return { year, month, day };
}

function baseFacts(chart: BaziChart): Pick<
  BaziBirthXiuFactsV1,
  | "schemaVersion"
  | "calculationKind"
  | "birthTimezone"
  | "birthCivilDate"
  | "timeKnown"
  | "dayBoundary"
  | "calculationConvention"
  | "algorithmVersion"
  | "sourceRuleId"
> {
  return {
    schemaVersion: BAZI_BIRTH_XIU_FACTS_VERSION,
    calculationKind: "traditional_daily_xiu",
    birthTimezone: chart.calculation.timezone,
    birthCivilDate: chart.inputSnapshot.birthDate,
    timeKnown: chart.calculation.timeKnown,
    dayBoundary: "出生地民用日期 00:00 换日",
    calculationConvention: CALCULATION_CONVENTION,
    algorithmVersion: BAZI_BIRTH_XIU_ALGORITHM_VERSION,
    sourceRuleId: BAZI_BIRTH_XIU_SOURCE_RULE_ID
  };
}

export function buildBaziBirthXiuFacts(chart: BaziChart): BaziBirthXiuFactsV1 {
  const common = baseFacts(chart);
  try {
    const { year, month, day } = parseBirthDate(chart.inputSnapshot.birthDate);
    const lunar = Solar.fromYmd(year, month, day).getLunar();
    const xiu = lunar.getXiu();
    const zheng = lunar.getZheng();
    const animal = lunar.getAnimal();
    const gong = lunar.getGong();
    const shou = lunar.getShou();
    const dayBranch = lunar.getDayZhi();
    const weekdayIndex = lunar.getWeek();
    if (
      !XIU_NAMES.includes(xiu as XiuName)
      || !XIU_ZHENG.includes(zheng as XiuZheng)
      || animal.length === 0
      || !XIU_GONG.includes(gong as XiuGong)
      || !XIU_SHOU.includes(shou as XiuShou)
      || !BRANCHES.includes(dayBranch as Branch)
      || !Number.isInteger(weekdayIndex)
      || weekdayIndex < 0
      || weekdayIndex > 6
    ) {
      throw new Error("invalid xiu result");
    }
    return {
      ...common,
      certainty: "confirmed",
      xiu: xiu as XiuName,
      zheng: zheng as XiuZheng,
      animal,
      gong: gong as XiuGong,
      shou: shou as XiuShou,
      dayBranch: dayBranch as Branch,
      weekdayIndex,
      unavailableReason: null
    };
  } catch {
    return {
      ...common,
      certainty: "unavailable",
      xiu: null,
      zheng: null,
      animal: null,
      gong: null,
      shou: null,
      dayBranch: null,
      weekdayIndex: null,
      unavailableReason: "calculation_failed"
    };
  }
}
