import type { BaziChart, Pillar } from "./bazi";
import {
  BRANCH_ELEMENT,
  KE,
  SHENG,
  STEM_ELEMENT,
  STEM_YIN_YANG,
  type Branch,
  type Element,
  type Stem
} from "./elements";

export const PILLAR_NAMES = ["年柱", "月柱", "日柱", "时柱"] as const;
export type PillarName = (typeof PILLAR_NAMES)[number];
export type QiLevel = "本气" | "中气" | "余气";
export type TenGodName = "比肩" | "劫财" | "食神" | "伤官" | "偏财" | "正财" | "七杀" | "正官" | "偏印" | "正印";
export type TenGodRelation = "同我" | "我生" | "我克" | "克我" | "生我";

interface HiddenStemDefinition {
  stem: Stem;
  qiLevel: QiLevel;
}

const HIDDEN_STEMS: Record<Branch, readonly HiddenStemDefinition[]> = {
  子: [{ stem: "癸", qiLevel: "本气" }],
  丑: [{ stem: "己", qiLevel: "本气" }, { stem: "癸", qiLevel: "中气" }, { stem: "辛", qiLevel: "余气" }],
  寅: [{ stem: "甲", qiLevel: "本气" }, { stem: "丙", qiLevel: "中气" }, { stem: "戊", qiLevel: "余气" }],
  卯: [{ stem: "乙", qiLevel: "本气" }],
  辰: [{ stem: "戊", qiLevel: "本气" }, { stem: "乙", qiLevel: "中气" }, { stem: "癸", qiLevel: "余气" }],
  巳: [{ stem: "丙", qiLevel: "本气" }, { stem: "戊", qiLevel: "中气" }, { stem: "庚", qiLevel: "余气" }],
  午: [{ stem: "丁", qiLevel: "本气" }, { stem: "己", qiLevel: "中气" }],
  未: [{ stem: "己", qiLevel: "本气" }, { stem: "丁", qiLevel: "中气" }, { stem: "乙", qiLevel: "余气" }],
  申: [{ stem: "庚", qiLevel: "本气" }, { stem: "壬", qiLevel: "中气" }, { stem: "戊", qiLevel: "余气" }],
  酉: [{ stem: "辛", qiLevel: "本气" }],
  戌: [{ stem: "戊", qiLevel: "本气" }, { stem: "辛", qiLevel: "中气" }, { stem: "丁", qiLevel: "余气" }],
  亥: [{ stem: "壬", qiLevel: "本气" }, { stem: "甲", qiLevel: "中气" }]
};

export interface TenGodFact {
  name: TenGodName;
  relation: TenGodRelation;
  polarity: "同阴阳" | "异阴阳";
}

export interface HiddenStemFact extends HiddenStemDefinition, TenGodFact {
  element: Element;
  source: string;
}

export interface PillarStructure {
  name: PillarName;
  pillar: Pillar | null;
  visibleStem: null | {
    stem: Stem;
    element: Element;
    role: TenGodName | "日主";
    relation: TenGodRelation | "参照点";
    source: string;
  };
  branch: null | {
    branch: Branch;
    element: Element;
    source: string;
  };
  hiddenStems: HiddenStemFact[];
}

export function tenGodFor(dayMaster: Stem, otherStem: Stem): TenGodFact {
  const dayElement = STEM_ELEMENT[dayMaster];
  const otherElement = STEM_ELEMENT[otherStem];
  const samePolarity = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[otherStem];
  const polarity = samePolarity ? "同阴阳" : "异阴阳";

  if (otherElement === dayElement) {
    return { name: samePolarity ? "比肩" : "劫财", relation: "同我", polarity };
  }
  if (SHENG[dayElement] === otherElement) {
    return { name: samePolarity ? "食神" : "伤官", relation: "我生", polarity };
  }
  if (KE[dayElement] === otherElement) {
    return { name: samePolarity ? "偏财" : "正财", relation: "我克", polarity };
  }
  if (KE[otherElement] === dayElement) {
    return { name: samePolarity ? "七杀" : "正官", relation: "克我", polarity };
  }
  return { name: samePolarity ? "偏印" : "正印", relation: "生我", polarity };
}

export function hiddenStemsFor(branch: Branch, dayMaster: Stem, pillarName: PillarName): HiddenStemFact[] {
  return HIDDEN_STEMS[branch].map(item => ({
    ...item,
    ...tenGodFor(dayMaster, item.stem),
    element: STEM_ELEMENT[item.stem],
    source: `${pillarName}地支·${branch}${item.qiLevel}`
  }));
}

export function buildBaziStructure(chart: BaziChart) {
  const values = [chart.year, chart.month, chart.day, chart.hour] as const;
  const pillars: PillarStructure[] = values.map((pillar, index) => {
    const name = PILLAR_NAMES[index];
    if (!pillar) return { name, pillar: null, visibleStem: null, branch: null, hiddenStems: [] };
    const role = index === 2 ? "日主" : tenGodFor(chart.dayMaster, pillar.stem).name;
    const relation = index === 2 ? "参照点" : tenGodFor(chart.dayMaster, pillar.stem).relation;
    return {
      name,
      pillar,
      visibleStem: {
        stem: pillar.stem,
        element: pillar.stemElement,
        role,
        relation,
        source: `${name}天干`
      },
      branch: {
        branch: pillar.branch,
        element: BRANCH_ELEMENT[pillar.branch],
        source: `${name}地支`
      },
      hiddenStems: hiddenStemsFor(pillar.branch, chart.dayMaster, name)
    };
  });

  return {
    dayMaster: {
      stem: chart.dayMaster,
      element: STEM_ELEMENT[chart.dayMaster],
      yinYang: STEM_YIN_YANG[chart.dayMaster],
      source: "日柱天干"
    },
    monthCommand: {
      branch: chart.month.branch,
      element: chart.month.branchElement,
      source: "月柱地支",
      hiddenStems: hiddenStemsFor(chart.month.branch, chart.dayMaster, "月柱")
    },
    pillars
  };
}

export const HIDDEN_STEM_REFERENCE = HIDDEN_STEMS;
