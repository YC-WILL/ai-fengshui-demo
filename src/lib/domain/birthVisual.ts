import { computeBazi } from "./bazi";
import { currentSolarTerm } from "./dailyCorrespondence";
import { STEM_ELEMENT, type Element, type Stem } from "./elements";
import type { BirthProfileInput } from "./dailyCorrespondence";

export type TrigramId = "qian" | "dui" | "li" | "zhen" | "xun" | "kan" | "gen" | "kun";

export interface BirthVisual {
  date: string;
  solarTerm: string;
  birthDayPillar: string;
  todayDayPillar: string;
  pillars: string[];
  hourKnown: boolean;
  bodyTrigram: { id: TrigramId; name: string; binary: string };
  useTrigram: { id: TrigramId; name: string; binary: string };
  hexagramBinary: string;
  elements: Array<{ element: Element; count: number; ratio: number }>;
  methodNote: string;
}

const TRIGRAMS: Record<TrigramId, { name: string; binary: string }> = {
  qian: { name: "乾", binary: "111" },
  dui: { name: "兑", binary: "110" },
  li: { name: "离", binary: "101" },
  zhen: { name: "震", binary: "100" },
  xun: { name: "巽", binary: "011" },
  kan: { name: "坎", binary: "010" },
  gen: { name: "艮", binary: "001" },
  kun: { name: "坤", binary: "000" }
};

// 以天干自身的阴阳与五行归入八卦。水、火各只有一个对应卦。
const STEM_TRIGRAM: Record<Stem, TrigramId> = {
  甲: "zhen", 乙: "xun",
  丙: "li", 丁: "li",
  戊: "gen", 己: "kun",
  庚: "qian", 辛: "dui",
  壬: "kan", 癸: "kan"
};

export function buildBirthVisual(profile: BirthProfileInput, dateKey: string): BirthVisual {
  const birthChart = computeBazi({
    gender: "other",
    birthDate: profile.birthDate,
    birthTime: profile.birthTime ?? "",
    birthLocation: profile.birthLocation ?? undefined,
    timezone: profile.timezone ?? undefined,
    unknownTime: !profile.birthTime
  });
  const todayChart = computeBazi({
    gender: "other",
    birthDate: dateKey,
    birthTime: "12:00",
    unknownTime: false
  });
  const bodyId = STEM_TRIGRAM[birthChart.dayMaster];
  const useId = STEM_TRIGRAM[todayChart.dayMaster];
  const counts = birthChart.elementDistribution.counts;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const order: Element[] = ["木", "火", "土", "金", "水"];

  return {
    date: dateKey,
    solarTerm: currentSolarTerm(dateKey).name,
    birthDayPillar: birthChart.day.pillarLabel,
    todayDayPillar: todayChart.day.pillarLabel,
    pillars: [
      birthChart.year.pillarLabel,
      birthChart.month.pillarLabel,
      birthChart.day.pillarLabel,
      ...(birthChart.hour ? [birthChart.hour.pillarLabel] : [])
    ],
    hourKnown: Boolean(birthChart.hour),
    bodyTrigram: { id: bodyId, ...TRIGRAMS[bodyId] },
    useTrigram: { id: useId, ...TRIGRAMS[useId] },
    // 周易数据库按自下而上保存：下卦三爻在前，上卦三爻在后。
    hexagramBinary: `${TRIGRAMS[bodyId].binary}${TRIGRAMS[useId].binary}`,
    elements: order.map(element => ({
      element,
      count: counts[element],
      ratio: total > 0 ? counts[element] / total : 0
    })),
    methodNote: `以生辰日干${birthChart.dayMaster}（${STEM_ELEMENT[birthChart.dayMaster]}）定下卦为体，以今日天干${todayChart.dayMaster}（${STEM_ELEMENT[todayChart.dayMaster]}）定上卦为用。此为蟾先森固定展示口径，不替代其他起卦法；出生在立春或交节日期附近时，年、月柱仍需按具体时刻复核。`
  };
}
