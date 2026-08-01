import type { Branch, Stem } from "./elements";
import type {
  ProfessionalBaziFact,
  ProfessionalBaziFactsV1
} from "./professionalBaziFacts";

export const BAZI_DIRECT_NARRATIVE_CONTENT_VERSION = "bazi-direct-narrative-v1" as const;

export const YI_WOOD_ROOSTER_MONTH_NARRATIVE = [
  "秋意铺开的时候你来到世间，草木褪去旺盛生机，天地慢慢沉静收敛。",
  "你就像一株柔韧藤蔓，秋日不复温暖繁盛，无法肆意蔓延，总要循着周遭的框架，找到合适的地方缓缓生长。",
  "秋里清劲之气自成边界，时刻与你相伴。",
  "这让你本能留意人和事的边界、截止的期限、该承担的责任。只要环境条理分明，没有模糊不清的灰色地带，你便能清晰看清方向，安心向外舒展。"
].join("\n\n");

export const BAZI_DIRECT_NARRATIVE_FACT_IDS = [
  "dayMaster.stem",
  "dayMaster.element",
  "dayMaster.yinYang",
  "monthCommand.branch",
  "monthCommand.mainStem",
  "monthCommand.mainTenGod"
] as const;

export type BaziDirectNarrativeFactId =
  (typeof BAZI_DIRECT_NARRATIVE_FACT_IDS)[number];

export interface BaziDirectNarrativeEntry {
  id: string;
  dayStem: Stem;
  monthBranch: Branch;
  requiredFacts: {
    dayElement: "木" | "火" | "土" | "金" | "水";
    dayYinYang: "阴" | "阳";
    monthMainStem: Stem;
    monthMainTenGod: string;
  };
  factDependencies: readonly BaziDirectNarrativeFactId[];
  narrative: string;
  contentVersion: typeof BAZI_DIRECT_NARRATIVE_CONTENT_VERSION;
  interpretationKind: "project_original_modern_reading";
}

export const BAZI_DIRECT_NARRATIVE_CATALOG = {
  "乙-酉": {
    id: "bazi-direct-narrative:乙-酉:v1",
    dayStem: "乙",
    monthBranch: "酉",
    requiredFacts: {
      dayElement: "木",
      dayYinYang: "阴",
      monthMainStem: "辛",
      monthMainTenGod: "七杀"
    },
    factDependencies: BAZI_DIRECT_NARRATIVE_FACT_IDS,
    narrative: YI_WOOD_ROOSTER_MONTH_NARRATIVE,
    contentVersion: BAZI_DIRECT_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_modern_reading"
  }
} as const satisfies Record<string, BaziDirectNarrativeEntry>;

export type BaziDirectNarrativeSelection =
  | {
      status: "available";
      key: keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG;
      entry: BaziDirectNarrativeEntry;
    }
  | {
      status: "not_available";
      reason:
        | "necessary_fact_unavailable"
        | "month_pillar_uncertain"
        | "combination_not_reviewed";
    };

function isConfirmedValue<T>(
  fact: ProfessionalBaziFact<T | null>
): fact is ProfessionalBaziFact<T> {
  return fact.certainty === "confirmed" && fact.value !== null;
}

export function selectBaziDirectNarrative(
  facts: ProfessionalBaziFactsV1
): BaziDirectNarrativeSelection {
  if (facts.uncertainty.monthPillarCandidates.value.length > 0) {
    return { status: "not_available", reason: "month_pillar_uncertain" };
  }

  const { stem, element, yinYang } = facts.dayMaster;
  const { branch, mainStem, mainTenGod } = facts.monthCommand;
  if (
    !isConfirmedValue(stem)
    || !isConfirmedValue(element)
    || !isConfirmedValue(yinYang)
    || !isConfirmedValue(branch)
    || !isConfirmedValue(mainStem)
    || !isConfirmedValue(mainTenGod)
  ) {
    return { status: "not_available", reason: "necessary_fact_unavailable" };
  }

  const key = `${stem.value}-${branch.value}` as keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG;
  const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
  if (!entry) {
    return { status: "not_available", reason: "combination_not_reviewed" };
  }

  const entryMatchesFacts = (
    element.value === entry.requiredFacts.dayElement
    && yinYang.value === entry.requiredFacts.dayYinYang
    && mainStem.value === entry.requiredFacts.monthMainStem
    && mainTenGod.value === entry.requiredFacts.monthMainTenGod
  );
  if (!entryMatchesFacts) {
    return { status: "not_available", reason: "necessary_fact_unavailable" };
  }

  return { status: "available", key, entry };
}
