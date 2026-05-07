// ============================================================
// 五行 / 天干地支 基础数据与工具
// ============================================================

export type Element = "木" | "火" | "土" | "金" | "水";
export type YinYang = "阳" | "阴";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Stem = (typeof STEMS)[number];
export type Branch = (typeof BRANCHES)[number];

export const STEM_ELEMENT: Record<Stem, Element> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水"
};

export const BRANCH_ELEMENT: Record<Branch, Element> = {
  子: "水", 亥: "水",
  寅: "木", 卯: "木",
  巳: "火", 午: "火",
  申: "金", 酉: "金",
  辰: "土", 丑: "土", 戌: "土", 未: "土"
};

export const STEM_YIN_YANG: Record<Stem, YinYang> = {
  甲: "阳", 丙: "阳", 戊: "阳", 庚: "阳", 壬: "阳",
  乙: "阴", 丁: "阴", 己: "阴", 辛: "阴", 癸: "阴"
};

export const BRANCH_YIN_YANG: Record<Branch, YinYang> = {
  子: "阳", 寅: "阳", 辰: "阳", 午: "阳", 申: "阳", 戌: "阳",
  丑: "阴", 卯: "阴", 巳: "阴", 未: "阴", 酉: "阴", 亥: "阴"
};

export const ZODIAC_BY_BRANCH: Record<Branch, string> = {
  子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇",
  午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪"
};

// 相生 / 相克
export const SHENG: Record<Element, Element> = {
  木: "火", 火: "土", 土: "金", 金: "水", 水: "木"
};
export const KE: Record<Element, Element> = {
  木: "土", 土: "水", 水: "火", 火: "金", 金: "木"
};

export const ALL_ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];

/**
 * 统计五行分布。返回每个五行出现次数 + 占比。
 */
export function elementDistribution(elements: Element[]) {
  const counts: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const e of elements) counts[e] = (counts[e] ?? 0) + 1;
  const total = elements.length || 1;
  const ratios: Record<Element, number> = {} as Record<Element, number>;
  for (const e of ALL_ELEMENTS) ratios[e] = +(counts[e] / total).toFixed(2);
  return {
    counts,
    ratios,
    strongest: (Object.keys(counts) as Element[]).reduce((a, b) =>
      counts[a] >= counts[b] ? a : b
    ),
    weakest: (Object.keys(counts) as Element[]).reduce((a, b) =>
      counts[a] <= counts[b] ? a : b
    ),
    missing: ALL_ELEMENTS.filter(e => counts[e] === 0)
  };
}
