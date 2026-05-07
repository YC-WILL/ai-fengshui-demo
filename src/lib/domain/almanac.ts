// ============================================================
// 今日黄历（简化 mock）
//
// MVP 阶段：
//   · 干支日按 bazi.computeBazi 派生
//   · 节气、宜忌、生肖冲煞从内置示例池根据日期 hash 选取
//   · 提供稳定（同一天结果相同）的伪随机
//
// 上线前可接入：HKO/紫金山天文台数据、节气库、第三方黄历 API。
// ============================================================

import { ZODIAC_BY_BRANCH } from "./elements";
import { computeBazi } from "./bazi";
import { ALMANAC_POOL } from "@/data/almanac";

export interface AlmanacToday {
  gregorian: string;       // 2026-05-06
  weekday: string;         // 周三
  lunar: string;           // 农历日（占位文字）
  ganzhiDay: string;       // 干支日
  solarTerm: string;       // 节气
  zodiacOfDay: string;     // 当日地支对应生肖
  goodFor: string[];       // 宜
  badFor: string[];        // 忌
  fiveElement: string;     // 当日五行简述
  zodiacClash: string;     // 冲煞
  luckyHours: string[];    // 吉时
  oneLine: string;         // 今日一句
  cultureNote: string;     // 传统文化解释
}

const WEEKDAY_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function hashDateInt(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(arr: readonly T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function pickN<T>(arr: readonly T[], n: number, seed: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  let i = 0;
  while (result.length < n && used.size < arr.length) {
    const idx = (seed + i * 7) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      result.push(arr[idx]);
    }
    i++;
  }
  return result;
}

const HOUR_SLOTS = [
  "子时(23-01)", "丑时(01-03)", "寅时(03-05)", "卯时(05-07)",
  "辰时(07-09)", "巳时(05-07)", "午时(11-13)", "未时(13-15)",
  "申时(15-17)", "酉时(17-19)", "戌时(19-21)", "亥时(21-23)"
];

export function buildAlmanac(date: Date = new Date()): AlmanacToday {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const seed = hashDateInt(dateStr);

  const chart = computeBazi({
    gender: "other",
    birthDate: dateStr,
    birthTime: "12:00",
    unknownTime: false
  });

  const goodFor = pickN(ALMANAC_POOL.goodFor, 4, seed);
  const badFor = pickN(ALMANAC_POOL.badFor, 3, seed + 17);
  const luckyHours = pickN(HOUR_SLOTS, 3, seed + 41);
  const solarTerm = pick(ALMANAC_POOL.solarTerms, seed + 7);
  const oneLine = pick(ALMANAC_POOL.oneLiners, seed + 23);
  const cultureNote = pick(ALMANAC_POOL.cultureNotes, seed + 31);

  return {
    gregorian: dateStr,
    weekday: WEEKDAY_CN[date.getDay()],
    lunar: `（农历占位，正式上线请接入农历数据源）`,
    ganzhiDay: `${chart.day.pillarLabel}日`,
    solarTerm,
    zodiacOfDay: ZODIAC_BY_BRANCH[chart.day.branch],
    goodFor,
    badFor,
    fiveElement: `日干${chart.day.stem}属${chart.day.stemElement}，整体偏${chart.elementDistribution.strongest}`,
    zodiacClash: zodiacClash(chart.day.branch),
    luckyHours,
    oneLine,
    cultureNote
  };
}

import type { Branch } from "./elements";
const CLASH_MAP: Record<Branch, Branch> = {
  子: "午", 丑: "未", 寅: "申", 卯: "酉", 辰: "戌", 巳: "亥",
  午: "子", 未: "丑", 申: "寅", 酉: "卯", 戌: "辰", 亥: "巳"
};
function zodiacClash(branch: Branch): string {
  return `${ZODIAC_BY_BRANCH[branch]}日，冲${ZODIAC_BY_BRANCH[CLASH_MAP[branch]]}`;
}
